import React from 'react';
import { LayoutDashboard, Users, Shield, Mail, BarChart3, Settings, ChevronLeft, Clock, BookOpen } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'providers', label: 'Providers', icon: Users },
  { id: 'committee', label: 'Committee', icon: Shield },
  { id: 'inbox', label: 'Inbox', icon: Mail },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'resources', label: 'Resources', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const dashboardSubItems = [
  { id: 'todays-queue', label: "Today's Queue", icon: Clock },
];
export default function Sidebar({ isOpen, onToggle, activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className={`bg-gray-900 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'} relative`}>
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-sm"
      >
        <ChevronLeft className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
      </button>

      <nav className="mt-8 px-3">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-3 py-3 mb-2 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </button>
            
            {/* Show subsections for Dashboard when active and sidebar is open */}
            {item.id === 'dashboard' && (activeTab === 'dashboard' || activeTab === 'todays-queue') && isOpen && (
              <div className="ml-6 mb-2">
                {dashboardSubItems.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => onTabChange(subItem.id)}
                    className={`w-full flex items-center px-3 py-2 mb-1 rounded-lg transition-colors text-sm ${
                      activeTab === subItem.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <subItem.icon className="w-4 h-4" />
                    <span className="ml-3">{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {isOpen && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-sm font-medium text-white">Need Help?</p>
            <p className="text-xs text-gray-400 mt-1">Contact support for assistance</p>
            <button className="mt-2 text-xs text-blue-400 hover:text-blue-300">
              Get Support
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}