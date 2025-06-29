import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for agent state
export interface MousePosition {
  x: number;
  y: number;
}

export interface UITarget {
  id: string;
  element: string;
  description: string;
  position: MousePosition;
}

// New types for viewport and element tracking
export interface ElementPosition {
  id: string;
  selector: string;
  center: MousePosition;
  rect: DOMRect;
  isVisible: boolean;
  isInViewport: boolean;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  devicePixelRatio: number;
}

export interface AgentThought {
  id: string;
  message: string;
  timestamp: Date;
  type: 'thinking' | 'action' | 'result';
}

export interface VerificationResult {
  id: string;
  type: 'npdb' | 'oig' | 'license' | 'comprehensive';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: {
    success: boolean;
    message: string;
    details?: any;
  };
  startTime?: Date;
  endTime?: Date;
}

export interface AgentState {
  // Agent execution state
  isRunning: boolean;
  currentTask: string | null;
  currentThought: AgentThought | null;
  thoughtHistory: AgentThought[];
  
  // UI interaction state
  mousePosition: MousePosition;
  currentTarget: UITarget | null;
  isMouseVisible: boolean;
  
  // NEW: Viewport and element tracking
  viewportInfo: ViewportInfo;
  trackedElements: Record<string, ElementPosition>;
  availableTargets: string[]; // Array of element IDs that can be targeted
  
  // Verification state
  verificationResults: Record<string, VerificationResult>;
  completedTasks: string[];
  
  // Actions - Agent Control
  startAgent: () => void;
  stopAgent: () => void;
  setCurrentTask: (task: string | null) => void;
  addThought: (thought: Omit<AgentThought, 'id' | 'timestamp'>) => void;
  setCurrentThought: (thought: AgentThought | null) => void;
  
  // Actions - UI Control
  updateMousePosition: (position: MousePosition) => void;
  setCurrentTarget: (target: UITarget | null) => void;
  showMouse: () => void;
  hideMouse: () => void;
  
  // NEW: Viewport and element tracking actions
  snapshotViewport: () => void;
  trackElements: (selectors: string[]) => void;
  getElementPosition: (elementId: string) => ElementPosition | null;
  moveToElement: (elementId: string) => Promise<boolean>;
  scrollToElement: (elementId: string) => Promise<boolean>;
  updateViewportInfo: () => void;
  
  // Actions - Verification Control
  startVerification: (type: VerificationResult['type']) => void;
  updateVerificationResult: (id: string, result: Partial<VerificationResult>) => void;
  markTaskComplete: (taskId: string) => void;
  
  // Actions - Utility
  reset: () => void;
}

const initialState = {
  isRunning: false,
  currentTask: null,
  currentThought: null,
  thoughtHistory: [],
  mousePosition: { x: 0, y: 0 },
  currentTarget: null,
  isMouseVisible: false,
  viewportInfo: {
    width: 0,
    height: 0,
    scrollX: 0,
    scrollY: 0,
    devicePixelRatio: 1,
  },
  trackedElements: {},
  availableTargets: [],
  verificationResults: {},
  completedTasks: [],
};

export const useAgentStore = create<AgentState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Agent Control Actions
      startAgent: () => {
        console.log('🚀 Store: Starting agent');
        set({ 
          isRunning: true,
          isMouseVisible: true,
        });
        
        // Immediately snapshot the viewport and track verification elements
        get().snapshotViewport();
        get().trackElements([
          '[data-verification="npdb"]',
          '[data-verification="oig"]',
          '[data-verification="license"]'
        ]);
      },

      stopAgent: () => {
        console.log('🛑 Store: Stopping agent');
        set({ 
          isRunning: false,
          currentTask: null,
          currentThought: null,
          currentTarget: null,
          isMouseVisible: false,
        });
      },

      setCurrentTask: (task: string | null) => {
        console.log('📋 Store: Setting current task', task);
        set({ currentTask: task });
      },

      addThought: (thought: Omit<AgentThought, 'id' | 'timestamp'>) => {
        const newThought: AgentThought = {
          ...thought,
          id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
        };
        
        console.log('💭 Store: Adding thought', newThought);
        
        set((state) => ({
          thoughtHistory: [...state.thoughtHistory, newThought],
          currentThought: newThought,
        }));
      },

      setCurrentThought: (thought: AgentThought | null) => {
        set({ currentThought: thought });
      },

      // UI Control Actions
      updateMousePosition: (position: MousePosition) => {
        set({ mousePosition: position });
      },

      setCurrentTarget: (target: UITarget | null) => {
        set({ currentTarget: target });
      },

      showMouse: () => {
        set({ isMouseVisible: true });
      },

      hideMouse: () => {
        set({ isMouseVisible: false });
      },

      // NEW: Viewport and Element Tracking Actions
      snapshotViewport: () => {
        if (typeof window === 'undefined') return;
        
        const viewportInfo: ViewportInfo = {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          devicePixelRatio: window.devicePixelRatio,
        };
        
        set({ viewportInfo });
        
        console.log('📸 Viewport snapshot taken:', viewportInfo);
      },

      updateViewportInfo: () => {
        get().snapshotViewport();
      },

      trackElements: (selectors: string[]) => {
        if (typeof window === 'undefined') return;
        
        const trackedElements: Record<string, ElementPosition> = {};
        const availableTargets: string[] = [];
        
        selectors.forEach((selector, index) => {
          const element = document.querySelector(selector) as HTMLElement;
          
          if (element) {
            const rect = element.getBoundingClientRect();
            const elementId = element.dataset.verification || `element-${index}`;
            
            // Calculate center position relative to viewport
            const center: MousePosition = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            };
            
            // Check if element is visible and in viewport
            const isVisible = rect.width > 0 && rect.height > 0;
            const isInViewport = 
              rect.top >= 0 && 
              rect.left >= 0 && 
              rect.bottom <= window.innerHeight && 
              rect.right <= window.innerWidth;
            
            const elementPosition: ElementPosition = {
              id: elementId,
              selector,
              center,
              rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
                toJSON: rect.toJSON,
              } as DOMRect,
              isVisible,
              isInViewport,
            };
            
            trackedElements[elementId] = elementPosition;
            if (isVisible) {
              availableTargets.push(elementId);
            }
            
            console.log(`🎯 Tracked element "${elementId}":`, {
              selector,
              center,
              isVisible,
              isInViewport,
              rect: {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }
            });
          } else {
            console.warn(`⚠️ Element not found: ${selector}`);
          }
        });
        
        set({ trackedElements, availableTargets });
        
        console.log(`📍 Tracking ${availableTargets.length} available targets:`, availableTargets);
      },

      getElementPosition: (elementId: string) => {
        const state = get();
        return state.trackedElements[elementId] || null;
      },

      moveToElement: async (elementId: string): Promise<boolean> => {
        const elementPosition = get().getElementPosition(elementId);
        
        if (!elementPosition) {
          console.warn(`❌ Element "${elementId}" not found in tracked elements`);
          return false;
        }
        
        // Add thought about moving to element
        get().addThought({
          message: `Moving cursor to ${elementId} verification container`,
          type: 'action',
        });
        
        // If element is not in viewport, scroll to it first
        if (!elementPosition.isInViewport) {
          const scrolled = await get().scrollToElement(elementId);
          if (!scrolled) {
            return false;
          }
          
          // Re-track elements after scrolling to get updated positions
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait for scroll
          get().trackElements([
            '[data-verification="npdb"]',
            '[data-verification="oig"]',
            '[data-verification="license"]'
          ]);
          
          // Get updated position
          const updatedPosition = get().getElementPosition(elementId);
          if (!updatedPosition) return false;
          
          set({ mousePosition: updatedPosition.center });
        } else {
          // Element is in viewport, move directly
          set({ mousePosition: elementPosition.center });
        }
        
        console.log(`🎯 Moved cursor to element "${elementId}" at:`, elementPosition.center);
        return true;
      },

      scrollToElement: async (elementId: string): Promise<boolean> => {
        if (typeof window === 'undefined') return false;
        
        const elementPosition = get().getElementPosition(elementId);
        if (!elementPosition) return false;
        
        const element = document.querySelector(elementPosition.selector) as HTMLElement;
        if (!element) return false;
        
        // Add thought about scrolling
        get().addThought({
          message: `Scrolling to bring ${elementId} into view`,
          type: 'action',
        });
        
        // Scroll element into view
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center', 
          inline: 'center' 
        });
        
        // Wait for scroll to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update viewport info after scroll
        get().updateViewportInfo();
        
        console.log(`📜 Scrolled to element "${elementId}"`);
        return true;
      },

      // Verification Control Actions
      startVerification: (type: VerificationResult['type']) => {
        const id = `verification-${type}-${Date.now()}`;
        const newVerification: VerificationResult = {
          id,
          type,
          status: 'pending',
          startTime: new Date(),
        };

        set((state) => ({
          verificationResults: {
            ...state.verificationResults,
            [id]: newVerification,
          },
        }));

        // Add thought about starting verification
        get().addThought({
          message: `Starting ${type.toUpperCase()} verification...`,
          type: 'action',
        });
      },

      updateVerificationResult: (id: string, result: Partial<VerificationResult>) => {
        set((state) => ({
          verificationResults: {
            ...state.verificationResults,
            [id]: {
              ...state.verificationResults[id],
              ...result,
              ...(result.status === 'completed' && { endTime: new Date() }),
            },
          },
        }));
      },

      markTaskComplete: (taskId: string) => {
        set((state) => ({
          completedTasks: [...state.completedTasks, taskId],
        }));
      },

      // Utility Actions
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'agent-store',
    }
  )
);

// Selector hooks for performance optimization

export const useAgentExecution = () => {
  const isRunning = useAgentStore(state => state.isRunning);
  const currentTask = useAgentStore(state => state.currentTask);
  const startAgent = useAgentStore(state => state.startAgent);
  const stopAgent = useAgentStore(state => state.stopAgent);
  const setCurrentTask = useAgentStore(state => state.setCurrentTask);

  return {
    isRunning,
    currentTask,
    startAgent,
    stopAgent,
    setCurrentTask,
  };
};

export const useAgentUI = () => {
  const mousePosition = useAgentStore(state => state.mousePosition);
  const currentTarget = useAgentStore(state => state.currentTarget);
  const isMouseVisible = useAgentStore(state => state.isMouseVisible);
  const updateMousePosition = useAgentStore(state => state.updateMousePosition);
  const setCurrentTarget = useAgentStore(state => state.setCurrentTarget);
  const showMouse = useAgentStore(state => state.showMouse);
  const hideMouse = useAgentStore(state => state.hideMouse);

  return {
    mousePosition,
    currentTarget,
    isMouseVisible,
    updateMousePosition,
    setCurrentTarget,
    showMouse,
    hideMouse,
  };
};

// NEW: Viewport and element tracking selector
export const useAgentViewport = () => {
  const viewportInfo = useAgentStore(state => state.viewportInfo);
  const trackedElements = useAgentStore(state => state.trackedElements);
  const availableTargets = useAgentStore(state => state.availableTargets);
  const snapshotViewport = useAgentStore(state => state.snapshotViewport);
  const trackElements = useAgentStore(state => state.trackElements);
  const getElementPosition = useAgentStore(state => state.getElementPosition);
  const moveToElement = useAgentStore(state => state.moveToElement);
  const scrollToElement = useAgentStore(state => state.scrollToElement);
  const updateViewportInfo = useAgentStore(state => state.updateViewportInfo);

  return {
    viewportInfo,
    trackedElements,
    availableTargets,
    snapshotViewport,
    trackElements,
    getElementPosition,
    moveToElement,
    scrollToElement,
    updateViewportInfo,
  };
};

export const useAgentThoughts = () => {
  const currentThought = useAgentStore(state => state.currentThought);
  const thoughtHistory = useAgentStore(state => state.thoughtHistory);
  const addThought = useAgentStore(state => state.addThought);
  const setCurrentThought = useAgentStore(state => state.setCurrentThought);

  return {
    currentThought,
    thoughtHistory,
    addThought,
    setCurrentThought,
  };
};

export const useAgentVerifications = () => {
  const verificationResults = useAgentStore(state => state.verificationResults);
  const completedTasks = useAgentStore(state => state.completedTasks);
  const startVerification = useAgentStore(state => state.startVerification);
  const updateVerificationResult = useAgentStore(state => state.updateVerificationResult);
  const markTaskComplete = useAgentStore(state => state.markTaskComplete);

  return {
    verificationResults,
    completedTasks,
    startVerification,
    updateVerificationResult,
    markTaskComplete,
  };
}; 