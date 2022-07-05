// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
// =============================================================================a platform for criminal justice reform

import RootStore from "../../../RootStore";
import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from "../../../testUtils";
import CoreStore from "../../CoreStore";
import VitalsStore from "../../CoreStore/VitalsStore";
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
jest.mock("../../CoreStore/VitalsStore", () => {
  return jest.fn().mockImplementation(() => ({
    currentEntitySummary: {
      entityType: "PO",
      entityName: "Fred Flintstone",
      entityId: "fflintstone",
    },
  }));
});

let coreStore: CoreStore;
let vitalsStore: VitalsStore;

describe("VitalsCaseloadButton", () => {
  beforeEach(() => {
    coreStore = new CoreStore(RootStore);
    vitalsStore = coreStore.vitalsStore;
    (useCoreStore as jest.Mock).mockReturnValue({
      vitalsStore,
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
    render(<VitalsCaseloadButton />);

    const caseloadButton = screen.getByRole("button");
    fireEvent.click(caseloadButton);

    // wait for button to be removed, slight delay during navigation
    waitForElementToBeRemoved(screen.queryByRole("button"));
    expect(window.open).toHaveBeenCalledWith(
      "test-case-triage-url?impersonated_email=NvUtb9XrPyt5wAwzJdhM1nD4CB6FNXFY25iZCqMNcC8%3D"
    );
    // reset window location to its original object
    window.open = open;
  });
});
