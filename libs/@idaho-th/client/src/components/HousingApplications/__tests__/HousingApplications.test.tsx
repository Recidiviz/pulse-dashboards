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
import type { ReactNode } from "react";

import { TAB_IDS } from "../../PreviewModal/constants";
import { HousingApplications } from "../HousingApplications";

vi.mock("~design-system", () => ({
  Button: ({
    children,
    onClick,
    type = "button",
  }: {
    children?: ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
  }) => (
    <button onClick={onClick} type={type}>
      {children}
    </button>
  ),
}));

type ExtractedFormValues = {
  clientFullName: string;
  idocNumber: string;
};

type PreparedPdf = {
  signedUrl?: string;
};

const testDoubles = vi.hoisted(() => ({
  applicationId: "application-123",
  extractedFormValues: {
    clientFullName: "John Doe",
    idocNumber: "12345",
  } satisfies ExtractedFormValues,
  preparedPdf: {
    signedUrl: "https://example.com/prepared-application.pdf",
  } as PreparedPdf,
  setCurrentApplicationId: vi.fn(),
  setInitialTab: vi.fn(),
}));

vi.mock("../AppHeader/AppHeader", () => ({
  AppHeader: () => null,
}));

vi.mock("../ApplicationsTable/ApplicationsTable", () => ({
  ApplicationsTable: ({
    onClick,
  }: {
    onClick?: (application: { id: string; stage: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onClick?.({ id: "existing-application-456", stage: "APPROVALS" })
      }
    >
      Open application
    </button>
  ),
}));

vi.mock("../SearchBar", () => ({
  SearchBar: () => null,
}));

vi.mock("../../IntakeFormModal", () => ({
  IntakeFormModal: ({
    defaultValues,
    isOpen,
    onSubmit,
    pdf,
  }: {
    defaultValues?: ExtractedFormValues;
    isOpen: boolean;
    onSubmit: (applicationId: string) => void;
    pdf: string | null;
  }) =>
    isOpen ? (
      <div
        data-client-name={defaultValues?.clientFullName}
        data-pdf-url={pdf}
        data-testid="intake-form-modal"
      >
        <button
          type="button"
          onClick={() => onSubmit(testDoubles.applicationId)}
        >
          Finish
        </button>
      </div>
    ) : null,
}));

vi.mock(
  "../../IntakeFormModal/ProviderMatchLoading/ProviderMatchLoading",
  () => ({
    ProviderMatchLoading: ({
      isOpen,
      onComplete,
    }: {
      isOpen: boolean;
      onComplete: () => void;
    }) =>
      isOpen ? (
        <div data-testid="provider-match-loading">
          <button type="button" onClick={onComplete}>
            Complete matching
          </button>
        </div>
      ) : null,
  }),
);

type PreviewModalModule = typeof import("../../PreviewModal");

vi.mock("../../PreviewModal", async () => ({
  getStaffInitialTab: (
    await vi.importActual<PreviewModalModule>("../../PreviewModal")
  ).getStaffInitialTab,
  StaffPreviewModal: ({
    application,
    isOpen,
    onDuplicated,
  }: {
    application?: { id: string; stage: string };
    isOpen: boolean;
    onDuplicated?: (newApplicationId: string) => void;
  }) =>
    isOpen ? (
      <div data-application-id={application?.id} data-testid="preview-modal">
        <button
          type="button"
          onClick={() => onDuplicated?.("duplicated-application-789")}
        >
          Trigger duplicated
        </button>
      </div>
    ) : null,
}));

vi.mock("../../UploadPdfApplicationModal/UploadPdfApplicationModal", () => ({
  UploadPdfApplicationModal: ({
    hideModal,
    onCompletion,
  }: {
    hideModal: () => void;
    onCompletion?: (
      applicationId: string,
      formValues: unknown,
      preparedPdf?: unknown,
    ) => void;
  }) => (
    <div data-testid="upload-pdf-application-modal">
      <button
        type="button"
        onClick={() => {
          onCompletion?.(
            testDoubles.applicationId,
            testDoubles.extractedFormValues,
            testDoubles.preparedPdf,
          );
          hideModal();
        }}
      >
        Complete extraction
      </button>
    </div>
  ),
}));

vi.mock("../../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => ({
    setCurrentApplicationId: testDoubles.setCurrentApplicationId,
  }),
  usePreviewModalStore: () => ({
    setInitialTab: testDoubles.setInitialTab,
  }),
}));

vi.mock("../../../hooks/housingApplication", () => ({
  useStaffHousingApplications: () => ({
    data: { items: [], total: 0 },
    isFetching: false,
    isLoading: false,
  }),
  useHousingProviders: () => ({
    providers: [],
    isPending: false,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("../../../trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      housingApplication: {
        getStaffApplicationById: {
          fetch: vi.fn(),
        },
      },
      documents: {
        listForStaff: {
          fetch: vi.fn(),
        },
      },
      client: {
        documents: {
          getDownloadUrlForStaff: {
            mutate: vi.fn(),
          },
        },
      },
    }),
  },
}));

describe("HousingApplications", () => {
  beforeEach(() => {
    testDoubles.preparedPdf = {
      signedUrl: "https://example.com/prepared-application.pdf",
    };
    testDoubles.setCurrentApplicationId.mockReset();
    testDoubles.setInitialTab.mockReset();
  });

  test("opens the upload modal when clicking Start an application", async () => {
    const user = userEvent.setup();

    render(<HousingApplications />);

    expect(
      screen.queryByTestId("upload-pdf-application-modal"),
    ).not.toBeInTheDocument();

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Start an application" }),
      );
    });

    expect(
      screen.getByTestId("upload-pdf-application-modal"),
    ).toBeInTheDocument();
  });

  test("opens the intake form with extracted values and prepared PDF after successful extraction", async () => {
    const user = userEvent.setup();

    render(<HousingApplications />);

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Start an application" }),
      );
    });
    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Complete extraction" }),
      );
    });

    expect(testDoubles.setCurrentApplicationId).toHaveBeenCalledWith(
      testDoubles.applicationId,
    );
    expect(screen.getByTestId("intake-form-modal")).toHaveAttribute(
      "data-pdf-url",
      testDoubles.preparedPdf.signedUrl,
    );
    expect(screen.getByTestId("intake-form-modal")).toHaveAttribute(
      "data-client-name",
      testDoubles.extractedFormValues.clientFullName,
    );
  });

  test("does not open the intake form when extracted PDF response has no signed URL", async () => {
    const user = userEvent.setup();
    testDoubles.preparedPdf = {};

    render(<HousingApplications />);

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Start an application" }),
      );
    });
    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Complete extraction" }),
      );
    });

    expect(testDoubles.setCurrentApplicationId).toHaveBeenCalledWith(
      testDoubles.applicationId,
    );
    expect(screen.queryByTestId("intake-form-modal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("preview-modal")).not.toBeInTheDocument();
  });

  test("opens the preview modal after review", async () => {
    const user = userEvent.setup();

    render(<HousingApplications />);

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Start an application" }),
      );
    });
    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Complete extraction" }),
      );
    });

    expect(screen.getByTestId("intake-form-modal")).toBeInTheDocument();
    expect(
      screen.queryByTestId("provider-match-loading"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("preview-modal")).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Finish" }));
    });

    expect(screen.queryByTestId("intake-form-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("provider-match-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("preview-modal")).not.toBeInTheDocument();

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Complete matching" }),
      );
    });

    expect(
      screen.queryByTestId("provider-match-loading"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("preview-modal")).toHaveAttribute(
      "data-application-id",
      testDoubles.applicationId,
    );
  });

  test("opens the preview modal when a dashboard row is clicked", async () => {
    const user = userEvent.setup();

    render(<HousingApplications />);

    expect(screen.queryByTestId("preview-modal")).not.toBeInTheDocument();

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Open application" }),
      );
    });

    expect(testDoubles.setCurrentApplicationId).toHaveBeenCalledWith(
      "existing-application-456",
    );
    expect(screen.getByTestId("preview-modal")).toHaveAttribute(
      "data-application-id",
      "existing-application-456",
    );
  });

  test("re-opens the preview modal on the duplicated application id", async () => {
    const user = userEvent.setup();

    render(<HousingApplications />);

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Open application" }),
      );
    });

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Trigger duplicated" }),
      );
    });

    expect(testDoubles.setCurrentApplicationId).toHaveBeenCalledWith(
      "duplicated-application-789",
    );
    expect(screen.getByTestId("preview-modal")).toHaveAttribute(
      "data-application-id",
      "duplicated-application-789",
    );
  });

  test("seeds the preview modal's starting tab from the row's stage", async () => {
    const user = userEvent.setup();

    render(<HousingApplications />);

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Open application" }),
      );
    });

    expect(testDoubles.setInitialTab).toHaveBeenCalledWith(TAB_IDS.HOME_PLAN);
  });

  test("seeds the providers tab when a duplicate re-opens the modal", async () => {
    const user = userEvent.setup();

    render(<HousingApplications />);

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Open application" }),
      );
    });

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Trigger duplicated" }),
      );
    });

    expect(testDoubles.setInitialTab).toHaveBeenLastCalledWith(
      TAB_IDS.PROVIDERS,
    );
  });
});
