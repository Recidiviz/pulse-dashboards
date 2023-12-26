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
import { MemoryRouter } from "react-router-dom";
import { useQueryParams } from "use-query-params";

import {
  useFeatureVariants,
  useRootStore,
  useUserStore,
} from "../../../components/StoreProvider";
import RootStore from "../../../RootStore";
import TenantStore from "../../../RootStore/TenantStore/TenantStore";
import CoreStore from "../../CoreStore";
import FiltersStore from "../../CoreStore/FiltersStore";
import VitalsStore from "../../CoreStore/VitalsStore";
import { useCoreStore } from "../../CoreStoreProvider";
import PageNavigation from "..";

jest.mock("use-query-params");
jest.mock("../../CoreStoreProvider");
jest.mock("../../../components/StoreProvider");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useLocation: jest.fn().mockReturnValue({
    pathname: "/system",
  }),
}));

let coreStore: CoreStore;
let vitalsStore: VitalsStore;
let filtersStore: FiltersStore;
let tenantStore: TenantStore;
let rootStoreMock: any;
let coreStoreMock: any;

const useFeatureVariantsMock = useFeatureVariants as jest.Mock;
const useRootStoreMock = useRootStore as jest.Mock;
const useCoreStoreMock = useCoreStore as jest.Mock;
const useUserStoreMock = useUserStore as jest.Mock;
const useQueryParamsMock = useQueryParams as jest.Mock;

describe("CoreLayout tests", () => {
  const renderPageNavigation = () => {
    return mount(
      <MemoryRouter>
        <PageNavigation />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
    vitalsStore = coreStore.vitalsStore;
    filtersStore = coreStore.filtersStore;
    tenantStore = coreStore.tenantStore;
    rootStoreMock = {
      userStore: {
        userAllowedNavigation: {
          system: ["page1", "page2", "page3"],
        },
      },
      currentTenantId: "US_ID",
    };

    useRootStoreMock.mockReturnValue(rootStoreMock);
    useFeatureVariantsMock.mockReturnValue({ responsiveRevamp: {} });

    coreStoreMock = {
      page: "page1",
      vitalsStore,
      setSection: jest.fn(),
      setPage: jest.fn(),
      filtersStore,
      tenantStore,
    };
    useCoreStoreMock.mockReturnValue(coreStoreMock);
    useUserStoreMock.mockReturnValue({
      user: {
        name: "Test",
      },
    });
    useQueryParamsMock.mockReturnValue(["query", jest.fn()]);
  });

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("Should render a link for each page option", () => {
    const selector = renderPageNavigation();
    expect(selector.find("Link.PageNavigation__option")).toHaveLength(3);
  });

  it("Add bar above current page", () => {
    coreStoreMock.page = "page1";

    const selector = renderPageNavigation();
    expect(selector.find("Link.PageNavigation__option--selected")).toHaveLength(
      1
    );
  });

  it("Don't add bars above any page selectors if not in one", () => {
    coreStoreMock.page = "disabledPage";

    const selector = renderPageNavigation();
    expect(selector.find("Link.PageNavigation__option--selected")).toHaveLength(
      0
    );
  });

  describe("Outliers link", () => {
    it("Hides if not enabled", () => {
      const selector = renderPageNavigation();
      expect(selector.find("OutliersLink>NavLink")).toHaveLength(0);
    });

    it("Shows if enabled", () => {
      rootStoreMock.userStore.userAllowedNavigation.insights = [];
      const selector = renderPageNavigation();
      expect(selector.find("OutliersLink>NavLink")).toHaveLength(1);
    });
  });
});
