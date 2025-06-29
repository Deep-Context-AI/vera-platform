import { useAgentStore, MousePosition } from '@/stores/agentStore';
import { UISimulator } from './UISimulator';

export interface SelectInteractionOptions {
  selectTriggerSelector: string;
  optionSelector: string;
  description?: string;
  moveDuration?: number;
  clickDelay?: number;
  optionWaitDelay?: number;
}

export interface ClickInteractionOptions {
  selector: string;
  description?: string;
  moveDuration?: number;
  clickDelay?: number;
}

export class UIInteractionPrimitives {
  private static instance: UIInteractionPrimitives;
  private uiSimulator: UISimulator;

  private constructor() {
    this.uiSimulator = UISimulator.getInstance();
  }

  static getInstance(): UIInteractionPrimitives {
    if (!UIInteractionPrimitives.instance) {
      UIInteractionPrimitives.instance = new UIInteractionPrimitives();
    }
    return UIInteractionPrimitives.instance;
  }

  /**
   * Smooth click interaction with thoughts and visual feedback
   */
  async smoothClick(options: ClickInteractionOptions): Promise<boolean> {
    const {
      selector,
      description = selector,
      moveDuration = 800,
      clickDelay = 200
    } = options;

    const store = useAgentStore.getState();
    
    // Find element position
    const position = this.uiSimulator.findElementPosition(selector);
    if (!position) {
      store.addThought({
        message: `Could not find element: ${description}`,
        type: 'result',
      });
      return false;
    }

    // Add thinking thought
    store.addThought({
      message: `Moving to ${description}...`,
      type: 'action',
    });

    // Smooth movement to element
    await this.uiSimulator.moveMouseTo(position, moveDuration);

    // Add click thought
    store.addThought({
      message: `Clicking ${description}`,
      type: 'action',
    });

    // Click delay for visual feedback
    await this.wait(clickDelay);

    // Perform the actual click
    const element = document.querySelector(selector);
    if (element) {
      (element as HTMLElement).click();
      
      store.addThought({
        message: `Successfully clicked ${description}`,
        type: 'result',
      });
      
      return true;
    }

    store.addThought({
      message: `Failed to click ${description}`,
      type: 'result',
    });
    
    return false;
  }

  /**
   * Complete select interaction: open dropdown and select option
   */
  async selectOption(options: SelectInteractionOptions): Promise<boolean> {
    const {
      selectTriggerSelector,
      optionSelector,
      description = 'select option',
      moveDuration = 800,
      clickDelay = 200,
      optionWaitDelay = 1000
    } = options;

    const store = useAgentStore.getState();

    // Step 1: Click to open the select
    store.addThought({
      message: `Opening ${description} dropdown...`,
      type: 'thinking',
    });

    const openSuccess = await this.smoothClick({
      selector: selectTriggerSelector,
      description: `${description} trigger`,
      moveDuration,
      clickDelay
    });

    if (!openSuccess) {
      return false;
    }

    // Step 2: Wait for dropdown to appear
    store.addThought({
      message: `Waiting for dropdown options to appear...`,
      type: 'thinking',
    });

    await this.wait(optionWaitDelay);

    // Step 3: Click the specific option
    store.addThought({
      message: `Looking for option in dropdown...`,
      type: 'thinking',
    });

    const optionSuccess = await this.smoothClick({
      selector: optionSelector,
      description: `${description} option`,
      moveDuration: moveDuration * 0.6, // Slightly faster for option selection
      clickDelay
    });

    if (optionSuccess) {
      store.addThought({
        message: `Successfully selected ${description}`,
        type: 'result',
      });
    }

    return optionSuccess;
  }

  /**
   * Hover over an element with smooth movement
   */
  async smoothHover(options: ClickInteractionOptions): Promise<boolean> {
    const {
      selector,
      description = selector,
      moveDuration = 800
    } = options;

    const store = useAgentStore.getState();
    
    // Find element position
    const position = this.uiSimulator.findElementPosition(selector);
    if (!position) {
      store.addThought({
        message: `Could not find element: ${description}`,
        type: 'result',
      });
      return false;
    }

    // Add thinking thought
    store.addThought({
      message: `Hovering over ${description}...`,
      type: 'action',
    });

    // Smooth movement to element
    await this.uiSimulator.moveMouseTo(position, moveDuration);

    // Trigger hover events
    const element = document.querySelector(selector);
    if (element) {
      element.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window,
      }));
      
      element.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window,
      }));
      
      store.addThought({
        message: `Hovering over ${description}`,
        type: 'result',
      });
      
      return true;
    }

    return false;
  }

  /**
   * Type text into an input field
   */
  async typeText(selector: string, text: string, options?: {
    description?: string;
    moveDuration?: number;
    typingSpeed?: number;
  }): Promise<boolean> {
    const {
      description = 'input field',
      moveDuration = 800,
      typingSpeed = 100
    } = options || {};

    const store = useAgentStore.getState();

    // First click on the input to focus it
    const clickSuccess = await this.smoothClick({
      selector,
      description: `${description} input`,
      moveDuration
    });

    if (!clickSuccess) {
      return false;
    }

    // Add typing thought
    store.addThought({
      message: `Typing "${text}" into ${description}...`,
      type: 'action',
    });

    // Get the input element
    const element = document.querySelector(selector) as HTMLInputElement;
    if (!element) {
      store.addThought({
        message: `Could not find input: ${description}`,
        type: 'result',
      });
      return false;
    }

    // Clear existing value
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));

    // Type each character with delay
    for (let i = 0; i < text.length; i++) {
      await this.wait(typingSpeed);
      element.value = text.substring(0, i + 1);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));

    store.addThought({
      message: `Successfully typed "${text}" into ${description}`,
      type: 'result',
    });

    return true;
  }

  /**
   * Scroll to an element smoothly
   */
  async scrollToElement(selector: string, options?: {
    description?: string;
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    inline?: ScrollLogicalPosition;
  }): Promise<boolean> {
    const {
      description = selector,
      behavior = 'smooth',
      block = 'center',
      inline = 'center'
    } = options || {};

    const store = useAgentStore.getState();

    store.addThought({
      message: `Scrolling to ${description}...`,
      type: 'action',
    });

    const element = document.querySelector(selector);
    if (!element) {
      store.addThought({
        message: `Could not find element to scroll to: ${description}`,
        type: 'result',
      });
      return false;
    }

    element.scrollIntoView({ behavior, block, inline });

    // Wait for scroll to complete
    await this.wait(500);

    store.addThought({
      message: `Scrolled to ${description}`,
      type: 'result',
    });

    return true;
  }

  /**
   * Wait for a specified duration
   */
  private async wait(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Check if an element exists and is visible
   */
  isElementVisible(selector: string): boolean {
    const element = document.querySelector(selector);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           rect.top >= 0 && rect.left >= 0 &&
           rect.bottom <= window.innerHeight && 
           rect.right <= window.innerWidth;
  }

  /**
   * Wait for an element to appear
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<boolean> {
    const store = useAgentStore.getState();
    const startTime = Date.now();

    store.addThought({
      message: `Waiting for element: ${selector}`,
      type: 'thinking',
    });

    while (Date.now() - startTime < timeout) {
      if (document.querySelector(selector)) {
        store.addThought({
          message: `Element appeared: ${selector}`,
          type: 'result',
        });
        return true;
      }
      await this.wait(100);
    }

    store.addThought({
      message: `Timeout waiting for element: ${selector}`,
      type: 'result',
    });

    return false;
  }
}

// Export a singleton instance
export const uiPrimitives = UIInteractionPrimitives.getInstance(); 