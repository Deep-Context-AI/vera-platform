import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(0);
  
  const faqs = [
    {
      question: "What primary sources does Vera verify against?",
      answer: "Vera checks over 100 primary sources including state medical boards, DEA registrations, board certifications, malpractice databases, OIG exclusion lists, sanctions databases, and more. We maintain direct connections to ensure real-time accuracy."
    },
    {
      question: "How does Vera handle international medical licenses?",
      answer: "We support verification of medical licenses from major international jurisdictions including Canada, UK, Australia, and EU countries. Our AI adapts to different regulatory frameworks and documentation requirements for comprehensive global coverage."
    },
    {
      question: "What is your data retention and privacy policy?",
      answer: "We retain verification data for 7 years to support audit requirements. All data is encrypted at rest and in transit using AES-256 encryption. We're HIPAA compliant and SOC 2 Type II certified. Customers maintain full control over their data with options for deletion upon request."
    },
    {
      question: "What's your support SLA and response time?",
      answer: "We offer 24/7 technical support with guaranteed response times: Critical issues within 1 hour, high priority within 4 hours, and standard requests within 24 hours. Enterprise customers receive dedicated support with faster response times."
    },
    {
      question: "How accurate is the verification process?",
      answer: "Our AI-powered system achieves >99.9% accuracy through automated verification combined with human-in-the-loop quality assurance. Every verification goes through expert review to ensure complete accuracy and compliance with regulatory requirements."
    },
    {
      question: "Can Vera integrate with our existing HRIS system?",
      answer: "Yes, Vera offers pre-built integrations with major HRIS systems like Workday, UltiPro, ADP, and BambooHR. We also provide a comprehensive REST API for custom integrations. Most implementations are completed within 1-2 business days."
    },
    {
      question: "What happens if a verification fails or shows red flags?",
      answer: "Failed verifications are immediately flagged and escalated to our expert review team. We provide detailed reports on any issues found, including specific reasons for failure and recommendations for resolution. You'll receive real-time alerts for any compliance concerns."
    },
    {
      question: "Is there a minimum commitment or long-term contract required?",
      answer: "No, we offer flexible month-to-month pricing with no minimum commitments. You can scale up or down based on your needs. We also offer 30-day free trials for new customers to test our platform risk-free."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-xl text-gray-600">
            Get answers to common questions about Vera's credentialing platform
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                {openFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {openFAQ === index && (
                <div className="px-6 py-4 bg-white border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <button className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Contact our support team →
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;