import React from 'react';
import { Plug, Zap, Shield, Globe } from 'lucide-react';

const IntegrationsSection = () => {
  const integrationCategories = [
    {
      title: 'HRIS & ATS Systems',
      icon: Plug,
      color: 'bg-blue-500',
      integrations: ['Workday', 'UltiPro', 'BambooHR', 'ADP', 'SuccessFactors', 'Greenhouse']
    },
    {
      title: 'Single Sign-On',
      icon: Shield,
      color: 'bg-green-500',
      integrations: ['Okta', 'Azure AD', 'OneLogin', 'Auth0', 'Ping Identity', 'SAML 2.0']
    },
    {
      title: 'Healthcare Systems',
      icon: Globe,
      color: 'bg-purple-500',
      integrations: ['Epic', 'Cerner', 'Meditech', 'Allscripts', 'athenahealth', 'NextGen']
    },
    {
      title: 'APIs & Workflows',
      icon: Zap,
      color: 'bg-orange-500',
      integrations: ['REST API', 'Webhooks', 'Zapier', 'Microsoft Flow', 'Custom Integrations', 'Bulk Upload']
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Integrates with your existing systems
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Seamlessly connect Vera to your current workflow with our comprehensive integration suite
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {integrationCategories.map((category, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-white mr-4`}>
                  <category.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {category.integrations.map((integration, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 text-center text-sm font-medium text-gray-700 hover:border-blue-300 transition-colors">
                    {integration}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* API Documentation CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Developer-First Integration</h3>
          <p className="text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
            Our RESTful API and comprehensive documentation make integration simple. Most customers are up and running in less than a day.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              View API Documentation
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Schedule Integration Call
            </button>
          </div>
          
          <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <p className="text-blue-100">API Uptime</p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">&lt;200ms</div>
              <p className="text-blue-100">Response Time</p>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <p className="text-blue-100">Developer Support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;