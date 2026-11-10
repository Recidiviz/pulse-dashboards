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

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TAB_IDS } from "../../PreviewModal/constants";
import { ProviderApplications } from "../ProviderApplications";

const testDoubles = vi.hoisted(() => ({
  setCurrentApplicationId: vi.fn(),
  setInitialTab: vi.fn(),
  openHousingProviderSelection: vi.fn(),
}));

vi.mock("../../assets/users.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/search-icon.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));

vi.mock("../../HousingApplications/AppHeader/AppHeader", () => ({
  AppHeader: ({
    actions,
  }: {
    actions?: { key: string; label: string; onClick: () => void }[];
  }) =>
    actions?.map(({ key, label, onClick }) => (
      <button key={key} type="button" onClick={onClick}>
        {label}
      </button>
    )),
}));

vi.mock(
  "../../HousingApplications/ApplicationsTable/ApplicationsTable",
  () => ({
    ApplicationsTable: ({
      applications,
      onClick,
      pagination,
    }: {
      applications: Array<{
        clientName: string;
        formData: { idocNumber?: string };
        id: string;
        status: string;
      }>;
      onClick?: (application: {
        clientName: string;
        formData: { idocNumber?: string };
        id: string;
        status: string;
      }) => void;
      pagination: { totalCount: number };
    }) => (
      <div>
        <div>Clients: {pagination.totalCount}</div>
        {applications.map((application) => (
          <div key={application.clientName}>
            <button type="button" onClick={() => onClick?.(application)}>
              {application.clientName}
            </button>
            <div>
              {application.status === "ACTION_NEEDED"
                ? "Action Needed"
                : application.status}
            </div>
            <div>{application.formData.idocNumber}</div>
          </div>
        ))}
      </div>
    ),
  }),
);

type PreviewModalModule = typeof import("../../PreviewModal");

vi.mock("../../PreviewModal", async () => ({
  getProviderInitialTab: (
    await vi.importActual<PreviewModalModule>("../../PreviewModal")
  ).getProviderInitialTab,
  ProviderPreviewModal: ({
    application,
    isOpen,
  }: {
    application?: { id: string; stage: string };
    isOpen: boolean;
  }) =>
    isOpen ? (
      <div
        data-application-id={application?.id}
        data-application-stage={application?.stage}
        data-testid="provider-preview-modal"
      />
    ) : null,
}));

vi.mock("../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    setCurrentApplicationId: testDoubles.setCurrentApplicationId,
  }),
  useHousingProviderStore: () => ({
    openHousingProviderSelection: testDoubles.openHousingProviderSelection,
  }),
  usePreviewModalStore: () => ({
    setInitialTab: testDoubles.setInitialTab,
  }),
}));

vi.mock("../../../hooks/housingApplication", () => ({
  useCurrentProvider: () => ({
    data: { id: "provider-1", name: "Acme Housing Partners (AHP)" },
    isLoading: false,
  }),
  useProviderHousingApplications: () => ({
    data: {
      items: [
        {
          clientName: "Jane Doe",
          createdAt: new Date("2026-06-01T00:00:00.000Z"),
          expectedReleaseDate: new Date("2026-06-18T00:00:00.000Z"),
          formData: {
            idocNumber: "123456",
          },
          id: "application-1",
          idocNumber: "123456",
          providerApplicationId: "provider-application-1",
          sentToProvidersAt: new Date("2026-06-10T00:00:00.000Z"),
          stage: "APPLICATION",
          status: "ACTION_NEEDED",
          subStage: "PROVIDER_REVIEW",
        },
      ],
      nextCursor: null,
      total: 1,
    },
    isFetching: false,
    isLoading: false,
  }),
}));

// The Switch Provider action is shown only to a user with more than one.
vi.mock("../../../hooks/housingProvider", () => ({
  useResolveHousingProvider: () => ({
    data: {
      housingProviders: [
        { id: "provider-1", name: "Acme Housing Partners (AHP)" },
        { id: "provider-2", name: "Sunrise House" },
      ],
      activeProviderId: "provider-1",
    },
  }),
}));

vi.mock("../../../hooks/useDelayedTrue", () => ({
  useDelay: (value: boolean) => value,
}));

describe("ProviderApplications", () => {
  beforeEach(() => {
    testDoubles.setCurrentApplicationId.mockReset();
    testDoubles.setInitialTab.mockReset();
    testDoubles.openHousingProviderSelection.mockReset();
  });

  test("opens the provider selection screen from the Switch Provider action", async () => {
    const user = userEvent.setup();

    render(<ProviderApplications />);
    await user.click(screen.getByRole("button", { name: "Switch Provider" }));

    expect(testDoubles.openHousingProviderSelection).toHaveBeenCalledOnce();
  });

  test("shows applications sent to the logged-in provider", () => {
    render(<ProviderApplications />);

    expect(screen.getByText("Acme Housing Partners (AHP)")).toBeInTheDocument();
    expect(screen.getByText("Provider Portal")).toBeInTheDocument();
    expect(screen.getByText("Clients: 1")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Action Needed")).toBeInTheDocument();
    expect(screen.getByText("123456")).toBeInTheDocument();
  });

  test("opens the provider preview modal when clicking an application row", async () => {
    const user = userEvent.setup();

    render(<ProviderApplications />);

    expect(
      screen.queryByTestId("provider-preview-modal"),
    ).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Jane Doe" }));
    });

    expect(screen.getByTestId("provider-preview-modal")).toHaveAttribute(
      "data-application-id",
      "application-1",
    );
    expect(screen.getByTestId("provider-preview-modal")).toHaveAttribute(
      "data-application-stage",
      "APPLICATION",
    );
  });

  test("seeds the preview modal's starting tab before opening it", async () => {
    const user = userEvent.setup();

    render(<ProviderApplications />);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Jane Doe" }));
    });

    expect(testDoubles.setInitialTab).toHaveBeenCalledWith(
      TAB_IDS.APPLICATION_DETAILS,
    );
  });
});
