/**
 * GitHub API route handler for fetching repository resources.
 * Provides:
 * - Branch listing
 * - File/directory contents
 * - Authentication validation
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { GITHUB_API_URL } from "@/lib/constants";
import {
  validateGitHubBranch,
  validateGitHubOwner,
  validateGitHubPath,
  validateGitHubRepo,
} from "@/lib/github";

// export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  props: RouteContext<"/api/github/repos/[...params]">
) {
  const params = await props.params;
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return Response.json({ error: "No access token found" }, { status: 401 });
    }

    const [action, owner, repo] = params.params;

    if (
      !(owner && repo && validateGitHubOwner(owner) && validateGitHubRepo(repo))
    ) {
      return Response.json({ error: "Invalid owner or repo" }, { status: 400 });
    }

    let endpoint = "";

    switch (action) {
      case "branches":
        endpoint = `${GITHUB_API_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`;
        break;
      case "contents": {
        const { searchParams } = new URL(req.url);
        const path = searchParams.get("path") || "";
        const ref = searchParams.get("ref") || "main";
        if (!(validateGitHubPath(path) && validateGitHubBranch(ref))) {
          return Response.json(
            { error: "Invalid path or ref" },
            { status: 400 }
          );
        }
        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        endpoint = `${GITHUB_API_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
        break;
      }
      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("GitHub API Error:", error);
      return Response.json(
        { error: `GitHub API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
