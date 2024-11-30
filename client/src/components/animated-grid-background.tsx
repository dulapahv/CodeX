'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isMobile } from 'react-device-detect';

const AnimatedGridBackground = () => {
  const [gridConfig, setGridConfig] = useState({
    rows: isMobile ? 10 : 20,
    cols: isMobile ? 8 : 24,
    cellSize: isMobile ? 40 : 50,
  });

  const [lights, setLights] = useState<
    Array<{
      type: 'horizontal' | 'vertical';
      position: number;
      key: number;
      duration: number;
    }>
  >([]);

  // Generate a random light
  const generateLight = useCallback(() => {
    const isHorizontal = Math.random() > 0.5;
    // Slightly faster movement for more dynamic feel
    const duration = Math.random() * 1.5 + (isMobile ? 2 : 2.5); // Random duration between 2-3.5s mobile, 2.5-4s desktop

    if (isHorizontal) {
      return {
        type: 'horizontal' as const,
        position: Math.floor(Math.random() * gridConfig.rows),
        key: Date.now() + Math.random(),
        duration,
      };
    } else {
      return {
        type: 'vertical' as const,
        position: Math.floor(Math.random() * gridConfig.cols),
        key: Date.now() + Math.random(),
        duration,
      };
    }
  }, [gridConfig.rows, gridConfig.cols]);

  // Spawn new lights periodically
  useEffect(() => {
    const spawnLight = () => {
      setLights((prevLights) => {
        // Remove lights that have been around too long
        const now = Date.now();
        const filteredLights = prevLights.filter(
          (light) => now - light.key < 8000, // Reduced from 10s to 8s for faster turnover
        );

        // Add new light if we're below the maximum
        const maxLights = isMobile ? 5 : 8; // Increased from 3/5 to 5/8
        if (filteredLights.length < maxLights) {
          return [...filteredLights, generateLight()];
        }
        return filteredLights;
      });
    };

    // Spawn lights at random intervals
    const interval = setInterval(
      () => {
        if (Math.random() > 0.3) {
          // Increased spawn chance from 0.5 to 0.7
          spawnLight();
        }
      },
      isMobile ? 800 : 600,
    ); // More frequent checks - reduced from 1000/800 to 800/600

    // Initial lights
    spawnLight();
    spawnLight();
    spawnLight(); // Added one more initial light

    return () => clearInterval(interval);
  }, [generateLight]);

  // Responsive grid adjustments
  useEffect(() => {
    const updateGridDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const newCellSize = isMobile ? 40 : 50;
      const newCols = Math.max(8, Math.floor(width / newCellSize));
      const newRows = Math.max(10, Math.floor(height / newCellSize));

      setGridConfig({
        rows: newRows,
        cols: newCols,
        cellSize: newCellSize,
      });
    };

    window.addEventListener('resize', updateGridDimensions);
    updateGridDimensions();

    return () => window.removeEventListener('resize', updateGridDimensions);
  }, []);

  // Grid line variants for animation
  const gridLineVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 0.1,
      transition: {
        duration: 1,
      },
    },
  };

  // Calculate dimensions for light elements
  const lightWidth = isMobile ? '8rem' : '12rem';
  const lightHeight = isMobile ? '8rem' : '12rem';

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      role="presentation"
    >
      <div className="absolute inset-0">
        {/* Vertical grid lines */}
        {Array.from({ length: gridConfig.cols + 1 }).map((_, i) => (
          <motion.div
            key={`v-${i}`}
            className="absolute top-0 h-full w-px bg-white/80 dark:bg-gray-300/40"
            style={{
              left: `${(i * 100) / gridConfig.cols}%`,
              transform: 'translateX(-50%)',
            }}
            initial="hidden"
            animate="visible"
            variants={gridLineVariants}
          />
        ))}

        {/* Horizontal grid lines */}
        {Array.from({ length: gridConfig.rows + 1 }).map((_, i) => (
          <motion.div
            key={`h-${i}`}
            className="absolute left-0 h-px w-full bg-white/80 dark:bg-gray-300/40"
            style={{
              top: `${(i * 100) / gridConfig.rows}%`,
              transform: 'translateY(-50%)',
            }}
            initial="hidden"
            animate="visible"
            variants={gridLineVariants}
          />
        ))}

        {/* Random traveling lights with AnimatePresence for smooth mounting/unmounting */}
        <AnimatePresence>
          {lights.map((light) => {
            if (light.type === 'horizontal') {
              return (
                <motion.div
                  key={light.key}
                  className="absolute h-px w-full"
                  style={{
                    top: `${(light.position * 100) / gridConfig.rows}%`,
                    transform: 'translateY(-50%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="absolute h-full"
                    style={{
                      width: lightWidth,
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(103, 172, 245, 0.6) 50%, transparent 100%)',
                    }}
                    animate={{
                      left: ['-20%', '120%'],
                    }}
                    transition={{
                      duration: light.duration,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              );
            } else {
              return (
                <motion.div
                  key={light.key}
                  className="absolute h-full w-px"
                  style={{
                    left: `${(light.position * 100) / gridConfig.cols}%`,
                    transform: 'translateX(-50%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="absolute w-full"
                    style={{
                      height: lightHeight,
                      background:
                        'linear-gradient(180deg, transparent 0%, rgba(103, 172, 245, 0.6) 50%, transparent 100%)',
                    }}
                    animate={{
                      top: ['-20%', '120%'],
                    }}
                    transition={{
                      duration: light.duration,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              );
            }
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnimatedGridBackground;
