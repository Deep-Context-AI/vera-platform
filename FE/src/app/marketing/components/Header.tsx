import React from 'react';
import { Shield, Calendar, LogIn } from 'lucide-react';
import { Button } from './ui/Button';
import Link from 'next/link';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="240" height="246" viewBox="0 0 240 246" fill="none">
                <path d="M168.5 21L153 0L119.5 37.5L84.5 0L68 21L119.5 79.5L168.5 21Z" fill="#15639F"/>
                <path d="M136.185 229.918L161.635 235.711L162.537 185.434L213.53 190.998L212.323 164.319L135.122 153.616L136.185 229.918Z" fill="#15639F"/>
                <path d="M26.5884 161.08L23.1493 186.953L73.297 183.251L72.4221 234.539L98.8792 230.896L102.474 153.04L26.5884 161.08Z" fill="#15639F"/>
                <path d="M40.6482 44.194L16.9757 55.1877L47.0298 95.5021L3.29528 122.308L20.5769 142.669L88.1837 103.89L40.6482 44.194Z" fill="#15639F"/>
                <path d="M218.677 141.665L235.868 122.025L192.06 97.3396L221.189 55.1167L197.141 43.5001L151.036 106.34L218.677 141.665Z" fill="#15639F"/>
              </svg>
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
          
          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <Link href="/auth/v1/sign-in">
              <Button variant="outline" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </Link>
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