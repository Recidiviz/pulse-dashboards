// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { render } from "@testing-library/react";
import { format } from "prettier";
import { MemoryRouter } from "react-router-dom";

import { TableOfContents } from "./TableOfContents";

const testBody = `here is an intro paragraph 

## This is a heading

first subsection content 

## Another heading here

second subsection contents
`;

test("generates links to headings in page body", async () => {
  const { container } = render(
    <MemoryRouter initialEntries={["/path/to/some/page"]}>
      <TableOfContents body={testBody} />
    </MemoryRouter>,
  );

  // what we want to test is that it generated the correct links;
  // wrapper markup contains styled-components generated code that may cause test flakiness
  const links = container.querySelector("ol");

  expect(await format(links?.outerHTML ?? "", { parser: "html" }))
    .toMatchInlineSnapshot(`
    "<ol>
      <li><a href="/path/to/some/page#this-is-a-heading">This is a heading</a></li>
      <li>
        <a href="/path/to/some/page#another-heading-here">Another heading here</a>
      </li>
    </ol>
    "
  `);
});
