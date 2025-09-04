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
          // Need to include these again because eslint doesn't deep merge rules
          {
            name: "styled-components",
            message: "Please import from styled-components/macro.",
          },
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

