// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { and, or, query, where } from "firebase/firestore";
import { observable, runInAction } from "mobx";
import { Mock } from "vitest";

import {
  IncarcerationStaffRecord,
  incarcerationStaffRecordSchema,
  SupervisionStaffRecord,
  supervisionStaffRecordSchema,
} from "~datatypes";

import { CombinedUserRecord } from "../../../FirestoreStore";
import { RootStore } from "../../../RootStore";
import { filterByUserDistrict } from "../../utils";
import { StaffSubscription } from "../StaffSubscription";

vi.mock("firebase/firestore");

const queryMock = query as Mock;
const whereMock = where as Mock;
const andMock = and as Mock;
const orMock = or as Mock;
const collectionMock = vi.fn();
const withConverterMock = vi.fn();

let rootStoreMock: RootStore;
let sub:
  | StaffSubscription<SupervisionStaffRecord["output"]>
  | StaffSubscription<IncarcerationStaffRecord["output"]>;

describe("StaffSubscription tests", () => {
  beforeEach(() => {
    queryMock.mockReturnValue({ withConverter: withConverterMock });
  });

  describe("collections", () => {
    beforeEach(() => {
      rootStoreMock = observable({
        currentTenantId: "US_ND",
        workflowsStore: {
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
          db: vi.fn(),
          collection: collectionMock,
        },
        userStore: {
          activeFeatureVariants: {},
        },
      }) as unknown as RootStore;
    });
    test("dataSource uses incarcerationStaff collection ID", () => {
      sub = new StaffSubscription(
        rootStoreMock,
        {
          key: "incarcerationStaff",
        },
        incarcerationStaffRecordSchema,
      );

      sub.subscribe();

      expect(collectionMock).toHaveBeenCalledWith({
        key: "incarcerationStaff",
      });
    });

    test("dataSource uses supervisionStaff collection ID", () => {
      sub = new StaffSubscription(
        rootStoreMock,
        {
          key: "supervisionStaff",
        },
        supervisionStaffRecordSchema,
      );

      sub.subscribe();

      expect(collectionMock).toHaveBeenCalledWith({ key: "supervisionStaff" });
    });
  });

  describe("StaffSubscription tests", () => {
    beforeEach(() => {
      rootStoreMock = observable({
        currentTenantId: "US_ND",
        workflowsStore: {
          caseloadDistricts: ["TEST"],
          activeSystem: "SUPERVISION",
          workflowsSupportedSystems: ["SUPERVISION"],
          user: {
            info: {
              district: "TEST_USER_DISTRICT",
              id: "2222",
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
      sub = new StaffSubscription(
        rootStoreMock,
        {
          key: "supervisionStaff",
        },
        supervisionStaffRecordSchema,
      );
    });

    test("dataSource reflects observables", () => {
      sub.subscribe();

      expect(collectionMock).toHaveBeenCalledWith({ key: "supervisionStaff" });
      expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ND");
      expect(whereMock).toHaveBeenCalledWith("district", "in", [
        "TEST_DISTRICT",
      ]);
      expect(queryMock).toHaveBeenCalled();
    });

    test("datasource filters by district when a filter is defined", () => {
      runInAction(() => {
        // @ts-ignore
        rootStoreMock.tenantStore.workflowsStaffFilterFn = filterByUserDistrict;
      });

      sub.subscribe();

      expect(whereMock).toHaveBeenCalledWith("district", "in", [
        "TEST_USER_DISTRICT",
      ]);
    });

    test("dataSource omits district filter when it's undefined", () => {
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

    test("dataSource filters by state code and district", () => {
      sub.subscribe();

      runInAction(() => {
        // @ts-ignore
        rootStoreMock.currentTenantId = "US_TN";
        // @ts-ignore
        rootStoreMock.tenantStore.workflowsStaffFilterFn = (
          user: CombinedUserRecord,
        ) => ({
          filterField: "district",
          filterValues: ["DISTRICT1", "DISTRICT2"],
        });
      });

      expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_TN");
      expect(whereMock).toHaveBeenCalledWith("district", "in", [
        "DISTRICT1",
        "DISTRICT2",
      ]);
      expect(whereMock).not.toHaveBeenCalledWith(
        "supervisorExternalId",
        "==",
        "2222",
      );
      expect(whereMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalled();

      expect(orMock).not.toHaveBeenCalled();
    });

    test("dataSource filters by state code and supervisor external id for users with workflowsSupervisorSearch feature variant", () => {
      sub.subscribe();

      runInAction(() => {
        // @ts-ignore
        rootStoreMock.currentTenantId = "US_TN";
        // @ts-ignore
        rootStoreMock.tenantStore.workflowsStaffFilterFn = (
          user: CombinedUserRecord,
        ) => ({
          filterField: "district",
          filterValues: ["DISTRICT1", "DISTRICT2"],
        });
        // @ts-ignore
        rootStoreMock.userStore.activeFeatureVariants = {
          workflowsSupervisorSearch: {},
        };
      });

      expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_TN");
      expect(whereMock).toHaveBeenCalledWith(
        "supervisorExternalId",
        "==",
        "2222",
      );
      expect(queryMock).toHaveBeenCalled();
      expect(orMock).toHaveBeenCalled();
      expect(andMock).toHaveBeenCalled();
    });

    test("FirestoreConverter inserts inferred properties when reading snapshot", () => {
      const mockRecord = {
        foo: "bar",
      };
      const mockDocumentSnapshot = {
        id: "test123",
        data: () => mockRecord,
      };

      sub.subscribe();

      const converter = withConverterMock.mock.calls[0][0];
      expect(converter.fromFirestore(mockDocumentSnapshot)).toEqual({
        foo: "bar",
        recordId: "test123",
      });
    });
  });
});
