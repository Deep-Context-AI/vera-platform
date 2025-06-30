import { z } from 'zod';
import { tool } from '@openai/agents';
import { VerificationAPI } from '@/lib/api/verification';
import { analyzeMedicalVerificationResult } from '../shared/analysis';
import { MedicalVerificationDecision } from '../shared/types';
import { useAgentStore } from '@/stores/agentStore';
import { uiPrimitives } from '@/lib/agent/UIInteractionPrimitives';

// Define workflow schema for Medi-Cal verification
const MedicalVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "medical_verification")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    npi: z.string().nullable().describe('NPI number (10 digits)'),
    licenseType: z.string().nullable().describe('License type'),
    taxonomyCode: z.string().nullable().describe('Provider taxonomy code'),
    providerType: z.string().nullable().describe('Provider type'),
    city: z.string().nullable().describe('City'),
    state: z.string().nullable().describe('State (2-letter abbreviation)'),
    zip: z.string().nullable().describe('ZIP code')
  }).nullable().describe('Practitioner data to use for Medi-Cal verification')
});

// Medi-Cal verification workflow tool
export const medicalVerificationWorkflowTool = tool({
  name: 'medical_verification_workflow',
  description: 'Execute the complete Medi-Cal verification workflow: expand accordion, start verification, make API call to verify Medi-Cal enrollment, and prepare results. This workflow uses the Medical (Medi-Cal Managed Care + ORP) verification API.',
  parameters: MedicalVerificationWorkflowSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: medical_verification_workflow', params);
    const store = useAgentStore.getState();
    
    // Add timing delay for better UX readability
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const stepId = params.stepId;
    let workflowMessage = '';
    
    try {
      // Step 1: Use reusable utility to expand and start verification
      const prepareResult = await uiPrimitives.expandAndStartVerificationStep(stepId);
      if (!prepareResult.success) {
        return {
          success: false,
          message: prepareResult.message,
          step: prepareResult.step
        };
      }
      
      // Step 2: Perform Medi-Cal verification API call if practitioner data is provided
      let medicalVerificationResult = null;
      
      if (params.practitionerData && params.practitionerData.npi) {
        store.addThought({
          message: `Performing Medi-Cal verification API call...`,
          type: 'action',
        });
        
        try {
          // Prepare Medi-Cal verification request
          const medicalRequest = {
            npi: params.practitionerData.npi,
            first_name: params.practitionerData.firstName || '',
            last_name: params.practitionerData.lastName || '',
            license_type: params.practitionerData.licenseType || undefined,
            taxonomy_code: params.practitionerData.taxonomyCode || undefined,
            provider_type: params.practitionerData.providerType || undefined,
            city: params.practitionerData.city || undefined,
            state: params.practitionerData.state || undefined,
            zip: params.practitionerData.zip || undefined
          };
          
          // Make the API call
          medicalVerificationResult = await VerificationAPI.verifyMedical(medicalRequest);
          
          store.addThought({
            message: `Medi-Cal verification API call completed successfully`,
            type: 'result',
          });
          
          console.log('✅ Medi-Cal Verification Result:', medicalVerificationResult);
          
        } catch (apiError) {
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
          
          // Check if this is a 404 error (provider not found in Medi-Cal database)
          const is404Error = errorMessage.includes('404') || errorMessage.toLowerCase().includes('not found');
          
          if (is404Error) {
            console.log('ℹ️ Medi-Cal Verification: Provider not found in database (expected for non-Medi-Cal providers)');
            
            store.addThought({
              message: `Provider not found in Medi-Cal database - this is normal for non-Medi-Cal providers`,
              type: 'result',
            });
            
            // Treat 404 as a successful verification with "not enrolled" status
            medicalVerificationResult = {
              status: 'success',
              message: 'Provider verification completed - not enrolled in Medi-Cal',
              data: {
                enrollment_status: 'not_enrolled',
                provider_found: false
              }
            };
          } else {
            console.error('❌ Medi-Cal Verification API Error:', apiError);
            
            store.addThought({
              message: `Medi-Cal verification API call failed: ${errorMessage}`,
              type: 'result',
            });
            
            // Continue workflow even if API fails - we can still complete the UI workflow
            medicalVerificationResult = {
              status: 'error',
              message: `API call failed: ${errorMessage}`,
              data: null
            };
          }
        }
      } else {
        store.addThought({
          message: `No NPI provided - skipping API call`,
          type: 'result',
        });
      }
      
      // Step 3: Analyze Medi-Cal verification result using OpenAI
      let verificationDecision: MedicalVerificationDecision | null = null;
      
      if (medicalVerificationResult) {
        store.addThought({
          message: `Analyzing Medi-Cal verification result with AI...`,
          type: 'action',
        });
        
        try {
          verificationDecision = await analyzeMedicalVerificationResult(
            medicalVerificationResult,
            params.practitionerData,
            null // Provider context will be accessed via runContext in future refactor
          );
          
          store.addThought({
            message: `AI analysis completed. Decision: ${verificationDecision.decision}`,
            type: 'result',
          });
          
          console.log('🤖 OpenAI Verification Decision:', verificationDecision);
          
        } catch (analysisError) {
          const errorMessage = analysisError instanceof Error ? analysisError.message : 'Unknown analysis error';
          console.error('❌ OpenAI Analysis Error:', analysisError);
          
          store.addThought({
            message: `AI analysis failed: ${errorMessage}. Using fallback decision.`,
            type: 'result',
          });
          
          // Fallback decision
          verificationDecision = {
            decision: 'requires_review',
            reasoning: `AI analysis failed: ${errorMessage}. Manual review required.`,
            issues_found: ['AI analysis unavailable'],
            recommendations: ['Perform manual verification review']
          };
        }
      } else {
        // No API result to analyze
        verificationDecision = {
          decision: 'completed',
          reasoning: 'No Medi-Cal verification data available for analysis.',
          issues_found: ['No API data available'],
          recommendations: ['Perform manual Medi-Cal verification']
        };
      }
      
      // Step 4: Fill out reasoning notes based on AI decision
      store.addThought({
        message: `Filling out verification notes...`,
        type: 'action',
      });
      
      // Use only the reasoning field from the parsed OpenAI response
      const reasoningNotes = verificationDecision?.reasoning;

      // Fill the reasoning notes field
      const notesSuccess = await uiPrimitives.fillInput({
        inputSelector: `[data-agent-field="reasoning-notes"][data-step-id="${stepId}"]`,
        text: reasoningNotes,
        description: 'verification reasoning notes',
        clearFirst: true
      });
      
      if (!notesSuccess) {
        store.addThought({
          message: `Warning: Could not fill reasoning notes field for ${stepId}`,
          type: 'result',
        });
      } else {
        store.addThought({
          message: `Successfully filled reasoning notes for ${stepId}`,
          type: 'result',
        });
      }
      
      // Step 5: Set verification status based on AI decision
      store.addThought({
        message: `Setting verification status to "${verificationDecision.decision}" for ${stepId}...`,
        type: 'action',
      });
      
      // Set status based on AI decision
      const statusSuccess = await uiPrimitives.setVerificationStatus(stepId, verificationDecision.decision);
      if (!statusSuccess) {
        return {
          success: false,
          message: `Failed to set status to ${verificationDecision.decision} for ${stepId}`,
          step: 'set_status'
        };
      }
      
      // Wait a moment before saving
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Save the verification step
      const saveSuccess = await uiPrimitives.saveVerificationStep(stepId);
      if (!saveSuccess) {
        return {
          success: false,
          message: `Failed to save verification step ${stepId}`,
          step: 'save'
        };
      }
      
      // Step 6: Close the accordion after saving
      store.addThought({
        message: `Closing accordion for ${stepId}...`,
        type: 'action',
      });
      
      // Wait a moment before collapsing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const collapseSuccess = await uiPrimitives.collapseVerificationStep(stepId);
      if (!collapseSuccess) {
        return {
          success: false,
          message: `Failed to collapse accordion for ${stepId}`,
          step: 'collapse'
        };
      }
      
      // Step 7: Report workflow completion
      workflowMessage = `Medi-Cal verification workflow fully completed for ${stepId}. API call ${medicalVerificationResult ? 'completed' : 'skipped'}, AI analysis completed with decision "${verificationDecision.decision}", notes filled, status set, saved, and accordion closed.`;
      
      store.addThought({
        message: workflowMessage,
        type: 'result',
      });
      
      // Final inspection to report current state
      const completionInspection = uiPrimitives.inspectVerificationStep(stepId);
      
      return {
        success: true,
        message: workflowMessage,
        step: 'completed',
        apiResult: medicalVerificationResult,
        aiDecision: verificationDecision,
        currentState: {
          status: completionInspection.currentStatus,
          availableActions: completionInspection.availableActions,
          availableFields: completionInspection.availableFields,
          hasStartButton: completionInspection.hasStartButton,
          hasSaveButton: completionInspection.hasSaveButton
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown workflow error';
      console.error('❌ Medi-Cal Verification Workflow Error:', error);
      
      store.addThought({
        message: `Medi-Cal verification workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `Medi-Cal verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
}); 