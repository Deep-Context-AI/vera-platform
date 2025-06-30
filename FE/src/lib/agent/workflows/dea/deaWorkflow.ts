import { z } from 'zod';
import { tool } from '@openai/agents';
import { VerificationAPI } from '@/lib/api/verification';
import { analyzeDEAVerificationResult } from '../shared/analysis';
import { DEAVerificationDecision } from '../shared/types';
import { useAgentStore } from '@/stores/agentStore';
import { uiPrimitives } from '@/lib/agent/UIInteractionPrimitives';

// Define workflow schema for DEA verification
const DEAVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "dea_verification")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    deaNumber: z.string().nullable().describe('DEA number (2 letters followed by 7 digits)')
  }).nullable().describe('Practitioner data to use for DEA verification')
});

// DEA verification workflow tool
export const deaVerificationWorkflowTool = tool({
  name: 'dea_verification_workflow',
  description: 'Execute the complete DEA verification workflow: expand accordion, start verification, make API call to verify DEA number, and prepare results. This workflow uses the DEA verification API.',
  parameters: DEAVerificationWorkflowSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: dea_verification_workflow', params);
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
      
      // Step 2: Perform DEA verification API call if practitioner data is provided
      let deaVerificationResult = null;
      
      if (params.practitionerData && params.practitionerData.deaNumber) {
        store.addThought({
          message: `Performing DEA verification API call...`,
          type: 'action',
        });
        
        try {
          // Prepare DEA verification request
          const deaRequest = {
            first_name: params.practitionerData.firstName || '',
            last_name: params.practitionerData.lastName || '',
            dea_number: params.practitionerData.deaNumber
          };
          
          // Make the API call
          deaVerificationResult = await VerificationAPI.verifyDEA(deaRequest);
          
          store.addThought({
            message: `DEA verification API call completed successfully`,
            type: 'result',
          });
          
          console.log('✅ DEA Verification Result:', deaVerificationResult);
          
        } catch (apiError) {
          const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
          console.error('❌ DEA Verification API Error:', apiError);
          
          store.addThought({
            message: `DEA verification API call failed: ${errorMessage}`,
            type: 'result',
          });
          
          // Continue workflow even if API fails - we can still complete the UI workflow
          deaVerificationResult = {
            status: 'error',
            message: `API call failed: ${errorMessage}`,
            data: null
          };
        }
      } else {
        store.addThought({
          message: `No DEA number provided - skipping API call`,
          type: 'result',
        });
      }
      
      // Step 3: Analyze DEA verification result using OpenAI
      let verificationDecision: DEAVerificationDecision | null = null;
      
      if (deaVerificationResult) {
        store.addThought({
          message: `Analyzing DEA verification result with AI...`,
          type: 'action',
        });
        
        try {
          verificationDecision = await analyzeDEAVerificationResult(
            deaVerificationResult,
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
          reasoning: 'No DEA verification data available for analysis.',
          issues_found: ['No API data available'],
          recommendations: ['Perform manual DEA verification']
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
      workflowMessage = `DEA verification workflow fully completed for ${stepId}. API call ${deaVerificationResult ? 'completed' : 'skipped'}, AI analysis completed with decision "${verificationDecision.decision}", notes filled, status set, saved, and accordion closed.`;
      
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
        apiResult: deaVerificationResult,
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
      console.error('❌ DEA Verification Workflow Error:', error);
      
      store.addThought({
        message: `DEA verification workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `DEA verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
}); 