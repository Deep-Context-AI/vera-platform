import React from 'react';
import { Clock, FileText, AlertTriangle, Zap, Shield, Check } from 'lucide-react';

const ProblemSolutionSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            From weeks of manual work to seconds of automation
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how Vera transforms the credentialing maze into a streamlined, error-free process
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Problem Side */}
          <div className="order-2 lg:order-1">
            <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-6 mb-8">
              <h3 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3" />
                Today's Manual Process
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">2-6 weeks per provider</p>
                    <p className="text-red-700 text-sm">Manual verification across 100+ sources</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Paper-heavy workflows</p>
                    <p className="text-red-700 text-sm">Faxes, phone calls, and manual data entry</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">High error rates</p>
                    <p className="text-red-700 text-sm">Human mistakes lead to compliance risks</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center lg:text-left">
              <p className="text-gray-600 italic">
                "Our credentialing team was drowning in paperwork. New providers waited months to start seeing patients."
              </p>
              <p className="text-gray-500 text-sm mt-2">— Medical Staff Director, 500-bed hospital</p>
            </div>
          </div>
          
          {/* Solution Side */}
          <div className="order-1 lg:order-2">
            <div className="bg-green-50 border-l-4 border-green-400 rounded-r-lg p-6 mb-8">
              <h3 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-3" />
                Vera's Automated Solution
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">4.2 minutes average</p>
                    <p className="text-green-700 text-sm">AI-powered verification across all sources</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">One-click verification</p>
                    <p className="text-green-700 text-sm">Instant PDF and JSON reports generated</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">&lt;0.1% error rate</p>
                    <p className="text-green-700 text-sm">Human-in-the-loop QA ensures perfection</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Demo Screenshot Placeholder */}
            <div className="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Vera Dashboard</h4>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="h-4 bg-blue-100 rounded animate-pulse"></div>
                <div className="h-4 bg-green-100 rounded animate-pulse"></div>
                <div className="h-4 bg-blue-100 rounded animate-pulse"></div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">Verification Status</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection; 