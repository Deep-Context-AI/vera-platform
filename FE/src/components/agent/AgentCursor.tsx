'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AgentCursorProps {
  position: { x: number; y: number };
}

export function AgentCursor({ position }: AgentCursorProps) {
  // Always use the same cursor - no special styling based on thought type
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-4px, -4px)', // Adjust for cursor tip positioning
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <g clipPath="url(#clip0_429_11096_default)">
            <path
              d="M11 20.9999L4 3.99994L21 10.9999L14.7353 13.6848C14.2633 13.8871 13.8872 14.2632 13.6849 14.7353L11 20.9999Z"
              stroke="#292929"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="white"
            />
          </g>
          <defs>
            <clipPath id="clip0_429_11096_default">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
} 