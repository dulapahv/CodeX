/**
 * Type definitions for animated grid background component.
 * Includes:
 * - Grid configuration
 * - Light animation types
 * - Style definitions
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export interface GridConfig {
  cellSize: number;
  cols: number;
  rows: number;
}

export interface Light {
  duration: number;
  key: number;
  position: number;
  type: "horizontal" | "vertical";
}

interface LightStyle {
  glow: {
    position: "absolute";
    right?: string;
    bottom?: string;
    width: string;
    height: string;
    background: string;
    boxShadow: string;
  };
  trail: {
    width?: string;
    height?: string;
    background: string;
    position?: "relative";
  };
}

export interface LightStyles {
  horizontal: LightStyle;
  vertical: LightStyle;
}
