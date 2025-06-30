import React from 'react';
import { Shield, Mail, Phone, MapPin, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'Integrations', href: '#integrations' },
        { name: 'API Documentation', href: '#api' },
        { name: 'Security', href: '#security' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#about' },
        { name: 'Careers', href: '#careers' },
        { name: 'Press', href: '#press' },
        { name: 'Contact', href: '#contact' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: '#docs' },
        { name: 'Support Center', href: '#support' },
        { name: 'Compliance Reports', href: '#compliance' },
        { name: 'Case Studies', href: '#cases' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#privacy' },
        { name: 'Terms of Service', href: '#terms' },
        { name: 'Cookie Policy', href: '#cookies' },
        { name: 'HIPAA Compliance', href: '#hipaa' }
      ]
    }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">Vera</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Transforming healthcare credentialing with AI-powered verification that takes minutes, not weeks.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Footer Links */}
          <div className="lg:col-span-4 grid md:grid-cols-4 gap-8">
            {footerSections.map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        {/* Contact Section */}
        <div className="border-t border-gray-800 pt-12 mb-12">
          <h3 className="text-xl font-semibold mb-6">Get in touch</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-blue-400 mt-1 mr-3" />
              <div>
                <p className="font-medium">Sales Inquiries</p>
                <a href="mailto:sales@vera.health" className="text-gray-400 hover:text-white transition-colors">
                  sales@vera.health
                </a>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-blue-400 mt-1 mr-3" />
              <div>
                <p className="font-medium">Support</p>
                <a href="tel:+1-555-123-4567" className="text-gray-400 hover:text-white transition-colors">
                  +1 (555) 123-4567
                </a>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-blue-400 mt-1 mr-3" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-gray-400">
                  123 Healthcare Blvd<br />
                  Medical District, CA 90210
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Vera Technologies, Inc. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                All systems operational
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                SOC 2 Certified
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 