export type TestResult = {
  id: number;
  http: number;
  socket: number;
  timestamp: string;
};

export type Stats = {
  min: number;
  max: number;
  avg: number;
  median: number;
  stdDev: number;
};
