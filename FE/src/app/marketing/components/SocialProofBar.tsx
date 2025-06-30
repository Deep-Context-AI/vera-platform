import React from 'react';

const SocialProofBar = () => {
  const logos = [
    { name: 'Mayo Clinic', width: 'w-32' },
    { name: 'Kaiser Permanente', width: 'w-40' },
    { name: 'Cleveland Clinic', width: 'w-36' },
    { name: 'Johns Hopkins', width: 'w-38' },
    { name: 'Mass General', width: 'w-34' },
    { name: 'Cedars-Sinai', width: 'w-36' }
  ];

  return (
    <section className="bg-white border-y border-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-gray-600 font-medium">
            Trusted by compliance teams verifying 50,000+ clinicians
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 opacity-60 hover:opacity-80 transition-opacity duration-300">
          {logos.map((logo, index) => (
            <div key={index} className={`${logo.width} h-12 bg-gray-200 rounded flex items-center justify-center`}>
              <span className="text-gray-400 font-medium text-sm">{logo.name}</span>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Processing verifications in real-time
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofBar; 