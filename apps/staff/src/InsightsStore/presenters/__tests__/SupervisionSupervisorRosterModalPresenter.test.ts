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

import { configure } from "mobx";
import { vi } from "vitest";

import {
  InsightsConfigFixture,
  rawRosterChangeRequestFixtures,
  rosterChangeRequestFixtures,
  rosterChangeRequestResponseFixture,
  supervisionOfficerFixture,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";
import { unpackAggregatedErrors } from "~hydration-utils";

import { RootStore } from "../../../RootStore";
import UserStore from "../../../RootStore/UserStore";
import { InsightsStore } from "../../InsightsStore";
import { InsightsSupervisionStore } from "../../stores/InsightsSupervisionStore";
import { SupervisionSupervisorRosterModalPresenter } from "../SupervisionSupervisorRosterModalPresenter";

const testSupervisor = supervisionOfficerSupervisorsFixture[0];

let store: InsightsSupervisionStore;
let presenter: SupervisionSupervisorRosterModalPresenter;

beforeEach(() => {
  configure({ safeDescriptors: false });

  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockReturnValue(
    testSupervisor.pseudonymizedId,
  );

  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => false,
  );

  vi.spyOn(UserStore.prototype, "stateCode", "get").mockImplementation(
    () => "US_TN",
  );

  store = new InsightsSupervisionStore(
    new InsightsStore(new RootStore()),
    InsightsConfigFixture,
  );

  vi.spyOn(store, "userCanSubmitRosterChangeRequest", "get").mockReturnValue(
    true,
  );

  presenter = new SupervisionSupervisorRosterModalPresenter(
    store,
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  configure({ safeDescriptors: true });
});

test("initial hydration state is 'needs hydration'", async () => {
  expect(presenter.hydrationState.status).toBe("needs hydration");
});

test("expected data when presenter is 'hydrated'", async () => {
  await presenter.hydrate();

  expect(presenter.allOfficers).toContainValues(supervisionOfficerFixture);
});

test("trackViewed sends analytics event", () => {
  const trackInsightsRosterModalViewedSpy = vi.spyOn(
    store.insightsStore.rootStore.analyticsStore,
    "trackInsightsRosterModalViewed",
  );

  presenter.trackViewed();

  expect(trackInsightsRosterModalViewedSpy.mock.calls[0][0])
    .toMatchInlineSnapshot(`
      {
        "supervisorPseudonymizedId": "hashed-agonzalez123",
        "viewedBy": "hashed-agonzalez123",
      }
    `);
});

test("trackInsightsRosterChangeRequestFormSubmitted sends analytics event", () => {
  const trackInsightsRosterChangeRequestFormSubmittedSpy = vi.spyOn(
    store.insightsStore.rootStore.analyticsStore,
    "trackInsightsRosterChangeRequestFormSubmitted",
  );

  const pseudoId = Object.keys(rawRosterChangeRequestFixtures)[0];
  const req = rosterChangeRequestFixtures[0];
  const res = rosterChangeRequestResponseFixture;

  presenter.trackSubmitted({
    supervisorPseudonymizedId: pseudoId,
    affectedOfficersExternalIds: req.affectedOfficersExternalIds,
    requestChangeType: req.requestChangeType,
    intercomTicketId: res.id,
  });

  expect(trackInsightsRosterChangeRequestFormSubmittedSpy.mock.calls[0][0])
    .toMatchInlineSnapshot(`
      {
        "affectedOfficersExternalIds": [
          "OFFICER4",
        ],
        "intercomTicketId": "1",
        "requestChangeType": "REMOVE",
        "submittedBy": "hashed-agonzalez123",
        "supervisorPseudonymizedId": "hashed-agonzalez123",
      }
    `);

  presenter.trackSubmitted({
    supervisorPseudonymizedId: pseudoId,
    affectedOfficersExternalIds: req.affectedOfficersExternalIds,
    requestChangeType: req.requestChangeType,
    error: "Error: some error message",
  });

  expect(trackInsightsRosterChangeRequestFormSubmittedSpy.mock.calls[1][0])
    .toMatchInlineSnapshot(`
      {
        "affectedOfficersExternalIds": [
          "OFFICER4",
        ],
        "error": "Error: some error message",
        "requestChangeType": "REMOVE",
        "submittedBy": "hashed-agonzalez123",
        "supervisorPseudonymizedId": "hashed-agonzalez123",
      }
    `);
});

test("supervisorId not found in supervisionOfficerSupervisors", async () => {
  vi.spyOn(
    InsightsSupervisionStore.prototype,
    "supervisorInfo",
  ).mockReturnValue(undefined);
  vi.spyOn(
    InsightsSupervisionStore.prototype,
    "populateAllSupervisionOfficers",
  ).mockImplementation(() => ({}) as any);
  vi.spyOn(
    InsightsSupervisionStore.prototype,
    "populateOfficersForSupervisor",
  ).mockImplementation(() => ({}) as any);
  await presenter.hydrate();
  expect(presenter.hydrationState).toMatchInlineSnapshot(`
    {
      "error": [AggregateError: Expected data failed to populate],
      "status": "failed",
    }
  `);

  expect(unpackAggregatedErrors(presenter)).toMatchInlineSnapshot(`
    [
      [Error: failed to populate all officers],
      [Error: failed to populate supervisor],
      [Error: failed to populate officers on supervisor's team],
    ]
  `);
});

it("should open correctly", () => {
  expect(presenter.isModalOpen).toBeFalse();

  presenter.openModal();
  expect(presenter.isModalOpen).toBeTrue();
  // Edge case, it should open regardless of which state it starts in
  presenter.openModal();
  expect(presenter.isModalOpen).toBeTrue();
});

it("should close correctly", () => {
  presenter.openModal();
  expect(presenter.isModalOpen).toBeTrue();

  presenter.closeModal();
  expect(presenter.isModalOpen).toBeFalse();
  // Edge case, it should close regardless of which state it starts in
  presenter.closeModal();
  expect(presenter.isModalOpen).toBeFalse();
});
