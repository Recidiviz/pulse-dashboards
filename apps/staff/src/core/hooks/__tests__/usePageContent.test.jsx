/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2021 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */
import { renderHook } from "@testing-library/react";
import { runInAction } from "mobx";

import StoreProvider from "../../../components/StoreProvider";
import RootStore from "../../../RootStore";
import CoreStore from "../../CoreStore";
import usePageContent from "../usePageContent";

vi.mock("../../content/page/default");
vi.mock("../../content/page/us_id");

const testPageContent = (pageId, expectedTitle, expectedSummary) => {
  const wrapper = ({ children }) => <StoreProvider>{children}</StoreProvider>;
  const {
    result: {
      current: { title, summary },
    },
  } = renderHook(() => usePageContent(pageId), { wrapper });
  expect(title).toBe(expectedTitle);
  expect(summary).toBe(expectedSummary);
};

const setTestTenant = (tenantId) => {
  const rootStore = new CoreStore(RootStore);
  runInAction(() => {
    rootStore.tenantStore.currentTenantId = tenantId;
  });
};

describe("Tests for usePageContent()", () => {
  it("uses the default prison copy.", () => {
    testPageContent("prison", "Prison", "Default prison summary");
  });

  it("uses the default supervision to liberty copy.", () => {
    testPageContent(
      "supervisionToLiberty",
      "Supervision to Liberty",
      "Default supervision to liberty summary",
    );
  });

  it("uses state-specific overrides when present", () => {
    setTestTenant("US_ID");
    testPageContent("prison", "Prison", "ID-specific prison summary");
  });

  it("falls back to defaults if page not in state-specific file", () => {
    setTestTenant("US_ID");
    testPageContent(
      "supervisionToLiberty",
      "Supervision to Liberty",
      "Default supervision to liberty summary",
    );
  });
});
