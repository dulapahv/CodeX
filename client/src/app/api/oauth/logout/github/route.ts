import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = cookies();

  // Remove the access token cookie
  cookieStore.delete('access_token');

  return NextResponse.json({ success: true });
}
