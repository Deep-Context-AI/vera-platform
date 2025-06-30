// Shared utilities for workflows
import { useAgentStore } from '@/stores/agentStore';
import { uiPrimitives } from '@/lib/agent/UIInteractionPrimitives';

/**
 * Common workflow execution pattern for all verification workflows
 */
export async function executeStandardWorkflow(
  stepId: string,
  workflowName: string,
  verificationLogic: () => Promise<{
    success: boolean;
    decision: 'completed' | 'in_progress' | 'failed' | 'requires_review';
    reasoning?: string;
  }>
) {
  const store = useAgentStore.getState();
  
  try {
    // Step 1: Expand and start verification
    store.addThought({
      message: `Starting ${workflowName} workflow for ${stepId}`,
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
    
    // Step 2: Execute verification logic
    const verificationResult = await verificationLogic();
    if (!verificationResult.success) {
      return verificationResult;
    }
    
    // Step 3: Fill reasoning notes if available
    if (verificationResult.reasoning) {
      const notesSuccess = await uiPrimitives.fillInput({
        inputSelector: `[data-agent-field="reasoning-notes"][data-step-id="${stepId}"]`,
        text: verificationResult.reasoning,
        description: 'verification reasoning notes',
        clearFirst: true
      });
      
      if (notesSuccess) {
        store.addThought({
          message: `Successfully filled reasoning notes for ${stepId}`,
          type: 'result',
        });
      }
    }
    
    // Step 4: Set status and save
    const statusSuccess = await uiPrimitives.setVerificationStatus(stepId, verificationResult.decision);
    if (!statusSuccess) {
      return {
        success: false,
        message: `Failed to set status to ${verificationResult.decision} for ${stepId}`,
        step: 'set_status'
      };
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const saveSuccess = await uiPrimitives.saveVerificationStep(stepId);
    if (!saveSuccess) {
      return {
        success: false,
        message: `Failed to save verification step ${stepId}`,
        step: 'save'
      };
    }
    
    // Step 5: Close accordion
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const collapseSuccess = await uiPrimitives.collapseVerificationStep(stepId);
    if (!collapseSuccess) {
      return {
        success: false,
        message: `Failed to collapse accordion for ${stepId}`,
        step: 'collapse'
      };
    }
    
    const workflowMessage = `${workflowName} workflow fully completed for ${stepId}. Status set to ${verificationResult.decision}, saved, and accordion closed.`;
    
    store.addThought({
      message: workflowMessage,
      type: 'result',
    });
    
    return {
      success: true,
      message: workflowMessage,
      step: 'completed'
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown workflow error';
    console.error(`❌ ${workflowName} Workflow Error:`, error);
    
    store.addThought({
      message: `${workflowName} workflow failed: ${errorMessage}`,
      type: 'result',
    });
    
    return {
      success: false,
      message: `${workflowName} workflow failed: ${errorMessage}`,
      step: 'error'
    };
  }
}
