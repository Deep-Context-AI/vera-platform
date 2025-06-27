import React from 'react';
import { cn } from '@/lib/utils';

interface TableRowFadeInProps extends React.ComponentProps<'tr'> {
  index: number;
  delay?: number; // Base delay in ms
  isVisible?: boolean;
  enableAnimation?: boolean;
}

export const TableRowFadeIn: React.FC<TableRowFadeInProps> = ({
  children,
  index,
  className,
  delay = 30, // Reduced delay for smoother experience
  isVisible = true,
  enableAnimation = true,
  ...props
}) => {
  // Don't animate if animation is disabled, not visible, or beyond 20 rows for performance
  const shouldAnimate = enableAnimation && isVisible && index < 20;
  const animationDelay = shouldAnimate ? index * delay : 0;

  return (
    <tr
      className={cn(
        // Use CSS animation that doesn't affect layout
        shouldAnimate && 'animate-in fade-in duration-300 ease-out',
        className
      )}
      style={{
        ...(shouldAnimate && {
          animationDelay: `${animationDelay}ms`,
          animationFillMode: 'backwards', // Start with initial state, not 'both'
        }),
      }}
      {...props}
    >
      {children}
    </tr>
  );
}; 