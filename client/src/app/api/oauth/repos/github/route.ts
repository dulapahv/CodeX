// app/api/github/repos/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GITHUB_API_URL } from '@/lib/constants';

export async function GET() {
  try {
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token found' },
        { status: 401 },
      );
    }

    // Fetch repositories from GitHub API
    const response = await fetch(`${GITHUB_API_URL}/user/repos`, {
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

    const repositories = await response.json();

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
