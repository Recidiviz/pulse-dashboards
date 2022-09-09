// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import { mount } from "enzyme";
import React from "react";
import { Link, StaticRouter } from "react-router-dom";

import PageNavigation from "../PageNavigation";

describe("CoreLayout tests", () => {
  const mockSection = "section";
  const mockPageOptions = ["page1", "page2", "page3"];

  const renderPageNavigation = (currentPage) => {
    return mount(
      <StaticRouter>
        <PageNavigation
          currentPage={currentPage}
          currentSection={mockSection}
          pageOptions={mockPageOptions}
        />
      </StaticRouter>
    );
  };

  it("Should render a link for each page option", () => {
    const selector = renderPageNavigation("page1");

    expect(selector.find(Link)).toHaveLength(3);
  });

  it("Add bar above current page", () => {
    const selector = renderPageNavigation("page1");

    expect(selector.find("Link.PageNavigation--Option-Selected")).toHaveLength(
      1
    );
  });

  it("Don't add bars above any page selectors if not in one", () => {
    const selector = renderPageNavigation("page4");

    expect(selector.find("Link.PageNavigation--Option-Selected")).toHaveLength(
      0
    );
  });
});
