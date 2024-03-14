/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
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
 */

import { query, where } from "firebase/firestore";
import { observable, runInAction } from "mobx";
import { Mock } from "vitest";

import { CombinedUserRecord } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { filterByUserDistrict } from "../../utils";
import { StaffSubscription } from "../StaffSubscription";

vi.mock("firebase/firestore");

const queryMock = query as Mock;
const whereMock = where as Mock;
const collectionMock = vi.fn();

let rootStoreMock: RootStore;
let sub: StaffSubscription;

describe("StaffSubscription tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    rootStoreMock = observable({
      currentTenantId: "US_ND",
      workflowsStore: {
        caseloadDistricts: ["TEST"],
        activeSystem: "SUPERVISION",
        workflowsSupportedSystems: ["SUPERVISION"],
        user: {
          info: {
            district: "TEST_USER_DISTRICT",
          },
        },
      },
      tenantStore: {
        workflowsStaffFilterFn: (user: CombinedUserRecord) => ({
          filterField: "district",
          filterValues: ["TEST_DISTRICT"],
        }),
      },
      firestoreStore: {
        collection: collectionMock,
      },
      userStore: {
        activeFeatureVariants: {},
      },
    }) as unknown as RootStore;
    sub = new StaffSubscription(rootStoreMock);
  });

  test("dataSource reflects observables", () => {
    sub.subscribe();

    // args may be undefined because of incomplete firestore mocking,
    // generally we don't care about that in these tests
    expect(collectionMock).toHaveBeenCalledWith({ key: "staff" });
    expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ND");
    expect(whereMock).toHaveBeenCalledWith("hasCaseload", "==", true);
    expect(whereMock).toHaveBeenCalledWith("district", "in", ["TEST_DISTRICT"]);
    expect(queryMock).toHaveBeenCalled();
  });

  test("datasource filters by district", () => {
    runInAction(() => {
      // @ts-ignore
      rootStoreMock.tenantStore.workflowsStaffFilterFn = filterByUserDistrict;
    });

    sub.subscribe();

    expect(whereMock).toHaveBeenCalledWith("district", "in", [
      "TEST_USER_DISTRICT",
    ]);
  });

  test("dataSource omits district filter", () => {
    runInAction(() => {
      // @ts-ignore
      rootStoreMock.tenantStore.workflowsStaffFilterFn = (
        user: CombinedUserRecord,
      ) => undefined;
    });

    sub.subscribe();

    expect(whereMock).not.toHaveBeenCalledWith(
      "district",
      "==",
      expect.anything(),
    );
  });

  test("dataSource reacts to observables", () => {
    sub.subscribe();

    runInAction(() => {
      // @ts-ignore
      rootStoreMock.currentTenantId = "US_TN";
      // @ts-ignore
      rootStoreMock.tenantStore.workflowsStaffFilterFn = (
        user: CombinedUserRecord,
      ) => ({
        filterField: "district",
        filterValues: ["TEST2", "TEST3"],
      });
    });

    expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_TN");
    expect(whereMock).toHaveBeenCalledWith("district", "in", [
      "TEST2",
      "TEST3",
    ]);
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
      expect.anything(),
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
      expect.anything(),
    );
    expect(whereMock).not.toHaveBeenCalledWith(
      "hasCaseload",
      "==",
      expect.anything(),
    );
  });
});
