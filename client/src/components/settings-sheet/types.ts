export type EditorOption = {
  title: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'text';
  options?: string[];
  currentValue: unknown;
};
