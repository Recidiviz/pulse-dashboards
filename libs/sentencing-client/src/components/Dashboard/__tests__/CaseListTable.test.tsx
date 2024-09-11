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
        caseTableData={[]}
        staffPseudoId=""
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  const statusFilter = await screen.findByText("Status (3)");
  expect(statusFilter).toBeInTheDocument();

  fireEvent.click(statusFilter);

  const archived = (await screen.getByLabelText("Archived", {
    selector: "input",
  })) as HTMLInputElement;
  const active = (await screen.getByLabelText("Active", {
    selector: "input",
  })) as HTMLInputElement;
  const notYetStarted = (await screen.getByLabelText("Not yet started", {
    selector: "input",
  })) as HTMLInputElement;
  const inProgress = (await screen.getByLabelText("In Progress", {
    selector: "input",
  })) as HTMLInputElement;
  const complete = (await screen.getByLabelText("Complete", {
    selector: "input",
  })) as HTMLInputElement;

  expect(archived).toBeInTheDocument();
  expect(active).toBeInTheDocument();
  expect(notYetStarted).toBeInTheDocument();
  expect(inProgress).toBeInTheDocument();
  expect(complete).toBeInTheDocument();

  expect(archived.checked).toBeFalse();
  expect(active.checked).toBeTrue();
  expect(notYetStarted.checked).toBeTrue();
  expect(inProgress.checked).toBeTrue();
  expect(complete.checked).toBeTrue();
});

test("displays no cases message when none are provided", async () => {
  const screen = render(
    <MemoryRouter>
      <CaseListTable
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
    (caseBrief) => moment() > moment(caseBrief.dueDate),
  );

  if (!data) return;

  const screen = render(
    <MemoryRouter>
      <CaseListTable
        caseTableData={data}
        staffPseudoId={psiStore.staffPseudoId!}
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  const notYetStartedCase = await screen.getByText("Not yet started");
  const completeCase = await screen.getByText("Complete");
  const inProgressCase = await screen.getByText("In Progress");
  const archivedCase = await screen.queryByText("Archived");
  const pastDueCaseName = await screen.queryByText(
    pastDueCase!.Client!.fullName,
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
    (caseBrief) => moment() > moment(caseBrief.dueDate),
  );

  if (!data) return;

  const screen = render(
    <MemoryRouter>
      <CaseListTable
        caseTableData={data}
        staffPseudoId={psiStore.staffPseudoId!}
        analytics={analytics}
      />
    </MemoryRouter>,
  );

  let notYetStartedCase = await screen.getByText("Not yet started");
  let completeCase = await screen.getByText("Complete");
  let inProgressCase = await screen.getByText("In Progress");
  let archivedCase: HTMLElement | HTMLElement[] | null =
    await screen.queryByText("Archived");
  let pastDueCaseName: HTMLElement | HTMLElement[] | null =
    await screen.queryByText(pastDueCase!.Client!.fullName.toLocaleLowerCase());
  const statusFilter = await screen.findByText("Status (3)");

  expect(archivedCase).toBeNull();
  expect(pastDueCaseName).toBeNull();
  expect(notYetStartedCase).toBeInTheDocument();
  expect(completeCase).toBeInTheDocument();
  expect(inProgressCase).toBeInTheDocument();

  fireEvent.click(statusFilter);

  const archivedInput = (await screen.getByLabelText("Archived", {
    selector: "input",
  })) as HTMLInputElement;

  fireEvent.click(archivedInput);
  fireEvent.click(statusFilter);

  archivedCase = await screen.getByText("Archived");
  pastDueCaseName = await screen.getByText(
    pastDueCase!.Client!.fullName.toLocaleLowerCase(),
  );
  notYetStartedCase = await screen.getByText("Not yet started");
  completeCase = await screen.getByText("Complete");
  inProgressCase = await screen.getByText("In Progress");

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
    ?.Client?.fullName.toLocaleLowerCase();
  let notYetStartedCase: HTMLElement | null = await screen.queryByText(
    notYetStartedName!,
  );

  expect(notYetStartedCase).not.toBeNull();

  const notYetStartedInput = (await screen.getByLabelText("Not yet started", {
    selector: "input",
  })) as HTMLInputElement;

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
    ?.Client?.fullName.toLocaleLowerCase();
  let inProgressCase: HTMLElement | null = await screen.queryByText(
    inProgressName!,
  );

  expect(inProgressCase).not.toBeNull();

  const inProgressInput = (await screen.getByLabelText("In Progress", {
    selector: "input",
  })) as HTMLInputElement;

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
        caseBrief.status === "Complete" && moment() < moment(caseBrief.dueDate),
    )
    ?.Client?.fullName.toLocaleLowerCase();
  let completeCase: HTMLElement | null = await screen.queryByText(
    completeName!,
  );

  expect(completeCase).not.toBeNull();

  const completeInput = (await screen.getByLabelText("Complete", {
    selector: "input",
  })) as HTMLInputElement;

  fireEvent.click(completeInput); //Uncheck

  completeCase = await screen.queryByText(completeName!);
  expect(completeCase).toBeNull();

  fireEvent.click(completeInput); // Check

  completeCase = await screen.queryByText(completeName!);
  expect(completeCase).not.toBeNull();
});
