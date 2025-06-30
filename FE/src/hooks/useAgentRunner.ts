'use client';

import { useCallback } from 'react';
import { useAgentExecution, useAgentThoughts } from '@/stores/agentStore';
import { uiSimulator } from '@/lib/agent/UISimulator';
import { agentRunner } from '@/lib/agent/AgentRunner';

export interface UseAgentRunnerReturn {
  isRunning: boolean;
  currentTask: string | null;
  startAgent: () => void;
  stopAgent: () => void;
  executeTask: (task: string, context?: any) => Promise<void>;
}

export function useAgentRunner(): UseAgentRunnerReturn {
  const { isRunning, currentTask, startAgent: startAgentStore, stopAgent: stopAgentStore, setCurrentTask } = useAgentExecution();
  const { addThought } = useAgentThoughts();

  const startAgent = useCallback(() => {
    startAgentStore();
    uiSimulator.reset();
    // Initialize mouse position in center of screen
    uiSimulator.initializeMousePosition();
    addThought({
      message: 'AI Assistant activated! Ready to help with verification tasks.',
      type: 'result',
    });
  }, [startAgentStore, addThought]);

  const stopAgent = useCallback(() => {
    stopAgentStore();
    uiSimulator.reset();
    addThought({
      message: 'AI Assistant deactivated.',
      type: 'result',
    });
  }, [stopAgentStore, addThought]);

  const executeTask = useCallback(async (task: string, context?: any) => {
    console.log('🚀 Hook: Executing task', task);
    if (!isRunning) {
      startAgent();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTask(`Executing: ${task}`);
    
    try {
      const result = await agentRunner.executeAllVerifications(context);
      console.log('✅ Hook: Task completed', result);
      addThought({
        message: `Task completed: ${result}`,
        type: 'result',
      });
    } catch (error) {
      console.error('❌ Hook: Task failed', error);
      addThought({
        message: 'Task execution encountered an error.',
        type: 'result',
      });
      console.error('Task execution error:', error);
    } finally {
      setCurrentTask(null);
    }
  }, [isRunning, startAgent, setCurrentTask, addThought]);

  return {
    isRunning,
    currentTask,
    startAgent,
    stopAgent,
    executeTask,
  };
} 