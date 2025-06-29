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
      
      {/* Debug info showing viewport coordinates */}
      <div
        className="absolute text-xs bg-black text-white px-2 py-1 rounded opacity-75 z-[100001]"
        style={{
          left: portalPosition.x + 20,
          top: portalPosition.y + 30,
        }}
      >
        <div>Viewport: ({mousePosition.x}, {mousePosition.y})</div>
        <div>Portal: ({Math.round(portalPosition.x)}, {Math.round(portalPosition.y)})</div>
        <div>Content Offset: ({Math.round(contentBounds.left)}, {Math.round(contentBounds.top)})</div>
      </div>
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
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
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
              {currentThought.type === 'thinking' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
              {currentThought.type === 'result' && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
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