'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAgentUI, useAgentThoughts, AgentThought } from '@/stores/agentStore';
import { AgentCursor } from './AgentCursor';
import { MovingBorder } from '@/components/ui/moving-border';

export function AgentMouse() {
  const { mousePosition, isMouseVisible } = useAgentUI();
  const { currentThought } = useAgentThoughts();
  const [contentBounds, setContentBounds] = useState<DOMRect | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Track the main content area boundaries to adjust coordinates
  useEffect(() => {
    if (!isMouseVisible) return;

    const updateContentBounds = () => {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        const bounds = mainContent.getBoundingClientRect();
        setContentBounds(bounds);
      }
    };

    updateContentBounds();
    window.addEventListener('resize', updateContentBounds);

    return () => {
      window.removeEventListener('resize', updateContentBounds);
    };
  }, [isMouseVisible]);

  // Set up portal container
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPortalContainer(document.body);
    }
  }, []);

  if (!isMouseVisible || !contentBounds || !portalContainer) return null;

  // Use viewport coordinates directly since we're rendering in a portal
  const portalPosition = {
    x: mousePosition.x,
    y: mousePosition.y,
  };

  const agentMouseContent = (
    <div className="fixed inset-0 pointer-events-none z-[99999]">
      {/* Agent Cursor - always the same style */}
      <AgentCursor position={portalPosition} />
      
      {/* Thought Bubble with conditional moving border */}
      <AgentThoughtBubble 
        position={portalPosition} 
        currentThought={currentThought} 
      />
    </div>
  );

  return createPortal(agentMouseContent, portalContainer);
}

interface AgentThoughtBubbleProps {
  position: { x: number; y: number };
  currentThought: AgentThought | null;
}

// Custom animated border component for action thoughts using MovingBorder
function AnimatedActionBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-[2px] overflow-hidden rounded-lg">
      <div className="absolute inset-0">
        <MovingBorder duration={1200} rx="8px" ry="8px">
          {/* Solid orange segment instead of radial gradient */}
          <div className="w-6 h-6 bg-orange-500 rounded-sm opacity-90" />
        </MovingBorder>
      </div>
      
      {/* Content with background to cover the path */}
      <div className="relative bg-white dark:bg-gray-800 rounded-md">
        {children}
      </div>
    </div>
  );
}

function AgentThoughtBubble({ position, currentThought }: AgentThoughtBubbleProps) {
  if (!currentThought) return null;

  const isActionThought = currentThought.type === 'action';

  if (isActionThought) {
    // Action thought bubble with animated border
    return (
      <div
        className="absolute max-w-xs"
        style={{
          left: position.x + 30,
          top: position.y - 60,
        }}
      >
        <div className="relative">
          <AnimatedActionBorder>
            {/* Thought bubble content with action styling */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 backdrop-blur-sm">
              <div className="flex items-start space-x-2">
                {/* Action indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 240 246" fill="none" className="animate-spin">
                    <path d="M168.5 21L153 0L119.5 37.5L84.5 0L68 21L119.5 79.5L168.5 21Z" fill="#15639F"/>
                    <path d="M136.185 229.918L161.635 235.711L162.537 185.434L213.53 190.998L212.323 164.319L135.122 153.616L136.185 229.918Z" fill="#15639F"/>
                    <path d="M26.5884 161.08L23.1493 186.953L73.297 183.251L72.4221 234.539L98.8792 230.896L102.474 153.04L26.5884 161.08Z" fill="#15639F"/>
                    <path d="M40.6482 44.194L16.9757 55.1877L47.0298 95.5021L3.29528 122.308L20.5769 142.669L88.1837 103.89L40.6482 44.194Z" fill="#15639F"/>
                    <path d="M218.677 141.665L235.868 122.025L192.06 97.3396L221.189 55.1167L197.141 43.5001L151.036 106.34L218.677 141.665Z" fill="#15639F"/>
                  </svg>
                </div>
                
                {/* Thought message */}
                <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {currentThought.message}
                </div>
              </div>
            </div>
          </AnimatedActionBorder>
          
        </div>
      </div>
    );
  }

  // Default thought bubble for thinking and result thoughts
  return (
    <div
      className="absolute max-w-xs"
      style={{
        left: position.x + 30,
        top: position.y - 60,
      }}
    >
      <div className="relative">
        {/* Thought bubble content */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-start space-x-2">
            {/* Thought type indicator */}
            <div className="flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 240 246" fill="none" className={`${currentThought.type === 'thinking' ? 'animate-spin' : ''}`}>
                    <path d="M168.5 21L153 0L119.5 37.5L84.5 0L68 21L119.5 79.5L168.5 21Z" fill="#15639F"/>
                    <path d="M136.185 229.918L161.635 235.711L162.537 185.434L213.53 190.998L212.323 164.319L135.122 153.616L136.185 229.918Z" fill="#15639F"/>
                    <path d="M26.5884 161.08L23.1493 186.953L73.297 183.251L72.4221 234.539L98.8792 230.896L102.474 153.04L26.5884 161.08Z" fill="#15639F"/>
                    <path d="M40.6482 44.194L16.9757 55.1877L47.0298 95.5021L3.29528 122.308L20.5769 142.669L88.1837 103.89L40.6482 44.194Z" fill="#15639F"/>
                    <path d="M218.677 141.665L235.868 122.025L192.06 97.3396L221.189 55.1167L197.141 43.5001L151.036 106.34L218.677 141.665Z" fill="#15639F"/>
                  </svg>
            </div>
            
            {/* Thought message */}
            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
              {currentThought.message}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
} 