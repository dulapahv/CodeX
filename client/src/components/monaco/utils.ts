export const createSafeClassName = (name: string): string =>
  `cursor-${name.replace(/[^a-zA-Z0-9]/g, "-")}`;

export const createCursorStyle = (
  className: string,
  color: string,
  name: string,
  isFirstLine: boolean = false,
): string => `
  .${className} {
    background-color: ${color} !important;
    width: 2px !important;
  }
  .${className}::after {
    content: "${name.replace(/"/g, '\\"')}";
    background-color: ${color};
    position: absolute;
    top: ${isFirstLine ? "18px" : "-18px"};
    left: 4px;
    font-size: 12px;
    padding: 0 4px;
    border-radius: 3px;
    white-space: nowrap;
    color: white;
    z-index: 100;
    animation: cursorFadeOut 0.2s ease-in forwards;
    animation-delay: 2.7s;
  }`;
