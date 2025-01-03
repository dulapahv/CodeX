'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { BASE_SERVER_URL } from '@/lib/constants';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LatencyTest = () => {
  const [httpLatency, setHttpLatency] = useState<number | null>(null);
  const [socketLatency, setSocketLatency] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const measureLatency = async () => {
    setIsTesting(true);
    setError(null);

    try {
      // Measure HTTP latency
      const httpStart = performance.now();
      const response = await fetch(BASE_SERVER_URL);

      if (!response.ok) {
        throw new Error('HTTP request failed');
      }

      setHttpLatency(Math.round(performance.now() - httpStart));

      // Measure Socket latency
      const socket = getSocket();
      const socketStart = performance.now();

      socket.emit('ping');

      const pongPromise = new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket ping timeout'));
        }, 5000);

        socket.once('pong', () => {
          clearTimeout(timeout);
          resolve(Math.round(performance.now() - socketStart));
        });
      });

      const socketLatencyValue = await pongPromise;
      setSocketLatency(socketLatencyValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Latency test error:', err);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    // Initial measurement
    measureLatency();
  }, []);

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Server Latency Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">HTTP Latency:</span>
            <span className="font-mono">
              {httpLatency !== null ? `${httpLatency}ms` : 'Testing...'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Socket Latency:</span>
            <span className="font-mono">
              {socketLatency !== null ? `${socketLatency}ms` : 'Testing...'}
            </span>
          </div>

          {error && (
            <div className="mt-2 text-sm text-destructive">Error: {error}</div>
          )}

          <Button
            onClick={measureLatency}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Again'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export { LatencyTest };
