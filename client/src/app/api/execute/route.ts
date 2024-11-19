import { NextResponse } from 'next/server';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const response = await fetch(PISTON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'javascript',
        version: '*',
        files: [{ content: body.code }],
        stdin: '',
        args: [],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 },
    );
  }
}
