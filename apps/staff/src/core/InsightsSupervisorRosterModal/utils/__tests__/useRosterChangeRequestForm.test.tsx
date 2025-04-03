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

import { renderHook } from "@testing-library/react";
import { configure } from "mobx";
import { act, useEffect } from "react";

import {
  InsightsConfigFixture,
  rawRosterChangeRequestResponseFixture,
  rosterChangeRequestFixtures,
  SupervisionOfficer,
  supervisionOfficerFixture,
  SupervisionOfficerSupervisor,
  supervisionOfficerSupervisorsFixture,
} from "~datatypes";

import { SupervisionSupervisorRosterModalPresenter } from "../../../../InsightsStore/presenters/SupervisionSupervisorRosterModalPresenter";
import { InsightsSupervisionStore } from "../../../../InsightsStore/stores/InsightsSupervisionStore";
import { RootStore } from "../../../../RootStore";
import UserStore from "../../../../RootStore/UserStore";
import {
  InsightsRosterChangeRequestFormManager,
  SelectOptionWithLocation,
} from "../../types";
import { useRosterChangeRequestForm } from "../useRosterChangeRequestForm";

let form: InsightsRosterChangeRequestFormManager[0];
let formData: InsightsRosterChangeRequestFormManager[1];
let presenter: SupervisionSupervisorRosterModalPresenter;
let store: InsightsSupervisionStore;
let rootStore: RootStore;

const testSupervisor = supervisionOfficerSupervisorsFixture[0];
const mockRequest = rosterChangeRequestFixtures[3];
const mockResponse = rawRosterChangeRequestResponseFixture;

beforeEach(async () => {
  configure({ safeDescriptors: false });

  vi.spyOn(UserStore.prototype, "userPseudoId", "get").mockImplementation(
    () => testSupervisor.pseudonymizedId,
  );

  vi.spyOn(UserStore.prototype, "stateCode", "get").mockImplementation(
    () => "US_TN",
  );

  vi.spyOn(UserStore.prototype, "isRecidivizUser", "get").mockImplementation(
    () => true,
  );

  vi.spyOn(
    InsightsSupervisionStore.prototype,
    "supervisionOfficers",
    "get",
  ).mockReturnValue(supervisionOfficerFixture);

  vi.spyOn(
    InsightsSupervisionStore.prototype,
    "supervisionOfficerSupervisors",
    "get",
  ).mockReturnValue(supervisionOfficerSupervisorsFixture);

  rootStore = new RootStore();
  rootStore.insightsStore.supervisionStore = new InsightsSupervisionStore(
    rootStore.insightsStore,
    InsightsConfigFixture,
  );
  store = rootStore.insightsStore.supervisionStore;

  vi.spyOn(store, "officersBySupervisorPseudoId", "get").mockReturnValue(
    new Map([
      [
        testSupervisor.externalId,
        supervisionOfficerFixture.filter((o) =>
          o.supervisorExternalIds.includes(testSupervisor.externalId),
        ),
      ],
    ]),
  );

  vi.spyOn(store, "userCanSubmitRosterChangeRequest", "get").mockReturnValue(
    true,
  );

  presenter = new SupervisionSupervisorRosterModalPresenter(
    store,
    supervisionOfficerSupervisorsFixture[0].pseudonymizedId,
  );

  await presenter.hydrate();

  renderHook(() => {
    const manager = useRosterChangeRequestForm(presenter);

    useEffect(() => {
      form = manager[0];
      formData = manager[1];
    }, [manager]);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.clearAllTimers();
  configure({ safeDescriptors: true });
});

it("should have correct default options at initialization", () => {
  expect(form.options).toMatchInlineSnapshot(`
    {
      "defaultValues": {
        "affectedOfficers": [],
        "requestChangeType": "ADD",
        "requestNote": "",
      },
      "onSubmit": [Function],
      "onSubmitMeta": {
        "handleSubmit": [Function],
        "isDemo": true,
        "supervisorPseudoId": "hashed-agonzalez123",
        "trackSubmitted": [Function],
      },
      "validators": {
        "onChange": [Function],
      },
    }
  `);
});

it("should not be submittable at initialization", async () => {
  await act(async () => {
    form.handleSubmit();
  });
  expect(form.state.isSubmitted).toBeFalse();
});

it("should become valid only when affectedOfficers and requestNote have values", () => {
  act(() => {
    form.setFieldValue("requestNote", "hi");
    form.validate("submit");
  });

  expect(form.state.isFormValid).toBeFalse();

  act(() => {
    form.setFieldValue("requestChangeType", "ADD");
    form.validate("submit");
  });

  expect(form.state.isFormValid).toBeFalse();

  act(() => {
    form.pushFieldValue("affectedOfficers", supervisionOfficerFixture[0]);
    form.validate("submit");
  });

  expect(form.state.isFormValid).toBeTrue();
});

it("should have a clear error message when validation is attempted", () => {
  act(() => {
    form.validate("submit");
  });
  expect(form.state.errors).toMatchInlineSnapshot(`
      [
        {
          "affectedOfficersExternalIds": [
            "Must have at least one officer.",
          ],
          "requestNote": [
            "Request note cannot be empty.",
          ],
        },
      ]
    `);
});

it("demo submit flow", async () => {
  vi.useFakeTimers();

  await act(async () => {
    form.setFieldValue("affectedOfficers", supervisionOfficerFixture);
    form.setFieldValue("requestChangeType", mockRequest.requestChangeType);
    form.setFieldValue("requestNote", mockRequest.requestNote);
  });

  const affectedOfficersExternalIds = supervisionOfficerFixture.map(
    (o) => o.externalId,
  );

  const trackSubmittedSpy = vi.spyOn(presenter, "trackSubmitted");

  // Fast-forward all timers so that any setTimeout resolves immediately.
  vi.runAllTimersAsync();

  // --- First Submission (Failure) ---
  let error: Error | undefined;

  await expect(
    form.handleSubmit().catch((e) => {
      error = e;
      throw e;
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: Unable to process your request. Please try again.]`,
  );

  expect(trackSubmittedSpy).toHaveBeenLastCalledWith({
    supervisorPseudonymizedId: testSupervisor.pseudonymizedId,
    affectedOfficersExternalIds,
    requestChangeType: mockRequest.requestChangeType,
    error: error?.message,
  });

  // --- Second Submission (Success) ---
  await expect(form.handleSubmit()).resolves.not.toThrow();
  expect(form.state.isSubmitted).toBeTrue();
  expect(trackSubmittedSpy).toHaveBeenLastCalledWith({
    supervisorPseudonymizedId: testSupervisor.pseudonymizedId,
    affectedOfficersExternalIds,
    requestChangeType: mockRequest.requestChangeType,
    intercomTicketId: mockResponse.id,
  });
});

it("navigate when officer selected", () => {
  const viewSpy = vi.spyOn(presenter, "view", "set");

  expect(presenter.view).toBe("ROSTER");
  act(() => {
    form.pushFieldValue("affectedOfficers", supervisionOfficerFixture[0]);
  });
  expect(viewSpy.mock.lastCall?.[0]).toMatchInlineSnapshot(`"FORM"`);
});

const isOfficerOnSupervisorTeam = (
  o: SupervisionOfficer | undefined,
  s: SupervisionOfficerSupervisor,
) => o?.supervisorExternalIds.includes(s.externalId);

it("gets the correct officers for toggled states", () => {
  vi.spyOn(presenter, "allOfficers", "get").mockImplementation(
    () => supervisionOfficerFixture,
  );
  vi.spyOn(presenter, "supervisorInfo", "get").mockImplementation(
    () => testSupervisor,
  );

  act(() => {
    form.setFieldValue("requestChangeType", "REMOVE");
  });

  expect(
    formData.selectableOfficersAsSelectOptions.every((select) =>
      isOfficerOnSupervisorTeam(
        formData.allOfficers?.find((o) => o.externalId === select.value),
        testSupervisor,
      ),
    ),
  ).toBeTrue();

  act(() => {
    form.setFieldValue("requestChangeType", "ADD");
  });

  expect(
    formData.selectableOfficersAsSelectOptions.every(
      (select) =>
        !isOfficerOnSupervisorTeam(
          formData.allOfficers?.find((o) => o.externalId === select.value),
          testSupervisor,
        ),
    ),
  ).toBeTrue();
});

it("maintains the selected officers", () => {
  act(() => {
    form.pushFieldValue("affectedOfficers", supervisionOfficerFixture[0]);
  });
  expect(formData.selectedOfficersAsSelectOptions).toMatchInlineSnapshot(`
    [
      {
        "label": "Walter Harris",
        "location": "Unit 1",
        "value": "OFFICER4",
      },
    ]
  `);
});

it("transforms options to officers", () => {
  const testOptions: SelectOptionWithLocation[] = [
    {
      label: "Walter Harris",
      location: "Unit 1",
      value: "OFFICER4",
    },
    { label: "Elizabeth Ramirez", value: "so8", location: "Unit 4" },
  ];
  const output = formData.transformOptionsIntoOfficers(testOptions);
  const expected = supervisionOfficerFixture.filter((o) =>
    testOptions.find((t) => t.value === o.externalId),
  );
  expect(output).toContainValues(expected);
});
