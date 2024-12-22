/**
 * Creates CSS styles for a user's cursor in the collaborative editor.
 * Generates cursor highlight and nametag styles with fade-out animation.
 *
 * @param userID - Unique identifier for the user's cursor
 * @param bgColor - Background color for cursor and nametag
 * @param color - Text color for the nametag
 * @param name - Display name to show in the nametag
 * @param isFirstLine - Whether cursor is on first line to adjust
 *                      nametag position
 * @param hasSelection - Whether user has text selected to control
 *                      fade animation
 *
 * @returns CSS string for cursor styles
 *
 * @example
 * ```ts
 * const cursorStyle = createCursorStyle(
 *   "user123",
 *   "#ff0000",
 *   "#ffffff",
 *   "John",
 *   false,
 *   true
 * );
 * ```
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

export const createCursorStyle = (
  userID: string,
  bgColor: string,
  color: string,
  name: string,
  isFirstLine: boolean = false,
  hasSelection: boolean = false,
): string => `
  .cursor-${userID} {
    background-color: ${bgColor} !important;
    width: 2px !important;
  }
  .cursor-${userID}::before {
    content: "";
    position: absolute;
    ${isFirstLine ? 'top: 25px;' : 'top: 0px;'}
    left: 0px;
    width: 6px;
    height: 6px;
    background-color: ${bgColor};
    transform: translateY(-100%);
  }
  .cursor-${userID}::after {
    content: "${name.replace(/"/g, '\\"')}";
    background-color: ${bgColor};
    color: ${color};
    position: absolute;
    font-weight: bold;
    ${isFirstLine ? 'top: 19px;' : 'top: -19px;'}
    height: 19px;
    font-size: 12px;
    padding: 0 4px;
    ${isFirstLine ? 'border-radius: 0px 3px 3px 3px;' : 'border-radius: 3px 3px 3px 0px;'}
    white-space: nowrap;
    z-index: 100;
    ${
      !hasSelection
        ? `
    animation: cursorLabelFadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    animation-delay: 2.7s;`
        : ''
    }
  }
  .cursor-${userID}-selection {
    background-color: ${bgColor};
    opacity: 0.4;
    min-width: 4px;
  }`;
