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

import { useRootStore } from "../../../components/StoreProvider";
import RootStore from "../../../RootStore";
import CoreStore from "../../CoreStore";
import FiltersStore from "../../CoreStore/FiltersStore";
import PagePracticesStore from "../../CoreStore/PagePracticesStore";
import { useCoreStore } from "../../CoreStoreProvider";
import PageNavigation from "..";

jest.mock("../../CoreStoreProvider");
jest.mock("../../../components/StoreProvider");
jest.mock("react-router-dom", () => ({
  // @ts-ignore
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn().mockReturnValue({
    pathname: "/community/practices",
  }),
}));
jest.mock("use-query-params", () => ({
  useQueryParams: jest.fn().mockReturnValue(["query", jest.fn()]),
}));

let coreStore: CoreStore;
let pagePracticesStore: PagePracticesStore;
let filtersStore: FiltersStore;

describe("CoreLayout tests", () => {
  let page;

  const renderPageNavigation = () => {
    return mount(
      <StaticRouter>
        <PageNavigation />
      </StaticRouter>
    );
  };

  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
    pagePracticesStore = coreStore.pagePracticesStore;
    filtersStore = coreStore.filtersStore;
    (useRootStore as jest.Mock).mockReturnValue({
      userStore: {
        userAllowedNavigation: {
          community: ["page1", "page2", "page3"],
        },
      },
    });
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("Should render a link for each page option", () => {
    page = "page1";
    (useCoreStore as jest.Mock).mockReturnValue({
      page,
      pagePracticesStore,
      setSection: jest.fn(),
      setPage: jest.fn(),
      filtersStore,
    });

    const selector = renderPageNavigation();
    expect(selector.find(Link)).toHaveLength(3);
  });

  it("Add bar above current page", () => {
    page = "page1";
    (useCoreStore as jest.Mock).mockReturnValue({
      page,
      pagePracticesStore,
      setSection: jest.fn(),
      setPage: jest.fn(),
      filtersStore,
    });

    const selector = renderPageNavigation();
    expect(selector.find("Link.PageNavigation__option--selected")).toHaveLength(
      1
    );
  });

  it("Don't add bars above any page selectors if not in one", () => {
    page = "disabledPage";
    (useCoreStore as jest.Mock).mockReturnValue({
      page,
      pagePracticesStore,
      setSection: jest.fn(),
      setPage: jest.fn(),
      filtersStore,
    });

    const selector = renderPageNavigation();
    expect(selector.find("Link.PageNavigation__option--selected")).toHaveLength(
      0
    );
  });
});
