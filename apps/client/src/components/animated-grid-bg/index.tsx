/**
 * Animated grid background component with parallax effect and moving lights.
 * Features:
 * - Responsive grid layout
 * - Animated light trails
 * - Mouse-based parallax
 * - Dynamic sizing
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  AnimatePresence,
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';

import { useMediaQuery } from '@/hooks/use-media-query';

import type { GridConfig, Light, LightStyles } from './types';

const AnimatedGridBackground = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: isDesktop ? 20 : 10,
    cols: isDesktop ? 24 : 8,
    cellSize: isDesktop ? 50 : 40,
  });

  const [lights, setLights] = useState<Light[]>([]);

  // Motion values for parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX: MotionValue = useSpring(mouseX, springConfig);
  const smoothY: MotionValue = useSpring(mouseY, springConfig);

  // Transform mouse position into grid movement
  const gridX = useTransform(smoothX, [-1, 1], [-20, 20]);
  const gridY = useTransform(smoothY, [-1, 1], [-20, 20]);

  // Handle mouse movement
  const handleMouseMove = useCallback(
    (e: MouseEvent): void => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Convert mouse position to normalized coordinates (-1 to 1)
      const x = (clientX / innerWidth) * 2 - 1;
      const y = (clientY / innerHeight) * 2 - 1;

      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY],
  );

  // Generate a random light
  const generateLight = useCallback((): Light => {
    const isHorizontal = Math.random() > 0.5;
    const duration = Math.random() * 1.5 + (isDesktop ? 2.5 : 2);

    if (isHorizontal) {
      return {
        type: 'horizontal',
        position: Math.floor(Math.random() * gridConfig.rows),
        key: Date.now() + Math.random(),
        duration,
      };
    } else {
      return {
        type: 'vertical',
        position: Math.floor(Math.random() * gridConfig.cols),
        key: Date.now() + Math.random(),
        duration,
      };
    }
  }, [gridConfig.rows, gridConfig.cols, isDesktop]);

  // Spawn new lights periodically
  useEffect(() => {
    const spawnLight = () => {
      setLights((prevLights) => {
        const now = Date.now();
        const filteredLights = prevLights.filter(
          (light) => now - light.key < 8000,
        );

        const maxLights = isDesktop ? 10 : 8;
        if (filteredLights.length < maxLights) {
          return [...filteredLights, generateLight()];
        }
        return filteredLights;
      });
    };

    const interval = setInterval(spawnLight, isDesktop ? 400 : 600);

    return () => clearInterval(interval);
  }, [generateLight, isDesktop]);

  // Responsive grid adjustments with parallax on all screen sizes
  useEffect(() => {
    const updateGridDimensions = () => {
      // Add extra columns and rows to account for parallax movement
      const parallaxPadding = 40;
      const width = window.innerWidth + parallaxPadding * 2;
      const height = window.innerHeight + parallaxPadding * 2;

      const newCellSize = isDesktop ? 50 : 40;
      const newCols = Math.max(8, Math.floor(width / newCellSize) + 2);
      const newRows = Math.max(10, Math.floor(height / newCellSize) + 2);

      setGridConfig({
        rows: newRows,
        cols: newCols,
        cellSize: newCellSize,
      });
    };

    // Enable parallax on all screen sizes
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateGridDimensions);
    updateGridDimensions();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateGridDimensions);
    };
  }, [handleMouseMove, isDesktop]);

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
  const trailWidth = isDesktop ? '10rem' : '6rem';
  const trailHeight = isDesktop ? '10rem' : '6rem';
  const glowSize = isDesktop ? '0.75rem' : '0.5rem';

  // Light styles with parallax offset
  const lightStyles: LightStyles = {
    horizontal: {
      trail: {
        width: trailWidth,
        background:
          'linear-gradient(90deg, transparent 0%, rgba(103, 172, 245, 0.4) 100%)',
      },
      glow: {
        position: 'absolute',
        right: '-2px',
        width: glowSize,
        height: '1px',
        background: 'rgba(103, 172, 245, 1)',
        boxShadow: `
          0 0 8px 1px rgba(103, 172, 245, 0.6),
          0 0 16px 2px rgba(103, 172, 245, 0.4),
          0 0 24px 3px rgba(103, 172, 245, 0.2)
        `,
      },
    },
    vertical: {
      trail: {
        height: trailHeight,
        background:
          'linear-gradient(180deg, transparent 0%, rgba(103, 172, 245, 0.4) 100%)',
      },
      glow: {
        position: 'absolute',
        bottom: '-2px',
        width: '1px',
        height: glowSize,
        background: 'rgba(103, 172, 245, 1)',
        boxShadow: `
          0 0 8px 1px rgba(103, 172, 245, 0.6),
          0 0 16px 2px rgba(103, 172, 245, 0.4),
          0 0 24px 3px rgba(103, 172, 245, 0.2)
        `,
      },
    },
  };

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      role="presentation"
    >
      <motion.div
        className="absolute"
        style={{
          inset: -40,
          x: gridX,
          y: gridY,
        }}
      >
        {/* Grid lines */}
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

        {/* Lights with parallax effect */}
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
                    className="absolute h-full rounded-full"
                    style={{
                      ...lightStyles.horizontal.trail,
                      position: 'relative',
                    }}
                    animate={{
                      left: ['-20%', '120%'],
                    }}
                    transition={{
                      duration: light.duration,
                      ease: 'linear',
                    }}
                  >
                    <div style={lightStyles.horizontal.glow} />
                  </motion.div>
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
                      ...lightStyles.vertical.trail,
                      position: 'relative',
                    }}
                    animate={{
                      top: ['-20%', '120%'],
                    }}
                    transition={{
                      duration: light.duration,
                      ease: 'linear',
                    }}
                  >
                    <div style={lightStyles.vertical.glow} />
                  </motion.div>
                </motion.div>
              );
            }
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export { AnimatedGridBackground };
