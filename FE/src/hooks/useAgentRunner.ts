'use client';

import { useCallback } from 'react';
import { useAgentExecution, useAgentThoughts } from '@/stores/agentStore';
import { uiSimulator, UIActions } from '@/lib/agent/UISimulator';
import { agentRunner } from '@/lib/agent/AgentRunner';

export interface UseAgentRunnerReturn {
  isRunning: boolean;
  currentTask: string | null;
  startAgent: () => void;
  stopAgent: () => void;
  runDemo: () => Promise<void>;
  runVerificationDemo: () => Promise<void>;
  runAccordionDemo: () => Promise<void>;
  runLicenseFormDemo: () => Promise<void>;
  executeTask: (task: string) => Promise<void>;
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

  const runAccordionDemo = useCallback(async () => {
    console.log('🎯 Hook: Starting accordion demo');
    if (!isRunning) {
      startAgent();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTask('Demonstrating accordion interactions');
    
    try {
      const result = await agentRunner.demoAccordionClicks();
      console.log('✅ Hook: Accordion demo completed', result);
      addThought({
        message: `Accordion demo completed: ${result}`,
        type: 'result',
      });
    } catch (error) {
      console.error('❌ Hook: Accordion demo failed', error);
      addThought({
        message: 'Accordion demo encountered an error.',
        type: 'result',
      });
      console.error('Accordion demo error:', error);
    } finally {
      setCurrentTask(null);
    }
  }, [isRunning, startAgent, setCurrentTask, addThought]);

  const runLicenseFormDemo = useCallback(async () => {
    console.log('📝 Hook: Starting license form demo');
    if (!isRunning) {
      startAgent();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTask('Demonstrating license form interactions');
    
    try {
      const result = await agentRunner.demoLicenseForm();
      console.log('✅ Hook: License form demo completed', result);
      addThought({
        message: `License form demo completed: ${result}`,
        type: 'result',
      });
    } catch (error) {
      console.error('❌ Hook: License form demo failed', error);
      addThought({
        message: 'License form demo encountered an error.',
        type: 'result',
      });
      console.error('License form demo error:', error);
    } finally {
      setCurrentTask(null);
    }
  }, [isRunning, startAgent, setCurrentTask, addThought]);

  const executeTask = useCallback(async (task: string) => {
    console.log('🚀 Hook: Executing custom task', task);
    if (!isRunning) {
      startAgent();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTask(`Executing: ${task}`);
    
    try {
      const result = await agentRunner.executeTask(task);
      console.log('✅ Hook: Custom task completed', result);
      addThought({
        message: `Task completed: ${result}`,
        type: 'result',
      });
    } catch (error) {
      console.error('❌ Hook: Custom task failed', error);
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
    runDemo,
    runVerificationDemo,
    runAccordionDemo,
    runLicenseFormDemo,
    executeTask,
  };
} 