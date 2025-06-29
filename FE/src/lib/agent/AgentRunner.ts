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
}

export class AgentRunner {
  private agent: Agent<VeraAgentContext>;
  private static instance: AgentRunner;

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
      instructions: `You are an AI assistant specialized in healthcare verification workflows. You have access to UI interaction tools that allow you to:

1. Click on elements using CSS selectors
2. Fill input fields with text
3. Select options from dropdowns
4. Hover over elements
5. Scroll to bring elements into view
6. Wait for elements to appear
7. Query the DOM to find available elements

Your primary focus is on helping users navigate and complete healthcare provider verification tasks. You can:

- Click on verification step accordions (look for [data-accordion-trigger] with data-step-name attributes)
- Fill out forms for licenses, education, incidents, and hospital privileges
- Navigate through different verification workflows
- Help users understand the verification process

Key selectors to look for:
- Accordion triggers: [data-accordion-trigger] (often with data-step-name attributes)
- Form inputs: input[type="text"], input[type="email"], textarea, select elements
- Buttons: button elements, especially those with specific data attributes
- Verification containers: [data-verification] attributes for different verification types

When interacting with forms:
- Use realistic sample data for healthcare verification
- Fill required fields first
- Look for data-step-name attributes to identify specific verification steps
  
Focus on helping users complete verification workflows efficiently and accurately.

You must also verbalize your actions and thoughts to the user in a succinct single sentence. It is very important that you do this before every tool call.
`,
      model: 'gpt-4.1',
      tools: [
        clickElementTool,
        fillInputTool,
        selectOptionTool,
        hoverElementTool,
        scrollToElementTool,
        waitForElementTool,
        queryElementsTool
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
   * Execute a task with the agent
   */
  async executeTask(task: string, context?: Partial<VeraAgentContext>): Promise<string> {
    const store = useAgentStore.getState();
    console.log('🚀 Agent Runner: Starting task execution', { task, context });
    
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
      console.log('🧠 Agent Runner: Sending task to OpenAI agent', { task });
      store.addThought({
        message: `Starting task: ${task}`,
        type: 'thinking'
      });

      const result = await run(this.agent, task, {
        context: agentContext
      });

      console.log('✅ Agent Runner: Task completed successfully', result);

      // Extract the final output from the result
      const finalOutput = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);

      store.addThought({
        message: `Task completed: ${finalOutput}`,
        type: 'result'
      });

      return finalOutput;
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
   * Demo task: Click on verification accordions
   */
  async demoAccordionClicks(): Promise<string> {
    console.log('🎯 Agent Runner: Starting accordion demo');
    return this.executeTask(
      'Please click on the first few verification step accordions to demonstrate UI interaction. Look for accordion triggers or expandable sections in the verification workflow.'
    );
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
   * Get the underlying agent instance (for advanced usage)
   */
  getAgent(): Agent<VeraAgentContext> {
    return this.agent;
  }
}

// Export singleton instance
export const agentRunner = AgentRunner.getInstance(); 