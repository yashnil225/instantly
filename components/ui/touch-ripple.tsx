"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export const TouchRipple = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const addRipple = useCallback((event: React.PointerEvent<HTMLSpanElement>) => {
    const rippleContainer = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rippleContainer.width, rippleContainer.height) * 2; // Make it big enough to cover 

    const x = event.clientX - rippleContainer.left - size / 2;
    const y = event.clientY - rippleContainer.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (ripples.length > 0) {
      timeout = setTimeout(() => {
        setRipples([]);
      }, 600); // Wait for the ripple animation to fully complete
    }
    return () => clearTimeout(timeout);
  }, [ripples]);

  return (
    <span
      className="absolute inset-0 overflow-hidden z-0 pointer-events-auto"
      style={{ borderRadius: "inherit" }}
      onPointerDown={addRipple}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-mui-ripple bg-black/10 dark:bg-white/20"
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </span>
  );
};
