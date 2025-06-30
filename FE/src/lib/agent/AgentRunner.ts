// Phase 2: This will integrate with OpenAI Agents SDK
// For now, this is a placeholder that provides the structure

import { Agent, tool, run, setDefaultOpenAIClient } from '@openai/agents';
import { z } from 'zod';
import { uiPrimitives } from './UIInteractionPrimitives';
import { useAgentStore } from '@/stores/agentStore';
import OpenAI from 'openai';

// Define tool schemas
const ClickElementSchema = z.object({
  selector: z.string().describe('CSS selector for the element to click'),
  description: z.string().describe('Human-readable description of what element is being clicked. Use empty string if not specified.'),
  moveDuration: z.number().describe('Duration of mouse movement animation in milliseconds. Use 800 if not specified.'),
  clickDelay: z.number().describe('Delay before clicking in milliseconds. Use 200 if not specified.')
});

const FillInputSchema = z.object({
  inputSelector: z.string().describe('CSS selector for the input field'),
  text: z.string().describe('Text to type into the input field'),
  description: z.string().describe('Human-readable description of the input field. Use empty string if not specified.'),
  moveDuration: z.number().describe('Duration of mouse movement animation in milliseconds. Use 800 if not specified.'),
  clickDelay: z.number().describe('Delay before clicking in milliseconds. Use 200 if not specified.'),
  typingSpeed: z.number().describe('Speed of typing in milliseconds per character. Use 100 if not specified.'),
  clearFirst: z.boolean().describe('Whether to clear existing content first. Use true if not specified.')
});

const SelectOptionSchema = z.object({
  selectTriggerSelector: z.string().describe('CSS selector for the select trigger/dropdown button'),
  optionSelector: z.string().describe('CSS selector for the option to select'),
  description: z.string().describe('Human-readable description of the select operation. Use empty string if not specified.'),
  moveDuration: z.number().describe('Duration of mouse movement animation in milliseconds. Use 800 if not specified.'),
  clickDelay: z.number().describe('Delay before clicking in milliseconds. Use 200 if not specified.'),
  optionWaitDelay: z.number().describe('Time to wait for dropdown options to appear in milliseconds. Use 1000 if not specified.')
});

const HoverElementSchema = z.object({
  selector: z.string().describe('CSS selector for the element to hover over'),
  description: z.string().describe('Human-readable description of what element is being hovered. Use empty string if not specified.'),
  moveDuration: z.number().describe('Duration of mouse movement animation in milliseconds. Use 800 if not specified.')
});

const ScrollToElementSchema = z.object({
  selector: z.string().describe('CSS selector for the element to scroll to'),
  description: z.string().describe('Human-readable description of the element. Use empty string if not specified.'),
  behavior: z.enum(['auto', 'smooth']).describe('Scroll behavior. Use "smooth" if not specified.'),
  block: z.enum(['start', 'center', 'end', 'nearest']).describe('Vertical alignment. Use "center" if not specified.'),
  inline: z.enum(['start', 'center', 'end', 'nearest']).describe('Horizontal alignment. Use "center" if not specified.')
});

const WaitForElementSchema = z.object({
  selector: z.string().describe('CSS selector for the element to wait for'),
  timeout: z.number().describe('Maximum time to wait in milliseconds. Use 5000 if not specified.')
});

const QueryElementsSchema = z.object({
  selector: z.string().describe('CSS selector to query for elements'),
  description: z.string().describe('Human-readable description of what elements to find. Use empty string if not specified.')
});

// Enhanced tool schemas for smart element finding
const SmartClickSchema = z.object({
  selector: z.string().nullable().optional().describe('CSS selector for the element (optional if using other methods)'),
  text: z.string().nullable().optional().describe('Text content to search for in elements'),
  dataAttribute: z.string().nullable().optional().describe('Data attribute name to search for (without data- prefix)'),
  dataValue: z.string().nullable().optional().describe('Value of the data attribute'),
  tagName: z.string().nullable().optional().describe('HTML tag name to limit search to'),
  description: z.string().describe('Human-readable description of what element is being clicked'),
  moveDuration: z.number().nullable().optional().describe('Duration of mouse movement animation in milliseconds'),
  clickDelay: z.number().nullable().optional().describe('Delay before clicking in milliseconds')
});

const VerificationStepSchema = z.object({
  stepId: z.string().describe('ID of the verification step'),
  action: z.enum(['expand', 'start', 'save']).describe('Action to perform on the verification step')
});

const FillVerificationFormSchema = z.object({
  stepId: z.string().describe('ID of the verification step'),
  formData: z.object({
    'reasoning-notes': z.string().nullable().optional().describe('Reasoning or notes for the verification'),
    'verification-status': z.string().nullable().optional().describe('Status of the verification (in_progress, completed, failed, requires_review)'),
    // Common form fields that might be encountered
    'license-number': z.string().nullable().optional().describe('License number'),
    'expiration-date': z.string().nullable().optional().describe('Expiration date'),
    'issuing-state': z.string().nullable().optional().describe('Issuing state'),
    'npi-number': z.string().nullable().optional().describe('NPI number'),
    'dea-number': z.string().nullable().optional().describe('DEA number'),
    'first-name': z.string().nullable().optional().describe('First name'),
    'last-name': z.string().nullable().optional().describe('Last name'),
    'middle-name': z.string().nullable().optional().describe('Middle name'),
    'ssn': z.string().nullable().optional().describe('Social Security Number'),
    'date-of-birth': z.string().nullable().optional().describe('Date of birth'),
    'education-degree': z.string().nullable().optional().describe('Education degree'),
    'medical-school': z.string().nullable().optional().describe('Medical school'),
    'graduation-year': z.string().nullable().optional().describe('Graduation year'),
    'hospital-name': z.string().nullable().optional().describe('Hospital name'),
    'privileges-type': z.string().nullable().optional().describe('Type of privileges'),
    'start-date': z.string().nullable().optional().describe('Start date'),
    'end-date': z.string().nullable().optional().describe('End date'),
    'incident-date': z.string().nullable().optional().describe('Incident date'),
    'claim-type': z.string().nullable().optional().describe('Claim type'),
    'description': z.string().nullable().optional().describe('Description'),
    'notes': z.string().nullable().optional().describe('Additional notes')
  }).describe('Object with field names as keys and values to fill')
});

// UI Tools
const clickElementTool = tool({
  name: 'click_element',
  description: 'Click on a UI element using a CSS selector. This will smoothly move the cursor to the element and click it.',
  parameters: ClickElementSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: click_element', params);
    const success = await uiPrimitives.smoothClick({
      selector: params.selector,
      description: params.description || undefined,
      moveDuration: params.moveDuration || undefined,
      clickDelay: params.clickDelay || undefined
    });
    
    return {
      success,
      message: success 
        ? `Successfully clicked ${params.description || params.selector}`
        : `Failed to click ${params.description || params.selector}`
    };
  }
});

const fillInputTool = tool({
  name: 'fill_input',
  description: 'Fill an input field with text. This will focus the input and type the specified text.',
  parameters: FillInputSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: fill_input', params);
    const success = await uiPrimitives.fillInput({
      inputSelector: params.inputSelector,
      text: params.text,
      description: params.description || undefined,
      moveDuration: params.moveDuration || undefined,
      clickDelay: params.clickDelay || undefined,
      typingSpeed: params.typingSpeed || undefined,
      clearFirst: params.clearFirst
    });
    
    return {
      success,
      message: success 
        ? `Successfully filled ${params.description || params.inputSelector} with "${params.text}"`
        : `Failed to fill ${params.description || params.inputSelector}`
    };
  }
});

const selectOptionTool = tool({
  name: 'select_option',
  description: 'Select an option from a dropdown or select element. This will open the dropdown and select the specified option.',
  parameters: SelectOptionSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: select_option', params);
    const success = await uiPrimitives.selectOption({
      selectTriggerSelector: params.selectTriggerSelector,
      optionSelector: params.optionSelector,
      description: params.description || undefined,
      moveDuration: params.moveDuration || undefined,
      clickDelay: params.clickDelay || undefined,
      optionWaitDelay: params.optionWaitDelay || undefined
    });
    
    return {
      success,
      message: success 
        ? `Successfully selected option in ${params.description || 'dropdown'}`
        : `Failed to select option in ${params.description || 'dropdown'}`
    };
  }
});

const hoverElementTool = tool({
  name: 'hover_element',
  description: 'Hover over a UI element to trigger hover effects or tooltips.',
  parameters: HoverElementSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: hover_element', params);
    const success = await uiPrimitives.smoothHover({
      selector: params.selector,
      description: params.description || undefined,
      moveDuration: params.moveDuration || undefined
    });
    
    return {
      success,
      message: success 
        ? `Successfully hovered over ${params.description || params.selector}`
        : `Failed to hover over ${params.description || params.selector}`
    };
  }
});

const scrollToElementTool = tool({
  name: 'scroll_to_element',
  description: 'Scroll to bring an element into view.',
  parameters: ScrollToElementSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: scroll_to_element', params);
    const success = await uiPrimitives.scrollToElement(params.selector, {
      description: params.description || undefined,
      behavior: params.behavior as ScrollBehavior,
      block: params.block as ScrollLogicalPosition,
      inline: params.inline as ScrollLogicalPosition
    });
    
    return {
      success,
      message: success 
        ? `Successfully scrolled to ${params.description || params.selector}`
        : `Failed to scroll to ${params.description || params.selector}`
    };
  }
});

const waitForElementTool = tool({
  name: 'wait_for_element',
  description: 'Wait for an element to appear in the DOM.',
  parameters: WaitForElementSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: wait_for_element', params);
    const success = await uiPrimitives.waitForElement(params.selector, params.timeout || undefined);
    
    return {
      success,
      message: success 
        ? `Element ${params.selector} appeared`
        : `Timeout waiting for element ${params.selector}`
    };
  }
});

// Enhanced smart click tool
const smartClickTool = tool({
  name: 'smart_click',
  description: 'Click on a UI element using flexible finding strategies. Can find elements by text content, data attributes, or CSS selectors. More reliable than basic click_element.',
  parameters: SmartClickSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: smart_click', params);
    const success = await uiPrimitives.smartClick({
      selector: params.selector || undefined,
      text: params.text || undefined,
      dataAttribute: params.dataAttribute || undefined,
      dataValue: params.dataValue || undefined,
      tagName: params.tagName || undefined,
      description: params.description,
      moveDuration: params.moveDuration || undefined,
      clickDelay: params.clickDelay || undefined
    });
    
    return {
      success,
      message: success 
        ? `Successfully clicked ${params.description}`
        : `Failed to click ${params.description}`
    };
  }
});

// Verification-specific tools
const verificationStepTool = tool({
  name: 'verification_step',
  description: 'Perform actions on verification steps: expand accordion, start verification, or save progress.',
  parameters: VerificationStepSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: verification_step', params);
    let success = false;
    let message = '';
    
    switch (params.action) {
      case 'expand':
        success = await uiPrimitives.expandVerificationStep(params.stepId);
        message = success 
          ? `Successfully expanded ${params.stepId} verification step`
          : `Failed to expand ${params.stepId} verification step`;
        break;
        
      case 'start':
        success = await uiPrimitives.startVerificationStep(params.stepId);
        message = success 
          ? `Successfully started verification for ${params.stepId}`
          : `Failed to start verification for ${params.stepId}`;
        break;
        
      case 'save':
        success = await uiPrimitives.saveVerificationStep(params.stepId);
        message = success 
          ? `Successfully saved progress for ${params.stepId}`
          : `Failed to save progress for ${params.stepId}`;
        break;
    }
    
    return { success, message };
  }
});

const fillVerificationFormTool = tool({
  name: 'fill_verification_form',
  description: 'Fill out form fields in a verification step with provided data.',
  parameters: FillVerificationFormSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: fill_verification_form', params);
    
    // Convert formData to the expected Record<string, string> format
    const formData: Record<string, string> = {};
    
    // Handle all possible fields from the schema
    const formDataEntries = Object.entries(params.formData);
    for (const [key, value] of formDataEntries) {
      if (value !== undefined && value !== null) {
        formData[key] = String(value);
      }
    }
    
    const success = await uiPrimitives.fillVerificationForm(params.stepId, formData);
    
    return {
      success,
      message: success 
        ? `Successfully filled verification form for ${params.stepId}`
        : `Failed to fill verification form for ${params.stepId}`
    };
  }
});

const discoverVerificationStepsTool = tool({
  name: 'discover_verification_steps',
  description: 'Discover all available verification steps on the page and their current state.',
  parameters: z.object({}),
  execute: async () => {
    console.log('🔧 Agent Tool: discover_verification_steps');
    const steps = uiPrimitives.findVerificationStepElements();
    
    return {
      success: true,
      steps,
      message: `Found ${steps.length} verification steps: ${steps.map(s => s.stepId).join(', ')}`
    };
  }
});

const queryElementsTool = tool({
  name: 'query_elements',
  description: 'Query the DOM to find available elements matching a selector. Useful for discovering what elements are available to interact with.',
  parameters: QueryElementsSchema,
  execute: async (params) => {
    console.log('🔧 Agent Tool: query_elements', params);
    const elements = document.querySelectorAll(params.selector);
    const elementInfo = Array.from(elements).map((element, index) => {
      const rect = element.getBoundingClientRect();
      return {
        index,
        tagName: element.tagName.toLowerCase(),
        id: element.id || `element-${index}`,
        className: element.className,
        textContent: element.textContent?.trim().substring(0, 100) || '',
        dataAttributes: Object.fromEntries(
          Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => [attr.name, attr.value])
        ),
        isVisible: rect.width > 0 && rect.height > 0,
        position: {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2)
        }
      };
    });
    
    return {
      success: true,
      count: elements.length,
      elements: elementInfo,
      message: `Found ${elements.length} elements matching "${params.selector}"`
    };
  }
});

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

    // Initialize the agent with UI tools
    this.agent = new Agent<VeraAgentContext>({
      name: 'Vera UI Assistant',
      instructions: `You are an AI assistant specialized in completing healthcare verification workflows. You have access to enhanced UI interaction tools:

AVAILABLE TOOLS:
1. smart_click - Click elements using flexible finding (text content, data attributes, CSS selectors)
2. verification_step - Perform actions on verification steps (expand, start, save)
3. discover_verification_steps - Find all available verification steps
4. fill_verification_form - Fill form fields in verification steps
5. click_element - Basic click with CSS selector
6. fill_input - Fill input fields with text
7. select_option - Select dropdown options
8. query_elements - Discover available elements

WORKFLOW STRATEGY:
1. DISCOVER: Use discover_verification_steps to find all available verification steps
2. EXPAND: Use verification_step with action="expand" to open accordion sections
3. START: Use verification_step with action="start" to begin verification
4. FILL: Use fill_verification_form to complete form fields with provided data
5. SAVE: Use verification_step with action="save" to save progress

KEY DATA ATTRIBUTES:
- [data-agent-action="start-verification"] - Start verification buttons
- [data-agent-action="save-progress"] - Save progress buttons
- [data-agent-field="reasoning-notes"] - Notes/reasoning text areas
- [data-agent-field="verification-status"] - Status dropdowns
- [data-accordion-trigger] - Accordion triggers with data-step-name
- [data-step-id] - Step identifiers

SMART CLICKING:
- Use smart_click with text parameter to find buttons by text content
- Use smart_click with dataAttribute and dataValue for precise targeting
- Fallback to click_element only if smart_click fails

FORM FILLING STRATEGY:
Use fill_verification_form with stepId and formData object containing:
- "reasoning-notes": "Your verification findings and notes"
- Other field names as needed

Always start by discovering verification steps, then systematically complete each one!

You must verbalize your actions in a succinct single sentence before every tool call.
`,
      model: 'gpt-4.1',
      tools: [
        clickElementTool,
        fillInputTool,
        selectOptionTool,
        hoverElementTool,
        scrollToElementTool,
        waitForElementTool,
        queryElementsTool,
        smartClickTool,
        verificationStepTool,
        fillVerificationFormTool,
        discoverVerificationStepsTool
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
      
      // For demo purposes, simulate accordion clicking
      if (task.toLowerCase().includes('accordion')) {
        return this.simulateAccordionDemo();
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
                  const toolName = toolCall.tool_call?.function?.name || 'unknown_tool';
                  const toolArgs = toolCall.tool_call?.function?.arguments || '{}';
                  
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
                  console.log('🔍 Agent Loop: Unhandled item type:', runItemEvent.item?.type);
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
            console.log('🔍 Agent Loop: Unhandled event type:', (event as any).type);
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
      case 'click_element':
        return `Clicking ${args.description || args.selector}`;
      case 'fill_input':
        return `Filling ${args.description || 'input'} with "${args.text}"`;
      case 'select_option':
        return `Selecting option in ${args.description || 'dropdown'}`;
      case 'hover_element':
        return `Hovering over ${args.description || args.selector}`;
      case 'scroll_to_element':
        return `Scrolling to ${args.description || args.selector}`;
      case 'wait_for_element':
        return `Waiting for ${args.selector}`;
      case 'query_elements':
        return `Finding elements: ${args.selector}`;
      case 'smart_click':
        return `Clicking ${args.description}`;
      case 'verification_step':
        return `Performing action on ${args.stepId} verification step`;
      case 'fill_verification_form':
        return `Filling verification form for ${args.stepId}`;
      case 'discover_verification_steps':
        return `Discovering verification steps`;
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
   * Simulate accordion demo for testing without API key
   */
  private async simulateAccordionDemo(): Promise<string> {
    console.log('🎭 Agent Runner: Running simulated accordion demo (no API key)');
    const store = useAgentStore.getState();
    
    // Simulate clicking on accordions with visual feedback
    const accordionSelectors = [
      '[data-accordion-trigger][data-step-name="identity_verification"]',
      '[data-accordion-trigger][data-step-name="license_verification"]',
      '[data-accordion-trigger][data-step-name="education_verification"]'
    ];
    
    for (const selector of accordionSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log('🎯 Simulated Demo: Clicking accordion', selector);
        store.addThought({
          message: `Clicking on ${element.dataset.stepName || 'accordion'} step`,
          type: 'action'
        });
        
        // Simulate smooth movement and click
        await uiPrimitives.smoothClick({
          selector,
          description: `${element.dataset.stepName || 'accordion'} step`,
          moveDuration: 800,
          clickDelay: 500
        });
        
        // Wait between clicks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('✅ Simulated Demo: Accordion demo completed');
    return 'Demo completed: Clicked on verification step accordions (simulated mode)';
  }

  /**
   * Complete verification workflow via accordion interaction
   */
  async demoAccordionClicks(): Promise<string> {
    console.log('🎯 Agent Runner: Starting full verification workflow');
    
    // Get practitioner context from global window object if available
    const practitionerContext = typeof window !== 'undefined' ? (window as any).__practitionerContext : undefined;
    
    // Use the same comprehensive task as completeVerificationWorkflow
    return this.completeVerificationWorkflow(practitionerContext);
  }

  /**
   * Demo task: Fill out a license form
   */
  async demoLicenseForm(): Promise<string> {
    console.log('📝 Agent Runner: Starting license form demo');
    return this.executeTask(
      'Please demonstrate filling out a medical license form. Look for license-related form fields and fill them with sample data.'
    );
  }

  /**
   * Complete the full verification workflow
   */
  async completeVerificationWorkflow(practitionerContext?: any): Promise<string> {
    console.log('🏥 Agent Runner: Starting complete verification workflow', practitionerContext);
    
    // Build task with real practitioner data if available
    let task = 'Please complete the entire healthcare provider verification workflow. Start by clicking any "Start Verification" button, then systematically go through each verification step (identity, license, education, hospital privileges, incidents), fill out all forms and complete the entire process. Make sure to expand each accordion section, fill all required fields, and submit/save each step.';
    
    if (practitionerContext?.practitioner) {
      const practitioner = practitionerContext.practitioner;
      const providerData = practitionerContext.providerData;
      const applications = practitionerContext.applications || [];
      
      // Extract real data for the agent to use
      const firstName = practitioner.first_name || 'John';
      const lastName = practitioner.last_name || 'Doe';
      const fullName = `${firstName} ${practitioner.middle_name ? practitioner.middle_name + ' ' : ''}${lastName}${practitioner.suffix ? ' ' + practitioner.suffix : ''}`;
      const ssn = practitioner.ssn || '123-45-6789';
      const npiNumber = applications.find((app: any) => app.npi_number)?.npi_number || providerData?.npi_number || '1234567890';
      const licenseNumber = providerData?.license_number || applications.find((app: any) => app.license_number)?.license_number || 'MD123456';
      const deaNumber = providerData?.dea_number || applications.find((app: any) => app.dea_number)?.dea_number || 'BD1234567';
      
      // Extract education info
      let education = 'Doctor of Medicine';
      let medicalSchool = 'Medical University';
      let graduationYear = '2015';
      
      if (practitioner.education) {
        if (typeof practitioner.education === 'object') {
          education = practitioner.education.degree || education;
          medicalSchool = practitioner.education.medical_school || medicalSchool;
          graduationYear = practitioner.education.graduation_year || graduationYear;
        } else if (typeof practitioner.education === 'string') {
          education = practitioner.education;
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
      
      // Extract DOB
      let dateOfBirth = '1985-03-15';
      if (practitioner.demographics) {
        const demo = practitioner.demographics as any;
        if (demo?.date_of_birth) {
          dateOfBirth = demo.date_of_birth;
        }
      }
      
      task = `Please complete the entire healthcare provider verification workflow for ${fullName}. Start by clicking any "Start Verification" button, then systematically go through each verification step (identity, license, education, hospital privileges, incidents), fill out all forms with the following REAL provider data, and complete the entire process:

REAL PROVIDER DATA TO USE:
- Full Name: ${fullName}
- SSN: ${ssn}
- Date of Birth: ${dateOfBirth}
- NPI Number: ${npiNumber}
- License Number: ${licenseNumber}
- DEA Number: ${deaNumber}
- Education: ${education}
- Medical School: ${medicalSchool}
- Graduation Year: ${graduationYear}
- Address: ${address}

Make sure to expand each accordion section, fill all required fields with this real data, and submit/save each step. Use the exact values provided above - do not make up different data.`;
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