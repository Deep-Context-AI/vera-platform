import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, AlertTriangle, Play, Pause, 
  Brain, Target, Activity, Search, Download, RefreshCw
} from 'lucide-react';

export default function TodaysQueue() {
  const [batchStatus, setBatchStatus] = useState<'ready' | 'running' | 'paused' | 'completed'>('ready');
  const [completedCount, setCompletedCount] = useState(0);
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Generate 100 providers for today's batch
  const todaysProviders = Array.from({ length: 100 }, (_, i) => ({
    id: `batch-${i + 1}`,
    name: `Dr. ${['Sarah', 'Michael', 'Emily', 'Robert', 'Lisa', 'David', 'Jennifer', 'James', 'Maria', 'Thomas'][i % 10]} ${['Johnson', 'Chen', 'Davis', 'Wilson', 'Brown', 'Miller', 'Garcia', 'Martinez', 'Anderson', 'Taylor'][Math.floor(i / 10)]}`,
    specialty: ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Emergency Medicine', 'Family Medicine', 'Internal Medicine', 'Radiology', 'Anesthesiology', 'Psychiatry'][i % 10],
    npi: `${1234567890 + i}`,
    priority: ['high', 'medium', 'low'][i % 3],
    estimatedTime: `${Math.floor(Math.random() * 5) + 2} min`,
    verificationSteps: [
      'Application Review',
      'NPI Verification', 
      'NPDB Check',
      'License Verification',
      'DEA Verification',
      'Board Certification',
      'Sanctions Check',
      'Education Verification',
      'Hospital Privileges',
      'Final Review'
    ],
    status: batchStatus === 'completed' ? 'completed' : 
            i < completedCount ? 'completed' :
            i === completedCount && batchStatus === 'running' ? 'processing' : 'queued',
    veraConfidence: Math.floor(Math.random() * 15) + 85, // 85-99%
    riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    facility: ['General Hospital', 'Medical Center', 'Clinic Network', 'Surgery Center'][i % 4]
  }));

  const startBatch = () => {
    setBatchStatus('running');
    setCompletedCount(0);
    setCurrentProvider(todaysProviders[0].name);
  };

  const pauseBatch = () => {
    setBatchStatus('paused');
    setCurrentProvider(null);
  };

  const resumeBatch = () => {
    setBatchStatus('running');
    if (completedCount < todaysProviders.length) {
      setCurrentProvider(todaysProviders[completedCount].name);
    }
  };

  // Simulate batch processing
  useEffect(() => {
    if (batchStatus === 'running' && completedCount < todaysProviders.length) {
      const timer = setTimeout(() => {
        setCompletedCount(prev => {
          const newCount = prev + 1;
          if (newCount < todaysProviders.length) {
            setCurrentProvider(todaysProviders[newCount].name);
          } else {
            setBatchStatus('completed');
            setCurrentProvider(null);
          }
          return newCount;
        });
      }, 1500); // Complete one provider every 1.5 seconds for demo

      return () => clearTimeout(timer);
    }
  }, [batchStatus, completedCount, todaysProviders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'queued': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredProviders = todaysProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.npi.includes(searchTerm) ||
                         provider.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || provider.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const progressPercentage = (completedCount / todaysProviders.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Brain className="w-8 h-8 text-blue-600 mr-3" />
                Today's Queue - Vera AI Batch Processing
              </h1>
              <p className="text-gray-600 mt-1">100 providers scheduled for automated verification today</p>
            </div>
            <div className="flex items-center space-x-3">
              {batchStatus === 'ready' && (
                <button
                  onClick={startBatch}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Vera Batch</span>
                </button>
              )}
              {batchStatus === 'running' && (
                <button
                  onClick={pauseBatch}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Batch</span>
                </button>
              )}
              {batchStatus === 'paused' && (
                <button
                  onClick={resumeBatch}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Batch</span>
                </button>
              )}
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Results</span>
              </button>
            </div>
          </div>

          {/* Batch Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Batch Progress:</span>
                <span className="text-lg font-bold text-gray-900">
                  {completedCount}/{todaysProviders.length} Complete
                </span>
                <span className="text-sm text-gray-600">({Math.round(progressPercentage)}%)</span>
              </div>
              {currentProvider && (
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Processing: {currentProvider}</span>
                </div>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Estimated completion: {batchStatus === 'running' ? '2.5 hours' : 'Not started'}</span>
              <span>Avg per provider: 1.5 minutes</span>
            </div>
          </div>
        </div>

        {/* Vera AI Status Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Queue Status</p>
                <p className="text-lg font-bold text-gray-900 capitalize">{batchStatus}</p>
              </div>
              <div className={`p-2 rounded-lg ${
                batchStatus === 'running' ? 'bg-blue-100' :
                batchStatus === 'completed' ? 'bg-green-100' :
                batchStatus === 'paused' ? 'bg-orange-100' : 'bg-gray-100'
              }`}>
                {batchStatus === 'running' ? <Activity className="w-6 h-6 text-blue-600 animate-pulse" /> :
                 batchStatus === 'completed' ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                 batchStatus === 'paused' ? <Pause className="w-6 h-6 text-orange-600" /> :
                 <Clock className="w-6 h-6 text-gray-600" />}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-lg font-bold text-gray-900">{completedCount}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Vera Confidence</p>
                <p className="text-lg font-bold text-gray-900">93%</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto-Flagged</p>
                <p className="text-lg font-bold text-gray-900">3</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="queued">Queued</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredProviders.length} of {todaysProviders.length} providers
            </div>
          </div>
        </div>

        {/* Provider Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vera Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification Steps
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProviders.map((provider, index) => (
                  <tr 
                    key={provider.id} 
                    className={`hover:bg-gray-50 ${
                      provider.status === 'processing' ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {provider.status === 'processing' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-3"></div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                          <div className="text-sm text-gray-500">NPI: {provider.npi}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(provider.status)}`}>
                        {provider.status === 'processing' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                        {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${
                              provider.veraConfidence >= 90 ? 'bg-green-500' :
                              provider.veraConfidence >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${provider.veraConfidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{provider.veraConfidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getRiskColor(provider.riskLevel)}`}>
                        {provider.riskLevel.charAt(0).toUpperCase() + provider.riskLevel.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.estimatedTime}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {provider.verificationSteps.slice(0, 3).map((step, stepIndex) => (
                          <span
                            key={stepIndex}
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              provider.status === 'completed' ? 'bg-green-100 text-green-800' :
                              provider.status === 'processing' && stepIndex <= 1 ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {step}
                          </span>
                        ))}
                        {provider.verificationSteps.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            +{provider.verificationSteps.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}