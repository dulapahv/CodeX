/**
 * Latency test component for measuring connection performance.
 * Features:
 * - HTTP/Socket latency tests
 * - Multiple test iterations
 * - Statistical analysis
 * - Results visualization
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Link from 'next/link';

import { ArrowLeft } from 'lucide-react';
import { Socket } from 'socket.io-client';

import { BASE_CLIENT_URL, BASE_SERVER_URL } from '@/lib/constants';
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
import { Spinner } from '@/components/spinner';

import type { TestResult } from './types';
import { calculateStats } from './utils';

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

  const handleIterationChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      <Button variant="link" className="text-foreground mt-4 px-6" asChild>
        <Link href={BASE_CLIENT_URL}>
          <ArrowLeft className="mr-2 size-4" />
          Go back
        </Link>
      </Button>
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
                pattern="[0-9]*"
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
                  <Spinner className="mr-2" />
                  Connecting...
                </>
              ) : isTesting ? (
                <>
                  <Spinner className="mr-2" />
                  Testing ({testCount}/{iterations})
                </>
              ) : (
                'Start Tests'
              )}
            </Button>
          </div>

          {error && (
            <div className="text-destructive mt-2 text-sm">Error: {error}</div>
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
