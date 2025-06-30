import React, { useRef, useEffect, useState } from "react";

const HealthcareMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Create dots representing healthcare facilities and networks
  const generateDots = (width: number, height: number) => {
    const dots = [];
    const gap = 25;
    const dotRadius = 2;

    for (let x = gap; x < width - gap; x += gap) {
      for (let y = gap; y < height - gap; y += gap) {
        // Create a uniform grid pattern with some randomness
        if (Math.random() > 0.25) {
          dots.push({
            x: x + (Math.random() - 0.5) * 8, // Add slight randomness to position
            y: y + (Math.random() - 0.5) * 8,
            radius: dotRadius + Math.random() * 0.5,
            opacity: Math.random() * 0.4 + 0.3,
            phase: Math.random() * Math.PI * 2, // For animation
          });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const rect = parent.getBoundingClientRect();
      const width = rect.width || parent.clientWidth;
      const height = rect.height || parent.clientHeight;
      
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
        canvas.width = width;
        canvas.height = height;
      }
    };

    // Initial sizing
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    // Fallback for cases where ResizeObserver doesn't trigger
    const timeoutId = setTimeout(updateDimensions, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    
    // Generate connections once
    const connections: Array<{ from: typeof dots[0], to: typeof dots[0] }> = [];
    for (let i = 0; i < dots.length; i++) {
      const dot1 = dots[i];
      for (let j = i + 1; j < dots.length; j++) {
        const dot2 = dots[j];
        const distance = Math.sqrt((dot1.x - dot2.x) ** 2 + (dot1.y - dot2.y) ** 2);
        
        // Only store connections for nearby dots
        if (distance < 80 && Math.random() > 0.85) {
          connections.push({ from: dot1, to: dot2 });
        }
      }
    }
    
    let animationFrameId: number;
    const startTime = Date.now();

    function drawDots() {
      if (!ctx) return;
      
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000; // Convert to seconds
      
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw connection lines first (so they appear behind dots)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 1;
      
      connections.forEach(connection => {
        ctx.beginPath();
        ctx.moveTo(connection.from.x, connection.from.y);
        ctx.lineTo(connection.to.x, connection.to.y);
        ctx.stroke();
      });
      
      // Draw dots
      dots.forEach(dot => {
        // Create subtle pulsing effect
        const pulseOpacity = dot.opacity + Math.sin(elapsed * 0.5 + dot.phase) * 0.1;
        const pulseRadius = dot.radius + Math.sin(elapsed * 0.3 + dot.phase) * 0.2;
        
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${Math.max(0.1, pulseOpacity)})`;
        ctx.fill();
      });
    }

    function animate() {
      drawDots();
      animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};

export default HealthcareMap;