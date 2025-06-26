'use client';

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { mockWorkflowData, WorkflowType } from '@/lib/data/mockWorkflowData';
import WorkflowSidebar from '@/components/workflows/WorkflowSidebar';
import TriggerNode from '@/components/workflows/nodes/TriggerNode';
import AIAgentNode from '@/components/workflows/nodes/AIAgentNode';
import DecisionNode from '@/components/workflows/nodes/DecisionNode';
import ActionNode from '@/components/workflows/nodes/ActionNode';

const nodeTypes = {
  trigger: TriggerNode,
  aiAgent: AIAgentNode,
  decision: DecisionNode,
  action: ActionNode,
};

const WorkflowsPage: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType>('education-check');
  const currentWorkflow = mockWorkflowData[selectedWorkflow];
  
  const [nodes, setNodes, onNodesChange] = useNodesState(currentWorkflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentWorkflow.edges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes and edges when workflow changes
  React.useEffect(() => {
    setNodes(currentWorkflow.nodes);
    setEdges(currentWorkflow.edges);
  }, [selectedWorkflow, currentWorkflow, setNodes, setEdges]);

  return (
    <div className="h-screen flex">
      {/* Main workflow area */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900">
        <div className="h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50 dark:bg-gray-900"
          >
            <Controls className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={12} 
              size={1}
              className="bg-gray-50 dark:bg-gray-900"
            />
            <Panel position="top-left" className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentWorkflow.title}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {currentWorkflow.description}
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Right sidebar */}
      <WorkflowSidebar
        selectedWorkflow={selectedWorkflow}
        onWorkflowChange={setSelectedWorkflow}
        workflowData={mockWorkflowData}
      />
    </div>
  );
};

export default WorkflowsPage; 