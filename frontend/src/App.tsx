import { useState } from 'react';
import { FileText, BookOpen, Globe, Phone } from 'lucide-react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import OverviewCards from './components/Dashboard/OverviewCards';
import ProviderList from './components/Providers/ProviderList';
import ProviderDetailDemo from './components/Providers/ProviderDetailDemo';
import TodaysQueue from './components/Dashboard/TodaysQueue';
import InteractiveReports from './components/Reports/InteractiveReports';
import InboxDashboard from './components/Inbox/InboxDashboard';
import CommitteeApprovals from './components/Committee/CommitteeApprovals';
import { Provider } from './types';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState(['Dashboard']);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedProvider(null);
    
    switch (tab) {
      case 'dashboard':
        setBreadcrumbs(['Dashboard']);
        break;
      case 'providers':
        setBreadcrumbs(['Providers']);
        break;
      case 'committee':
        setBreadcrumbs(['Committee']);
        break;
      case 'inbox':
        setBreadcrumbs(['Inbox']);
        break;
      case 'reports':
        setBreadcrumbs(['Reports']);
        break;
      case 'settings':
        setBreadcrumbs(['Settings']);
        break;
      case 'resources':
        setBreadcrumbs(['Resources']);
        break;
      case 'todays-queue':
        setBreadcrumbs(['Dashboard', "Today's Queue"]);
        break;
      default:
        setBreadcrumbs(['Dashboard']);
    }
  };

  const handleSelectProvider = () => {
    setSelectedProvider({} as Provider); // Set a dummy provider for navigation state
    setBreadcrumbs(['Providers', 'Application #15005']);
  };

  const handleBackToProviders = () => {
    setSelectedProvider(null);
    setBreadcrumbs(['Providers']);
  };

  const renderContent = () => {
    if (selectedProvider) {
      return (
        <ProviderDetailDemo
          onBack={handleBackToProviders}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <OverviewCards />
        );
      case 'providers':
        return <ProviderList onSelectProvider={handleSelectProvider} />;
      case 'committee':
        return (
          <CommitteeApprovals />
        );
      case 'inbox':
        return (
          <InboxDashboard />
        );
      case 'todays-queue':
        return <TodaysQueue />;
      case 'reports':
        return (
          <InteractiveReports />
        );
      case 'resources':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resources & Job Aids</h1>
                <p className="text-gray-600 mt-1">Primary source links, workflow guides, and institutional contacts</p>
              </div>
            </div>
            
            {/* Resource Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Primary Source Links</h3>
                    <p className="text-sm text-gray-600">Direct access to verification sources</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Federal Sources</h4>
                    <div className="space-y-1 text-sm">
                      <a href="#" className="block text-blue-600 hover:text-blue-800">NPI Registry (CMS)</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">NPDB Query Portal</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">DEA Registration</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">OIG Exclusion Database</a>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">State Boards</h4>
                    <div className="space-y-1 text-sm">
                      <a href="#" className="block text-blue-600 hover:text-blue-800">California Medical Board</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Texas Medical Board</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">New York State Board</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Florida Medical Board</a>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Specialty Boards</h4>
                    <div className="space-y-1 text-sm">
                      <a href="#" className="block text-blue-600 hover:text-blue-800">ABMS Directory</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">American Board of Internal Medicine</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">American Board of Surgery</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">American Board of Pediatrics</a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Workflow Job Aids</h3>
                    <p className="text-sm text-gray-600">Step-by-step process guides</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Verification Steps</h4>
                    <div className="space-y-1 text-sm">
                      <a href="#" className="block text-blue-600 hover:text-blue-800">NPI Verification Guide</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">NPDB Query Process</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">License Verification SOP</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">DEA Certificate Review</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Board Certification Check</a>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Committee Process</h4>
                    <div className="space-y-1 text-sm">
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Committee Review Guidelines</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Red Flag Escalation Process</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Approval Decision Matrix</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Appeal Process Guide</a>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Vera AI Guidelines</h4>
                    <div className="space-y-1 text-sm">
                      <a href="#" className="block text-blue-600 hover:text-blue-800">AI Confidence Score Guide</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Auto-Flagging Rules</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Batch Processing SOP</a>
                      <a href="#" className="block text-blue-600 hover:text-blue-800">Override Procedures</a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Phone className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">School & Hospital Contacts</h3>
                    <p className="text-sm text-gray-600">Education verification contacts</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Medical Schools</h4>
                    <div className="space-y-2 text-sm">
                      <div className="border-b border-gray-200 pb-2">
                        <p className="font-medium text-gray-900">Harvard Medical School</p>
                        <p className="text-gray-600">registrar@hms.harvard.edu</p>
                        <p className="text-gray-600">(617) 432-1000</p>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <p className="font-medium text-gray-900">Johns Hopkins School of Medicine</p>
                        <p className="text-gray-600">registrar@jhmi.edu</p>
                        <p className="text-gray-600">(410) 955-3182</p>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <p className="font-medium text-gray-900">Stanford School of Medicine</p>
                        <p className="text-gray-600">registrar@stanford.edu</p>
                        <p className="text-gray-600">(650) 723-6861</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Residency Programs</h4>
                    <div className="space-y-2 text-sm">
                      <div className="border-b border-gray-200 pb-2">
                        <p className="font-medium text-gray-900">Mayo Clinic</p>
                        <p className="text-gray-600">residency@mayo.edu</p>
                        <p className="text-gray-600">(507) 284-2511</p>
                      </div>
                      <div className="border-b border-gray-200 pb-2">
                        <p className="font-medium text-gray-900">Cleveland Clinic</p>
                        <p className="text-gray-600">residency@ccf.org</p>
                        <p className="text-gray-600">(216) 444-5353</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Mass General Brigham</p>
                        <p className="text-gray-600">gme@partners.org</p>
                        <p className="text-gray-600">(617) 726-8779</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Resource Management Center</h2>
              <p className="text-gray-600">Centralized access to all verification resources, job aids, and institutional contacts for efficient credentialing operations.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-gray-600">User management, roles, and system configuration.</p>
          </div>
        );
      default:
        return (
          <OverviewCards />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          breadcrumbs={breadcrumbs}
        />
        
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;