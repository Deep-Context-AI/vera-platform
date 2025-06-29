'use client';

import React, { useEffect } from 'react';
import { useAgentRunner } from '@/hooks/useAgentRunner';
import { AgentOverlay } from '@/components/agent/AgentOverlay';
import { VerificationDemoContainers } from '@/components/agent/VerificationDemoContainers';

interface ProviderDetailClientProps {
  providerId: string;
  children: React.ReactNode;
}

export function ProviderDetailClient({ providerId, children }: ProviderDetailClientProps) {
  const agentRunner = useAgentRunner();

  // Set up event listeners for agent demo controls
  useEffect(() => {
    const handleAgentDemo = (event: CustomEvent) => {
      const { action } = event.detail;
      
      switch (action) {
        case 'demo':
          agentRunner.runDemo();
          break;
        case 'verification':
          agentRunner.runVerificationDemo();
          break;
        default:
          console.warn('Unknown agent demo action:', action);
      }
    };

    const handleAgentStop = () => {
      agentRunner.stopAgent();
    };

    // Add event listeners
    window.addEventListener('agent-demo', handleAgentDemo as EventListener);
    window.addEventListener('agent-stop', handleAgentStop);

    // Cleanup
    return () => {
      window.removeEventListener('agent-demo', handleAgentDemo as EventListener);
      window.removeEventListener('agent-stop', handleAgentStop);
    };
  }, []); // Empty dependency array to prevent re-running

  return (
    <>
      {/* Original provider detail content */}
      {children}
      
      {/* Agent overlay system - only render when needed */}
      <AgentOverlay />
    </>
  );
}

// Enhanced verification tab content with agent demo
export function VerificationTabContent() {
  return (
    <div className="space-y-6">
      {/* Original verification content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 text-gray-400 mx-auto mb-4">🛡️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Verifications</h3>
          <p className="text-gray-500 dark:text-gray-400">Verification details will be displayed here.</p>
        </div>
      </div>

      {/* Agent demo containers */}
      <VerificationDemoContainers />
    </div>
  );
} 