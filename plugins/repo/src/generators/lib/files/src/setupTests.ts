import jestExtendedMatchers from "jest-extended";
<% if(isReact) { %>
import "@testing-library/jest-dom";
import "jest-styled-components";
import { toHaveNoViolations } from "jest-axe";
<% } %>

expect.extend(jestExtendedMatchers);
<% if(isReact) { %>
expect.extend(toHaveNoViolations);
<% } %>
