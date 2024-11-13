/**
 * Type definition for cursor position displayed in the status bar
 *
 * @interface StatusBarCursorPosition
 * @property {number} line - Current line number of cursor
 * @property {number} column - Current column number of cursor
 * @property {number} [selected] - Optional number of selected characters
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

export type StatusBarCursorPosition = {
  readonly line: number;
  readonly column: number;
  readonly selected?: number;
};
