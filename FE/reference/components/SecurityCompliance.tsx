import React from 'react';
import { Shield, Lock, Eye, FileCheck, Award, Users } from 'lucide-react';

const SecurityCompliance = () => {
  const certifications = [
    {
      icon: Shield,
      title: 'SOC 2 Type II',
      description: 'Independently audited security controls',
      badge: 'Certified'
    },
    {
      icon: Lock,
      title: 'HIPAA Compliant',
      description: 'Healthcare data protection standards',
      badge: 'Compliant'
    },
    {
      icon: Eye,
      title: '256-bit Encryption',
      description: 'Data encrypted in transit and at rest',
      badge: 'Secured'
    },
    {
      icon: Users,
      title: 'Role-based Access',
      description: 'Granular permissions and audit trails',
      badge: 'Protected'
    },
    {
      icon: FileCheck,
      title: 'Audit Ready',
      description: 'Complete documentation and reporting',
      badge: 'Verified'
    },
    {
      icon: Award,
      title: 'ISO 27001',
      description: 'Information security management',
      badge: 'Certified'
    }
  ];

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Enterprise-grade security and compliance
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Built for healthcare organizations with the highest security and compliance requirements
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {certifications.map((cert, index) => (
            <div 
              key={index}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <cert.icon className="w-6 h-6" />
                </div>
                <span className="bg-green-600 text-green-100 px-3 py-1 rounded-full text-sm font-medium">
                  {cert.badge}
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-3">{cert.title}</h3>
              <p className="text-gray-300">{cert.description}</p>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Security Documentation</h3>
            <p className="text-gray-300 mb-6">
              Access our comprehensive security documentation, compliance reports, and architectural diagrams
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Download Security Whitepaper
              </button>
              <button className="border border-gray-600 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:border-gray-500 hover:text-white transition-colors">
                View Compliance Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityCompliance;