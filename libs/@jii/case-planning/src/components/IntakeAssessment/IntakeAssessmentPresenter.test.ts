// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { UserStore } from "~@jii/data";
import { ResidentRecord } from "~datatypes";
import { FirebaseAuthClient } from "~firebase-auth";

import { IntakeAssessmentPresenter } from "./IntakeAssessmentPresenter";

let mockFirebaseAuthClient: FirebaseAuthClient;
let mockUserStore: UserStore;
let mockResident: ResidentRecord;

beforeEach(() => {
  window.sessionStorage.clear();

  mockFirebaseAuthClient = {
    getIdToken: vi.fn().mockResolvedValue("mock-firebase-token"),
  } as unknown as FirebaseAuthClient;

  mockUserStore = {
    hasPermission: vi.fn().mockReturnValue(false),
  } as unknown as UserStore;

  mockResident = {
    pseudonymizedId: "mock-resident-id",
  } as ResidentRecord;
});

test("no token", () => {
  const presenter = new IntakeAssessmentPresenter(
    mockFirebaseAuthClient,
    mockUserStore,
    mockResident,
  );

  expect(presenter.isAuthorized).toBeFalse();
});

test("with token", () => {
  window.sessionStorage.setItem("intake_token", "foobar");

  const presenter = new IntakeAssessmentPresenter(
    mockFirebaseAuthClient,
    mockUserStore,
    mockResident,
  );

  expect(presenter.isAuthorized).toBeTrue();
});

test("a new token appears", () => {
  const presenter = new IntakeAssessmentPresenter(
    mockFirebaseAuthClient,
    mockUserStore,
    mockResident,
  );

  expect(presenter.isAuthorized).toBeFalse();

  window.sessionStorage.setItem("intake_token", "foobar");

  presenter.updateAuthToken();

  expect(presenter.isAuthorized).toBeTrue();
});
