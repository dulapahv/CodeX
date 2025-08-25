/**
 * GitHub API route handler for searching user repositories.
 * Features:
 * - Search query handling
 * - Authentication validation
 * - Repository filtering
 * - Sorting and ordering
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GITHUB_API_URL } from '@/lib/constants';

// export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token found' },
        { status: 401 },
      );
    }

    // Construct the GitHub API URL with search query and sort parameters
    const apiUrl = query
      ? `${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(query)}+in:name+user:@me&sort=updated&order=desc`
      : `${GITHUB_API_URL}/user/repos?sort=updated&order=desc`;

    // Fetch repositories from GitHub API
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to fetch repositories' },
        { status: response.status },
      );
    }

    const data = await response.json();
    const repositories = query ? data.items : data;

    // Return the repositories data
    return NextResponse.json({
      repositories,
      total: repositories.length,
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
