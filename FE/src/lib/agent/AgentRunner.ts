// Phase 2: This will integrate with OpenAI Agents SDK
// For now, this is a placeholder that provides the structure

import { Agent, run, setDefaultOpenAIClient } from '@openai/agents';
import { uiPrimitives } from './UIInteractionPrimitives';
import { useAgentStore } from '@/stores/agentStore';
import OpenAI from 'openai';
import { identityVerificationWorkflowTool } from './AgentWorkflows';


// Context interface for our agent
interface VeraAgentContext {
  currentPage: string;
  userId?: string;
  isAuthenticated: boolean;
  store: ReturnType<typeof useAgentStore.getState>;
  practitionerData?: any;
}

export class AgentRunner {
  private agent: Agent<VeraAgentContext>;
  private static instance: AgentRunner;
  private isLoopRunning: boolean = false;

  private constructor() {
    console.log('🚀 Agent Runner: Initializing singleton instance');
    
    // Configure OpenAI client for browser environment
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      const openaiClient = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Required for browser environments
      });
      
      // Set the client for the Agents SDK to use
      setDefaultOpenAIClient(openaiClient);
      console.log('🔧 OpenAI Client: Configured for browser environment with dangerouslyAllowBrowser: true');
    } else {
      console.warn('OpenAI API key not found. Agent functionality may be limited.');
    }

    // Initialize the agent with the single workflow tool
    this.agent = new Agent<VeraAgentContext>({
      name: 'Vera Identity Verification Assistant',
      instructions: `You are an AI assistant specialized in executing healthcare identity verification workflows. You have access to a single, deterministic workflow tool:

AVAILABLE TOOL:
- identity_verification_workflow - Execute the complete identity verification process

WORKFLOW STRATEGY:
The identity_verification_workflow tool handles the entire sequence automatically:
1. INSPECT: Check current state of the identity verification step
2. EXPAND: Open accordion if collapsed
3. START: Begin verification if not already started
4. PREPARE: Ready the step for data retrieval and form filling

IMPORTANT: STEP ID
Always use "identity_verification" as the stepId parameter.

EXECUTION SEQUENCE:
1. Call identity_verification_workflow with stepId="identity_verification"
2. The tool will handle all the UI interactions automatically
3. Report the final state and next steps

The workflow is deterministic and will handle all edge cases automatically. You don't need to make multiple tool calls - a single call to identity_verification_workflow will complete the entire sequence.

You must verbalize your actions in a succinct single sentence before every tool call.

If you run into an error, you must verbalize the error first before trying to fix it.
`,
      model: 'gpt-4.1',
      tools: [
        identityVerificationWorkflowTool
      ],
      modelSettings: {
        temperature: 0.1,
        maxTokens: 1000
      }
    });
  }

  static getInstance(): AgentRunner {
    if (!AgentRunner.instance) {
      AgentRunner.instance = new AgentRunner();
    }
    return AgentRunner.instance;
  }

  /**
   * Execute a task with the agent using streaming and agent loop pattern
   */
  async executeTask(task: string, context?: Partial<VeraAgentContext>): Promise<string> {
    const store = useAgentStore.getState();
    console.log('🚀 Agent Runner: Starting streaming task execution', { task, context });
    
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('⚠️ Agent Runner: No API key found, running in demo mode');
      store.addThought({
        message: 'OpenAI API key not configured. Running in demo mode with simulated responses.',
        type: 'result'
      });
      
      // For demo purposes, simulate identity verification workflow
      if (task.toLowerCase().includes('identity') || task.toLowerCase().includes('verification')) {
        return this.simulateIdentityVerificationDemo();
      }
      
      return 'Demo mode: OpenAI API key required for full functionality';
    }
    
    // Build context
    const agentContext: VeraAgentContext = {
      currentPage: 'provider-verification',
      isAuthenticated: true,
      store,
      ...context
    };

    try {
      console.log('🧠 Agent Runner: Starting streaming agent loop', { task });
      store.addThought({
        message: `Starting task: ${task}`,
        type: 'thinking'
      });

      return await this.runAgentLoop(task, agentContext);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Agent Runner: Task execution failed', error);
      
      store.addThought({
        message: `Task failed: ${errorMessage}`,
        type: 'result'
      });

      throw error;
    }
  }

  /**
   * Run the agent in a continuous loop with streaming events
   */
  private async runAgentLoop(task: string, context: VeraAgentContext): Promise<string> {
    const store = context.store;
    this.isLoopRunning = true;
    
    console.log('🔄 Agent Loop: Starting continuous execution');
    
    try {
      // Create a streaming run
      const streamResult = await run(this.agent, task, {
        context,
        stream: true
      });
      
      let finalResult = '';
      
      // Process stream events
      for await (const event of streamResult) {
        if (!this.isLoopRunning) {
          console.log('⏹️ Agent Loop: Stopping due to external request');
          break;
        }
        
        switch (event.type) {
          case 'raw_model_stream_event':
            // Skip raw model events as per Python example - we only handle structured events
            continue;
            
          case 'run_item_stream_event':
            // Handle run item events - completed items like tool calls, messages
            const runItemEvent = event as any;
            if (runItemEvent.item) {
              switch (runItemEvent.item.type) {
                case 'tool_call_item':
                  const toolCall = runItemEvent.item as any; // Type assertion for tool call
                  // Try multiple ways to extract tool name
                  const toolName = toolCall.tool_call?.function?.name || 
                                   toolCall.function?.name || 
                                   toolCall.name || 
                                   'unknown_tool';
                  const toolArgs = toolCall.tool_call?.function?.arguments || 
                                   toolCall.function?.arguments || 
                                   toolCall.arguments || 
                                   '{}';
                  
                  console.log('🔧 Tool Call Debug:', { 
                    toolName, 
                    toolArgs, 
                    fullItem: toolCall 
                  });
                  
                  store.addThought({
                    message: `Executing ${toolName}: ${this.formatToolCallFromArgs(toolName, toolArgs)}`,
                    type: 'action'
                  });
                  break;
                  
                case 'tool_call_output_item':
                  const toolOutput = runItemEvent.item as any; // Type assertion for tool output
                  const output = toolOutput.output;
                  let success = false;
                  let message = 'Tool completed';
                  
                  console.log('🔧 Tool Output Debug:', { output, fullItem: toolOutput });
                  
                  // Try to parse the output to determine success
                  if (typeof output === 'object' && output !== null) {
                    success = output.success === true;
                    message = output.message || message;
                  } else if (typeof output === 'string') {
                    message = output;
                    success = true;
                  }
                  
                  store.addThought({
                    message: message,
                    type: success ? 'result' : 'thinking'
                  });
                  break;
                  
                case 'message_output_item':
                  const messageOutput = runItemEvent.item as any; // Type assertion for message output
                  if (messageOutput.content) {
                    // Extract text from content array
                    let textContent = '';
                    if (Array.isArray(messageOutput.content)) {
                      textContent = messageOutput.content
                        .filter((c: any) => c.type === 'output_text')
                        .map((c: any) => c.text || '')
                        .join('');
                    } else if (typeof messageOutput.content === 'string') {
                      textContent = messageOutput.content;
                    }
                    
                    if (textContent) {
                      // Store the result but don't treat it as completion
                      // The agent might still have more tool calls to make
                      finalResult = textContent;
                      
                      store.addThought({
                        message: textContent,
                        type: 'thinking'
                      });
                    }
                  }
                  break;
                  
                default:
                  console.log('🔍 Agent Loop: Unhandled item type:', runItemEvent.item?.type, runItemEvent.item);
                  break;
              }
            }
            break;
            
          case 'agent_updated_stream_event':
            // Handle agent updates (handoffs)
            const agentEvent = event as any;
            if (agentEvent.agent) {
              store.addThought({
                message: `Agent updated: ${agentEvent.agent.name}`,
                type: 'thinking'
              });
            }
            break;
            
          default:
            // Handle any other event types
            console.log('🔍 Agent Loop: Unhandled event type:', (event as any).type, event);
            break;
        }

      }
      
      // Wait for the stream to complete
      await streamResult.completed;
      
      console.log('🏁 Agent Loop: Stream completed', { finalResult });
      return finalResult || 'Task completed successfully';
      
    } catch (error) {
      console.error('❌ Agent Loop: Stream error', error);
      throw error;
    } finally {
      this.isLoopRunning = false;
      console.log('🔄 Agent Loop: Execution stopped');
    }
  }

  /**
   * Format tool call for display in thinking bubbles
   */
  private formatToolCall(toolName: string, args: any): string {
    switch (toolName) {
      case 'identity_verification_workflow':
        return `Executing identity verification workflow for ${args.stepId || 'identity_verification'}`;
      default:
        return `${toolName} with ${JSON.stringify(args)}`;
    }
  }

  /**
   * Format tool call from arguments string for display
   */
  private formatToolCallFromArgs(toolName: string, argsString: string): string {
    try {
      const args = JSON.parse(argsString);
      return this.formatToolCall(toolName, args);
    } catch {
      return `${toolName} with ${argsString}`;
    }
  }

  /**
   * Stop the current agent loop execution
   */
  stopExecution(): void {
    console.log('🛑 Agent Runner: Stopping execution');
    this.isLoopRunning = false;
  }

  /**
   * Check if the agent loop is currently running
   */
  isExecuting(): boolean {
    return this.isLoopRunning;
  }

  /**
   * Simulate identity verification demo for testing without API key
   */
  private async simulateIdentityVerificationDemo(): Promise<string> {
    console.log('🎭 Agent Runner: Running simulated identity verification demo (no API key)');
    const store = useAgentStore.getState();
    
    store.addThought({
      message: 'Starting identity verification workflow simulation...',
      type: 'action'
    });
    
    // Simulate the workflow steps
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to expand identity verification accordion
    const identityAccordion = document.querySelector('[data-accordion-trigger="identity_verification"]');
    if (identityAccordion) {
      store.addThought({
        message: 'Expanding identity verification accordion...',
        type: 'action'
      });
      
      await uiPrimitives.smoothClick({
        selector: '[data-accordion-trigger="identity_verification"]',
        description: 'identity verification accordion',
        moveDuration: 800,
        clickDelay: 500
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Try to start verification if button exists
      const startButton = document.querySelector('[data-agent-action="start-verification"][data-step-id="identity_verification"]');
      if (startButton) {
        store.addThought({
          message: 'Starting identity verification...',
          type: 'action'
        });
        
        await uiPrimitives.smoothClick({
          selector: '[data-agent-action="start-verification"][data-step-id="identity_verification"]',
          description: 'start verification button',
          moveDuration: 600,
          clickDelay: 300
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    store.addThought({
      message: 'Identity verification workflow simulation completed',
      type: 'result'
    });
    
    console.log('✅ Simulated Demo: Identity verification workflow completed');
    return 'Demo completed: Identity verification workflow executed (simulated mode)';
  }

  /**
   * Execute identity verification workflow
   */
  async executeIdentityVerification(practitionerContext?: any): Promise<string> {
    console.log('🆔 Agent Runner: Starting identity verification workflow');
    
    let task = 'Please execute the identity verification workflow for the healthcare provider. Use the identity_verification_workflow tool to complete the entire process.';
    
    if (practitionerContext?.practitioner) {
      const practitioner = practitionerContext.practitioner;
      const firstName = practitioner.first_name || 'John';
      const lastName = practitioner.last_name || 'Doe';
      const fullName = `${firstName} ${practitioner.middle_name ? practitioner.middle_name + ' ' : ''}${lastName}${practitioner.suffix ? ' ' + practitioner.suffix : ''}`;
      const ssn = practitioner.ssn || '123-45-6789';
      
      // Extract DOB
      let dateOfBirth = '1985-03-15';
      if (practitioner.demographics) {
        const demo = practitioner.demographics as any;
        if (demo?.date_of_birth) {
          dateOfBirth = demo.date_of_birth;
        }
      }
      
      // Extract address info
      let address = '123 Main St, Anytown, CA 90210';
      if (practitioner.home_address) {
        if (typeof practitioner.home_address === 'object') {
          const addr = practitioner.home_address as any;
          const parts = [];
          if (addr.street || addr.address_line_1) parts.push(addr.street || addr.address_line_1);
          if (addr.city) parts.push(addr.city);
          if (addr.state) parts.push(addr.state);
          if (addr.zip_code || addr.postal_code) parts.push(addr.zip_code || addr.postal_code);
          if (parts.length > 0) address = parts.join(', ');
        } else if (typeof practitioner.home_address === 'string') {
          address = practitioner.home_address;
        }
      }
      
      task = `Please execute the identity verification workflow for ${fullName}. Use the identity_verification_workflow tool with the following practitioner data:
      
PRACTITIONER DATA:
- Full Name: ${fullName}
- SSN: ${ssn}
- Date of Birth: ${dateOfBirth}
- Address: ${address}

Execute the workflow with stepId="identity_verification" and include this practitioner data.`;
    }
    
    return this.executeTask(task, practitionerContext ? { 
      currentPage: 'provider-verification',
      isAuthenticated: true,
      store: useAgentStore.getState(),
      practitionerData: practitionerContext
    } : undefined);
  }



  /**
   * Get the underlying agent instance (for advanced usage)
   */
  getAgent(): Agent<VeraAgentContext> {
    return this.agent;
  }
}

// Export singleton instance
export const agentRunner = AgentRunner.getInstance(); 