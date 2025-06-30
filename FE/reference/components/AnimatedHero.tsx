import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Shield } from "lucide-react";
import { Button } from "@/app/marketing/components/ui/Button";
import { SpiralAnimation } from "./ui/SpiralAnimation";

function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["seamless", "instant", "accurate", "compliant", "effortless"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center pt-16">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23e0f2fe%27 fill-opacity=%270.4%27%3E%3Ccircle cx=%2730%27 cy=%2730%27 r=%272%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Spiral Animation Background */}
      <SpiralAnimation 
        totalDots={300}
        size={800}
        dotRadius={2}
        duration={4}
        dotColor="#0ea5e9"
        className="opacity-60"
      />
      
      <div className="relative w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
            <div>
              <Button variant="secondary" size="sm" className="gap-4 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                <Shield className="w-4 h-4" />
                Trusted by 500+ healthcare organizations 
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-4 flex-col">
              <h1 className="text-5xl md:text-7xl max-w-4xl tracking-tighter text-center font-regular">
                <span className="text-gray-900">Healthcare verification that's</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                  &nbsp;
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="absolute font-semibold bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: "-100" }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                              y: 0,
                              opacity: 1,
                            }
                          : {
                              y: titleNumber > index ? -150 : 150,
                              opacity: 0,
                            }
                      }
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
              </h1>

              <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-600 max-w-3xl text-center">
                Transform credentialing with Vera's AI-powered platform. Automate verifications,
                reduce compliance risk, and accelerate provider onboarding with our comprehensive
                verification suite that takes minutes, not weeks.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-4" variant="outline">
                <Calendar className="w-4 h-4" />
                Schedule Demo
              </Button>
            </div>

            {/* Live Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-2xl"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">4.2min</div>
                <p className="text-gray-600 text-sm">Average verification time</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">99.9%</div>
                <p className="text-gray-600 text-sm">Accuracy rate</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">100+</div>
                <p className="text-gray-600 text-sm">Primary sources checked</p>
              </div>
            </motion.div>

            {/* Floating verification cards */}
            <motion.div 
              className="absolute top-1/4 left-8 bg-white rounded-xl shadow-lg p-4 border border-gray-200 z-10 hidden lg:block"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Dr. Sarah Martinez</p>
                  <p className="text-green-600 text-sm">Verified ✓</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="absolute top-1/3 right-8 bg-white rounded-xl shadow-lg p-4 border border-gray-200 z-10 hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">24/7</div>
                <p className="text-gray-600 text-sm">Active monitoring</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { AnimatedHero };