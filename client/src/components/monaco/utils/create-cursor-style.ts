/**
 * Utility function to create a CSS style for a cursor, cursor selection, and
 * cursor name.
 *
 * Created by Dulapah Vibulsanti (https://github.com/dulapahv).
 */

/**
 * Create a CSS style for a cursor, cursor selection, and cursor name.
 * @param userID User identifier.
 * @param bgColor Background color.
 * @param color Text color.
 * @param name User name.
 * @param isFirstLine Is the cursor on the first line.
 * @param hasSelection Has selection.
 * @returns CSS style string.
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
  .cursor-${userID}::after {
    content: "${name.replace(/"/g, '\\"')}";
    background-color: ${bgColor};
    color: ${color};
    position: absolute;
    font-weight: bold;
    top: ${isFirstLine ? "19px" : "-19px"};
    height: 19px;
    font-size: 12px;
    padding: 0 4px;
    ${isFirstLine ? "border-radius: 0px 3px 3px 3px;" : "border-radius: 3px 3px 3px 0px;"}
    white-space: nowrap;
    z-index: 100;
    ${
      !hasSelection
        ? `
    animation: cursorFadeOut 0.2s ease-in forwards;
    animation-delay: 2.7s;`
        : ""
    }
  }
  .cursor-${userID}-selection {
    background-color: ${bgColor};
    opacity: 0.5;
    min-width: 4px;
  }`;
