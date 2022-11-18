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

import { ClientRecord } from "../../../firestore";
import { WorkflowsStore } from "../../WorkflowsStore";
import { CaseloadSubscription } from "../CaseloadSubscription";

jest.mock("firebase/firestore");

const queryMock = query as jest.Mock;
const whereMock = where as jest.Mock;
const collectionMock = collection as jest.Mock;
const withConverterMock = jest.fn();

let workflowsStoreMock: WorkflowsStore;
let sub: CaseloadSubscription<ClientRecord>;

beforeEach(() => {
  jest.resetAllMocks();

  queryMock.mockReturnValue({ withConverter: withConverterMock });

  workflowsStoreMock = observable({
    selectedOfficerIds: ["TEST1"],
    rootStore: { currentTenantId: "US_ND" },
  }) as WorkflowsStore;
  sub = new CaseloadSubscription<ClientRecord>(
    workflowsStoreMock,
    "clients",
    "CLIENT"
  );
});

test("dataSource reflects observables", () => {
  sub.subscribe();

  // args may be undefined because of incomplete firestore mocking,
  // generally we don't care about that in these tests
  expect(collectionMock).toHaveBeenCalledWith(undefined, "clients");
  expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_ND");
  expect(whereMock).toHaveBeenCalledWith("officerId", "in", ["TEST1"]);
  expect(queryMock).toHaveBeenCalled();
});

test("dataSource is undefined if no officers are selected", () => {
  runInAction(() => {
    // @ts-ignore
    workflowsStoreMock.selectedOfficerIds = [];
  });

  sub.subscribe();

  expect(sub.dataSource).toBeUndefined();
  expect(collectionMock).not.toHaveBeenCalled();
  expect(whereMock).not.toHaveBeenCalled();
  expect(queryMock).not.toHaveBeenCalled();
});

test("dataSource reacts to observables", () => {
  sub.subscribe();

  runInAction(() => {
    // @ts-ignore
    workflowsStoreMock.rootStore.currentTenantId = "US_TN";
    // @ts-ignore
    workflowsStoreMock.selectedOfficerIds = ["TEST1", "TEST2"];
  });

  expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_TN");
  expect(whereMock).toHaveBeenCalledWith("officerId", "in", ["TEST1", "TEST2"]);
});

test("dataSource can be unset and reset", () => {
  sub.subscribe();

  runInAction(() => {
    // @ts-ignore
    workflowsStoreMock.selectedOfficerIds = [];
  });

  expect(sub.dataSource).toBeUndefined();

  runInAction(() => {
    // @ts-ignore
    workflowsStoreMock.rootStore.currentTenantId = "US_TN";
    // @ts-ignore
    workflowsStoreMock.selectedOfficerIds = ["TEST1", "TEST2"];
  });

  expect(whereMock).toHaveBeenCalledWith("stateCode", "==", "US_TN");
  expect(whereMock).toHaveBeenCalledWith("officerId", "in", ["TEST1", "TEST2"]);
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
    personType: "CLIENT",
  });
});
