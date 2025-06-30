import React from 'react';
import { Zap, Database, Users, FileCheck, Shield, Plug } from 'lucide-react';

const ValuePropTiles = () => {
  const features = [
    {
      icon: Zap,
      title: 'Seconds-fast verifications',
      description: 'AI-powered verification delivers results in under 5 minutes',
      metric: '4.2 min avg',
      color: 'bg-yellow-500'
    },
    {
      icon: Database,
      title: '100+ primary sources covered',
      description: 'Comprehensive database of medical boards, DEA, and more',
      metric: '100+ sources',
      color: 'bg-blue-500'
    },
    {
      icon: Users,
      title: 'Human-in-the-loop QA',
      description: 'Expert review ensures <0.1% error rate',
      metric: '<0.1% errors',
      color: 'bg-green-500'
    },
    {
      icon: FileCheck,
      title: 'Audit-ready reports',
      description: 'PDF and JSON reports with full source documentation',
      metric: '100% compliant',
      color: 'bg-purple-500'
    },
    {
      icon: Shield,
      title: 'SOC 2 + HIPAA compliance',
      description: 'Enterprise-grade security and data protection',
      metric: 'SOC 2 Type II',
      color: 'bg-indigo-500'
    },
    {
      icon: Plug,
      title: 'API & no-code dashboard',
      description: 'Seamless integration with existing workflows',
      metric: 'REST API',
      color: 'bg-teal-500'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why compliance teams choose Vera
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for healthcare organizations that demand speed, accuracy, and compliance
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-white rounded-xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">{feature.metric}</p>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropTiles;