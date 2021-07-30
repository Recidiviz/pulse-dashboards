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
import PagePracticesStore from "../../CoreStore/PagePracticesStore";
import { useCoreStore } from "../../CoreStoreProvider";
import PracticesCaseloadButton from "..";

jest.mock("../../CoreStoreProvider");
jest.mock("../../../RootStore/TenantStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentTenantId: "US_ID",
    domain: "bedrock.gov",
    enablePracticesCaseloadButton: true,
  }));
});
jest.mock("../../CoreStore/PagePracticesStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentEntitySummary: {
      entityType: "PO",
      entityName: "Fred Flintstone",
      entityId: "fflintstone",
    },
  }));
});

let coreStore: CoreStore;
let pagePracticesStore: PagePracticesStore;

describe("PracticesCaseloadButton", () => {
  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
    pagePracticesStore = coreStore.pagePracticesStore;
    (useCoreStore as jest.Mock).mockReturnValue({
      pagePracticesStore,
      tenantStore: coreStore.tenantStore,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("Case Triage read only URL", async () => {
    // delete and re-create the window location object for this test
    const { open } = window;
    // @ts-ignore
    delete window.open;

    window.open = jest.fn();
    render(<PracticesCaseloadButton />);

    const caseloadButton = screen.getByRole("button");
    fireEvent.click(caseloadButton);

    // wait for button to be removed, slight delay during navigation
    waitForElementToBeRemoved(screen.queryByRole("button"));
    expect(window.open).toHaveBeenCalledWith(
      "test-case-triage-url?impersonated_email=fflintstone%40bedrock.gov"
    );
    // reset window location to its original object
    window.open = open;
  });
});
