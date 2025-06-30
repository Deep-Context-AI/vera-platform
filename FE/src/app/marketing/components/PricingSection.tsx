import React from 'react';
import { Check, ArrowRight, Shield, Code, TrendingUp, Building2, Star, Users, FileText, UserCheck } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: 'Developer Sandbox',
      icon: Code,
      audience: 'Solo devs, hackathons',
      price: 'Free',
      period: '',
      platformFee: 'Free',
      credits: '25 / lifetime',
      overage: 'n/a',
      notes: 'Read-only test data',
      color: 'border-gray-300',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      popular: false,
      features: [
        '25 lifetime verification credits',
        'Read-only test data access',
        'API documentation',
        'Community support',
        'Basic reporting'
      ]
    },
    {
      name: 'Startup',
      icon: TrendingUp,
      audience: '< 50 active providers',
      price: '$299',
      period: '/ month',
      platformFee: '$299 / month',
      credits: '100 / mo',
      overage: '$1.20 ea.',
      notes: 'Best for seed/Series A tele-health clinics',
      color: 'border-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      popular: true,
      features: [
        '100 monthly verification credits',
        'All primary source integrations',
        'PDF & JSON reports',
        'Email support',
        'Basic dashboard analytics',
        'API access'
      ]
    },
    {
      name: 'Growth',
      icon: Users,
      audience: '50–250 providers',
      price: '$999',
      period: '/ month',
      platformFee: '$999 / month',
      credits: '500 / mo',
      overage: '$0.90 ea.',
      notes: 'Slips neatly under typical "ops tools" budgets',
      color: 'border-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      popular: false,
      features: [
        '500 monthly verification credits',
        'Advanced reporting & analytics',
        'Priority email & phone support',
        'Custom integrations',
        'Team collaboration tools',
        'Advanced API features'
      ]
    },
    {
      name: 'Enterprise',
      icon: Building2,
      audience: '250+ providers / payers',
      price: 'Custom',
      period: 'annual',
      platformFee: 'Custom annual',
      credits: '5,000+ / yr',
      overage: '$0.60 ea.',
      notes: 'Volume discounts, SSO, HIPAA-BAA',
      color: 'border-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      popular: false,
      features: [
        '5,000+ annual verification credits',
        'Custom volume pricing',
        'Dedicated account manager',
        'SSO integration',
        'HIPAA-BAA agreement',
        'Custom SLA'
      ]
    }
  ];

  const addOns = [
    {
      icon: FileText,
      name: 'Education verification',
      description: 'Email/phone chase, AI parsing',
      price: '$5 each',
      note: '(covers registrar touch-time)'
    },
    {
      icon: Users,
      name: 'Committee e-sign & quorum dashboard',
      description: 'Digital committee management',
      price: '$2 / meeting seat',
      note: ''
    },
    {
      icon: UserCheck,
      name: 'Human examiner QA',
      description: 'Continuous monitoring available',
      price: '$25 / provider file',
      note: 'or $2 / provider / mo for continuous monitoring'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transparent pricing that scales with you
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            From individual developers to enterprise health systems, we have a plan that fits your needs
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <Star className="w-4 h-4 mr-2" />
            One "credit" = one primary-source verification endpoint (e.g., ABMS, DEA, state license)
          </div>
        </div>
        
        {/* Main Pricing Plans */}
        <div className="grid lg:grid-cols-4 gap-8 mb-20">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white rounded-2xl border-2 ${plan.color} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                plan.popular ? 'transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <div className={`${plan.bgColor} p-6 ${plan.popular ? 'pt-12' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${plan.textColor === 'text-gray-600' ? 'bg-gray-200' : plan.bgColor.replace('50', '200')} rounded-lg flex items-center justify-center`}>
                    <plan.icon className={`w-6 h-6 ${plan.textColor}`} />
                  </div>
                  {plan.popular && (
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Recommended
                    </div>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.audience}</p>
                
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Pricing Details */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Platform fee</span>
                    <span className="font-semibold text-gray-900">{plan.platformFee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Included credits</span>
                    <span className="font-semibold text-gray-900">{plan.credits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Overage rate</span>
                    <span className="font-semibold text-gray-900">{plan.overage}</span>
                  </div>
                </div>
                
                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Notes */}
                <div className="bg-gray-50 p-3 rounded-lg mb-6">
                  <p className="text-gray-600 text-xs italic">{plan.notes}</p>
                </div>
                
                {/* CTA Button */}
                <button className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl' 
                    : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}>
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Add-ons Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-8">
            <h3 className="text-2xl font-bold mb-2">Optional Add-ons</h3>
            <p className="text-blue-100">Enhance your verification workflow with these premium services</p>
          </div>
          
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {addOns.map((addon, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <addon.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">{addon.name}</h4>
                      <p className="text-gray-600 text-sm">{addon.description}</p>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">{addon.price}</div>
                    {addon.note && (
                      <p className="text-green-700 text-xs">{addon.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Important Notes */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-yellow-600 mr-3 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Important Pricing Notes</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• NPDB and other fee-based data sources are pass-through at cost + $0.25 convenience markup</li>
                <li>• All plans include SOC 2 Type II compliance and HIPAA protections</li>
                <li>• Enterprise plans include custom volume discounts and dedicated support</li>
                <li>• No setup fees or hidden charges - pay only for what you use</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Final CTA */}
        <div className="text-center mt-12">
          <button className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Schedule a Demo
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Questions about pricing? Contact our sales team for a custom quote.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 