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
  clearMocks: true,
  detectOpenHandles: true,
  forceExit: true,
  reporters: [
    "default",
    [
      "jest-junit",
      {
        ancestorSeparator: " › ",
        classNameTemplate: "{classname}",
        outputDirectory: "./test-results",
        outputName: "junit.xml",
        suiteNameTemplate: "{filepath}",
        titleTemplate: "{title}",
        uniqueOutputName: false,
      },
    ],
  ],
  resetMocks: true,
  restoreMocks: true,
  setupFiles: ["./jest.setup.ts"],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  testTimeout: 300_000,
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
  verbose: true,
};

export default config;
