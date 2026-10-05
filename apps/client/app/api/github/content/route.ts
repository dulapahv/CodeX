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

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { GITHUB_API_URL, GITHUB_USER_AGENT } from "@/lib/constants";
import {
  validateGitHubBranch,
  validateGitHubPath,
  validateGitHubRepo,
} from "@/lib/github";

// export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch");
    const path = searchParams.get("path");
    const filename = searchParams.get("filename");

    // Validate required parameters
    if (!(repo && branch && filename)) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (
      !(
        validateGitHubRepo(repo) &&
        validateGitHubBranch(branch) &&
        validateGitHubPath(filename)
      ) ||
      (path && !validateGitHubPath(path))
    ) {
      return NextResponse.json(
        { error: "Invalid parameter value" },
        { status: 400 }
      );
    }

    // Construct the file path
    const filePath = path ? `${path}/${filename}` : filename;
    const encodedRepo = repo.split("/").map(encodeURIComponent).join("/");
    const encodedFilePath = filePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const encodedBranch = encodeURIComponent(branch);

    // Fetch file content from GitHub
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${encodedRepo}/contents/${encodedFilePath}?ref=${encodedBranch}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": GITHUB_USER_AGENT,
          Accept: "application/vnd.github.v3.raw",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      const error = await response.json().catch(() => null);
      return NextResponse.json(
        { error: "Failed to fetch file content", details: error },
        { status: response.status }
      );
    }

    const content = await response.text();

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error in content route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
