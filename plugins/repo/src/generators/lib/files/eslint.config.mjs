// @ts-check

import tseslint from "typescript-eslint";

import baseConfig, { 
    designSystemRestrictedImports,
    <% if (isReact) { %> reactConfig, <% } %>
} from "<%- pathToRoot %>eslint.config.mjs";

export default tseslint.config(baseConfig, <% if (isReact) { %>reactConfig, <% } %>{
  files: ["**/*.*js", "**/*.*jsx", "**/*.*ts", "**/*.*tsx"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          <% if (isReact) { %> {
            name: "react-router-dom",
            importNames: ["useParams"],
            message:
              "Please import useTypedParams from react-router-typesafe-routes/dom instead",
          }, <% } %>
          designSystemRestrictedImports,
        ],
      },
    ],
  },
});
