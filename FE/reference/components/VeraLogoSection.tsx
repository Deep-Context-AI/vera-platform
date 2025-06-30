import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Target, Zap, Users, Award } from 'lucide-react';

const VeraLogoSection = () => {
  const floatingStats = [
    {
      icon: Clock,
      value: "4.2min",
      label: "Average verification",
      position: { top: "10%", left: "15%" },
      delay: 0
    },
    {
      icon: Shield,
      value: "99.9%",
      label: "Accuracy rate",
      position: { top: "20%", right: "10%" },
      delay: 0.5
    },
    {
      icon: Target,
      value: "100+",
      label: "Primary sources",
      position: { bottom: "25%", left: "8%" },
      delay: 1
    },
    {
      icon: Zap,
      value: "<0.1%",
      label: "Error rate",
      position: { bottom: "15%", right: "12%" },
      delay: 1.5
    },
    {
      icon: Users,
      value: "500+",
      label: "Healthcare orgs",
      position: { top: "35%", left: "5%" },
      delay: 2
    },
    {
      icon: Award,
      value: "SOC 2",
      label: "Certified secure",
      position: { top: "45%", right: "8%" },
      delay: 2.5
    }
  ];

  return (
    <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-gray-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23e0f2fe%27 fill-opacity=%270.3%27%3E%3Ccircle cx=%2730%27 cy=%2730%27 r=%271%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
          >
            The ultimate healthcare verification platform
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Powered by AI, verified by experts, trusted by the industry's leading healthcare organizations
          </motion.p>
        </div>
        
        <div className="relative flex justify-center items-center min-h-[500px]">
          {/* Central Spinning Vera Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative z-10"
          >
            <div className="w-48 h-48 lg:w-60 lg:h-60 animate-spin" style={{ animationDuration: '20s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 246" fill="none" className="w-full h-full drop-shadow-lg">
                <path d="M168.5 21L153 0L119.5 37.5L84.5 0L68 21L119.5 79.5L168.5 21Z" fill="#15639F"/>
                <path d="M136.185 229.918L161.635 235.711L162.537 185.434L213.53 190.998L212.323 164.319L135.122 153.616L136.185 229.918Z" fill="#15639F"/>
                <path d="M26.5884 161.08L23.1493 186.953L73.297 183.251L72.4221 234.539L98.8792 230.896L102.474 153.04L26.5884 161.08Z" fill="#15639F"/>
                <path d="M40.6482 44.194L16.9757 55.1877L47.0298 95.5021L3.29528 122.308L20.5769 142.669L88.1837 103.89L40.6482 44.194Z" fill="#15639F"/>
                <path d="M218.677 141.665L235.868 122.025L192.06 97.3396L221.189 55.1167L197.141 43.5001L151.036 106.34L218.677 141.665Z" fill="#15639F"/>
              </svg>
            </div>
            
            {/* Central glow effect */}
            <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-xl animate-pulse"></div>
          </motion.div>
          
          {/* Floating Stats */}
          {floatingStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: stat.delay,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className="absolute bg-white rounded-xl p-4 border border-gray-200 shadow-lg backdrop-blur-sm hover:border-blue-300 transition-all duration-300 cursor-pointer"
              style={stat.position}
            >
              <div className="flex items-center space-x-3 min-w-[140px]">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Orbiting Elements */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <div className="relative w-full h-full">
              <div className="absolute top-1/2 left-0 w-3 h-3 bg-blue-400 rounded-full opacity-60 transform -translate-y-1/2"></div>
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-teal-400 rounded-full opacity-60 transform -translate-x-1/2"></div>
              <div className="absolute top-1/2 right-0 w-3 h-3 bg-purple-400 rounded-full opacity-60 transform -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-green-400 rounded-full opacity-60 transform -translate-x-1/2"></div>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-700 mb-6">
            Ready to transform your credentialing process?
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            See Vera in Action
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default VeraLogoSection;