import React from 'react';
import { Upload, Zap, Users, Download, ArrowRight } from 'lucide-react';

const WorkflowDiagram = () => {
  const workflowSteps = [
    {
      icon: Upload,
      title: 'Incoming Roster',
      description: 'Upload provider list or connect via API',
      color: 'bg-blue-500'
    },
    {
      icon: Zap,
      title: 'API Verification',
      description: 'Automated verification across all sources',
      color: 'bg-yellow-500'
    },
    {
      icon: Users,
      title: 'Committee Review',
      description: 'Human oversight in dedicated workspace',
      color: 'bg-green-500'
    },
    {
      icon: Download,
      title: 'Export to HRIS',
      description: 'Seamless integration back to your systems',
      color: 'bg-purple-500'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Fits seamlessly into your existing workflow
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            No disruption to your current processes. Vera enhances what you already do.
          </p>
        </div>
        
        <div className="relative">
          {/* Workflow Steps */}
          <div className="grid md:grid-cols-4 gap-8 relative">
            {workflowSteps.map((step, index) => (
              <div key={index} className="text-center relative">
                {/* Connecting Arrow */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-16 -right-4 z-10">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                
                {/* Step Content */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-blue-300 hover:shadow-lg transition-all duration-300 relative z-20">
                  <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center text-white mx-auto mb-6`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Timeline */}
          <div className="mt-16 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Timeline Comparison</h3>
              <p className="text-gray-600">See the dramatic improvement in processing time</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="font-bold text-red-900 mb-3">Traditional Process</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-red-700">Manual verification</span>
                    <span className="font-semibold text-red-900">2-6 weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Committee review</span>
                    <span className="font-semibold text-red-900">1-2 weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Documentation</span>
                    <span className="font-semibold text-red-900">3-5 days</span>
                  </div>
                  <div className="border-t border-red-200 pt-2 mt-3">
                    <div className="flex justify-between font-bold">
                      <span className="text-red-900">Total time</span>
                      <span className="text-red-900">4-9 weeks</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-bold text-green-900 mb-3">With Vera</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">AI verification</span>
                    <span className="font-semibold text-green-900">4.2 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Committee review</span>
                    <span className="font-semibold text-green-900">Same day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Auto-documentation</span>
                    <span className="font-semibold text-green-900">Instant</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 mt-3">
                    <div className="flex justify-between font-bold">
                      <span className="text-green-900">Total time</span>
                      <span className="text-green-900">1-2 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowDiagram;