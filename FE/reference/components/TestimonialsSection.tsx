import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const testimonials = [
    {
      quote: "Vera cut our credentialing time by 70%. What used to take weeks now happens in minutes. Our providers can start seeing patients almost immediately.",
      author: "Dr. Sarah Martinez",
      role: "Medical Staff Director",
      organization: "Regional Medical Center (500 beds)",
      rating: 5,
      avatar: "SM"
    },
    {
      quote: "The accuracy is remarkable. We've processed over 2,000 providers with zero compliance issues. The audit reports are exactly what our board needs.",
      author: "Michael Chen",
      role: "VP of Compliance",
      organization: "Healthcare System (15 facilities)",
      rating: 5,
      avatar: "MC"
    },
    {
      quote: "Implementation was seamless. Their API integrated with our HRIS in one day. The ROI was immediate - we're saving 40 hours per week.",
      author: "Jennifer Williams",
      role: "Director of Medical Staff Services",
      organization: "Academic Medical Center",
      rating: 5,
      avatar: "JW"
    },
    {
      quote: "Vera's human-in-the-loop approach gives us confidence. The AI does the heavy lifting, but we know experts review everything. Perfect balance.",
      author: "Dr. Robert Kim",
      role: "Chief Medical Officer",
      organization: "Multi-Specialty Group",
      rating: 5,
      avatar: "RK"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-r from-blue-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by healthcare leaders
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what compliance teams and medical staff directors say about their experience with Vera
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 lg:p-12">
              <div className="flex items-center justify-between mb-8">
                <Quote className="w-12 h-12 text-blue-600 opacity-20" />
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              <blockquote className="text-xl lg:text-2xl text-gray-900 leading-relaxed mb-8 font-medium">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {testimonials[currentTestimonial].author}
                    </p>
                    <p className="text-gray-600">
                      {testimonials[currentTestimonial].role}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {testimonials[currentTestimonial].organization}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={prevTestimonial}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextTestimonial}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Testimonial Indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;