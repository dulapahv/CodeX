/**
 * Validators for repository names, refs and paths sent to provider APIs.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

const REPO_SEGMENT_RE = /^[a-zA-Z0-9._-]+$/;

// git check-ref-format forbids these in a ref name, alongside control characters.
const REF_ILLEGAL_CHARS = new Set([" ", "~", "^", ":", "?", "*", "[", "\\"]);

const SPACE_CODE_POINT = 0x20;
const DELETE_CODE_POINT = 0x7f;

const MAX_REPO_SEGMENT_LENGTH = 100;
// GitLab nests projects in up to 20 levels of subgroups
const MAX_REPO_SEGMENTS = 21;
const MAX_PATH_LENGTH = 500;
const MAX_REF_LENGTH = 255;

// C0 control characters and DEL are never valid in a git path or ref name.
const hasControlCharacter = (value: string): boolean => {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < SPACE_CODE_POINT || code === DELETE_CODE_POINT) {
      return true;
    }
  }
  return false;
};

// "owner/repo", "workspace/slug" or GitLab's "group/subgroup/project"
export const isValidRepo = (value: string): boolean => {
  const segments = value.split("/");
  return (
    segments.length >= 2 &&
    segments.length <= MAX_REPO_SEGMENTS &&
    segments.every(
      (segment) =>
        REPO_SEGMENT_RE.test(segment) &&
        segment.length <= MAX_REPO_SEGMENT_LENGTH &&
        segment !== "." &&
        segment !== ".."
    )
  );
};

export const isValidPath = (value: string): boolean => {
  // An empty path addresses the repository root.
  if (value === "") {
    return true;
  }

  if (value.length > MAX_PATH_LENGTH || hasControlCharacter(value)) {
    return false;
  }

  // A leading slash would escape the API's path prefix.
  if (value.startsWith("/")) {
    return false;
  }

  // Reject traversal segments only. A filename such as "notes..md" is legal, so
  // this inspects each segment rather than searching for ".." as a substring.
  return value
    .split("/")
    .every((segment) => segment !== "." && segment !== "..");
};

export const isValidRef = (value: string): boolean => {
  // A ref may be a branch, a tag, or a commit SHA; all follow check-ref-format.
  if (value === "" || value.length > MAX_REF_LENGTH) {
    return false;
  }

  if (hasControlCharacter(value)) {
    return false;
  }

  for (const char of value) {
    if (REF_ILLEGAL_CHARS.has(char)) {
      return false;
    }
  }

  if (value.includes("..") || value.includes("@{") || value === "@") {
    return false;
  }

  if (
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.includes("//") ||
    value.endsWith(".")
  ) {
    return false;
  }

  return value
    .split("/")
    .every(
      (segment) => !(segment.startsWith(".") || segment.endsWith(".lock"))
    );
};
