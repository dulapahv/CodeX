'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Socket } from 'socket.io-client';

import { BASE_SERVER_URL } from '@/lib/constants';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TestResult {
  id: number;
  http: number;
  socket: number;
  timestamp: string;
}

interface Stats {
  min: number;
  max: number;
  avg: number;
  median: number;
  stdDev: number;
}

const calculateStats = (values: number[]): Stats => {
  const sorted = [...values].sort((a, b) => a - b);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.round(Math.sqrt(avgSquareDiff));

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg),
    median: sorted[Math.floor(sorted.length / 2)],
    stdDev,
  };
};

const DEFAULT_ITERATIONS = 10;
const MIN_ITERATIONS = 1;
const MAX_ITERATIONS = 50;

const LatencyTest = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testCount, setTestCount] = useState(0);
  const [iterations, setIterations] = useState(DEFAULT_ITERATIONS);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  // Initialize socket connection on component mount
  useEffect(() => {
    const newSocket = getSocket();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnecting(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleIterationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setIterations(Math.min(Math.max(value, MIN_ITERATIONS), MAX_ITERATIONS));
    }
  };

  const singleTest = async (): Promise<{ http: number; socket: number }> => {
    if (!socket) {
      throw new Error('Socket not initialized');
    }

    const httpStart = performance.now();
    const response = await fetch(BASE_SERVER_URL);

    if (!response.ok) {
      throw new Error('HTTP request failed');
    }

    const httpLatency = Math.round(performance.now() - httpStart);

    const socketLatency = await new Promise<number>((resolve, reject) => {
      const start = performance.now();
      const timeout = setTimeout(() => {
        reject(new Error('Socket ping timeout'));
      }, 5000);

      socket.emit('ping');
      socket.once('pong', () => {
        clearTimeout(timeout);
        resolve(Math.round(performance.now() - start));
      });
    });

    return { http: httpLatency, socket: socketLatency };
  };

  const measureLatency = async () => {
    if (!socket?.connected) {
      setError('Socket not connected');
      return;
    }

    setIsTesting(true);
    setError(null);
    setResults([]);
    setTestCount(0);

    try {
      for (let i = 0; i < iterations; i++) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const result = await singleTest();
        setResults((prev) => [
          ...prev,
          {
            id: i + 1,
            http: result.http,
            socket: result.socket,
            timestamp: new Date().toISOString(),
          },
        ]);
        setTestCount(i + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Latency test error:', err);
    } finally {
      setIsTesting(false);
    }
  };

  const httpStats = results.length
    ? calculateStats(results.map((r) => r.http))
    : null;
  const socketStats = results.length
    ? calculateStats(results.map((r) => r.socket))
    : null;

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Server Latency Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="iterations">Number of Tests</Label>
              <Input
                id="iterations"
                type="number"
                min={MIN_ITERATIONS}
                max={MAX_ITERATIONS}
                value={iterations}
                onChange={handleIterationChange}
                className="w-32"
                disabled={isTesting}
              />
            </div>
            <Button
              onClick={measureLatency}
              disabled={isTesting || isConnecting}
              className="flex-1"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing ({testCount}/{iterations})
                </>
              ) : (
                'Start Tests'
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-2 text-sm text-destructive">Error: {error}</div>
          )}

          {results.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test #</TableHead>
                    <TableHead>HTTP (ms)</TableHead>
                    <TableHead>Socket (ms)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>{result.id}</TableCell>
                      <TableCell>{result.http}</TableCell>
                      <TableCell>{result.socket}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {httpStats && socketStats && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statistics (ms)</TableHead>
                      <TableHead>HTTP</TableHead>
                      <TableHead>Socket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Minimum</TableCell>
                      <TableCell>{httpStats.min}</TableCell>
                      <TableCell>{socketStats.min}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Maximum</TableCell>
                      <TableCell>{httpStats.max}</TableCell>
                      <TableCell>{socketStats.max}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Average</TableCell>
                      <TableCell>{httpStats.avg}</TableCell>
                      <TableCell>{socketStats.avg}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Median</TableCell>
                      <TableCell>{httpStats.median}</TableCell>
                      <TableCell>{socketStats.median}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Std Dev</TableCell>
                      <TableCell>{httpStats.stdDev}</TableCell>
                      <TableCell>{socketStats.stdDev}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { LatencyTest };
