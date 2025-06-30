"use client";

import React, { useState } from 'react';
import { Play, Search, Check, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const ProductDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const demoSteps = [
    {
      title: 'Search Provider',
      description: 'Enter provider name or NPI number',
      icon: Search,
      color: 'bg-blue-500'
    },
    {
      title: 'AI Verification',
      description: 'Our AI queries 100+ primary sources instantly',
      icon: Check,
      color: 'bg-green-500'
    },
    {
      title: 'Generate Report',
      description: 'Download audit-ready PDF and JSON reports',
      icon: Download,
      color: 'bg-purple-500'
    }
  ];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % demoSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + demoSteps.length) % demoSteps.length);
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See Vera in action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how our platform transforms credentialing from weeks to minutes
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Demo Video/Interactive */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Video Player Mockup */}
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                <button className="group bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-all duration-200">
                  <Play className="w-12 h-12 text-white ml-1 group-hover:scale-110 transition-transform" />
                </button>
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center justify-between text-white text-sm">
                    <span>Vera Demo: Provider Verification</span>
                    <span>1:32 / 2:15</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1 mt-2">
                    <div className="bg-blue-500 h-1 rounded-full w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 bg-green-500 text-white p-4 rounded-full shadow-lg">
              <Check className="w-8 h-8" />
            </div>
          </div>
          
          {/* Interactive Steps */}
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Verification Process</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={prevStep}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextStep}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {demoSteps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-start p-6 rounded-xl border-2 transition-all duration-300 ${
                  index === currentStep 
                    ? 'border-blue-300 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 ${step.color} rounded-lg flex items-center justify-center text-white mr-4 flex-shrink-0 ${
                  index === currentStep ? 'scale-110' : ''
                } transition-transform duration-200`}>
                  <step.icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Step {index + 1}: {step.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                  {index === currentStep && (
                    <div className="mt-4 flex items-center text-blue-600 font-medium">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                      Active step
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center mb-3">
                <Check className="w-6 h-6 text-green-600 mr-2" />
                <span className="font-semibold text-gray-900">Average completion time</span>
              </div>
              <div className="text-3xl font-bold text-green-600">4.2 minutes</div>
              <p className="text-gray-600 mt-1">From search to verified report</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDemo; 