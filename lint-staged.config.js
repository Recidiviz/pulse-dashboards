module.exports = {
  "**/*.{ts,tsx}": [
    (files) => `nx affected --target=typecheck --files=${files.join(",")}`,
    (files) => `nx affected:lint --files=${files.join(",")} --fix`,
    (files) => `nx format:write --files=${files.join(",")}`,
  ],
  "**/*.{js,jsx}": [
    (files) => `nx affected:lint --files=${files.join(",")} --fix`,
    (files) => `nx format:write --files=${files.join(",")}`,
  ],
  "**/*.json": [(files) => `nx format:write --files=${files.join(",")}`],
};
