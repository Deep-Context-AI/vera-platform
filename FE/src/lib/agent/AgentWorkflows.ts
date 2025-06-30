import { z } from 'zod';
import { useAgentStore } from '@/stores/agentStore';
import { uiPrimitives } from './UIInteractionPrimitives';
import { tool } from '@openai/agents';

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
      // Step 1: Inspect current state
      store.addThought({
        message: `Starting identity verification workflow for ${stepId}`,
        type: 'action',
      });
      
      const inspectionResult = uiPrimitives.inspectVerificationStep(stepId);
      console.log('🔍 Workflow - Inspection result:', inspectionResult);
      
      if (!inspectionResult.success) {
        return {
          success: false,
          message: `Failed to inspect ${stepId}: ${inspectionResult.message}`,
          step: 'inspection'
        };
      }
      
      // Step 2: Expand accordion if collapsed
      if (inspectionResult.state === 'collapsed') {
        store.addThought({
          message: `Expanding ${stepId} accordion...`,
          type: 'action',
        });
        
        const expandSuccess = await uiPrimitives.expandVerificationStep(stepId);
        if (!expandSuccess) {
          return {
            success: false,
            message: `Failed to expand ${stepId} accordion`,
            step: 'expand'
          };
        }
        
        // Wait for accordion animation and re-inspect
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const reInspectionResult = uiPrimitives.inspectVerificationStep(stepId);
        console.log('🔍 Workflow - Re-inspection after expand:', reInspectionResult);
        
        if (reInspectionResult.state !== 'expanded') {
          return {
            success: false,
            message: `Failed to properly expand ${stepId} accordion`,
            step: 'expand_verification'
          };
        }
      }
      
      // Step 3: Start verification if not already started
      const finalInspection = uiPrimitives.inspectVerificationStep(stepId);
      
      // Check if we need to start verification (status is 'not_started' or 'unknown' with a start button)
      const needsToStart = finalInspection.hasStartButton && 
        (finalInspection.currentStatus === 'not_started' || finalInspection.currentStatus === 'unknown');
      
      if (needsToStart) {
        store.addThought({
          message: `Starting verification for ${stepId} (current status: ${finalInspection.currentStatus})...`,
          type: 'action',
        });
        
        const startSuccess = await uiPrimitives.startVerificationStep(stepId);
        if (!startSuccess) {
          return {
            success: false,
            message: `Failed to start verification for ${stepId}`,
            step: 'start'
          };
        }
        
        // Wait for start action to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        store.addThought({
          message: `Successfully started verification for ${stepId}`,
          type: 'result',
        });
      } else if (finalInspection.currentStatus === 'in_progress') {
        store.addThought({
          message: `Verification for ${stepId} is already in progress`,
          type: 'result',
        });
      } else if (finalInspection.currentStatus === 'completed') {
        store.addThought({
          message: `Verification for ${stepId} is already completed`,
          type: 'result',
        });
      } else {
        store.addThought({
          message: `Verification for ${stepId} status: ${finalInspection.currentStatus}, start button available: ${finalInspection.hasStartButton}`,
          type: 'result',
        });
      }
      
      // Step 4: Report workflow completion (stopping here for now)
      workflowMessage = `Identity verification workflow completed for ${stepId}. Ready for data retrieval and form filling.`;
      
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