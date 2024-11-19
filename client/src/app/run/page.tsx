'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// TypeScript interfaces
interface PistonFile {
  content: string;
}

interface PistonRequest {
  language: string;
  version: string;
  files: PistonFile[];
  stdin: string;
  args: string[];
}

interface PistonResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

const CodeRunner: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const executeCode = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data = (await response.json()) as PistonResponse;

      // Combine stdout and stderr from the run object
      const executionOutput = [
        data.run.stdout && `Output:\n${data.run.stdout}`,
        data.run.stderr && `Errors:\n${data.run.stderr}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      setOutput(executionOutput || 'No output');
    } catch (error) {
      setOutput(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-3xl space-y-4 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Code Runner</h1>
        <p className="text-sm text-gray-500">
          Write and execute JavaScript code in real-time
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-64 w-full rounded-lg border p-4 font-mono text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          placeholder="// Write your JavaScript code here
console.log('Hello, World!');"
        />

        <div className="flex items-center justify-between">
          <Button
            onClick={executeCode}
            disabled={isLoading || !code.trim()}
            className="flex items-center space-x-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLoading ? 'Executing...' : 'Run Code'}</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setCode('');
              setOutput('');
            }}
            disabled={isLoading || !code.trim()}
          >
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2 text-background">
            <h3 className="font-semibold">Output:</h3>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border bg-gray-50 p-4 font-mono text-sm">
              {output}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CodeRunner;
