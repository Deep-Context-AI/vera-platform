'use client';

import { useCallback } from 'react';
import { useAgentExecution, useAgentThoughts } from '@/stores/agentStore';
import { uiSimulator, UIActions } from '@/lib/agent/UISimulator';

export interface UseAgentRunnerReturn {
  isRunning: boolean;
  currentTask: string | null;
  startAgent: () => void;
  stopAgent: () => void;
  runDemo: () => Promise<void>;
  runVerificationDemo: () => Promise<void>;
}

export function useAgentRunner(): UseAgentRunnerReturn {
  const { isRunning, currentTask, startAgent: startAgentStore, stopAgent: stopAgentStore, setCurrentTask } = useAgentExecution();
  const { addThought } = useAgentThoughts();

  const startAgent = useCallback(() => {
    startAgentStore();
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

  const runDemo = useCallback(async () => {
    if (!isRunning) {
      startAgent();
      // Wait a bit for the agent to start
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTask('Running demonstration');
    
    try {
      addThought({
        message: 'Starting demonstration of AI capabilities...',
        type: 'thinking',
      });

      // Demo sequence
      await UIActions.demonstrateVerificationTab();
      
      addThought({
        message: 'Demonstration completed successfully!',
        type: 'result',
      });
    } catch (error) {
      addThought({
        message: 'Demo encountered an error. Please try again.',
        type: 'result',
      });
      console.error('Demo error:', error);
    } finally {
      setCurrentTask(null);
    }
  }, [isRunning, startAgent, setCurrentTask, addThought]);

  const runVerificationDemo = useCallback(async () => {
    if (!isRunning) {
      startAgent();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTask('Demonstrating verification workflow');
    
    try {
      addThought({
        message: 'I\'ll show you how I can interact with verification elements...',
        type: 'thinking',
      });

      await UIActions.clickVerificationContainers();
      
      addThought({
        message: 'Verification demonstration completed! I can interact with various UI elements.',
        type: 'result',
      });
    } catch (error) {
      addThought({
        message: 'Verification demo encountered an error.',
        type: 'result',
      });
      console.error('Verification demo error:', error);
    } finally {
      setCurrentTask(null);
    }
  }, [isRunning, startAgent, setCurrentTask, addThought]);

  return {
    isRunning,
    currentTask,
    startAgent,
    stopAgent,
    runDemo,
    runVerificationDemo,
  };
} 