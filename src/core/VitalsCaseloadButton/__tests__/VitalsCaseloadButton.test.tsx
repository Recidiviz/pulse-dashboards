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

import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import React from "react";

import RootStore from "../../../RootStore";
import CoreStore from "../../CoreStore";
import PageVitalsStore from "../../CoreStore/PageVitalsStore";
import { useCoreStore } from "../../CoreStoreProvider";
import VitalsCaseloadButton from "..";

jest.mock("../../CoreStoreProvider");
jest.mock("../../../RootStore/TenantStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentTenantId: "US_ID",
    domain: "bedrock.gov",
    enableVitalsCaseloadButton: true,
  }));
});
jest.mock("../../CoreStore/PageVitalsStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentEntitySummary: {
      entityType: "PO",
      entityName: "Fred Flintstone",
      entityId: "fflintstone",
    },
  }));
});

let coreStore: CoreStore;
let pageVitalsStore: PageVitalsStore;

describe("VitalsCaseloadButton", () => {
  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
    pageVitalsStore = coreStore.pageVitalsStore;
    (useCoreStore as jest.Mock).mockReturnValue({
      pageVitalsStore,
      tenantStore: coreStore.tenantStore,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("Case Triage read only URL", async () => {
    // delete and re-create the window location object for this test
    const { location } = window;
    // @ts-ignore
    delete window.location;
    window.location = { ...window.location, href: "original-url" };

    render(<VitalsCaseloadButton />);

    const caseloadButton = screen.getByRole("button");
    fireEvent.click(caseloadButton);

    // wait for button to be removed, slight delay during navigation
    waitForElementToBeRemoved(screen.queryByRole("button"));
    expect(window.location.href).toEqual(
      "test-case-triage-url?impersonated_email=fflintstone%40bedrock.gov"
    );
    // reset window location to its original object
    window.location = location;
  });
});
