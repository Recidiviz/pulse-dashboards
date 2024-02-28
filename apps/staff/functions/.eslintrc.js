module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ["../.eslintrc.json"],
  parser: "@typescript-eslint/parser",
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: ["@typescript-eslint", "import"],
};
