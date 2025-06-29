import { useAgentStore, MousePosition, UITarget } from '@/stores/agentStore';

export class UISimulator {
  private static instance: UISimulator;
  private animationFrameId: number | null = null;

  private constructor() {}

  static getInstance(): UISimulator {
    if (!UISimulator.instance) {
      UISimulator.instance = new UISimulator();
    }
    return UISimulator.instance;
  }

  /**
   * Move mouse to a specific position with smooth animation
   */
  async moveMouseTo(targetPosition: MousePosition, duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startPosition = useAgentStore.getState().mousePosition;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth movement
        const easeInOutCubic = (t: number) => 
          t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        
        const easedProgress = easeInOutCubic(progress);
        
        const currentPosition: MousePosition = {
          x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
          y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
        };
        
        useAgentStore.getState().updateMousePosition(currentPosition);
        
        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.animationFrameId = null;
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Find a DOM element and get its position
   */
  findElementPosition(selector: string): MousePosition | null {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
      return null;
    }

    const rect = element.getBoundingClientRect();
    
    // Debug logging
    console.log(`Element ${selector}:`, {
      rect: rect,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      windowScroll: { x: window.scrollX, y: window.scrollY }
    });
    
    // Calculate center position
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Account for browser zoom/device pixel ratio
    // When zoomed, we need to adjust coordinates
    const pixelRatio = window.devicePixelRatio || 1;
    
    console.log('Pixel ratio adjustment:', {
      originalX: centerX,
      originalY: centerY,
      pixelRatio: pixelRatio,
      adjustedX: centerX,
      adjustedY: centerY
    });
    
    // Round to eliminate sub-pixel positioning issues
    const roundedX = Math.round(centerX);
    const roundedY = Math.round(centerY);
    
    console.log('Final positioning decision:', {
      original: { x: centerX, y: centerY },
      rounded: { x: roundedX, y: roundedY },
      subPixelDiff: { 
        x: centerX - roundedX, 
        y: centerY - roundedY 
      }
    });
    
    // Use rounded coordinates to avoid sub-pixel rendering issues
    return {
      x: roundedX,
      y: roundedY,
    };
  }

  /**
   * Create a UI target from a DOM selector
   */
  createUITarget(selector: string, description: string): UITarget | null {
    const position = this.findElementPosition(selector);
    if (!position) return null;

    const element = document.querySelector(selector);
    const elementName = element?.tagName.toLowerCase() || 'unknown';

    return {
      id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      element: elementName,
      description,
      position,
    };
  }

  /**
   * Simulate clicking on an element
   */
  async clickElement(selector: string, description: string = ''): Promise<boolean> {
    const target = this.createUITarget(selector, description);
    if (!target) return false;

    // Set current target
    useAgentStore.getState().setCurrentTarget(target);
    
    // Add thought about the action
    useAgentStore.getState().addThought({
      message: `Moving to ${description || selector}...`,
      type: 'action',
    });

    // Move mouse to target
    await this.moveMouseTo(target.position, 800);
    
    // Add click action thought
    useAgentStore.getState().addThought({
      message: `Clicking on ${description || selector}`,
      type: 'action',
    });

    // Simulate click with visual feedback
    await this.simulateClick();

    // Actually click the element
    const element = document.querySelector(selector);
    if (element) {
      // Dispatch click event
      element.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      }));
      
      // Add success thought
      useAgentStore.getState().addThought({
        message: `Successfully clicked ${description || selector}`,
        type: 'result',
      });
      
      return true;
    }

    return false;
  }

  /**
   * Simulate a click with visual feedback
   */
  private async simulateClick(): Promise<void> {
    return new Promise((resolve) => {
      // Add click animation class or trigger visual feedback
      // This could be enhanced with CSS animations or other visual effects
      setTimeout(resolve, 200);
    });
  }

  /**
   * Hover over an element
   */
  async hoverElement(selector: string, description: string = ''): Promise<boolean> {
    const target = this.createUITarget(selector, description);
    if (!target) return false;

    useAgentStore.getState().setCurrentTarget(target);
    
    useAgentStore.getState().addThought({
      message: `Hovering over ${description || selector}...`,
      type: 'action',
    });

    await this.moveMouseTo(target.position, 600);
    
    return true;
  }

  /**
   * Wait for a specified duration
   */
  async wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Stop any ongoing animations
   */
  stopAnimations(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Reset the simulator state
   */
  reset(): void {
    this.stopAnimations();
    useAgentStore.getState().setCurrentTarget(null);
  }

  /**
   * Debug function to test positioning
   */
  debugPosition(selector: string): void {
    const position = this.findElementPosition(selector);
    if (position) {
      console.log(`Moving to debug position:`, position);
      console.log(`Cursor will be positioned at:`, {
        svgLeft: position.x - 6,
        svgTop: position.y - 6,
        clickPointAt: { x: position.x, y: position.y }
      });
      useAgentStore.getState().updateMousePosition(position);
      useAgentStore.getState().showMouse();
    }
  }
}

// Export singleton instance
export const uiSimulator = UISimulator.getInstance();

// Utility functions for common UI interactions
export const UIActions = {
  /**
   * Click on verification containers in sequence
   */
  async clickVerificationContainers(): Promise<void> {
    const containers = [
      { selector: '[data-verification="npdb"]', description: 'NPDB verification container' },
      { selector: '[data-verification="oig"]', description: 'OIG verification container' },
      { selector: '[data-verification="license"]', description: 'License verification container' },
    ];

    for (const container of containers) {
      const success = await uiSimulator.clickElement(container.selector, container.description);
      if (success) {
        await uiSimulator.wait(1000); // Wait between clicks
      }
    }
  },

  /**
   * Demonstrate mouse movement around verification tab
   */
  async demonstrateVerificationTab(): Promise<void> {
    // Move to verification tab
    await uiSimulator.hoverElement('[data-tab="verifications"]', 'Verifications tab');
    await uiSimulator.wait(500);
    
    // Move around verification elements
    const elements = [
      '[data-verification="npdb"]',
      '[data-verification="oig"]', 
      '[data-verification="license"]',
    ];

    for (const element of elements) {
      await uiSimulator.hoverElement(element, `Verification element: ${element}`);
      await uiSimulator.wait(800);
    }
  },
}; 