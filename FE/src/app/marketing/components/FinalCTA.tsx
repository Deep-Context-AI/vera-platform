import React from 'react';
import { ChevronRight, Clock, Shield, Zap } from 'lucide-react';

const FinalCTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold mb-6">
          Ready to verify providers in minutes?
        </h2>
        
        <p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto">
          Join hundreds of healthcare organizations that have transformed their credentialing process with Vera's AI-powered platform.
        </p>
        
        {/* Key Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-2">4.2 minutes average</h3>
            <p className="text-blue-100 text-sm">From search to verified report</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-2">&lt;0.1% error rate</h3>
            <p className="text-blue-100 text-sm">Human-verified accuracy</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-2">98% less manual work</h3>
            <p className="text-blue-100 text-sm">Automated end-to-end process</p>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
          <button className="group inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Book a 15-minute Demo
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-200">
            Start Free Trial
          </button>
        </div>
        
        <p className="text-blue-100">
          No setup fees • 30-day free trial • Implementation support included
        </p>
      </div>
    </section>
  );
};

export default FinalCTA; 