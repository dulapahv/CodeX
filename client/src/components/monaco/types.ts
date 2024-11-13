/**
 * This file contains the types for the cursor position in the status bar.
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)..
 */

export type StatusBarCursorPosition = {
  readonly line: number;
  readonly column: number;
  readonly selected?: number;
};
