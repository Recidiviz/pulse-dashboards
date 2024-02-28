module.exports = {
  "**/*.{ts,tsx}": [
    (files) => `nx affected --target=typecheck --files=${files.join(",")}`,
    (files) => `nx affected:lint --files=${files.join(",")} --fix`,
    (files) => `nx format:write --files=${files.join(",")}`,
  ],
  "**/*.{js,jsx,mjs}": [
    (files) => `nx affected:lint --files=${files.join(",")} --fix`,
    (files) => `nx format:write --files=${files.join(",")}`,
  ],
  "**/*.{json,md,yml,yaml,html,scss}": [
    (files) => `nx format:write --files=${files.join(",")}`,
  ],
};
