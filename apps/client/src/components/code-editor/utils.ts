/**
 * Create a style for a cursor
 * @param userID
 * @param bgColor
 * @param color
 * @param name
 * @param isFirstLine
 * @param hasSelection
 * @returns
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
    z-index: 100;
  }
  .cursor-${userID}::after {
    content: "${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";
    background-color: ${bgColor};
    color: ${color};
    font-family: var(--font-geist-sans);
    position: absolute;
    font-weight: 500;
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
