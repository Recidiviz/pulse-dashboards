// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { RootStore } from "../../../RootStore";
import { AllCaseloadsPresenter } from "../AllCaseloadsPresenter";

function makePresenter({
  activeFeatureVariants = {},
  activeSystem = "SUPERVISION",
  caseloadPersons = [],
  clientsResidentsShowListView,
  currentTenantId = "US_CA",
  displayIdCopy = "DOC ID",
  labels = {
    incarcerationStaffTitle: "Case Manager",
    supervisionEndDateCopy: "End",
    releaseDateCopy: "Release Date",
  },
}: {
  activeFeatureVariants?: Record<string, unknown>;
  activeSystem?: string;
  caseloadPersons?: unknown[];
  clientsResidentsShowListView?: boolean;
  currentTenantId?: string;
  displayIdCopy?: string;
  labels?: {
    incarcerationStaffTitle: string;
    supervisionEndDateCopy: string;
    releaseDateCopy: string;
  };
} = {}) {
  const updateClientsResidentsViewPreference = vi.fn();
  const getDisplayIdCopy = vi.fn(() => displayIdCopy);
  const userUpdatesData =
    clientsResidentsShowListView === undefined
      ? {}
      : { clientsResidentsShowListView };

  const rootStore = {
    currentTenantId,
    firestoreStore: { updateClientsResidentsViewPreference },
    tenantStore: { getDisplayIdCopy, labels },
    userStore: { activeFeatureVariants },
    workflowsStore: {
      activeSystem,
      activeSystemConfig: {
        search: [{ searchType: "staff", searchTitleIgnoreCase: true }],
      },
      justiceInvolvedPersonTitle:
        activeSystem === "SUPERVISION" ? "client" : "resident",
      searchStore: {
        caseloadPersons,
        searchType: "staff",
        workflowsSearchFieldTitle: "staff",
      },
      userUpdatesSubscription: { data: userUpdatesData },
    },
  } as unknown as RootStore;

  return {
    presenter: new AllCaseloadsPresenter(rootStore),
    getDisplayIdCopy,
    updateClientsResidentsViewPreference,
  };
}

describe("AllCaseloadsPresenter", () => {
  it("defaults Clients and Residents to list view", () => {
    const { presenter } = makePresenter();

    expect(presenter.showListView).toBeTrue();
  });

  it("uses the shared Clients and Residents view preference", () => {
    const { presenter } = makePresenter({
      clientsResidentsShowListView: false,
    });

    expect(presenter.showListView).toBeFalse();
  });

  it("uses the shared view preference if user updates hydrate after presenter creation", () => {
    const { presenter } = makePresenter();

    expect(presenter.showListView).toBeTrue();

    (
      presenter as unknown as {
        rootStore: RootStore;
      }
    ).rootStore.workflowsStore.userUpdatesSubscription = {
      data: { clientsResidentsShowListView: false },
    } as RootStore["workflowsStore"]["userUpdatesSubscription"];

    expect(presenter.showListView).toBeFalse();
  });

  it("updates the shared Clients and Residents view preference", () => {
    const { presenter, updateClientsResidentsViewPreference } = makePresenter();

    presenter.showListView = false;

    expect(updateClientsResidentsViewPreference).toHaveBeenCalledWith(false);
  });

  it("hides the Clients and Residents table toggle when the feature variant is inactive", () => {
    const { presenter } = makePresenter({
      clientsResidentsShowListView: false,
    });

    expect(presenter.showTableViewToggle).toBeFalse();
    expect(presenter.showClientsResidentsTable).toBeFalse();
  });

  it("shows the Clients and Residents table when the feature variant and table preference are active", () => {
    const { presenter } = makePresenter({
      activeFeatureVariants: { clientsResidentsTableViewToggle: {} },
      clientsResidentsShowListView: false,
    });

    expect(presenter.showTableViewToggle).toBeTrue();
    expect(presenter.showClientsResidentsTable).toBeTrue();
    expect(presenter.showTnPilotTable).toBeFalse();
  });

  it("keeps the TN pilot table separate from the Clients and Residents toggle", () => {
    const { presenter } = makePresenter({
      activeFeatureVariants: {
        clientsResidentsTableViewToggle: {},
        usTn2026ClassificationPolicyPilot: {},
      },
      activeSystem: "INCARCERATION",
      clientsResidentsShowListView: false,
      currentTenantId: "US_TN",
    });

    expect(presenter.showTnPilotTable).toBeTrue();
    expect(presenter.showTableViewToggle).toBeFalse();
    expect(presenter.showClientsResidentsTable).toBeFalse();
  });

  it("formats the hydrated header with the caseload count", () => {
    const { presenter } = makePresenter({
      caseloadPersons: [{}, {}, {}],
    });

    expect(presenter.hydratedHeaderText).toEqual("All Clients (3)");
  });

  it("exposes the hydrated caseload people", () => {
    const caseloadPersons = [{}, {}, {}];
    const { presenter } = makePresenter({ caseloadPersons });

    expect(presenter.people).toBe(caseloadPersons);
  });

  it("derives the date and level headers for supervision", () => {
    const { presenter } = makePresenter({ activeSystem: "SUPERVISION" });

    expect(presenter.dateHeader).toEqual("Supervision End Date");
    expect(presenter.levelHeader).toEqual("Supervision Level");
  });

  it("derives the date and level headers for incarceration", () => {
    const { presenter } = makePresenter({ activeSystem: "INCARCERATION" });

    expect(presenter.dateHeader).toEqual("Release Date");
    expect(presenter.levelHeader).toEqual("Custody Level");
  });

  it("derives the display ID header from the tenant config", () => {
    const { presenter, getDisplayIdCopy } = makePresenter({
      activeSystem: "INCARCERATION",
      displayIdCopy: "Resident ID",
    });

    expect(presenter.displayIdHeader).toEqual("Resident ID");
    expect(getDisplayIdCopy).toHaveBeenCalledWith("INCARCERATION");
  });

  it("derives the assigned staff title for supervision", () => {
    const { presenter } = makePresenter({ activeSystem: "SUPERVISION" });

    expect(presenter.assignedStaffTitle).toEqual("supervisor");
  });

  it("derives the assigned staff title for incarceration", () => {
    const { presenter } = makePresenter({
      activeSystem: "INCARCERATION",
      labels: {
        incarcerationStaffTitle: "Case Manager",
        releaseDateCopy: "Release Date",
        supervisionEndDateCopy: "End",
      },
    });

    expect(presenter.assignedStaffTitle).toEqual("case manager");
  });

  it("enables the supervision type column only for supervision", () => {
    const { presenter: supervisionPresenter } = makePresenter({
      activeSystem: "SUPERVISION",
    });
    const { presenter: incarcerationPresenter } = makePresenter({
      activeSystem: "INCARCERATION",
    });

    expect(supervisionPresenter.enabledColumnIds.supervisionType).toBeTrue();
    expect(incarcerationPresenter.enabledColumnIds.supervisionType).toBeFalse();
    expect(supervisionPresenter.enabledColumnIds).toMatchObject({
      name: true,
      id: true,
      date: true,
      assignedTo: true,
      level: true,
    });
  });
});
