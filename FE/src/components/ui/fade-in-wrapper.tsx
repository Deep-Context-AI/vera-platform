"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FadeInWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  disabled?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
}

const FadeInWrapper: React.FC<FadeInWrapperProps> = ({
  children,
  className,
  delay = 0,
  duration = 500,
  disabled = false,
  direction = 'up',
  distance = 8,
}) => {
  const [isVisible, setIsVisible] = useState(disabled);

  useEffect(() => {
    if (disabled) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, disabled]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const getTransformClasses = () => {
    if (direction === 'none') return '';
    
    const baseTransform = isVisible ? 'translate-x-0 translate-y-0' : '';
    const hiddenTransform = !isVisible ? (() => {
      switch (direction) {
        case 'up':
          return `translate-y-${distance === 8 ? '2' : distance === 4 ? '1' : '4'}`;
        case 'down':
          return `-translate-y-${distance === 8 ? '2' : distance === 4 ? '1' : '4'}`;
        case 'left':
          return `translate-x-${distance === 8 ? '2' : distance === 4 ? '1' : '4'}`;
        case 'right':
          return `-translate-x-${distance === 8 ? '2' : distance === 4 ? '1' : '4'}`;
        default:
          return `translate-y-${distance === 8 ? '2' : distance === 4 ? '1' : '4'}`;
      }
    })() : '';

    return `${baseTransform} ${hiddenTransform}`;
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        getTransformClasses(),
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default FadeInWrapper; 