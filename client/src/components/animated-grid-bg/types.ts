export interface GridConfig {
  rows: number;
  cols: number;
  cellSize: number;
}

export interface Light {
  type: 'horizontal' | 'vertical';
  position: number;
  key: number;
  duration: number;
}

interface LightStyle {
  trail: {
    width?: string;
    height?: string;
    background: string;
    position?: 'relative';
  };
  glow: {
    position: 'absolute';
    right?: string;
    bottom?: string;
    width: string;
    height: string;
    background: string;
    boxShadow: string;
  };
}

export interface LightStyles {
  horizontal: LightStyle;
  vertical: LightStyle;
}
