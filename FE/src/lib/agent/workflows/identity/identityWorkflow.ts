import { z } from "zod";
import { tool } from "@openai/agents";
import { useAgentStore } from "@/stores/agentStore";
import { uiPrimitives } from "@/lib/agent/UIInteractionPrimitives";

// Define workflow schema for identity verification
const IdentityVerificationWorkflowSchema = z.object({
  stepId: z.string().describe('ID of the verification step (should be "identity_verification")'),
  practitionerData: z.object({
    firstName: z.string().nullable().describe('Practitioner first name'),
    lastName: z.string().nullable().describe('Practitioner last name'),
    fullName: z.string().nullable().describe('Full name of practitioner'),
    ssn: z.string().nullable().describe('Social Security Number'),
    dateOfBirth: z.string().nullable().describe('Date of birth'),
    address: z.string().nullable().describe('Address information')
  }).nullable().describe('Practitioner data to use for form filling')
});

// Identity verification workflow tool
export const identityVerificationWorkflowTool = tool({
  name: 'identity_verification_workflow',
  description: 'Execute the complete identity verification workflow: expand accordion, start verification if needed, and prepare for form filling. This is a deterministic workflow that handles the entire sequence.',
  parameters: IdentityVerificationWorkflowSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: identity_verification_workflow', params);
    const store = useAgentStore.getState();
    
    // Add timing delay for better UX readability
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const stepId = params.stepId;
    let workflowMessage = '';
    
    try {
      // Step 1: Use reusable utility to expand and start verification
      store.addThought({
        message: `Starting identity verification workflow for ${stepId}`,
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
      
      // Step 2: Complete the verification by setting status and saving
      store.addThought({
        message: `Completing identity verification for ${stepId}...`,
        type: 'action',
      });
      
      // Set status to completed
      const statusSuccess = await uiPrimitives.setVerificationStatus(stepId, 'completed');
      if (!statusSuccess) {
        return {
          success: false,
          message: `Failed to set status to completed for ${stepId}`,
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
      
      // Step 3: Close the accordion after saving
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
      
      // Step 4: Report workflow completion
      workflowMessage = `Identity verification workflow fully completed for ${stepId}. Status set to completed, saved, and accordion closed.`;
      
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
      console.error('❌ Identity Verification Workflow Error:', error);
      
      store.addThought({
        message: `Workflow failed: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `Identity verification workflow failed: ${errorMessage}`,
        step: 'error'
      };
    }
  }
});