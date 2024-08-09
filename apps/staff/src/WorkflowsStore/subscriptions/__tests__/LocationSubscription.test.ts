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

import { query, where } from "firebase/firestore";
import { observable, runInAction } from "mobx";
import { Mock } from "vitest";

import { RootStore } from "../../../RootStore";
import { LocationSubscription } from "../LocationSubscription";

vi.mock("firebase/firestore");

const queryMock = query as Mock;
const whereMock = where as Mock;
const collectionMock = vi.fn();

let rootStoreMock: RootStore;
let sub: LocationSubscription;

describe("LocationSubscription tests", () => {
  describe("when activeSystem is SUPERVISION", () => {
    beforeEach(() => {
      vi.resetAllMocks();

      rootStoreMock = observable({
        currentTenantId: "US_ND",
        workflowsStore: {
          caseloadDistrict: "TEST",
          activeSystem: "SUPERVISION",
          searchField: "district",
        },
        firestoreStore: {
          collection: collectionMock,
        },
      }) as unknown as RootStore;
      sub = new LocationSubscription(rootStoreMock);
    });

    test("dataSource reflects observables", () => {
      sub.subscribe();

      // args may be undefined because of incomplete firestore mocking,
      // generally we don't care about that in these tests
      expect(collectionMock).toHaveBeenCalledWith({ key: "locations" });
      expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ND");
      expect(whereMock).toHaveBeenCalledWith("idType", "==", "district");
      expect(queryMock).toHaveBeenCalled();
    });

    test("dataSource reacts to observables", () => {
      sub.subscribe();

      runInAction(() => {
        // @ts-ignore
        rootStoreMock.currentTenantId = "US_TN";
        // @ts-ignore
        rootStoreMock.workflowsStore.searchField = "facilityId";
      });

      expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_TN");
      expect(whereMock).toHaveBeenCalledWith("idType", "==", "facilityId");
    });
  });

  describe("when activeSystem === ALL", () => {
    beforeEach(() => {
      vi.resetAllMocks();

      rootStoreMock = observable({
        currentTenantId: "US_ND",
        workflowsStore: {
          caseloadDistrict: "TEST",
          activeSystem: "ALL",
          searchField: "district",
          locationSearchField: "facilityId",
        },
        firestoreStore: {
          collection: collectionMock,
        },
      }) as unknown as RootStore;
      sub = new LocationSubscription(rootStoreMock);
    });

    test("it selects the locationSearchField from the tenant config", () => {
      sub.subscribe();

      runInAction(() => {
        // @ts-ignore
        rootStoreMock.currentTenantId = "US_ID";
      });

      expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ID");
      expect(whereMock).toHaveBeenCalledWith("idType", "==", "facilityId");
    });
  });
});
