module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // `zod` v4's `external.js` re-exports with `export * as core from "..."` — syntax
  // `@react-native/babel-preset` doesn't transform on its own, which fails the whole Metro bundle
  // (not just the call site) since `zod` sits in the require graph from app launch (auth
  // forms use it for validation). Not New Architecture/Gradle-related, unlike ANDROID_TROUBLESHOOTING.md.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
