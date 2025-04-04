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

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { fireEvent, render } from "@testing-library/react";
import moment from "moment";
import { MemoryRouter } from "react-router-dom";

import { StaffInfoFixture } from "../../../api/offlineFixtures";
import { PSIStore } from "../../../datastores/PSIStore";
import { StaffPresenter } from "../../../presenters/StaffPresenter";
import { createMockPSIStore } from "../../../utils/test";
import { CaseListTable } from "../CaseListTable";
import { ACTIVE_STATUS, ARCHIVED_STATUS, CANCELLED_STATUS } from "../constants";
import { CaseStatusToDisplay } from "../types";

let psiStore: PSIStore;
let presenter: StaffPresenter;
const analytics = {
  trackIndividualCaseClicked: () => null,
  trackRecommendationStatusFilterChanged: () => null,
  trackDashboardSortOrderChanged: () => null,
};

beforeEach(() => {
  psiStore = createMockPSIStore();
  presenter = new StaffPresenter(psiStore.staffStore);

  vi.spyOn(psiStore.staffStore, "loadStaffInfo");
  vi.spyOn(psiStore.apiClient, "getStaffInfo").mockResolvedValue(
    StaffInfoFixture,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("shows status filter with default filters checked", async () => {
  const screen = render(
    <MemoryRouter>
      <CaseListTable
        excludedAttributeKeys={[]}
        caseTableData={[]}
        staffPseudoId=""
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  const statusFilter = await screen.findByText("Status (3)");
  expect(statusFilter).toBeInTheDocument();

  fireEvent.click(statusFilter);

  const archived = (await screen.getByLabelText(ARCHIVED_STATUS, {
    selector: "input",
  })) as HTMLInputElement;
  const active = (await screen.getByLabelText(ACTIVE_STATUS, {
    selector: "input",
  })) as HTMLInputElement;
  const notYetStarted = (await screen.getByLabelText(
    CaseStatusToDisplay.NotYetStarted,
    {
      selector: "input",
    },
  )) as HTMLInputElement;
  const inProgress = (await screen.getByLabelText(
    CaseStatusToDisplay.InProgress,
    {
      selector: "input",
    },
  )) as HTMLInputElement;
  const complete = (await screen.getByLabelText(CaseStatusToDisplay.Complete, {
    selector: "input",
  })) as HTMLInputElement;
  const cancelled = (await screen.getByLabelText(CANCELLED_STATUS, {
    selector: "input",
  })) as HTMLInputElement;

  expect(archived).toBeInTheDocument();
  expect(cancelled).toBeInTheDocument();
  expect(active).toBeInTheDocument();
  expect(notYetStarted).toBeInTheDocument();
  expect(inProgress).toBeInTheDocument();
  expect(complete).toBeInTheDocument();

  expect(archived.checked).toBeFalse();
  expect(cancelled.checked).toBeFalse();
  expect(active.checked).toBeTrue();
  expect(notYetStarted.checked).toBeTrue();
  expect(inProgress.checked).toBeTrue();
  expect(complete.checked).toBeTrue();
});

test("displays no cases message when none are provided", async () => {
  const screen = render(
    <MemoryRouter>
      <CaseListTable
        excludedAttributeKeys={[]}
        caseTableData={[]}
        staffPseudoId=""
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  const noCasesMessage = await screen.findByText("No cases to display");
  expect(noCasesMessage).toBeInTheDocument();
});

test("does not show archived cases", async () => {
  await presenter.hydrate();
  const data = presenter.caseTableData;
  const pastDueCase = data?.find(
    (caseBrief) => moment().utc() > moment(caseBrief.dueDate).utc(),
  );

  if (!data) return;

  const screen = render(
    <MemoryRouter>
      <CaseListTable
        excludedAttributeKeys={[]}
        caseTableData={data}
        staffPseudoId={psiStore.staffPseudoId!}
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  const notYetStartedCase = await screen.getByText(
    CaseStatusToDisplay.NotYetStarted,
  );
  const completeCase = await screen.getByText(CaseStatusToDisplay.Complete);
  const inProgressCase = await screen.getByText(CaseStatusToDisplay.InProgress);
  const archivedCase = await screen.queryByText(ARCHIVED_STATUS);
  const pastDueCaseName = await screen.queryByText(
    pastDueCase!.client!.fullName,
  );

  expect(archivedCase).toBeNull();
  expect(pastDueCaseName).toBeNull();
  expect(notYetStartedCase).toBeInTheDocument();
  expect(completeCase).toBeInTheDocument();
  expect(inProgressCase).toBeInTheDocument();
});

test("shows archived case when filter is checked", async () => {
  await presenter.hydrate();
  const data = presenter.caseTableData;
  const pastDueCase = data?.find(
    (caseBrief) => moment().utc() > moment(caseBrief.dueDate).utc(),
  );

  if (!data) return;

  const screen = render(
    <MemoryRouter>
      <CaseListTable
        excludedAttributeKeys={[]}
        caseTableData={data}
        staffPseudoId={psiStore.staffPseudoId!}
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  let notYetStartedCase = await screen.getByText(
    CaseStatusToDisplay.NotYetStarted,
  );
  let completeCase = await screen.getByText(CaseStatusToDisplay.Complete);
  let inProgressCase = await screen.getByText(CaseStatusToDisplay.InProgress);
  let archivedCase: HTMLElement | HTMLElement[] | null =
    await screen.queryByText(ARCHIVED_STATUS);
  let pastDueCaseName: HTMLElement | HTMLElement[] | null =
    await screen.queryByText(pastDueCase!.client!.fullName.toLocaleLowerCase());
  const statusFilter = await screen.findByText("Status (3)");

  expect(archivedCase).toBeNull();
  expect(pastDueCaseName).toBeNull();
  expect(notYetStartedCase).toBeInTheDocument();
  expect(completeCase).toBeInTheDocument();
  expect(inProgressCase).toBeInTheDocument();

  fireEvent.click(statusFilter);

  const archivedInput = (await screen.getByLabelText(ARCHIVED_STATUS, {
    selector: "input",
  })) as HTMLInputElement;

  fireEvent.click(archivedInput);
  fireEvent.click(statusFilter);

  archivedCase = await screen.getByText(ARCHIVED_STATUS);
  pastDueCaseName = await screen.getByText(
    pastDueCase!.client!.fullName.toLocaleLowerCase(),
  );
  notYetStartedCase = await screen.getByText(CaseStatusToDisplay.NotYetStarted);
  completeCase = await screen.getByText(CaseStatusToDisplay.Complete);
  inProgressCase = await screen.getByText(CaseStatusToDisplay.InProgress);

  expect(archivedCase).toBeInTheDocument();
  expect(pastDueCaseName).toBeInTheDocument();
  expect(notYetStartedCase).toBeInTheDocument();
  expect(completeCase).toBeInTheDocument();
  expect(inProgressCase).toBeInTheDocument();
});

test("show/hide cases when 'Not yet started' filter is checked/unchecked", async () => {
  await presenter.hydrate();
  const data = presenter.caseTableData;

  if (!data) return;

  const screen = render(
    <MemoryRouter>
      <CaseListTable
        excludedAttributeKeys={[]}
        caseTableData={data}
        staffPseudoId={psiStore.staffPseudoId!}
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  const statusFilter = await screen.findByText("Status (3)");

  fireEvent.click(statusFilter); // Open filter dropdown

  const notYetStartedName = data
    .find((user) => user.status === "NotYetStarted")
    ?.client?.fullName.toLocaleLowerCase();
  let notYetStartedCase: HTMLElement | null = await screen.queryByText(
    notYetStartedName!,
  );

  expect(notYetStartedCase).not.toBeNull();

  const notYetStartedInput = (await screen.getByLabelText(
    CaseStatusToDisplay.NotYetStarted,
    {
      selector: "input",
    },
  )) as HTMLInputElement;

  fireEvent.click(notYetStartedInput); // Uncheck

  notYetStartedCase = await screen.queryByText(notYetStartedName!);
  expect(notYetStartedCase).toBeNull();

  fireEvent.click(notYetStartedInput); // Check

  notYetStartedCase = await screen.queryByText(notYetStartedName!);
  expect(notYetStartedCase).not.toBeNull();
});

test("show/hide cases when 'In Progress' filter is checked/unchecked", async () => {
  await presenter.hydrate();
  const data = presenter.caseTableData;

  if (!data) return;

  const screen = render(
    <MemoryRouter>
      <CaseListTable
        excludedAttributeKeys={[]}
        caseTableData={data}
        staffPseudoId={psiStore.staffPseudoId!}
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  const statusFilter = await screen.findByText("Status (3)");

  fireEvent.click(statusFilter); // Open filter dropdown

  const inProgressName = data
    .find((user) => user.status === "InProgress")
    ?.client?.fullName.toLocaleLowerCase();
  let inProgressCase: HTMLElement | null = await screen.queryByText(
    inProgressName!,
  );

  expect(inProgressCase).not.toBeNull();

  const inProgressInput = (await screen.getByLabelText(
    CaseStatusToDisplay.InProgress,
    {
      selector: "input",
    },
  )) as HTMLInputElement;

  fireEvent.click(inProgressInput); // Uncheck

  inProgressCase = await screen.queryByText(inProgressName!);
  expect(inProgressCase).toBeNull();

  fireEvent.click(inProgressInput); // Check

  inProgressCase = await screen.queryByText(inProgressName!);
  expect(inProgressCase).not.toBeNull();
});

test("show/hide cases when 'Complete' filter is checked/unchecked", async () => {
  await presenter.hydrate();
  const data = presenter.caseTableData;

  if (!data) return;

  const screen = render(
    <MemoryRouter>
      <CaseListTable
        excludedAttributeKeys={[]}
        caseTableData={data}
        staffPseudoId={psiStore.staffPseudoId!}
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  const statusFilter = await screen.findByText("Status (3)");

  fireEvent.click(statusFilter); // Open filter dropdown

  const completeName = data
    .find(
      (caseBrief) =>
        caseBrief.status === CaseStatusToDisplay.Complete &&
        moment().utc() < moment(caseBrief.dueDate).utc(),
    )
    ?.client?.fullName.toLocaleLowerCase();
  let completeCase: HTMLElement | null = await screen.queryByText(
    completeName!,
  );

  expect(completeCase).not.toBeNull();

  const completeInput = (await screen.getByLabelText(
    CaseStatusToDisplay.Complete,
    {
      selector: "input",
    },
  )) as HTMLInputElement;

  fireEvent.click(completeInput); //Uncheck

  completeCase = await screen.queryByText(completeName!);
  expect(completeCase).toBeNull();

  fireEvent.click(completeInput); // Check

  completeCase = await screen.queryByText(completeName!);
  expect(completeCase).not.toBeNull();
});
