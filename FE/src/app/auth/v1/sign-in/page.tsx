"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight, Heart, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";
import VeraLogo from "@/components/VeraLogo";
import HealthcareMap from "@/components/HealthcareMap";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VeraLoginCard = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        // Successful login - redirect to dashboard
        router.push('/');
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl flex bg-white shadow-2xl"
    >
      {/* Left side - Healthcare Network Visualization */}
      <div className="hidden md:block w-1/2 h-full relative overflow-hidden border-r border-gray-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <HealthcareMap />
          
        {/* Logo and branding overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mb-8"
          >
            <VeraLogo className="w-24 h-24" />
          </motion.div>
            
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-4xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
          >
            Vera
          </motion.h2>
            
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-xl font-semibold text-center text-gray-700 max-w-sm mb-6"
          >
            &ldquo;Transforming Healthcare, One Verification at a Time&rdquo;
          </motion.p>
            
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex items-center space-x-6 text-gray-600"
          >
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-sm">Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm">Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm">Connected</span>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Right side - Sign In Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center mb-8">
            <VeraLogo className="w-12 h-12 mr-3" />
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Vera
            </h1>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800">Welcome back</h1>
          <p className="text-gray-500 mb-8">Access your healthcare platform</p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-blue-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={isLoading}
                className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 relative z-30"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-blue-500">*</span>
              </label>
              <div className="relative z-30">
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pr-10 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 relative z-30"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors z-40"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
                Forgot password?
              </a>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              className="pt-2"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full bg-gradient-to-r relative overflow-hidden from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white py-3 rounded-lg transition-all duration-300 shadow-lg",
                  isHovered ? "shadow-xl shadow-blue-200" : "",
                  isLoading ? "opacity-75 cursor-not-allowed" : ""
                )}
              >
                <span className="flex items-center justify-center font-semibold">
                  {isLoading ? "Signing in..." : "Sign in to Vera"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
                {isHovered && (
                  <motion.span
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{ filter: "blur(8px)" }}
                  />
                )}
              </Button>
            </motion.div>
            
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need access to Vera?{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  Contact your administrator
                </a>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VeraLoginCard;
