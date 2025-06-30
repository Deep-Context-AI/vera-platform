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
      typingSpeed = 10,
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
        // Select all and delete with React-compatible approach
        element.select();
        await this.wait(100);
        
        // Use native setter for React controlled components
        let nativeInputValueSetter;
        const htmlElement = element as HTMLInputElement | HTMLTextAreaElement;
        
        if (htmlElement.tagName === 'INPUT') {
          nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
          )?.set;
        } else if (htmlElement.tagName === 'TEXTAREA') {
          nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;
        }
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(htmlElement, '');
        } else {
          htmlElement.value = '';
        }
        
        // Dispatch React-compatible events
        const inputEvent = new Event('input', { bubbles: true });
        Object.defineProperty(inputEvent, 'target', { 
          writable: false, 
          value: htmlElement 
        });
        htmlElement.dispatchEvent(inputEvent);
        
        const changeEvent = new Event('change', { bubbles: true });
        Object.defineProperty(changeEvent, 'target', { 
          writable: false, 
          value: htmlElement 
        });
        htmlElement.dispatchEvent(changeEvent);
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
      const newValue = currentValue + text.substring(0, i + 1);
      
      // For React controlled components, we need to set the value and trigger events properly
      let nativeInputValueSetter;
      const htmlElement = element as HTMLInputElement | HTMLTextAreaElement;
      
      if (htmlElement.tagName === 'INPUT') {
        nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
      } else if (htmlElement.tagName === 'TEXTAREA') {
        nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;
      }
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(htmlElement, newValue);
      } else {
        htmlElement.value = newValue;
      }
      
      // Dispatch both input and change events with proper React-compatible event objects
      const inputEvent = new Event('input', { bubbles: true });
      Object.defineProperty(inputEvent, 'target', { 
        writable: false, 
        value: htmlElement 
      });
      htmlElement.dispatchEvent(inputEvent);
    }

    // Final change event
    const finalElement = document.querySelector(inputSelector) as HTMLInputElement | HTMLTextAreaElement;
    const changeEvent = new Event('change', { bubbles: true });
    Object.defineProperty(changeEvent, 'target', { 
      writable: false, 
      value: finalElement 
    });
    finalElement.dispatchEvent(changeEvent);

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
      typingSpeed = 10
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

  /**
   * Find element by text content (case-insensitive)
   */
  findElementByText(text: string, tagName?: string): Element | null {
    const elements = document.querySelectorAll(tagName || '*');
    const searchText = text.toLowerCase();
    
    for (const element of elements) {
      const elementText = element.textContent?.toLowerCase().trim() || '';
      if (elementText.includes(searchText)) {
        return element;
      }
    }
    return null;
  }

  /**
   * Find elements by data attribute
   */
  findElementsByDataAttribute(attributeName: string, value?: string): Element[] {
    if (value) {
      return Array.from(document.querySelectorAll(`[data-${attributeName}="${value}"]`));
    } else {
      return Array.from(document.querySelectorAll(`[data-${attributeName}]`));
    }
  }

  /**
   * Smart element finder that tries multiple strategies
   */
  findElementSmart(options: {
    selector?: string;
    text?: string;
    dataAttribute?: string;
    dataValue?: string;
    tagName?: string;
    description?: string;
  }): Element | null {
    const { selector, text, dataAttribute, dataValue, tagName } = options;

    // Strategy 1: Try direct selector
    if (selector) {
      try {
        const element = document.querySelector(selector);
        if (element) return element;
      } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
      }
    }

    // Strategy 2: Try data attribute
    if (dataAttribute) {
      const elements = this.findElementsByDataAttribute(dataAttribute, dataValue);
      if (elements.length > 0) return elements[0];
    }

    // Strategy 3: Try text content
    if (text) {
      const element = this.findElementByText(text, tagName);
      if (element) return element;
    }

    // Strategy 4: Try common button patterns if looking for buttons
    if (text && (!tagName || tagName === 'button')) {
      const buttonSelectors = [
        `button:contains("${text}")`, // This won't work, but let's try alternatives
        `button[aria-label*="${text}" i]`,
        `button[title*="${text}" i]`,
        `[role="button"][aria-label*="${text}" i]`,
        `[role="button"][title*="${text}" i]`
      ];

      for (const sel of buttonSelectors) {
        try {
          const element = document.querySelector(sel);
          if (element) return element;
        } catch {
          // Invalid selector, continue
        }
      }
    }

    return null;
  }

  /**
   * Enhanced click with smart element finding
   */
  async smartClick(options: {
    selector?: string;
    text?: string;
    dataAttribute?: string;
    dataValue?: string;
    tagName?: string;
    description?: string;
    moveDuration?: number;
    clickDelay?: number;
  }): Promise<boolean> {
    const {
      description = 'element',
      moveDuration = 800,
      clickDelay = 200
    } = options;

    const store = useAgentStore.getState();
    
    console.log('🔍 SmartClick Debug:', { 
      options, 
      description,
      availableElements: options.selector ? document.querySelectorAll(options.selector).length : 'N/A'
    });
    
    // Find element using smart strategy
    const targetElement = this.findElementSmart(options);
    if (!targetElement) {
      // Add more debugging information
      if (options.selector) {
        const selectorExists = document.querySelector(options.selector);
        console.log('🔍 SmartClick Selector Debug:', { 
          selector: options.selector,
          exists: !!selectorExists,
          allMatches: document.querySelectorAll(options.selector).length
        });
      }
      
      store.addThought({
        message: `Could not find element: ${description}`,
        type: 'result',
      });
      return false;
    }

    console.log('🔍 SmartClick Found Element:', { 
      tagName: targetElement.tagName,
      id: targetElement.id,
      className: targetElement.className,
      textContent: targetElement.textContent?.substring(0, 50)
    });

    // Get a proper selector for the found element
    const elementSelector = this.generateSelectorForElement(targetElement);
    
    // Use the existing smoothClick logic
    return this.smoothClick({
      selector: elementSelector,
      description,
      moveDuration,
      clickDelay
    });
  }

  /**
   * Generate a CSS selector for a given element
   */
  private generateSelectorForElement(element: Element): string {
    // Try ID first
    if (element.id) {
      return `#${element.id}`;
    }

    // Try data attributes
    const dataAttrs = Array.from(element.attributes).filter(attr => attr.name.startsWith('data-'));
    if (dataAttrs.length > 0) {
      const attr = dataAttrs[0];
      return `[${attr.name}="${attr.value}"]`;
    }

    // Try class if unique enough
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        const classSelector = `.${classes.join('.')}`;
        if (document.querySelectorAll(classSelector).length === 1) {
          return classSelector;
        }
      }
    }

    // Try tag + position as last resort
    const tagName = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentElement?.children || []).filter(el => el.tagName === element.tagName);
    const index = siblings.indexOf(element);
    
    if (siblings.length === 1) {
      return tagName;
    } else {
      return `${tagName}:nth-of-type(${index + 1})`;
    }
  }

  /**
   * Find verification step elements specifically
   */
  findVerificationStepElements(): Array<{
    stepId: string;
    stepName: string;
    element: Element;
    hasStartButton: boolean;
    isExpanded: boolean;
  }> {
    const accordionTriggers = document.querySelectorAll('[data-accordion-trigger]');
    
    console.log('🔍 FindVerificationSteps Debug:', {
      totalAccordionTriggers: accordionTriggers.length,
      selectors: Array.from(accordionTriggers).map(el => ({
        stepId: el.getAttribute('data-accordion-trigger'),
        stepName: el.getAttribute('data-step-name'),
        tagName: el.tagName,
        dataState: el.getAttribute('data-state')
      }))
    });
    
    const results = Array.from(accordionTriggers).map(trigger => {
      const stepId = trigger.getAttribute('data-accordion-trigger') || '';
      const stepName = trigger.getAttribute('data-step-name') || '';
      
      // Look for start button within the parent accordion item
      const parentItem = trigger.closest('[data-slot="accordion-item"]');
      const startButton = parentItem?.querySelector(`[data-agent-action="start-verification"][data-step-id="${stepId}"]`);
      
      // Check if accordion is expanded by looking at trigger's data-state
      const triggerState = trigger.getAttribute('data-state');
      const isExpanded = triggerState === 'open';
      
      return {
        stepId,
        stepName,
        element: trigger,
        hasStartButton: !!startButton,
        isExpanded
      };
    });
    
    console.log('🔍 FindVerificationSteps Results:', results);
    return results;
  }

  /**
   * Click on verification step to expand it
   */
  async expandVerificationStep(stepId: string): Promise<boolean> {
    const store = useAgentStore.getState();
    
    store.addThought({
      message: `Expanding verification step: ${stepId}`,
      type: 'action',
    });

    // Add timing delay for better UX readability
    await this.wait(800);

    // Use direct selector approach since we know the exact format
    const success = await this.smartClick({
      selector: `[data-accordion-trigger="${stepId}"]`,
      description: `${stepId} verification step`
    });

    if (success) {
      // Wait for accordion animation
      await this.wait(1000);
      
      store.addThought({
        message: `Successfully expanded ${stepId} verification step`,
        type: 'result',
      });
    } else {
      // Fallback: try to find by step name if direct selector fails
      store.addThought({
        message: `Trying alternative approach for ${stepId}...`,
        type: 'thinking',
      });
      
      const fallbackSuccess = await this.smartClick({
        dataAttribute: 'step-name',
        dataValue: stepId.replace('_', ' '),
        description: `${stepId} verification step (fallback)`
      });
      
      if (fallbackSuccess) {
        await this.wait(1000);
        store.addThought({
          message: `Successfully expanded ${stepId} verification step (fallback method)`,
          type: 'result',
        });
        return true;
      }
    }

    return success;
  }

  /**
   * Collapse verification step accordion
   */
  async collapseVerificationStep(stepId: string): Promise<boolean> {
    const store = useAgentStore.getState();
    
    store.addThought({
      message: `Collapsing verification step: ${stepId}`,
      type: 'action',
    });

    // Add timing delay for better UX readability
    await this.wait(800);

    // First check if the step is currently expanded
    const inspectionResult = this.inspectVerificationStep(stepId);
    if (inspectionResult.state === 'collapsed') {
      store.addThought({
        message: `Step ${stepId} is already collapsed`,
        type: 'result',
      });
      return true;
    }

    if (inspectionResult.state === 'not_found') {
      store.addThought({
        message: `Could not find verification step: ${stepId}`,
        type: 'result',
      });
      return false;
    }

    // Use direct selector approach since we know the exact format
    const success = await this.smartClick({
      selector: `[data-accordion-trigger="${stepId}"]`,
      description: `${stepId} verification step (to collapse)`
    });

    if (success) {
      // Wait for accordion animation
      await this.wait(1000);
      
      store.addThought({
        message: `Successfully collapsed ${stepId} verification step`,
        type: 'result',
      });
    } else {
      // Fallback: try to find by step name if direct selector fails
      store.addThought({
        message: `Trying alternative approach for ${stepId}...`,
        type: 'thinking',
      });
      
      const fallbackSuccess = await this.smartClick({
        dataAttribute: 'step-name',
        dataValue: stepId.replace('_', ' '),
        description: `${stepId} verification step (fallback collapse)`
      });
      
      if (fallbackSuccess) {
        await this.wait(1000);
        store.addThought({
          message: `Successfully collapsed ${stepId} verification step (fallback method)`,
          type: 'result',
        });
        return true;
      }
    }

    return success;
  }

  /**
   * Start verification for a specific step
   */
  async startVerificationStep(stepId: string): Promise<boolean> {
    const store = useAgentStore.getState();
    
    store.addThought({
      message: `Starting verification for step: ${stepId}`,
      type: 'action',
    });

    // Add timing delay for better UX readability
    await this.wait(800);

    // Use the specific data-agent-action selector for the Start Verification button
    const startButtonSelector = `button[data-step-id="${stepId}"][data-agent-action="start-verification"]`;
    
    store.addThought({
      message: `Looking for Start Verification button with selector: ${startButtonSelector}`,
      type: 'action',
    });
    
    // Check if the start button exists, with retry mechanism for timing issues
    let startButton = document.querySelector(startButtonSelector);
    
    // If not found immediately, wait a bit and try again (in case of DOM updates)
    if (!startButton) {
      store.addThought({
        message: `Start button not found immediately, waiting and retrying...`,
        type: 'action',
      });
      await this.wait(1000);
      startButton = document.querySelector(startButtonSelector);
    }
    if (!startButton) {
      // Enhanced debugging - let's see what's actually in the DOM
      store.addThought({
        message: `Start button not found. Debugging DOM state...`,
        type: 'action',
      });
      
      // Check if any elements with the stepId exist at all
      const stepElements = document.querySelectorAll(`[data-step-id="${stepId}"]`);
      store.addThought({
        message: `Found ${stepElements.length} elements with data-step-id="${stepId}"`,
        type: 'action',
      });
      
      // Check all buttons in the step
      const allButtons = document.querySelectorAll(`[data-step-id="${stepId}"] button`);
      const buttonDetails = Array.from(allButtons).map(b => {
        const text = b.textContent?.trim() || '';
        const action = b.getAttribute('data-agent-action') || '';
        const stepId = b.getAttribute('data-step-id') || '';
        const disabled = (b as HTMLButtonElement).disabled;
        const visible = (b as HTMLElement).offsetParent !== null;
        return `"${text}" (action: "${action}", step: "${stepId}", disabled: ${disabled}, visible: ${visible})`;
      });
      
      // Also check for buttons with start-verification action anywhere
      const startButtons = document.querySelectorAll(`button[data-agent-action="start-verification"]`);
      const startButtonDetails = Array.from(startButtons).map(b => {
        const text = b.textContent?.trim() || '';
        const stepId = b.getAttribute('data-step-id') || '';
        const disabled = (b as HTMLButtonElement).disabled;
        const visible = (b as HTMLElement).offsetParent !== null;
        return `"${text}" (step: "${stepId}", disabled: ${disabled}, visible: ${visible})`;
      });
      
      store.addThought({
        message: `Buttons in step: ${buttonDetails.length > 0 ? buttonDetails.join(' | ') : 'NONE'}`,
        type: 'result',
      });
      
      store.addThought({
        message: `All start-verification buttons: ${startButtonDetails.length > 0 ? startButtonDetails.join(' | ') : 'NONE'}`,
        type: 'result',
      });
      
      throw new Error(`Could not find Start Verification button with selector: ${startButtonSelector}`);
    }
    
    // Check if button is disabled
    const isDisabled = (startButton as HTMLButtonElement).disabled;
    if (isDisabled) {
      store.addThought({
        message: `Start Verification button is disabled for ${stepId}`,
        type: 'result',
      });
      throw new Error(`Start Verification button is disabled for ${stepId}`);
    }
    
    // Click the start button
    store.addThought({
      message: `Clicking Start Verification button: ${startButton.textContent?.trim()}`,
      type: 'action',
    });
    
    const success = await this.smoothClick({
      selector: startButtonSelector,
      description: `Start verification button for ${stepId}`
    });

    if (!success) {
      store.addThought({
        message: `Start Verification button click failed for ${stepId}`,
        type: 'result',
      });
      throw new Error(`Failed to click Start Verification button for ${stepId}`);
    }

    await this.wait(500);
    store.addThought({
      message: `Successfully started verification for ${stepId}`,
      type: 'result',
    });

    return true;
  }

  /**
   * Fill verification step form fields
   */
  async fillVerificationForm(stepId: string, formData: Record<string, string>): Promise<boolean> {
    const store = useAgentStore.getState();
    
    store.addThought({
      message: `Filling form for verification step: ${stepId}`,
      type: 'action',
    });

    // Add timing delay for better UX readability
    await this.wait(1000);

    let allSuccess = true;

    for (const [fieldName, value] of Object.entries(formData)) {
      if (!value) continue;

      // Try to find the field
      const fieldSelector = `[data-agent-field="${fieldName}"][data-step-id="${stepId}"]`;
      const fieldElement = document.querySelector(fieldSelector);
      
      if (!fieldElement) {
        store.addThought({
          message: `Could not find field: ${fieldName} for step ${stepId}`,
          type: 'result',
        });
        allSuccess = false;
        continue;
      }

      // Add small delay between field fills for better visual tracking
      await this.wait(500);

      // Fill the field based on its type
      if (fieldElement.tagName.toLowerCase() === 'textarea' || 
          (fieldElement.tagName.toLowerCase() === 'input' && 
           ['text', 'email', 'tel', 'date'].includes((fieldElement as HTMLInputElement).type))) {
        
        const success = await this.fillInput({
          inputSelector: fieldSelector,
          text: value,
          description: `${fieldName} field`
        });
        
        if (!success) allSuccess = false;
      }
    }

    if (allSuccess) {
      store.addThought({
        message: `Successfully filled all form fields for ${stepId}`,
        type: 'result',
      });
    }

    return allSuccess;
  }

  /**
   * Set verification status for a step
   */
  async setVerificationStatus(stepId: string, status: 'completed' | 'in_progress' | 'failed' | 'requires_review'): Promise<boolean> {
    const store = useAgentStore.getState();
    
    store.addThought({
      message: `Setting verification status to "${status}" for step: ${stepId}`,
      type: 'action',
    });

    // Add timing delay for better UX readability
    await this.wait(800);

    // Look for the status select field
    const statusSelectSelector = `[data-agent-field="verification-status"][data-step-id="${stepId}"]`;
    const statusSelect = document.querySelector(statusSelectSelector);
    
    if (!statusSelect) {
      store.addThought({
        message: `Could not find status select field for ${stepId}`,
        type: 'result',
      });
      return false;
    }

    // Map status to option selectors - use the correct data-agent-option attributes
    let optionSelector: string;
    switch (status) {
      case 'completed':
        optionSelector = `[data-agent-option="completed"]`;
        break;
      case 'in_progress':
        optionSelector = `[data-agent-option="in_progress"]`;
        break;
      case 'failed':
        optionSelector = `[data-agent-option="failed"]`;
        break;
      case 'requires_review':
        optionSelector = `[data-agent-option="requires_review"]`;
        break;
      default:
        store.addThought({
          message: `Invalid status value: ${status}`,
          type: 'result',
        });
        return false;
    }

    // Use the working selectOption method that handles the complete flow
    const success = await this.selectOption({
      selectTriggerSelector: statusSelectSelector,
      optionSelector: optionSelector,
      description: `verification status to "${status}"`,
      moveDuration: 800,
      clickDelay: 200,
      optionWaitDelay: 1200
    });

    if (success) {
      store.addThought({
        message: `Successfully set verification status to "${status}" for ${stepId}`,
        type: 'result',
      });
    }

    return success;
  }

  /**
   * Save verification step progress
   */
  async saveVerificationStep(stepId: string): Promise<boolean> {
    const store = useAgentStore.getState();
    
    store.addThought({
      message: `Saving progress for verification step: ${stepId}`,
      type: 'action',
    });

    // Add timing delay for better UX readability
    await this.wait(800);

    // Use the specific data-agent-action selector for the Save Progress button
    const saveButtonSelector = `button[data-step-id="${stepId}"][data-agent-action="save-progress"]`;
    
    store.addThought({
      message: `Looking for Save Progress button with selector: ${saveButtonSelector}`,
      type: 'action',
    });
    
    // Check if the save button exists, with retry mechanism for timing issues
    let saveButton = document.querySelector(saveButtonSelector);
    
    // If not found immediately, wait a bit and try again (in case of DOM updates)
    if (!saveButton) {
      store.addThought({
        message: `Save button not found immediately, waiting and retrying...`,
        type: 'action',
      });
      await this.wait(1000);
      saveButton = document.querySelector(saveButtonSelector);
    }
    if (!saveButton) {
      // Enhanced debugging - let's see what's actually in the DOM
      store.addThought({
        message: `Save button not found. Debugging DOM state...`,
        type: 'action',
      });
      
      // Check if any elements with the stepId exist at all
      const stepElements = document.querySelectorAll(`[data-step-id="${stepId}"]`);
      store.addThought({
        message: `Found ${stepElements.length} elements with data-step-id="${stepId}"`,
        type: 'action',
      });
      
      // Check all buttons in the step
      const allButtons = document.querySelectorAll(`[data-step-id="${stepId}"] button`);
      const buttonDetails = Array.from(allButtons).map(b => {
        const text = b.textContent?.trim() || '';
        const action = b.getAttribute('data-agent-action') || '';
        const stepId = b.getAttribute('data-step-id') || '';
        const disabled = (b as HTMLButtonElement).disabled;
        const visible = (b as HTMLElement).offsetParent !== null;
        return `"${text}" (action: "${action}", step: "${stepId}", disabled: ${disabled}, visible: ${visible})`;
      });
      
      // Also check for buttons with save-progress action anywhere
      const saveButtons = document.querySelectorAll(`button[data-agent-action="save-progress"]`);
      const saveButtonDetails = Array.from(saveButtons).map(b => {
        const text = b.textContent?.trim() || '';
        const stepId = b.getAttribute('data-step-id') || '';
        const disabled = (b as HTMLButtonElement).disabled;
        const visible = (b as HTMLElement).offsetParent !== null;
        return `"${text}" (step: "${stepId}", disabled: ${disabled}, visible: ${visible})`;
      });
      
      store.addThought({
        message: `Buttons in step: ${buttonDetails.length > 0 ? buttonDetails.join(' | ') : 'NONE'}`,
        type: 'result',
      });
      
      store.addThought({
        message: `All save-progress buttons: ${saveButtonDetails.length > 0 ? saveButtonDetails.join(' | ') : 'NONE'}`,
        type: 'result',
      });
      
      throw new Error(`Could not find Save Progress button with selector: ${saveButtonSelector}`);
    }
    
    // Check if button is disabled
    const isDisabled = (saveButton as HTMLButtonElement).disabled;
    if (isDisabled) {
      store.addThought({
        message: `Save Progress button is disabled for ${stepId}`,
        type: 'result',
      });
      throw new Error(`Save Progress button is disabled for ${stepId}`);
    }
    
    // Click the save button
    store.addThought({
      message: `Clicking Save Progress button: ${saveButton.textContent?.trim()}`,
      type: 'action',
    });
    
    const success = await this.smoothClick({
      selector: saveButtonSelector,
      description: `Save progress button for ${stepId}`
    });

    if (!success) {
      store.addThought({
        message: `Save Progress button click failed for ${stepId}`,
        type: 'result',
      });
      throw new Error(`Failed to click Save Progress button for ${stepId}`);
    }

    await this.wait(500);
    store.addThought({
      message: `Successfully saved progress for ${stepId}`,
      type: 'result',
    });

    return true;
  }

  /**
   * Generic workflow step to expand accordion and start verification if needed
   * This is a reusable utility for any verification step
   */
  async expandAndStartVerificationStep(stepId: string): Promise<{
    success: boolean;
    message: string;
    step: string;
    currentState?: any;
  }> {
    const store = useAgentStore.getState();
    
    try {
      // Step 1: Inspect current state
      store.addThought({
        message: `Preparing verification step: ${stepId}`,
        type: 'action',
      });
      
      const inspectionResult = this.inspectVerificationStep(stepId);
      console.log('🔍 Expand and Start - Inspection result:', inspectionResult);
      
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
        
        const expandSuccess = await this.expandVerificationStep(stepId);
        if (!expandSuccess) {
          return {
            success: false,
            message: `Failed to expand ${stepId} accordion`,
            step: 'expand'
          };
        }
        
        // Wait for accordion animation and re-inspect
        await this.wait(1500);
        
        const reInspectionResult = this.inspectVerificationStep(stepId);
        console.log('🔍 Expand and Start - Re-inspection after expand:', reInspectionResult);
        
        if (reInspectionResult.state !== 'expanded') {
          return {
            success: false,
            message: `Failed to properly expand ${stepId} accordion`,
            step: 'expand_verification'
          };
        }
      }
      
      // Step 3: Start verification if not already started
      const finalInspection = this.inspectVerificationStep(stepId);
      
      // Check if we need to start verification (status is 'not_started' or 'unknown' with a start button)
      const needsToStart = finalInspection.hasStartButton && 
        (finalInspection.currentStatus === 'not_started' || finalInspection.currentStatus === 'unknown');
      
      if (needsToStart) {
        store.addThought({
          message: `Starting verification for ${stepId} (current status: ${finalInspection.currentStatus})...`,
          type: 'action',
        });
        
        const startSuccess = await this.startVerificationStep(stepId);
        if (!startSuccess) {
          return {
            success: false,
            message: `Failed to start verification for ${stepId}`,
            step: 'start'
          };
        }
        
        // Wait for start action to complete
        await this.wait(1000);
        
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
      
      // Final inspection to report current state
      const completionInspection = this.inspectVerificationStep(stepId);
      
      return {
        success: true,
        message: `Successfully prepared verification step ${stepId} for processing`,
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
      console.error('❌ Expand and Start Verification Error:', error);
      
      store.addThought({
        message: `Failed to prepare verification step: ${errorMessage}`,
        type: 'result',
      });
      
      return {
        success: false,
        message: `Failed to prepare verification step ${stepId}: ${errorMessage}`,
        step: 'error'
      };
    }
  }

  /**
   * Inspect a verification step to understand its current state and available actions
   */
  inspectVerificationStep(stepId: string): {
    success: boolean;
    message: string;
    state: 'not_found' | 'collapsed' | 'expanded';
    currentStatus?: string;
    availableActions?: string[];
    availableFields?: string[];
    hasStartButton?: boolean;
    hasSaveButton?: boolean;
    hasStatusField?: boolean;
    hasReasoningField?: boolean;
  } {
    console.log('🔍 Inspecting verification step:', stepId);
    
    // Debug: log all accordion items for troubleshooting
    console.log('🔍 All accordion items:', document.querySelectorAll('[data-slot="accordion-item"]').length);
    
    // Look for the trigger first to understand the structure
    const accordionTrigger = document.querySelector(`[data-accordion-trigger="${stepId}"]`);
    if (!accordionTrigger) {
      console.log('❌ Could not find accordion trigger for:', stepId);
      return {
        success: false,
        message: `Could not find accordion trigger for step: ${stepId}`,
        state: 'not_found'
      };
    }
    
    console.log('✅ Found accordion trigger for:', stepId);
    
    // Get the parent accordion item to check state
    const parentItem = accordionTrigger.closest('[data-slot="accordion-item"]');
    if (!parentItem) {
      console.log('❌ Could not find parent accordion item for:', stepId);
      return {
        success: false,
        message: `Could not find parent accordion item for step: ${stepId}`,
        state: 'not_found'
      };
    }
    
    // Check if accordion is expanded by looking at the trigger's data-state
    const triggerState = accordionTrigger.getAttribute('data-state');
    const isExpanded = triggerState === 'open';
    
    console.log('🔍 Accordion state for', stepId, ':', { triggerState, isExpanded });
    
    if (!isExpanded) {
      console.log('📁 Step is collapsed:', stepId);
      return {
        success: true,
        message: `Step ${stepId} is collapsed. Need to expand first.`,
        state: 'collapsed',
        availableActions: ['expand']
      };
    }

         // Look for the content area within the same accordion item
     const accordionContent = parentItem.querySelector('[data-slot="accordion-content"]');
     if (!accordionContent) {
       console.log('❌ Could not find accordion content within item for:', stepId);
       console.log('🔍 Available content elements in parent:', parentItem.querySelectorAll('[data-slot]').length);
       console.log('🔍 Parent item HTML:', parentItem.outerHTML.substring(0, 200));
       return {
         success: false,
         message: `Could not find accordion content within item for step: ${stepId}`,
         state: 'not_found'
       };
     }
     
     console.log('✅ Found accordion content for:', stepId);
     console.log('🔍 Content data-state:', accordionContent.getAttribute('data-state'));

    // Look for available buttons and forms within this content
    const startButton = accordionContent.querySelector(`[data-agent-action="start-verification"][data-step-id="${stepId}"]`);
    const saveButton = accordionContent.querySelector(`[data-agent-action="save-progress"][data-step-id="${stepId}"]`);
    const statusSelect = accordionContent.querySelector(`[data-agent-field="verification-status"][data-step-id="${stepId}"]`);
    const reasoningField = accordionContent.querySelector(`[data-agent-field="reasoning-notes"][data-step-id="${stepId}"]`);
    
    // Check current status from the UI badge in the trigger
    let currentStatus = 'unknown';
    const statusBadge = accordionTrigger.querySelector('[class*="badge"]');
    if (statusBadge) {
      const badgeText = statusBadge.textContent?.toLowerCase() || '';
      if (badgeText.includes('progress')) currentStatus = 'in_progress';
      else if (badgeText.includes('completed')) currentStatus = 'completed';
      else if (badgeText.includes('not started')) currentStatus = 'not_started';
    }
    
    const availableActions: string[] = [];
    const availableFields: string[] = [];
    
    if (startButton) availableActions.push('start');
    if (saveButton) availableActions.push('save');
    if (statusSelect) availableFields.push('verification-status');
    if (reasoningField) availableFields.push('reasoning-notes');
    
    // Look for form fields within the content
    const formFields = accordionContent.querySelectorAll('[data-agent-field]');
    formFields.forEach(field => {
      const fieldName = field.getAttribute('data-agent-field');
      if (fieldName && !availableFields.includes(fieldName)) {
        availableFields.push(fieldName);
      }
    });
    
    console.log('✅ Step inspection complete:', {
      stepId,
      currentStatus,
      availableActions,
      availableFields,
      hasStartButton: !!startButton,
      hasSaveButton: !!saveButton,
      contentFound: !!accordionContent,
      triggerFound: !!accordionTrigger
    });
    
    return {
      success: true,
      message: `Step ${stepId} is expanded. Status: ${currentStatus}. Available actions: ${availableActions.join(', ') || 'none'}. Available fields: ${availableFields.join(', ') || 'none'}`,
      state: 'expanded',
      currentStatus,
      availableActions,
      availableFields,
      hasStartButton: !!startButton,
      hasSaveButton: !!saveButton,
      hasStatusField: !!statusSelect,
      hasReasoningField: !!reasoningField
    };
  }

  /**
   * Add a license to the LicenseForm component
   * This handles the complete flow: click Add License button -> fill form -> submit
   */
  async addLicenseToForm(options: {
    stepId: string;
    licenseData: {
      number: string;
      state: string;
      issued: string; // YYYY-MM-DD format
      expiration: string; // YYYY-MM-DD format
      status?: string; // License status (optional)
    };
    description?: string;
  }): Promise<boolean> {
    const { stepId, licenseData } = options;
    const store = useAgentStore.getState();
    
    try {
      // Step 1: Click the "Add License" button to show the form
      store.addThought({
        message: `Opening license form for ${stepId}...`,
        type: 'action',
      });
      
      // Look for the Add License button
      const addButtonSelectors = [
        `button[data-step-id="${stepId}"][data-agent-action="open-add-license-form"]`,
        `[data-step-id="${stepId}"] button[class*="text-blue-600"]`,
        `[data-step-id="${stepId}"] button`
      ];
      
      let addButtonSuccess = false;
      for (const selector of addButtonSelectors) {
        try {
          const addSuccess = await this.smartClick({
            selector: selector,
            description: 'Add License button'
          });
          if (addSuccess) {
            addButtonSuccess = true;
            break;
          }
        } catch {
          // Try next selector
          continue;
        }
      }
      
      if (!addButtonSuccess) {
        // Fallback: try to find button by text content
        const buttons = document.querySelectorAll(`[data-step-id="${stepId}"] button`);
        for (const button of buttons) {
          if (button.textContent?.includes('Add License')) {
            const buttonSelector = this.generateSelectorForElement(button);
            const success = await this.smoothClick({
              selector: buttonSelector,
              description: 'Add License button (fallback)'
            });
            if (success) {
              addButtonSuccess = true;
              break;
            }
          }
        }
      }
      
      if (!addButtonSuccess) {
        store.addThought({
          message: `Could not find Add License button for ${stepId}`,
          type: 'result',
        });
        throw new Error(`Could not find Add License button for ${stepId}`);
      }
      
      // Wait for form to appear
      await this.wait(1000);
      
      // Step 2: Fill out the license form fields
      store.addThought({
        message: `Filling license form fields...`,
        type: 'action',
      });
      
      // Fill License Number
      const licenseNumberSuccess = await this.fillInput({
        inputSelector: `[data-step-id="${stepId}"] input[data-agent-field="license-number"]`,
        text: licenseData.number,
        description: 'license number field',
        clearFirst: true
      });
      
      if (!licenseNumberSuccess) {
        throw new Error(`Could not fill license number field for ${stepId}`);
      }
      
      await this.wait(500);
      
      // Fill State (dropdown) - always set state, even if CA
      store.addThought({
        message: `Setting state to ${licenseData.state}...`,
        type: 'action',
      });
      
      const stateSuccess = await this.selectOption({
        selectTriggerSelector: `[data-step-id="${stepId}"] [data-agent-trigger="license-state"]`,
        optionSelector: `[data-agent-option="${licenseData.state}"]`,
        description: `state selection to ${licenseData.state}`,
        moveDuration: 800,
        clickDelay: 200,
        optionWaitDelay: 1000
      });
      
      if (!stateSuccess) {
        store.addThought({
          message: `Could not set state to ${licenseData.state}`,
          type: 'result',
        });
        throw new Error(`Could not set state to ${licenseData.state} for ${stepId}`);
      }
      
      await this.wait(500);
      
      // Fill Issue Date
      const issueDateSuccess = await this.fillInput({
        inputSelector: `[data-step-id="${stepId}"] input[data-agent-field="license-issue-date"]`,
        text: licenseData.issued,
        description: 'issue date field',
        clearFirst: true
      });
      
      if (!issueDateSuccess) {
        store.addThought({
          message: `Could not fill issue date`,
          type: 'result',
        });
        throw new Error(`Could not fill issue date field for ${stepId}`);
      }
      
      await this.wait(500);
      
      // Fill Expiration Date
      const expirationDateSuccess = await this.fillInput({
        inputSelector: `[data-step-id="${stepId}"] input[data-agent-field="license-expiration-date"]`,
        text: licenseData.expiration,
        description: 'expiration date field',
        clearFirst: true
      });
      
      if (!expirationDateSuccess) {
        store.addThought({
          message: `Could not fill expiration date`,
          type: 'result',
        });
        throw new Error(`Could not fill expiration date field for ${stepId}`);
      }
      
      await this.wait(500);
      
      // Fill Status if available
      if (licenseData.status) {
        const statusSuccess = await this.fillInput({
          inputSelector: `[data-step-id="${stepId}"] input[data-agent-field="license-status"]`,
          text: licenseData.status,
          description: 'license status field',
          clearFirst: true
        });
        
        if (!statusSuccess) {
          store.addThought({
            message: `Could not fill license status`,
            type: 'result',
          });
          throw new Error(`Could not fill license status field for ${stepId}`);
        }
        
        await this.wait(500);
      }
      
      // Step 3: Click the "Add License" button to submit
      store.addThought({
        message: `Submitting license form...`,
        type: 'action',
      });
      
      // Wait a bit more to ensure the form is fully rendered and ready
      store.addThought({
        message: `Waiting for form to be fully ready...`,
        type: 'action',
      });
      await this.wait(1000);
      
      // Look for the submit button with the specific data-agent-action attribute
      const submitButtonSelector = `[data-step-id="${stepId}"] button[data-agent-action="submit-add-license"]`;
      
      store.addThought({
        message: `Looking for submit button with selector: ${submitButtonSelector}`,
        type: 'action',
      });
      
      // Check if the submit button exists
      const submitButton = document.querySelector(submitButtonSelector);
      if (!submitButton) {
        // Log all buttons for debugging
        const allButtons = document.querySelectorAll(`[data-step-id="${stepId}"] button`);
        const buttonDetails = Array.from(allButtons).map(b => {
          const text = b.textContent?.trim() || '';
          const action = b.getAttribute('data-agent-action') || '';
          const disabled = (b as HTMLButtonElement).disabled;
          return `"${text}" (action: "${action}", disabled: ${disabled})`;
        });
        
        store.addThought({
          message: `Submit button not found! Available buttons: ${buttonDetails.join(' | ')}`,
          type: 'result',
        });
        
        throw new Error(`Could not find submit button with selector: ${submitButtonSelector}`);
      }
      
      // Check if button is disabled
      const isDisabled = (submitButton as HTMLButtonElement).disabled;
      if (isDisabled) {
        store.addThought({
          message: `Submit button is disabled - checking form validation...`,
          type: 'result',
        });
        
        // Wait a bit more and try again
        await this.wait(1000);
        const recheckButton = document.querySelector(submitButtonSelector) as HTMLButtonElement;
        if (recheckButton?.disabled) {
          throw new Error(`Submit button is still disabled after waiting`);
        }
      }
      
             // Click the submit button
       store.addThought({
         message: `Clicking submit button: ${submitButton.textContent?.trim()}`,
         type: 'action',
       });
       
       const submitSuccess = await this.smoothClick({
         selector: submitButtonSelector,
         description: 'Add License submit button'
       });
       
       if (!submitSuccess) {
         store.addThought({
           message: `Submit button click failed for ${stepId}`,
           type: 'result',
         });
         throw new Error(`Failed to click submit button for ${stepId}`);
       }
       
       store.addThought({
         message: `Successfully clicked submit button for ${stepId}`,
         type: 'result',
       });
      
      // Wait for form submission to complete and verify the form is closed
      store.addThought({
        message: `Waiting for license form submission to complete...`,
        type: 'action',
      });
      await this.wait(2000);
      
      // Verify that the license was actually added by checking if the form closed
      const formStillOpen = document.querySelector(`[data-step-id="${stepId}"] input[data-agent-field="license-number"]`);
      if (formStillOpen) {
        store.addThought({
          message: `License form still appears to be open after submission for ${stepId}`,
          type: 'result',
        });
        // Try to close the form by clicking Cancel if available
        const cancelButton = document.querySelector(`[data-step-id="${stepId}"] button:contains("Cancel")`);
        if (cancelButton) {
          (cancelButton as HTMLElement).click();
          await this.wait(500);
        }
        throw new Error(`License form submission failed - form still open for ${stepId}`);
      } else {
        store.addThought({
          message: `License form closed successfully - license appears to have been added`,
          type: 'result',
        });
      }
      
      store.addThought({
        message: `Successfully added license ${licenseData.number} to ${stepId}`,
        type: 'result',
      });
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Add License Error:', error);
      
      store.addThought({
        message: `Failed to add license: ${errorMessage}`,
        type: 'result',
      });
      
      return false;
    }
  }

  /**
   * Query DOM elements for discovery and debugging
   */
  queryElements(selector: string, description?: string): {
    success: boolean;
    count: number;
    elements: Array<{
      index: number;
      tagName: string;
      id: string;
      className: string;
      textContent: string;
      dataAttributes: Record<string, string>;
      isVisible: boolean;
      position: { x: number; y: number };
    }>;
    message: string;
  } {
    console.log('🔍 Querying elements:', selector);
    
    const elements = document.querySelectorAll(selector);
    const elementInfo = Array.from(elements).map((element, index) => {
      const rect = element.getBoundingClientRect();
      return {
        index,
        tagName: element.tagName.toLowerCase(),
        id: element.id || `element-${index}`,
        className: element.className || '',
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
    
    const message = `Found ${elements.length} elements matching "${selector}"${description ? ` (${description})` : ''}`;
    console.log('✅ Query complete:', message);
    
    return {
      success: true,
      count: elements.length,
      elements: elementInfo,
      message
    };
  }
}

// Export a singleton instance
export const uiPrimitives = UIInteractionPrimitives.getInstance(); 