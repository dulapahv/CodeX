/**
 * Jest test configuration.
 * Features:
 * - TypeScript support
 * - Test environment setup
 * - Reporter configuration
 * - Mock handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  // Tests run in Node; src/ is compiled for the Workers runtime instead
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tests/tsconfig.json" }],
    // nanoid ships only ESM, but y-partyserver's CommonJS build requires it
    "nanoid[/\\\\].+\\.js$": [
      "ts-jest",
      { tsconfig: { allowJs: true, module: "commonjs" } },
    ],
  },
  transformIgnorePatterns: ["node_modules[/\\\\](?!(\\.pnpm[/\\\\])?nanoid)"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["./jest.setup.ts"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  detectOpenHandles: true,
  testTimeout: 300_000,
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./test-results",
        outputName: "junit.xml",
        ancestorSeparator: " › ",
        uniqueOutputName: false,
        suiteNameTemplate: "{filepath}",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
      },
    ],
  ],
};

export default config;
