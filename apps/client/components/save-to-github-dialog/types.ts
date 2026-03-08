/**
 * Type definitions for GitHub commit form data.
 * Includes:
 * - File name field
 * - Commit message field
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export interface CommitForm {
  commitSummary: string;
  fileName: string;
}
