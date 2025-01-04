/**
 * GitHub repository search API route handler.
 * Searches user's repositories or lists all repos if no query provided.
 * Uses Edge Runtime for optimal performance.
 *
 * @remarks
 * This handler supports two modes:
 * 1. Search repos - When query parameter 'q' is provided
 * 2. List repos - When no query parameter is provided
 *
 * Uses GitHub's repository search API with the following parameters:
 * - Search in repository names only
 * - Filter to authenticated user's repos only
 * - Sort by last updated
 * - Order by descending
 *
 * @example
 * ```ts
 * // Search repositories
 * GET /api/github/repos/search?q=test
 *
 * // List all repositories
 * GET /api/github/repos/search
 * ```
 *
 * @param request - Next.js Edge API request object
 * @returns {Promise<Response>}
 * - Success: JSON response with repository data
 * - Error: JSON response with error message and status code
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GITHUB_API_URL } from '@/lib/constants';

export const runtime = 'edge';

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
