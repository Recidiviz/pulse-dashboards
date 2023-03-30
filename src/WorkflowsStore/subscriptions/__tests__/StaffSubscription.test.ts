// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { collection, query, where } from "firebase/firestore";
import { observable, runInAction } from "mobx";

import { RootStore } from "../../../RootStore";
import { StaffSubscription } from "../StaffSubscription";

jest.mock("firebase/firestore");

const queryMock = query as jest.Mock;
const whereMock = where as jest.Mock;
const collectionMock = collection as jest.Mock;

let rootStoreMock: RootStore;
let sub: StaffSubscription;

describe("StaffSubscription tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    rootStoreMock = observable({
      currentTenantId: "US_ND",
      workflowsStore: {
        caseloadDistrict: "TEST",
        activeSystem: "SUPERVISION",
        workflowsSupportedSystems: ["SUPERVISION"],
      },
      firestoreStore: {
        db: jest.fn(),
      },
    }) as unknown as RootStore;
    sub = new StaffSubscription(rootStoreMock);
  });

  test("dataSource reflects observables", () => {
    sub.subscribe();

    // args may be undefined because of incomplete firestore mocking,
    // generally we don't care about that in these tests
    expect(collectionMock).toHaveBeenCalledWith(
      rootStoreMock.firestoreStore.db,
      "staff"
    );
    expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ND");
    expect(whereMock).toHaveBeenCalledWith("hasCaseload", "==", true);
    expect(whereMock).toHaveBeenCalledWith("district", "==", "TEST");
    expect(queryMock).toHaveBeenCalled();
  });

  test("dataSource omits district filter", () => {
    runInAction(() => {
      // @ts-ignore
      rootStoreMock.workflowsStore.caseloadDistrict = undefined;
    });

    sub.subscribe();

    expect(whereMock).not.toHaveBeenCalledWith(
      "district",
      "==",
      expect.anything()
    );
  });

  test("dataSource reacts to observables", () => {
    sub.subscribe();

    runInAction(() => {
      // @ts-ignore
      rootStoreMock.currentTenantId = "US_TN";
      // @ts-ignore
      rootStoreMock.workflowsStore.caseloadDistrict = "TEST2";
    });

    expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_TN");
    expect(whereMock).toHaveBeenCalledWith("district", "==", "TEST2");
  });

  test("dataSource officer filter respects activeSystem", () => {
    runInAction(() => {
      // @ts-ignore
      rootStoreMock.workflowsStore.activeSystem = "INCARCERATION";
    });

    sub.subscribe();

    expect(whereMock).toHaveBeenCalledWith("hasFacilityCaseload", "==", true);
    expect(whereMock).not.toHaveBeenCalledWith(
      "hasCaseload",
      "==",
      expect.anything()
    );
  });

  test("dataSource does not filter officer for multiple supported systems", () => {
    runInAction(() => {
      // @ts-ignore
      rootStoreMock.workflowsStore.workflowsSupportedSystems = [
        "SUPERVISION",
        "INCARCERATION",
      ];
    });

    sub.subscribe();

    expect(whereMock).not.toHaveBeenCalledWith(
      "hasFacilityCaseload",
      "==",
      expect.anything()
    );
    expect(whereMock).not.toHaveBeenCalledWith(
      "hasCaseload",
      "==",
      expect.anything()
    );
  });
});
