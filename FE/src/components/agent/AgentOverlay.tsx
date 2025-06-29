'use client';

import React from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { AgentMouse } from './AgentMouse';

export function AgentOverlay() {
  const isRunning = useAgentStore(state => state.isRunning);

  if (!isRunning) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9998]"
    >
      {/* Agent Mouse Cursor */}
      <AgentMouse />
      
      {/* Optional: Add a subtle overlay to indicate agent is active */}
      <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[0.5px]" />
      
      {/* Agent Status Indicator - positioned in top right */}
      <AgentStatusIndicator />
    </div>
  );
}

function AgentStatusIndicator() {
  const currentTask = useAgentStore(state => state.currentTask);

  return (
    <div className="absolute top-4 right-4 z-[10000]">
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
}