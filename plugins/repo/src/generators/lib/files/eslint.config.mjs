// @ts-check

import tseslint from "typescript-eslint";

import baseConfig <% if (isReact) { %>, { reactConfig } <% } %> from "../../eslint.config.mjs";

export default tseslint.config(baseConfig, <% if (isReact) { %>reactConfig<% } %>);
