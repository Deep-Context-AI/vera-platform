'use client';

import React from 'react';
import { Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export function VerificationDemoContainers() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        AI Agent Demo - Verification Containers
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* NPDB Container */}
        <div
          data-verification="npdb"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">NPDB Check</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            National Practitioner Data Bank verification for malpractice and disciplinary history.
          </p>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-600">Pending Verification</span>
          </div>
        </div>

        {/* OIG Container */}
        <div
          data-verification="oig"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">OIG Exclusions</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Office of Inspector General exclusions list verification.
          </p>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-yellow-600">Pending Verification</span>
          </div>
        </div>

        {/* License Container */}
        <div
          data-verification="license"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">License Verification</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            State medical license verification and status check.
          </p>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600">Verified</span>
          </div>
        </div>
      </div>

      {/* Agent Control Panel */}
      <AgentControlPanel />
    </div>
  );
}

function AgentControlPanel() {
  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
        <span className="mr-2">🤖</span>
        AI Agent Demo Controls
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The AI agent automatically tracks verification elements and positions its cursor accurately using viewport snapshots.
      </p>
      
      <div className="flex flex-wrap gap-2">
        <AgentDemoButton
          action="demo"
          label="Start Demo"
          description="Basic mouse movement demonstration"
        />
        <AgentDemoButton
          action="verification"
          label="Verification Demo"
          description="Click through verification containers"
        />
        <ViewportSnapshotButton />
        <ElementTrackingButton />
        <VisualAlignmentTestButton />
        <MoveToElementButton elementId="npdb" label="Move to NPDB" />
        <MoveToElementButton elementId="oig" label="Move to OIG" />
        <MoveToElementButton elementId="license" label="Move to License" />
        <ActionThoughtTestButton />
        <AgentStopButton />
      </div>
    </div>
  );
}

interface AgentDemoButtonProps {
  action: 'demo' | 'verification';
  label: string;
  description: string;
}

function AgentDemoButton({ action, label, description }: AgentDemoButtonProps) {
  const handleClick = () => {
    console.log(`Starting ${action} demo`);
    
    // Start the agent and add appropriate thoughts
    import('@/stores/agentStore').then(({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // Start the agent
      store.startAgent();
      
      if (action === 'verification') {
        // Add ACTION thought for verification demo
        store.addThought({
          message: 'Starting verification workflow...',
          type: 'action',
        });
        
        // Simulate a verification sequence with different thought types
        setTimeout(() => {
          store.addThought({
            message: 'Analyzing verification containers...',
            type: 'thinking',
          });
        }, 2000);
        
        setTimeout(() => {
          store.addThought({
            message: 'Clicking on NPDB verification...',
            type: 'action',
          });
        }, 4000);
        
        setTimeout(() => {
          store.addThought({
            message: 'NPDB verification completed successfully',
            type: 'result',
          });
        }, 6000);
        
      } else {
        // Basic demo
        store.addThought({
          message: 'Demonstrating cursor movement...',
          type: 'thinking',
        });
      }
    });
    
    // Also trigger the custom event for any other listeners
    window.dispatchEvent(new CustomEvent('agent-demo', { 
      detail: { action } 
    }));
  };

  return (
    <button
      onClick={handleClick}
      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      title={description}
    >
      {label}
    </button>
  );
}

function ViewportSnapshotButton() {
  const handleViewportSnapshot = () => {
    console.log('=== VIEWPORT SNAPSHOT ===');
    
    // Use the new agent store viewport tracking
    import('@/stores/agentStore').then(({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // Take a viewport snapshot
      store.snapshotViewport();
      
      // Track all verification elements
      store.trackElements([
        '[data-verification="npdb"]',
        '[data-verification="oig"]',
        '[data-verification="license"]'
      ]);
      
      console.log('Viewport snapshot complete. Check console for tracking results.');
    });
  };

  return (
    <button
      onClick={handleViewportSnapshot}
      className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
      title="Take viewport snapshot and track elements"
    >
      📸 Snapshot
    </button>
  );
}

function ElementTrackingButton() {
  const handleElementTracking = () => {
    console.log('=== ELEMENT TRACKING ===');
    
    // Use the new agent store to display tracked element info
    import('@/stores/agentStore').then(({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // First ensure we have tracked elements
      store.trackElements([
        '[data-verification="npdb"]',
        '[data-verification="oig"]',
        '[data-verification="license"]'
      ]);
      
      // Log all tracked elements
      const trackedElements = store.trackedElements;
      const availableTargets = store.availableTargets;
      
      console.log('Tracked Elements:', trackedElements);
      console.log('Available Targets:', availableTargets);
      
      // Show viewport info
      console.log('Viewport Info:', store.viewportInfo);
    });
  };

  return (
    <button
      onClick={handleElementTracking}
      className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
      title="Show tracked element information"
    >
      🎯 Track Elements
    </button>
  );
}

function VisualAlignmentTestButton() {
  const handleVisualAlignmentTest = () => {
    console.log('=== VISUAL ALIGNMENT TEST ===');
    
    // Test alignment on OIG element since that's what user is testing
    const element = document.querySelector('[data-verification="oig"]');
    if (element) {
      const rect = element.getBoundingClientRect();
      const calculatedCenter = {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
      
      console.log('OIG Element Analysis:', {
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        calculatedCenter,
        cursorTipPosition: {
          x: calculatedCenter.x - 4, // Accounting for our -4px transform
          y: calculatedCenter.y - 4,
        }
      });
      
      // Create visual markers for debugging
      const markers = [
        { id: 'center-marker', pos: calculatedCenter, color: 'red', label: 'Calculated Center' },
        { id: 'cursor-tip-marker', pos: { x: calculatedCenter.x - 4, y: calculatedCenter.y - 4 }, color: 'blue', label: 'Cursor Tip Target' },
      ];
      
      // Remove existing markers
      markers.forEach(m => {
        const existing = document.getElementById(m.id);
        if (existing) existing.remove();
      });
      
      // Add new markers
      markers.forEach(marker => {
        const markerEl = document.createElement('div');
        markerEl.id = marker.id;
        markerEl.style.position = 'fixed';
        markerEl.style.left = marker.pos.x + 'px';
        markerEl.style.top = marker.pos.y + 'px';
        markerEl.style.width = '8px';
        markerEl.style.height = '8px';
        markerEl.style.backgroundColor = marker.color;
        markerEl.style.border = '2px solid white';
        markerEl.style.borderRadius = '50%';
        markerEl.style.transform = 'translate(-50%, -50%)';
        markerEl.style.zIndex = '10000';
        markerEl.style.pointerEvents = 'none';
        markerEl.title = marker.label;
        
        document.body.appendChild(markerEl);
      });
      
      // Position the cursor at the calculated center
      import('@/stores/agentStore').then(({ useAgentStore }) => {
        const store = useAgentStore.getState();
        store.updateMousePosition(calculatedCenter);
        store.showMouse();
        
        console.log('Cursor positioned at calculated center. Red dot = element center, Blue dot = where cursor tip should be.');
      });
      
      // Remove markers after 8 seconds
      setTimeout(() => {
        markers.forEach(m => {
          const markerToRemove = document.getElementById(m.id);
          if (markerToRemove) markerToRemove.remove();
        });
      }, 8000);
    }
  };

  return (
    <button
      onClick={handleVisualAlignmentTest}
      className="px-3 py-2 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 transition-colors"
      title="Test visual alignment with markers"
    >
      🎯 Visual Test
    </button>
  );
}

function MoveToElementButton({ elementId, label }: { elementId: string; label: string }) {
  const handleMoveToElement = async () => {
    console.log(`=== MOVING TO ${label} ===`);
    
    // Use the new agent store moveToElement method
    import('@/stores/agentStore').then(async ({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // Ensure agent is started and mouse is visible
      store.startAgent();
      
      // Add ACTION thought for moving - this will trigger the moving border
      store.addThought({
        message: `Moving to ${label} container...`,
        type: 'action',
      });
      
      // Try to move to the element
      const success = await store.moveToElement(elementId);
      
      if (success) {
        console.log(`✅ Successfully moved to ${label}`);
        
        // Add a visual confirmation thought
        store.addThought({
          message: `Positioned at ${label} verification container`,
          type: 'result',
        });
      } else {
        console.log(`❌ Failed to move to ${label}`);
        
        // Add error thought
        store.addThought({
          message: `Failed to locate ${label} container`,
          type: 'result',
        });
      }
    });
  };

  return (
    <button
      onClick={handleMoveToElement}
      className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
      title={`Move to ${label}`}
    >
      {label}
    </button>
  );
}

function ActionThoughtTestButton() {
  const handleActionTest = () => {
    console.log('=== TESTING ACTION THOUGHT WITH MOVING BORDER ===');
    
    import('@/stores/agentStore').then(({ useAgentStore }) => {
      const store = useAgentStore.getState();
      
      // Start the agent and show mouse
      store.startAgent();
      
      // Add an ACTION thought to trigger the moving border
      store.addThought({
        message: 'Clicking verification container...',
        type: 'action',
      });
      
      // Position cursor at center of screen for demo
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      store.updateMousePosition({ x: centerX, y: centerY });
      
      console.log('ACTION thought added - you should see the moving border around the cursor!');
      
      // Clear the thought after 5 seconds
      setTimeout(() => {
        store.setCurrentThought(null);
      }, 5000);
    });
  };

  return (
    <button
      onClick={handleActionTest}
      className="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
      title="Test ACTION thought with moving border"
    >
      🔥 Action Test
    </button>
  );
}

function AgentStopButton() {
  const handleStop = () => {
    window.dispatchEvent(new CustomEvent('agent-stop'));
  };

  return (
    <button
      onClick={handleStop}
      className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
      title="Stop agent demonstration"
    >
      Stop Agent
    </button>
  );
} 