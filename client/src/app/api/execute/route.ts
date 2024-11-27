import { NextResponse } from 'next/server';

export const runtime = 'edge';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (!body.language) {
      return NextResponse.json(
        { error: 'Language is required' },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    request.signal.addEventListener('abort', () => {
      controller.abort();
    });

    const response = await fetch(PISTON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: body.language.toLowerCase(),
        version: '*',
        files: [{ content: body.code }],
        stdin: '',
        args: Array.isArray(body.args) ? body.args : [], // Safely handle args
        run_timeout: 30000, // 30 seconds timeout
        compile_timeout: 30000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Add args to output for debugging purposes
    if (body.args?.length > 0) {
      data.args = body.args;
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Code execution cancelled' },
        { status: 499 }, // Using 499 Client Closed Request
      );
    }

    console.error('Code execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 },
    );
  }
}
