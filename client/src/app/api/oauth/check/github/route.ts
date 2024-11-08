import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { GITHUB_API_URL } from '@/lib/constants';

export async function GET() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token');

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Fetch user data from GitHub using the access token
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();

    return NextResponse.json({
      username: userData.login,
      // Add any other user data you want to return
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 401 },
    );
  }
}
