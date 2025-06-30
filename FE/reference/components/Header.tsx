import React from 'react';
import { Shield, Calendar } from 'lucide-react';
import { Button } from './ui/Button';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">VERA</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#integrations" className="text-gray-600 hover:text-gray-900 transition-colors">Integrations</a>
            <a href="#security" className="text-gray-600 hover:text-gray-900 transition-colors">Security</a>
          </nav>
          
          {/* CTA Button */}
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;