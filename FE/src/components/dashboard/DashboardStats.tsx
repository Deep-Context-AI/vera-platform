import React from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  FileCheck,
  Target,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color 
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <TrendingUp className={`w-4 h-4 mr-1 ${getChangeColor()}`} />
              <span className={`text-sm font-medium ${getChangeColor()}`}>
                {change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const DashboardStats: React.FC = () => {
  const stats = [
    {
      title: 'Total Providers',
      value: '342',
      change: '+12%',
      changeType: 'positive' as const,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'In Review',
      value: '89',
      change: '+5%',
      changeType: 'positive' as const,
      icon: <Clock className="w-6 h-6 text-orange-600" />,
      color: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Completed',
      value: '253',
      change: '+18%',
      changeType: 'positive' as const,
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      color: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Avg. Processing Time',
      value: '8.7 days',
      change: '-8%',
      changeType: 'positive' as const,
      icon: <FileCheck className="w-6 h-6 text-purple-600" />,
      color: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'High Priority',
      value: '31',
      change: '+3',
      changeType: 'negative' as const,
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      color: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Compliance Rate',
      value: '99.2%',
      change: '+0.3%',
      changeType: 'positive' as const,
      icon: <Target className="w-6 h-6 text-emerald-600" />,
      color: 'bg-emerald-50 dark:bg-emerald-900/20'
    }
  ];

  return (
    <div className="space-y-8 mb-8">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default DashboardStats; 