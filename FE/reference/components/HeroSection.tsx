import React, { useState, useEffect } from 'react';
import { Shield, Check, Calendar, ArrowRight } from 'lucide-react';

const HeroSection = () => {
  const [currentRole, setCurrentRole] = useState(0);
  const roles = ['Physicians', 'Nurse Practitioners', 'Physician Assistants', 'Specialists'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23e0f2fe%27 fill-opacity=%270.4%27%3E%3Ccircle cx=%2730%27 cy=%2730%27 r=%272%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Healthcare verification that's
            <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 bg-clip-text text-transparent">
              seamless
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Transform credentialing with Vera's AI-powered platform. Automate verifications,
            reduce compliance risk, and accelerate provider onboarding with our comprehensive
            verification suite.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <button className="group inline-flex items-center px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200">
              <Calendar className="mr-3 w-5 h-5" />
              Schedule Demo
            </button>
            <button className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Get Started
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          {/* Visual Elements */}
          <div className="relative max-w-2xl mx-auto">
            {/* Verification Status Card */}
            <div className="absolute top-0 left-8 bg-white rounded-xl shadow-lg p-4 border border-gray-200 z-20">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Verification Status</p>
                  <p className="text-green-600 text-sm">Active Monitoring</p>
                </div>
              </div>
            </div>
            
            {/* Accuracy Rate Card */}
            <div className="absolute top-0 right-8 bg-white rounded-xl shadow-lg p-4 border border-gray-200 z-20">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">98.5%</div>
                <p className="text-gray-600 text-sm">Accuracy Rate</p>
              </div>
            </div>
            
            {/* Central Star/Check Element */}
            <div className="relative mt-16 flex justify-center">
              <div className="relative">
                {/* Star/Arrow Pattern */}
                <div className="w-64 h-64 relative">
                  {/* Main star shape made of arrow elements */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((rotation, index) => (
                      <div
                        key={index}
                        className="absolute w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center transform"
                        style={{
                          transform: `rotate(${rotation}deg) translateY(-80px)`,
                          transformOrigin: 'center 80px'
                        }}
                      >
                        <ArrowRight className="w-8 h-8 text-white" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Center circle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-blue-500">
                      <Check className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Animated Role Cycling */}
          <div className="text-center mt-16">
            <p className="text-gray-500 mb-2">Verifying</p>
            <div className="text-2xl font-semibold text-gray-900 h-8 flex items-center justify-center">
              <span className="inline-block transition-all duration-500 transform">
                {roles[currentRole]}
              </span>
              <span className="ml-2 text-green-600">
                <Check className="w-6 h-6 inline-block" />
              </span>
            </div>
            <p className="text-gray-500 mt-1">in minutes, not weeks</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;