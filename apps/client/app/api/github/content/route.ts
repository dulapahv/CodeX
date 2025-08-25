/**
 * GitHub API route handler for fetching file content.
 * Features:
 * - Authentication verification
 * - Parameter validation
 * - Repository content retrieval
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GITHUB_API_URL } from '@/lib/constants';

// export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const branch = searchParams.get('branch');
    const path = searchParams.get('path');
    const filename = searchParams.get('filename');

    // Validate required parameters
    if (!repo || !branch || !filename) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 },
      );
    }

    // Construct the file path
    const filePath = path ? `${path}/${filename}` : filename;

    // Fetch file content from GitHub
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3.raw',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      const error = await response.json();
      return NextResponse.json(
        { error: 'Failed to fetch file content', details: error },
        { status: response.status },
      );
    }

    // Get the raw content
    const content = await response.text();

    // Get file metadata from GitHub
    const metadataResponse = await fetch(
      `${GITHUB_API_URL}/repos/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!metadataResponse.ok) {
      return NextResponse.json({ content }, { status: 200 });
    }

    const metadata = await metadataResponse.json();

    return NextResponse.json({
      content,
      sha: metadata.sha,
      size: metadata.size,
      encoding: metadata.encoding,
      url: metadata.url,
      git_url: metadata.git_url,
      html_url: metadata.html_url,
    });
  } catch (error) {
    console.error('Error in content route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
