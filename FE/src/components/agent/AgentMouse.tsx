'use client';

import React, { useEffect, useState } from 'react';
import { useAgentUI, useAgentThoughts, AgentThought } from '@/stores/agentStore';
import { AgentCursor } from './AgentCursor';
import { MovingBorder } from '@/components/ui/moving-border';

export function AgentMouse() {
  const { mousePosition, isMouseVisible } = useAgentUI();
  const { currentThought } = useAgentThoughts();
  const [contentBounds, setContentBounds] = useState<DOMRect | null>(null);

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

  if (!isMouseVisible || !contentBounds) return null;

  // Adjust mouse position to be relative to content area
  const adjustedPosition = {
    x: mousePosition.x - contentBounds.left,
    y: mousePosition.y - contentBounds.top,
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[9999]">
      {/* Agent Cursor - always the same style */}
      <AgentCursor position={adjustedPosition} />
      
      {/* Thought Bubble with conditional moving border */}
      <AgentThoughtBubble 
        position={adjustedPosition} 
        currentThought={currentThought} 
      />
      
      {/* Debug info showing both original and adjusted coordinates */}
      <div
        className="absolute text-xs bg-black text-white px-2 py-1 rounded opacity-75"
        style={{
          left: adjustedPosition.x + 20,
          top: adjustedPosition.y + 30,
        }}
      >
        <div>Viewport: ({mousePosition.x}, {mousePosition.y})</div>
        <div>Content: ({Math.round(adjustedPosition.x)}, {Math.round(adjustedPosition.y)})</div>
        <div>Content Offset: ({Math.round(contentBounds.left)}, {Math.round(contentBounds.top)})</div>
      </div>
    </div>
  );
}

interface AgentThoughtBubbleProps {
  position: { x: number; y: number };
  currentThought: AgentThought | null;
}

function AgentThoughtBubble({ position, currentThought }: AgentThoughtBubbleProps) {
  if (!currentThought) return null;

  const isActionThought = currentThought.type === 'action';

  if (isActionThought) {
    // Action thought bubble with moving border
    return (
      <div
        className="absolute max-w-xs"
        style={{
          left: position.x + 30,
          top: position.y - 60,
        }}
      >
        <div className="relative">
          {/* Moving border container */}
          <div className="relative overflow-hidden rounded-lg">
            <MovingBorder duration={1500} rx="12px" ry="12px">
              <div className="w-4 h-4 opacity-80 bg-[radial-gradient(var(--orange-500)_40%,transparent_60%)]" />
            </MovingBorder>
            
            {/* Thought bubble content with action styling */}
            <div className="relative bg-white dark:bg-gray-800 border-2 border-orange-500/20 rounded-lg shadow-lg px-3 py-2 backdrop-blur-sm">
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
          </div>
          
          {/* Thought bubble tail */}
          <div className="absolute -bottom-2 left-4">
            <div className="w-4 h-4 bg-white dark:bg-gray-800 border-l-2 border-b-2 border-orange-500/20 transform rotate-45"></div>
          </div>
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
        
        {/* Thought bubble tail */}
        <div className="absolute -bottom-2 left-4">
          <div className="w-4 h-4 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-600 transform rotate-45"></div>
        </div>
      </div>
    </div>
  );
} 