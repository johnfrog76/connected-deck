/**
 * Jest config for the deck engine's host-contract tests.
 *
 * Scoped deliberately narrow. These tests exist to pin the rules that are easy
 * to break by accident and invisible when broken: the narration/voice-coverage
 * rules (voiceCoverage + useVoiceControls) and the DeckPlayer/PresenterNotes
 * seams (mode ownership — presenter never grows voice controls, audience never
 * grows a notes surface — and which narration source each host reads from).
 *
 * They are not a general UI suite. The component tests stub the environment
 * seams (BroadcastChannel, Audio, fetch) and mock the deck registry; anything
 * needing real media or real windows is out of scope for this runner.
 *
 * jsdom (not node) because useVoiceControls is a React hook rendered via
 * @testing-library/react. ts-jest compiles the TSX/TS sources directly, so
 * there's no build step between source and test.
 */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          // The app targets bundler resolution; tests just need it to compile.
          module: "commonjs",
          moduleResolution: "node",
        },
      },
    ],
  },
};
