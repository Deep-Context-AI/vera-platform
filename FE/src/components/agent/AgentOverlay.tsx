'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAgentStore } from '@/stores/agentStore';
import { AgentMouse } from './AgentMouse';

export function AgentOverlay() {
  const isRunning = useAgentStore(state => state.isRunning);

  if (!isRunning) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[99998]"
    >
      {/* Agent Mouse Cursor */}
      <AgentMouse />
      
      {/* Optional: Add a subtle overlay to indicate agent is active */}
      <div className="absolute inset-0 bg-blue-500/5 rounded-lg" />
      
      {/* Agent Status Indicator - positioned in top right */}
      <AgentStatusIndicator />
    </div>
  );
}

function AgentStatusIndicator() {
  const currentTask = useAgentStore(state => state.currentTask);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPortalContainer(document.body);
    }
  }, []);

  if (!portalContainer) return null;

  const statusContent = (
    <div className="fixed top-4 right-4 z-[100000] pointer-events-none">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center space-x-2">
          {/* Pulsing indicator */}
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          
          <div className="text-sm">
            <div className="font-medium text-gray-900">AI Assistant Active</div>
            {currentTask && (
              <div className="text-xs text-gray-600">{currentTask}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(statusContent, portalContainer);
}