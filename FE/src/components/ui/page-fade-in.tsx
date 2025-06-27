"use client";

import React from 'react';
import FadeInWrapper from './fade-in-wrapper';
import { useFadeIn } from '@/hooks/useFadeIn';

interface PageFadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  staggerChildren?: boolean;
  staggerDelay?: number;
}

const PageFadeIn: React.FC<PageFadeInProps> = ({
  children,
  className,
  delay = 300,
  duration = 500,
  direction = 'up',
  distance = 8,
  staggerChildren = false,
  staggerDelay = 100,
}) => {
  const { isDisabled } = useFadeIn();

  if (staggerChildren && React.Children.count(children) > 1) {
    return (
      <div className={className}>
        {React.Children.map(children, (child, index) => (
          <FadeInWrapper
            key={index}
            delay={delay + (index * staggerDelay)}
            duration={duration}
            direction={direction}
            distance={distance}
            disabled={isDisabled}
          >
            {child}
          </FadeInWrapper>
        ))}
      </div>
    );
  }

  return (
    <FadeInWrapper
      className={className}
      delay={delay}
      duration={duration}
      direction={direction}
      distance={distance}
      disabled={isDisabled}
    >
      {children}
    </FadeInWrapper>
  );
};

export default PageFadeIn; 