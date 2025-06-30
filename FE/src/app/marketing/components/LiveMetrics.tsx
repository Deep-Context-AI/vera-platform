"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Users, Target } from 'lucide-react';

const LiveMetrics = () => {
  const [metrics, setMetrics] = useState({
    avgTurnaround: 0,
    peakProviders: 0,
    lessManualEntry: 0,
    accuracy: 0
  });

  useEffect(() => {
    const targetMetrics = {
      avgTurnaround: 4.2,
      peakProviders: 20000,
      lessManualEntry: 98,
      accuracy: 99.9
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setMetrics({
        avgTurnaround: Number((targetMetrics.avgTurnaround * progress).toFixed(1)),
        peakProviders: Math.floor(targetMetrics.peakProviders * progress),
        lessManualEntry: Math.floor(targetMetrics.lessManualEntry * progress),
        accuracy: Number((targetMetrics.accuracy * progress).toFixed(1))
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Real-time verification metrics</h2>
          <p className="text-xl text-blue-100">
            Live performance data from our credentialing platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-2">{metrics.avgTurnaround}</div>
            <p className="text-blue-100">Minutes avg turnaround</p>
          </div>
          
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-2">{metrics.peakProviders.toLocaleString()}</div>
            <p className="text-blue-100">Peak providers/hour</p>
          </div>
          
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-2">{metrics.lessManualEntry}%</div>
            <p className="text-blue-100">Less manual data entry</p>
          </div>
          
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4">
              <Target className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-2">{metrics.accuracy}%</div>
            <p className="text-blue-100">Verification accuracy</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveMetrics; 