import { useAgentStore } from '@/stores/agentStore';
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

export interface InputInteractionOptions {
  inputSelector: string;
  text: string;
  description?: string;
  moveDuration?: number;
  clickDelay?: number;
  typingSpeed?: number;
  clearFirst?: boolean;
}

export interface FileUploadInteractionOptions {
  uploadTriggerSelector: string;
  fileName?: string;
  fileType?: string;
  acceptButtonSelector?: string;
  cancelButtonSelector?: string;
  description?: string;
  moveDuration?: number;
  clickDelay?: number;
  uploadDelay?: number;
  dialogWaitDelay?: number;
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
    
    // Check if element exists
    const targetElement = document.querySelector(selector);
    if (!targetElement) {
      store.addThought({
        message: `Could not find element: ${description}`,
        type: 'result',
      });
      return false;
    }

    // Ensure element is visible in viewport (scroll if necessary)
    const isVisible = await this.ensureElementVisible(selector, description);
    if (!isVisible) {
      store.addThought({
        message: `Could not bring ${description} into viewport`,
        type: 'result',
      });
      return false;
    }

    // Find element position after potential scrolling
    const position = this.uiSimulator.findElementPosition(selector);
    if (!position) {
      store.addThought({
        message: `Could not determine position for: ${description}`,
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
   * Complete input interaction: focus input and type text
   */
  async fillInput(options: InputInteractionOptions): Promise<boolean> {
    const {
      inputSelector,
      text,
      description = 'input field',
      moveDuration = 800,
      clickDelay = 200,
      typingSpeed = 100,
      clearFirst = true
    } = options;

    const store = useAgentStore.getState();

    // Step 1: Click to focus the input
    store.addThought({
      message: `Focusing on ${description}...`,
      type: 'thinking',
    });

    const focusSuccess = await this.smoothClick({
      selector: inputSelector,
      description: `${description} input`,
      moveDuration,
      clickDelay
    });

    if (!focusSuccess) {
      return false;
    }

    // Step 2: Clear existing content if requested
    if (clearFirst) {
      store.addThought({
        message: `Clearing existing content in ${description}...`,
        type: 'thinking',
      });

      const element = document.querySelector(inputSelector) as HTMLInputElement;
      if (element && element.value) {
        // Select all and delete
        element.select();
        await this.wait(100);
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Step 3: Type the new text
    store.addThought({
      message: `Typing "${text}" into ${description}...`,
      type: 'action',
    });

    const element = document.querySelector(inputSelector) as HTMLInputElement;
    if (!element) {
      store.addThought({
        message: `Could not find input: ${description}`,
        type: 'result',
      });
      return false;
    }

    // Type each character with delay for realistic interaction
    const currentValue = clearFirst ? '' : element.value;
    for (let i = 0; i < text.length; i++) {
      await this.wait(typingSpeed);
      element.value = currentValue + text.substring(0, i + 1);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));

    store.addThought({
      message: `Successfully entered "${text}" into ${description}`,
      type: 'result',
    });

    return true;
  }

  /**
   * Complete file upload interaction: open dialog, simulate upload, and accept
   */
  async uploadFile(options: FileUploadInteractionOptions): Promise<boolean> {
    const {
      uploadTriggerSelector,
      fileName = 'document.pdf',
      fileType = 'application/pdf',
      acceptButtonSelector = '[data-dialog-action="accept"]',
      description = 'file upload',
      moveDuration = 800,
      clickDelay = 200,
      uploadDelay = 2000,
      dialogWaitDelay = 1000
    } = options;

    const store = useAgentStore.getState();

    // Step 1: Click to open the upload dialog
    store.addThought({
      message: `Opening ${description} dialog...`,
      type: 'thinking',
    });

    const openSuccess = await this.smoothClick({
      selector: uploadTriggerSelector,
      description: `${description} trigger`,
      moveDuration,
      clickDelay
    });

    if (!openSuccess) {
      return false;
    }

    // Step 2: Wait for dialog to appear
    store.addThought({
      message: `Waiting for upload dialog to open...`,
      type: 'thinking',
    });

    await this.wait(dialogWaitDelay);

    // Step 3: Simulate file drop/upload
    store.addThought({
      message: `Simulating file upload: ${fileName}...`,
      type: 'action',
    });

    // Create and dispatch a simulated file drop event
    const dropZone = document.querySelector('[data-upload-zone]') || 
                     document.querySelector('[data-slot="dialog-content"]');
    
    if (dropZone) {
      // Create a mock file object
      const mockFile = new File(['mock content'], fileName, { type: fileType });
      
      // Create file list
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => index === 0 ? mockFile : null,
        [Symbol.iterator]: function* () {
          yield mockFile;
        }
      } as FileList;

      // Dispatch drop event
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      
      // Add file to dataTransfer
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: fileList,
          items: [{
            kind: 'file',
            type: fileType,
            getAsFile: () => mockFile
          }]
        }
      });

      dropZone.dispatchEvent(dropEvent);

      // Also try input file change event as fallback
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: fileList,
          writable: false
        });
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Step 4: Wait for upload processing/preview
    store.addThought({
      message: `Processing uploaded file...`,
      type: 'thinking',
    });

    await this.wait(uploadDelay);

    // Step 5: Click Accept button
    store.addThought({
      message: `Looking for Accept button in dialog...`,
      type: 'thinking',
    });

    // Wait a bit more for the preview to appear
    await this.wait(500);

    const acceptSuccess = await this.smoothClick({
      selector: acceptButtonSelector,
      description: 'Accept button',
      moveDuration: moveDuration * 0.8,
      clickDelay
    });

    if (acceptSuccess) {
      store.addThought({
        message: `Successfully uploaded and accepted ${fileName}`,
        type: 'result',
      });
    } else {
      store.addThought({
        message: `Could not find Accept button - upload may have failed`,
        type: 'result',
      });
    }

    return acceptSuccess;
  }

  /**
   * Cancel a dialog interaction
   */
  async cancelDialog(options: {
    cancelButtonSelector?: string;
    description?: string;
    moveDuration?: number;
    clickDelay?: number;
  } = {}): Promise<boolean> {
    const {
      cancelButtonSelector = '[data-dialog-action="cancel"]',
      description = 'dialog',
      moveDuration = 600,
      clickDelay = 200
    } = options;

    const store = useAgentStore.getState();

    store.addThought({
      message: `Canceling ${description}...`,
      type: 'action',
    });

    const cancelSuccess = await this.smoothClick({
      selector: cancelButtonSelector,
      description: 'Cancel button',
      moveDuration,
      clickDelay
    });

    if (cancelSuccess) {
      store.addThought({
        message: `Successfully canceled ${description}`,
        type: 'result',
      });
    }

    return cancelSuccess;
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
    
    // Check if element exists
    const hoverElement = document.querySelector(selector);
    if (!hoverElement) {
      store.addThought({
        message: `Could not find element: ${description}`,
        type: 'result',
      });
      return false;
    }

    // Ensure element is visible in viewport (scroll if necessary)
    const isVisible = await this.ensureElementVisible(selector, description);
    if (!isVisible) {
      store.addThought({
        message: `Could not bring ${description} into viewport`,
        type: 'result',
      });
      return false;
    }

    // Find element position after potential scrolling
    const position = this.uiSimulator.findElementPosition(selector);
    if (!position) {
      store.addThought({
        message: `Could not determine position for: ${description}`,
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
   * Move cursor to an element with viewport-aware scrolling (without clicking)
   */
  async moveToElement(options: ClickInteractionOptions): Promise<boolean> {
    const {
      selector,
      description = selector,
      moveDuration = 800
    } = options;

    const store = useAgentStore.getState();
    
    // Check if element exists
    const moveElement = document.querySelector(selector);
    if (!moveElement) {
      store.addThought({
        message: `Could not find element: ${description}`,
        type: 'result',
      });
      return false;
    }

    // Ensure element is visible in viewport (scroll if necessary)
    const isVisible = await this.ensureElementVisible(selector, description);
    if (!isVisible) {
      store.addThought({
        message: `Could not bring ${description} into viewport`,
        type: 'result',
      });
      return false;
    }

    // Find element position after potential scrolling
    const position = this.uiSimulator.findElementPosition(selector);
    if (!position) {
      store.addThought({
        message: `Could not determine position for: ${description}`,
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

    store.addThought({
      message: `Positioned cursor over ${description}`,
      type: 'result',
    });

    return true;
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
   * Check if an element exists and is visible in the viewport
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
   * Check if an element is in the viewport (more lenient than isElementVisible)
   */
  isElementInViewport(selector: string): boolean {
    const element = document.querySelector(selector);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    // Element is considered in viewport if any part of it is visible
    return rect.bottom > 0 && 
           rect.right > 0 && 
           rect.top < viewportHeight && 
           rect.left < viewportWidth;
  }

  /**
   * Ensure element is visible in viewport by scrolling if necessary
   */
  async ensureElementVisible(selector: string, description?: string): Promise<boolean> {
    const element = document.querySelector(selector);
    if (!element) {
      return false;
    }

    // Check if element is already in viewport
    if (this.isElementInViewport(selector)) {
      return true;
    }

    const store = useAgentStore.getState();
    
    store.addThought({
      message: `Scrolling to bring ${description || selector} into view...`,
      type: 'thinking',
    });

    // Scroll element into view
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center', 
      inline: 'center' 
    });

    // Wait for scroll animation to complete
    await this.wait(800);

    // Verify element is now visible
    const isVisible = this.isElementInViewport(selector);
    
    if (isVisible) {
      store.addThought({
        message: `Successfully scrolled ${description || selector} into view`,
        type: 'result',
      });
    } else {
      store.addThought({
        message: `Warning: ${description || selector} may still not be fully visible`,
        type: 'result',
      });
    }

    return isVisible;
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