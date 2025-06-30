import { z } from 'zod';
import { tool } from '@openai/agents';
import { VerificationAPI } from '@/lib/api/verification';
import { analyzeNPIVerificationResult } from '../shared/analysis';
import { NPIVerificationDecision } from '../shared/types';
import { useAgentStore } from '@/stores/agentStore';
import { uiPrimitives } from '@/lib/agent/UIInteractionPrimitives';

// Define workflow schema for NPI verification
const NPIVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "npi_verification")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    npi: z.string().nullable().describe('NPI number (10 digits)'),
    organizationName: z.string().nullable().describe('Organization name if applicable'),
    city: z.string().nullable().describe('City'),
    state: z.string().nullable().describe('State (2-letter abbreviation)'),
    postalCode: z.string().nullable().describe('Postal/ZIP code')
  }).nullable().describe('Practitioner data to use for NPI verification')
});

// NPI verification workflow tool
export const npiVerificationWorkflowTool = tool({
  name: 'npi_verification_workflow',
  description: 'Execute the complete NPI verification workflow: expand accordion, start verification, make API call to verify NPI, and prepare results. This workflow uses the NPI verification API.',
  parameters: NPIVerificationWorkflowSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: npi_verification_workflow', params);
    const store = useAgentStore.getState();
    
    // Add timing delay for better UX readability
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const stepId = params.stepId;
    let workflowMessage = '';
    
    try {
      // Step 1: Use reusable utility to expand and start verification
      store.addThought({
        message: `Starting NPI verification workflow for ${stepId}`,
        type: 'action',
      });
      
      const prepareResult = await uiPrimitives.expandAndStartVerificationStep(stepId);
      if (!prepareResult.success) {
        return {
          success: false,
          message: prepareResult.message,
          step: prepareResult.step
        };
      }
      
      // Step 2: Perform NPI verification API call if practitioner data is provided
      let npiVerificationResult = null;
      
      if (params.practitionerData) {
        store.addThought({
          message: `Performing NPI verification API call...`,
          type: 'action',
        });
        
        try {
          // Prepare NPI search request
          const npiRequest: any = {};
          
          if (params.practitionerData.npi) {
            npiRequest.npi = params.practitionerData.npi;
          }
          if (params.practitionerData.firstName) {
            npiRequest.first_name = params.practitionerData.firstName;
          }
          if (params.practitionerData.lastName) {
            npiRequest.last_name = params.practitionerData.lastName;
          }
          if (params.practitionerData.organizationName) {
            npiRequest.organization_name = params.practitionerData.organizationName;
          }
          if (params.practitionerData.city) {
            npiRequest.city = params.practitionerData.city;
          }
          if (params.practitionerData.state) {
            npiRequest.state = params.practitionerData.state;
          }
          if (params.practitionerData.postalCode) {
            npiRequest.postal_code = params.practitionerData.postalCode;
          }
          
          // Make the API call
          npiVerificationResult = await VerificationAPI.searchNPI(npiRequest);
          
          store.addThought({
            message: `NPI verification API call completed successfully`,
            type: 'result',
          });
          
          console.log('✅ NPI Verification Result:', npiVerificationResult);
          
        } catch (apiError) {
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
          console.error('❌ NPI Verification API Error:', apiError);
          
          store.addThought({
            message: `NPI verification API call failed: ${errorMessage}`,
            type: 'result',
          });
          
          // Continue workflow even if API fails - we can still complete the UI workflow
          npiVerificationResult = {
            status: 'error',
            message: `API call failed: ${errorMessage}`,
            data: null
          };
        }
      } else {
        store.addThought({
          message: `No practitioner data provided - skipping API call`,
          type: 'result',
        });
      }
      
      // Step 3: Analyze NPI verification result using OpenAI
      let verificationDecision: NPIVerificationDecision | null = null;
      
      if (npiVerificationResult) {
        store.addThought({
          message: `Analyzing NPI verification result with AI...`,
          type: 'action',
        });
        
        try {
          verificationDecision = await analyzeNPIVerificationResult(
            npiVerificationResult,
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
          decision: 'requires_review',
          reasoning: 'No NPI verification data available for analysis. Manual review required.',
          issues_found: ['No API data available'],
          recommendations: ['Perform manual NPI verification']
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
      workflowMessage = `NPI verification workflow fully completed for ${stepId}. API call ${npiVerificationResult ? 'completed' : 'skipped'}, AI analysis completed with decision "${verificationDecision.decision}", notes filled, status set, saved, and accordion closed.`;
      
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
        apiResult: npiVerificationResult,
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
      console.error('❌ NPI Verification Workflow Error:', error);
      
      store.addThought({
        message: `NPI verification workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `NPI verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
});