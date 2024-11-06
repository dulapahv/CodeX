import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import {
  GITHUB_CLIENT_ID,
  GITHUB_OAUTH_URL,
  IS_DEV_ENV,
} from "@/lib/constants";

interface GithubSuccessResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GithubErrorResponse {
  error: string;
  error_description: string;
  error_uri: string;
}

export async function GET(req: NextRequest) {
  const cookieStore = cookies();

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const error_description = url.searchParams.get("error_description");

  /*
   * If error is present (likely user has denied),
   * redirect to the app with the error
   */
  if (error) {
    redirect(`/oauth/github?status=${error}&description=${error_description}`);
  }

  const GITHUB_CLIENT_SECRET = IS_DEV_ENV
    ? process.env.GITHUB_CLIENT_SECRET_DEV
    : process.env.GITHUB_CLIENT_SECRET_PROD;

  const res = await fetch(
    `${GITHUB_OAUTH_URL}/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = (await res.json()) as
    | GithubSuccessResponse
    | GithubErrorResponse;

  if ("error" in data) {
    redirect(`/oauth/github`);
  } else {
    cookieStore.set("access_token", data.access_token, {
      secure: true,
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    });
    const username = await fetch(`https://api.github.com/user`, {
      headers: {
        Authorization: `token ${data.access_token}`,
      },
    }).then((res) => res.json());
    redirect(`/oauth/github?status=success&username=${username.login}`);
  }
}
