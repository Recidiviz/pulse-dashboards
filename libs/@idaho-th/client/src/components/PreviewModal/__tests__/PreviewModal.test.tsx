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

import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import toast from "react-hot-toast";

import { ProviderPreviewModal } from "../ProviderPreviewModal";
import { StaffPreviewModal } from "../StaffPreviewModal";

const testDoubles = vi.hoisted(() => ({
  activeTab: "applicationDetails",
  currentApplication: undefined as Record<string, unknown> | undefined,
  currentFormValues: {
    clientFullName: "John Doe",
    cmPoEmail: "cm@example.gov",
    cmPoName: "Casey Manager",
    cmPoPhone: "208-555-0100",
    currentFacilityLocation: "Test Facility",
    dob: "01/01/1990",
    faithBasedPreferred: true,
    gender: "Male",
    idocNumber: "999999",
    legalCurrentStatus: "Rider",
    legalSexOffenderRegistry: false,
    preferredDistrict: ["District 1"],
    preferredProviders: ["provider-a"],
    tpdHousingNeededDate: "07/01/2026",
    violenceHistoryDors: false,
  },
  advanceApplicationStage: vi.fn(),
  providerInfoRequest: undefined as
    | {
        infoRequests: Array<{
          id: string;
          status?: string;
          messages: Array<{
            body: string;
            createdAt: Date;
            senderType: string;
          }>;
        }>;
      }
    | undefined,
  user: {
    nickname: "Casey Manager",
    providerPseudonymizedId: undefined as string | undefined,
    role: "staff" as "provider" | "staff",
  },
  postStaffInfoReply: vi.fn(),
  sendApplicationToProviders: vi.fn(),
  setHomePlanApprovals: vi.fn(),
  submitProviderResponse: vi.fn(),
  editProviderInfoRequestMessage: vi.fn(),
  setActiveTab: vi.fn(),
  resetPreviewModalStore: vi.fn(),
  useStaffApplicationProviders: vi.fn(),
  useStaffApplicationById: vi.fn(),
  useProviderApplicationById: vi.fn(),
  useCurrentApplicationDetail: vi.fn(),
  useProvidersWithEligibility: vi.fn(),
  trpcUtils: {
    housingApplication: {
      getByStaff: { invalidate: vi.fn() },
      getProviderApplications: { invalidate: vi.fn() },
    },
  },
}));

vi.mock("react-hot-toast", () => {
  const toast = vi.fn();
  return {
    default: Object.assign(toast, {
      error: vi.fn(),
      success: vi.fn(),
    }),
  };
});

vi.mock("../../../hooks/useIsMobile", () => ({
  breakpoints: {
    mobile: 480,
    tablet: 768,
  },
  default: () => ({ isTablet: false }),
}));

vi.mock("../../../datastores/IdahoTHStoreContext", () => ({
  useIdahoTHStore: () => ({
    rootStore: {
      userStore: {
        user: testDoubles.user,
      },
    },
  }),
  useHousingApplicationsStore: () => ({
    currentApplicationId: "application-1",
  }),
  usePreviewModalStore: () => ({
    activeTab: testDoubles.activeTab,
    reset: testDoubles.resetPreviewModalStore,
    setActiveTab: (tab: string) => {
      testDoubles.activeTab = tab;
      testDoubles.setActiveTab(tab);
    },
  }),
  useUserStore: () => ({
    user: testDoubles.user,
  }),
}));

vi.mock("../../../hooks/housingApplication", () => ({
  useAdvanceApplicationStage: () => ({
    isPending: false,
    mutate: testDoubles.advanceApplicationStage,
  }),
  useEditProviderInfoRequestMessage: () => ({
    isPending: false,
    mutate: testDoubles.editProviderInfoRequestMessage,
  }),
  useProviderHomePlan: () => ({
    data: undefined,
    isLoading: false,
  }),
  useProviderInfoRequests: () => ({
    data: testDoubles.providerInfoRequest,
    isLoading: false,
  }),
  usePostStaffInfoReply: () => ({
    mutateAsync: testDoubles.postStaffInfoReply,
  }),
  useProvidersWithEligibility: testDoubles.useProvidersWithEligibility,
  useSendApplicationToProviders: () => ({
    isPending: false,
    mutate: testDoubles.sendApplicationToProviders,
  }),
  useSetHomePlanApprovals: () => ({
    isPending: false,
    mutate: testDoubles.setHomePlanApprovals,
  }),
  useStaffHomePlan: () => ({
    data: undefined,
    isLoading: false,
  }),
  useSubmitProviderResponse: () => ({
    isPending: false,
    mutate: testDoubles.submitProviderResponse,
  }),
  useToggleEligibleProviderSelection: () => ({
    mutate: vi.fn(),
  }),
  useUpdateHousingApplication: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock("../../../hooks/useApplicationDetail", () => ({
  useStaffApplicationProviders: testDoubles.useStaffApplicationProviders,
  useStaffApplicationById: testDoubles.useStaffApplicationById,
  useProviderApplicationById: testDoubles.useProviderApplicationById,
  useCurrentApplicationDetail: testDoubles.useCurrentApplicationDetail,
  useDismissProviderAlert: () => ({
    mutate: vi.fn(),
  }),
  useDismissStaffAlert: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock("../../../trpc/client", () => ({
  trpc: {
    useUtils: () => testDoubles.trpcUtils,
  },
}));

vi.mock("../../../hooks/useTimeline", () => ({
  useStaffTimeline: () => ({
    data: { events: [], newEventCount: 0 },
    isLoading: false,
    isSuccess: false,
  }),
  useProviderTimeline: () => ({
    data: { events: [], newEventCount: 0 },
    isLoading: false,
    isSuccess: false,
  }),
  useMarkStaffModalOpened: () => ({
    mutate: vi.fn(),
  }),
  useMarkProviderModalOpened: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock("../../Modal/Modal", () => ({
  Modal: ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) =>
    isOpen ? <div>{children}</div> : null,
}));

vi.mock(
  "../StaffPreviewModal/StaffApplicationDetailsView/StaffApplicationDetailsView",
  () => ({
    StaffApplicationDetailsView: () => <div>Application details content</div>,
  }),
);

vi.mock(
  "../StaffPreviewModal/EligibleProvidersView/ProviderCard/ProviderCard",
  () => ({
    ProviderCard: ({
      provider,
    }: {
      provider: {
        isPreferred?: boolean;
        name: string;
      };
    }) => (
      <div data-is-preferred={provider.isPreferred} data-testid="provider-card">
        {provider.name}
      </div>
    ),
  }),
);

vi.mock("react-pdf", () => ({
  Document: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Page: () => <div />,
  pdfjs: {
    GlobalWorkerOptions: {},
  },
}));

vi.mock("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url", () => ({
  default: "",
}));

vi.mock("react-use-clipboard", () => ({
  default: () => [false, vi.fn()],
}));

vi.mock("../../assets/arrow-down.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/arrow-left.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/building-icon.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/calendar.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/check.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/document.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/home.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/message.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/house-icon.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/pin-icon.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/quotes-icon.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/search-icon.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/tabler-icon-bed.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/tabler-icon-corner-down-right.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/tabler-icon-clock.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/tabler-icon-mail.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/tabler-icon-notes.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/tabler-icon-phone.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/timeline.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/trash-icon.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/upload.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/user-icon.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/x.svg?react", () => ({
  default: () => <svg />,
}));
vi.mock("../../assets/x-solid.svg?react", () => ({
  default: () => <svg />,
}));

describe("PreviewModal", () => {
  const setProviderUser = () => {
    testDoubles.user = {
      nickname: "Acme Housing Partners",
      providerPseudonymizedId: "provider-1",
      role: "provider",
    };
  };

  const renderProviderPreviewModal = (applicationId = "application-1") => {
    setProviderUser();
    return render(
      <ProviderPreviewModal
        isOpen
        application={{ id: applicationId, stage: "APPLICATION" }}
        onClose={vi.fn()}
      />,
    );
  };

  beforeEach(() => {
    testDoubles.activeTab = "applicationDetails";
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      formData: testDoubles.currentFormValues,
      providerApplications: [],
      sentToProvidersAt: null,
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };
    testDoubles.user = {
      nickname: "J. Doe",
      providerPseudonymizedId: undefined,
      role: "staff",
    };
    testDoubles.providerInfoRequest = undefined;
    testDoubles.advanceApplicationStage.mockReset();
    testDoubles.postStaffInfoReply.mockReset();
    testDoubles.postStaffInfoReply.mockResolvedValue(undefined);
    testDoubles.resetPreviewModalStore.mockReset();
    testDoubles.sendApplicationToProviders.mockReset();
    testDoubles.submitProviderResponse.mockReset();
    testDoubles.editProviderInfoRequestMessage.mockReset();
    testDoubles.setActiveTab.mockReset();
    testDoubles.useStaffApplicationProviders.mockReset();
    testDoubles.useStaffApplicationProviders.mockReturnValue({
      data: { providers: [] },
      isError: false,
      isLoading: false,
    });
    testDoubles.useStaffApplicationById.mockReset();
    testDoubles.useStaffApplicationById.mockImplementation(() => ({
      data: testDoubles.currentApplication,
      isError: false,
      isLoading: false,
      isSuccess: true,
    }));
    testDoubles.useProviderApplicationById.mockReset();
    testDoubles.useProviderApplicationById.mockImplementation(() => ({
      data: testDoubles.currentApplication,
      isError: false,
      isLoading: false,
      isSuccess: true,
    }));
    testDoubles.useCurrentApplicationDetail.mockReset();
    testDoubles.useCurrentApplicationDetail.mockImplementation(() => ({
      formData: testDoubles.currentFormValues,
      preferredProviders: [],
    }));
    testDoubles.useProvidersWithEligibility.mockReset();
    testDoubles.useProvidersWithEligibility.mockReturnValue({
      data: { providers: [] },
      isError: false,
      isLoading: false,
    });
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  test("syncs staff and provider preview details for selected applications", () => {
    const { unmount } = render(
      <StaffPreviewModal
        isOpen
        application={{ id: "staff-application-1", stage: "APPLICATION" }}
        onClose={vi.fn()}
        onDuplicated={vi.fn()}
      />,
    );

    expect(testDoubles.useStaffApplicationById).toHaveBeenCalledWith(
      "staff-application-1",
      true,
    );

    unmount();
    testDoubles.useProviderApplicationById.mockClear();

    renderProviderPreviewModal("provider-application-1");

    expect(testDoubles.useProviderApplicationById).toHaveBeenCalledWith(
      "provider-application-1",
      true,
    );
  });

  test("loads eligible providers with current form values when the Eligible providers tab is clicked", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    expect(screen.getByText("Application details content")).toBeInTheDocument();
    expect(testDoubles.useProvidersWithEligibility).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    expect(testDoubles.useProvidersWithEligibility).toHaveBeenCalledWith(
      {
        faithBasedPreferred: true,
        gender: "Male",
        isRider: true,
        isSexOffender: false,
        preferredDistricts: ["District 1"],
        preferredProviders: ["provider-a"],
      },
      undefined,
      { enabled: true },
    );
    expect(screen.getByText("No eligible providers found")).toBeInTheDocument();
  });

  test("shows empty provider state when there are no eligible providers", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    expect(screen.getByText("No eligible providers found")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Send Application/ }),
    ).not.toBeInTheDocument();
    expect(testDoubles.sendApplicationToProviders).not.toHaveBeenCalled();
  });

  test("shows empty provider state when the application was already sent to all eligible providers", async () => {
    const user = userEvent.setup();

    testDoubles.currentApplication = {
      eligibleProviders: [
        {
          provider: {
            email: "provider-a@example.com",
            id: "provider-a",
            name: "Provider A",
          },
          providerLocation: {
            acceptedGenders: ["MALE"],
            acceptsRiders: true,
            acceptsSexOffenders: false,
            acceptsViolentCriminals: false,
            district: "District 1",
            faithBased: true,
            id: "provider-a-location",
          },
          isSelected: true,
        },
      ],
      formData: testDoubles.currentFormValues,
      providerApplications: [{ providerId: "provider-a" }],
      sentToProvidersAt: null,
    };

    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    expect(
      screen.getByText("Application sent to all recommended providers"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Use the search bar above to add additional providers manually\./i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /^Send Application/ }),
    ).not.toBeInTheDocument();
    expect(testDoubles.sendApplicationToProviders).not.toHaveBeenCalled();
  });

  test("shows preferred providers before other eligible providers", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      eligibleProviders: [
        {
          provider: {
            email: "other-provider@example.com",
            id: "other-provider",
            name: "Other Provider",
          },
          providerLocation: {
            acceptedGenders: ["MALE"],
            acceptsRiders: true,
            acceptsSexOffenders: false,
            acceptsViolentCriminals: false,
            district: "District 1",
            faithBased: true,
            id: "other-location",
          },
        },
        {
          provider: {
            email: "provider-a@example.com",
            id: "provider-a",
            name: "Provider A",
          },
          providerLocation: {
            acceptedGenders: ["MALE"],
            acceptsRiders: true,
            acceptsSexOffenders: false,
            acceptsViolentCriminals: false,
            district: "District 1",
            faithBased: true,
            id: "provider-a-location",
          },
          isSelected: true,
        },
      ],
      formData: testDoubles.currentFormValues,
      providerApplications: [],
      sentToProvidersAt: null,
    };
    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    expect(screen.getByText("Selected Providers (1)")).toBeInTheDocument();
    expect(screen.getByText("Suggestions (1)")).toBeInTheDocument();
    expect(screen.getByText("Provider A")).toBeInTheDocument();
    expect(screen.getByText("Other Provider")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send Application to 1 Provider" }),
    ).toBeEnabled();
    expect(testDoubles.sendApplicationToProviders).not.toHaveBeenCalled();
  });

  test("sends application to selected providers and shows a success modal", async () => {
    const user = userEvent.setup();
    const currentApplication = {
      eligibleProviders: [
        {
          provider: {
            email: "other-provider@example.com",
            id: "other-provider",
            name: "Other Provider",
          },
          providerLocation: {
            acceptedGenders: ["MALE"],
            acceptsRiders: true,
            acceptsSexOffenders: false,
            acceptsViolentCriminals: false,
            district: "District 1",
            faithBased: true,
            id: "other-location",
          },
        },
        {
          provider: {
            email: "provider-a@example.com",
            id: "provider-a",
            name: "Provider A",
          },
          providerLocation: {
            acceptedGenders: ["MALE"],
            acceptsRiders: true,
            acceptsSexOffenders: false,
            acceptsViolentCriminals: false,
            district: "District 1",
            faithBased: true,
            id: "provider-a-location",
          },
          isSelected: true,
        },
      ],
      formData: testDoubles.currentFormValues,
      providerApplications: [],
      sentToProvidersAt: null,
    };
    testDoubles.currentApplication = currentApplication;
    testDoubles.sendApplicationToProviders.mockImplementation(
      (_input, options) => {
        options?.onSuccess?.();
      },
    );

    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(
        screen.getByRole("button", {
          name: "Send Application to 1 Provider",
        }),
      );
    });

    expect(testDoubles.sendApplicationToProviders).toHaveBeenCalledWith(
      {
        applicationId: "application-1",
        providerIds: ["provider-a"],
      },
      { onError: expect.any(Function), onSuccess: expect.any(Function) },
    );
    expect(screen.getByText("1 Application Sent!")).toBeInTheDocument();
  });

  test("shows an error and keeps send enabled when sending application to providers fails", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      eligibleProviders: [
        {
          provider: {
            email: "provider-a@example.com",
            id: "provider-a",
            name: "Provider A",
          },
          providerLocation: {
            acceptedGenders: ["MALE"],
            acceptsRiders: true,
            acceptsSexOffenders: false,
            acceptsViolentCriminals: false,
            district: "District 1",
            faithBased: true,
            id: "provider-a-location",
          },
          isSelected: true,
        },
      ],
      formData: testDoubles.currentFormValues,
      providerApplications: [],
      sentToProvidersAt: null,
    };
    testDoubles.sendApplicationToProviders.mockImplementation(
      (_input, options) => {
        options?.onError?.(new Error("Send failed"));
      },
    );

    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    const selectedSendButton = screen.getByRole("button", {
      name: "Send Application to 1 Provider",
    });

    await act(async () => {
      await user.click(selectedSendButton);
    });

    expect(testDoubles.sendApplicationToProviders).toHaveBeenCalledWith(
      {
        applicationId: "application-1",
        providerIds: ["provider-a"],
      },
      { onError: expect.any(Function), onSuccess: expect.any(Function) },
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Failed to send application to providers.",
    );
    expect(selectedSendButton).toBeEnabled();
  });

  test("shows provider responses view when application was already sent to providers", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      eligibleProviders: [
        {
          provider: {
            email: "provider-a@example.com",
            id: "provider-a",
            name: "Provider A",
          },
          providerLocation: {
            acceptedGenders: ["MALE"],
            acceptsRiders: true,
            acceptsSexOffenders: false,
            acceptsViolentCriminals: false,
            district: "District 1",
            faithBased: true,
            id: "provider-a-location",
          },
        },
      ],
      formData: testDoubles.currentFormValues,
      providerApplications: [{ providerId: "provider-a" }],
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
    };

    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    expect(screen.getByText("No provider responses.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Application sent" }),
    ).not.toBeInTheDocument();
    expect(testDoubles.sendApplicationToProviders).not.toHaveBeenCalled();
  });

  test("shows provider response cards in staff Providers tab after application is sent", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      eligibleProviders: [],
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
    };
    testDoubles.useStaffApplicationProviders.mockReturnValue({
      data: {
        providers: [
          {
            contactPhone: "208-555-0101",
            email: "pending@example.com",
            infoRequests: [],
            providerApplicationId: "provider-app-pending",
            providerId: "provider-pending",
            providerLocation: {
              acceptedGenders: ["MALE"],
              acceptsRiders: true,
              acceptsSexOffenders: false,
              acceptsViolentCriminals: false,
              addressUsedForPPInvestigation: false,
              city: "Boise",
              district: "District 1",
              faithBased: true,
              housingType: null,
              id: "provider-pending-location",
              populationsServed: null,
              providerId: "provider-pending",
              state: "ID",
              streetAddress: "1 Main St",
              zip: "83702",
            },
            providerName: "Pending Provider",
            stage: "APPLICATION",
            status: "ACTION_NEEDED",
            subStage: "PROVIDER_REVIEW",
          },
          {
            contactPhone: "208-555-0102",
            email: "info@example.com",
            infoRequests: [
              {
                createdAt: new Date("2026-06-12T00:00:00.000Z"),
                id: "info-request-1",
                messages: [
                  {
                    body: "Please provide medication details.",
                    createdAt: new Date("2026-06-12T00:00:00.000Z"),
                    editedAt: null,
                    id: "info-message-1",
                    originalBody: null,
                    readAt: null,
                    senderPseudonymizedId: "provider-info",
                    senderType: "PROVIDER",
                  },
                ],
                resolvedAt: null,
                status: "OPEN",
                updatedAt: new Date("2026-06-12T00:00:00.000Z"),
              },
            ],
            providerApplicationId: "provider-app-info",
            providerId: "provider-info",
            providerLocation: {
              acceptedGenders: ["MALE"],
              acceptsRiders: true,
              acceptsSexOffenders: false,
              acceptsViolentCriminals: false,
              addressUsedForPPInvestigation: false,
              city: "Boise",
              district: "District 1",
              faithBased: true,
              housingType: null,
              id: "provider-info-location",
              populationsServed: null,
              providerId: "provider-info",
              state: "ID",
              streetAddress: "2 Main St",
              zip: "83702",
            },
            providerName: "Info Provider",
            stage: "APPLICATION",
            status: "WAITING",
            subStage: "INFO_NEEDED",
          },
          {
            contactPhone: "208-555-0103",
            email: "declined@example.com",
            infoRequests: [],
            providerApplicationId: "provider-app-declined",
            providerId: "provider-declined",
            providerLocation: {
              acceptedGenders: ["MALE"],
              acceptsRiders: true,
              acceptsSexOffenders: false,
              acceptsViolentCriminals: false,
              addressUsedForPPInvestigation: false,
              city: "Boise",
              district: "District 1",
              faithBased: true,
              housingType: null,
              id: "provider-declined-location",
              populationsServed: null,
              providerId: "provider-declined",
              state: "ID",
              streetAddress: "3 Main St",
              zip: "83702",
            },
            providerName: "Declined Provider",
            stage: "CLOSED",
            status: "DONE",
            subStage: "DECLINED",
          },
        ],
      },
      isError: false,
      isLoading: false,
    });

    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    expect(screen.getByText("Providers (3)")).toBeInTheDocument();
    expect(screen.getByText("Pending Provider")).toBeInTheDocument();
    expect(screen.getByText("Info Provider")).toBeInTheDocument();
    expect(screen.getByText("Declined Provider")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Info Needed")).toBeInTheDocument();
    expect(screen.getByText("Declined")).toBeInTheDocument();
    expect(
      screen.getByText("Please provide medication details."),
    ).toBeInTheDocument();
  });

  test("staff can reply to a provider information request", async () => {
    const user = userEvent.setup();
    const providerMessage = "Please provide medication details.";
    const staffReply = "The medication details are attached.";
    testDoubles.currentApplication = {
      eligibleProviders: [],
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
    };
    testDoubles.useStaffApplicationProviders.mockReturnValue({
      data: {
        providers: [
          {
            contactPhone: "208-555-0102",
            email: "info@example.com",
            infoRequests: [
              {
                createdAt: new Date("2026-06-12T00:00:00.000Z"),
                id: "info-request-1",
                messages: [
                  {
                    body: providerMessage,
                    createdAt: new Date("2026-06-12T00:00:00.000Z"),
                    editedAt: null,
                    id: "info-message-1",
                    originalBody: null,
                    readAt: null,
                    senderPseudonymizedId: "provider-info",
                    senderType: "PROVIDER",
                  },
                ],
                resolvedAt: null,
                status: "OPEN",
                updatedAt: new Date("2026-06-12T00:00:00.000Z"),
              },
            ],
            providerApplicationId: "provider-app-info",
            providerId: "provider-info",
            providerLocation: {
              acceptedGenders: ["MALE"],
              acceptsRiders: true,
              acceptsSexOffenders: false,
              acceptsViolentCriminals: false,
              addressUsedForPPInvestigation: false,
              city: "Boise",
              district: "District 1",
              faithBased: true,
              housingType: null,
              id: "provider-info-location",
              populationsServed: null,
              providerId: "provider-info",
              state: "ID",
              streetAddress: "2 Main St",
              zip: "83702",
            },
            providerName: "Info Provider",
            stage: "APPLICATION",
            status: "WAITING",
            subStage: "INFO_NEEDED",
          },
        ],
      },
      isError: false,
      isLoading: false,
    });

    const { rerender } = render(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /^Providers\b/ }));
    });
    rerender(
      <StaffPreviewModal isOpen onClose={vi.fn()} onDuplicated={vi.fn()} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Provide Info" }));
    });

    expect(screen.getByText("Provide info to provider")).toBeInTheDocument();
    expect(screen.getAllByText("Info Provider").length).toBeGreaterThan(0);
    expect(screen.getAllByText(providerMessage).length).toBeGreaterThan(0);

    await act(async () => {
      await user.type(
        screen.getByPlaceholderText("Provide the requested information..."),
        staffReply,
      );
    });
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Submit" }));
    });

    await waitFor(() => {
      expect(testDoubles.postStaffInfoReply).toHaveBeenCalledWith({
        applicationId: "application-1",
        providerApplicationId: "provider-app-info",
        message: staffReply,
      });
    });
  });

  const responseActions = () =>
    screen.getByRole("group", { name: "Application response" });

  // Sub-stage copy like "Declined" renders in both the sidebar stage tracker
  // and the response badge, so badge assertions skip the sidebar.
  const outsideSidebar = (text: string) => {
    const sidebar = screen.getByRole("complementary");
    return screen.getAllByText(text).filter((el) => !sidebar.contains(el));
  };

  const REQUEST_INFO_PLACEHOLDER =
    "e.g. We need documentation of the client's current medications";

  test("shows provider response actions in application details", () => {
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };

    renderProviderPreviewModal();

    expect(screen.getByText("Application details")).toBeInTheDocument();
    expect(
      within(responseActions()).getByRole("button", {
        name: "Conditionally Approve",
      }),
    ).toBeEnabled();
    expect(
      within(responseActions()).getByRole("button", { name: "Request Info" }),
    ).toBeEnabled();
    expect(
      within(responseActions()).getByRole("button", { name: "Decline" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Submit response" }),
    ).not.toBeInTheDocument();
  });

  test("submits conditionally approve response after confirmation", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        within(responseActions()).getByRole("button", {
          name: "Conditionally Approve",
        }),
      );
    });

    expect(
      screen.getByText("Conditionally Approve application?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Application will be marked as Conditionally Approved. You can update this decision later if needed.",
      ),
    ).toBeInTheDocument();
    expect(testDoubles.submitProviderResponse).not.toHaveBeenCalled();

    const approveButtons = screen.getAllByRole("button", {
      name: "Conditionally Approve",
    });
    expect(approveButtons).toHaveLength(2);
    await act(async () => {
      await user.click(approveButtons[1]);
    });

    expect(testDoubles.submitProviderResponse).toHaveBeenCalledWith(
      {
        applicationId: "application-1",
        response: "CONDITIONALLY_APPROVE",
      },
      { onSuccess: expect.any(Function) },
    );
  });

  test("submits nothing when going back from the approval confirmation", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        within(responseActions()).getByRole("button", {
          name: "Conditionally Approve",
        }),
      );
    });
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Go back" }));
    });

    expect(
      screen.queryByText("Conditionally Approve application?"),
    ).not.toBeInTheDocument();
    expect(testDoubles.submitProviderResponse).not.toHaveBeenCalled();
  });

  test("requires a message before sending an info request", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        within(responseActions()).getByRole("button", { name: "Request Info" }),
      );
    });

    expect(
      screen.getByText("What additional information do you need?"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(REQUEST_INFO_PLACEHOLDER)).toHaveValue(
      "",
    );
    expect(
      screen.getByRole("button", { name: "Send info request" }),
    ).toBeDisabled();
    expect(testDoubles.submitProviderResponse).not.toHaveBeenCalled();
  });

  test("submits request info response with message", async () => {
    const user = userEvent.setup();
    const message = "Please provide medication details.";
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        within(responseActions()).getByRole("button", { name: "Request Info" }),
      );
    });
    await act(async () => {
      await user.type(
        screen.getByPlaceholderText(REQUEST_INFO_PLACEHOLDER),
        `${message}  `,
      );
    });
    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Send info request" }),
      );
    });

    expect(testDoubles.submitProviderResponse).toHaveBeenCalledWith(
      {
        applicationId: "application-1",
        message,
        response: "INFO_NEEDED",
      },
      { onSuccess: expect.any(Function) },
    );
  });

  test("opens confirmation before declining an application", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        within(responseActions()).getByRole("button", { name: "Decline" }),
      );
    });

    expect(screen.getByText("Decline application?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The application will be declined and this decision cannot be changed later.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    expect(testDoubles.submitProviderResponse).not.toHaveBeenCalled();
  });

  test("submits decline response after confirmation", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        within(responseActions()).getByRole("button", { name: "Decline" }),
      );
    });

    expect(testDoubles.submitProviderResponse).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Decline Application" }),
      );
    });

    expect(testDoubles.submitProviderResponse).toHaveBeenCalledWith(
      {
        applicationId: "application-1",
        response: "DECLINE",
      },
      { onSuccess: expect.any(Function) },
    );
  });

  test("shows submitted conditionally approved state", () => {
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "CONDITIONALLY_APPROVED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    expect(screen.getAllByText("Conditionally Approved")).toHaveLength(2);
    expect(
      screen.getByRole("button", {
        name: "Revoke conditional approval",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit request" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Application response" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request Info" }),
    ).not.toBeInTheDocument();
  });

  test("opens revoke modal instead of response row when conditionally approved", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "CONDITIONALLY_APPROVED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        screen.getByRole("button", {
          name: "Revoke conditional approval",
        }),
      );
    });

    expect(screen.getByText("Revoke Conditional Approval")).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Application response" }),
    ).not.toBeInTheDocument();
  });

  test("shows submitted request info state", () => {
    const message = "Please provide medication details.";
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "INFO_NEEDED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };
    testDoubles.providerInfoRequest = {
      infoRequests: [
        {
          id: "info-request-1",
          messages: [
            {
              body: message,
              createdAt: new Date("2026-06-12T00:00:00.000Z"),
              senderType: "PROVIDER",
            },
          ],
        },
      ],
    };

    renderProviderPreviewModal();

    expect(screen.getByText("Info Requested")).toBeInTheDocument();
    // The request wording appears both in the submitted-response summary and
    // the read-only "Requests for Info" section below it.
    expect(screen.getAllByText(message)).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Edit request" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Application response" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send info request" }),
    ).not.toBeInTheDocument();
  });

  describe("editing a submitted info request", () => {
    const message = "Please provide medication details.";

    const renderSubmittedInfoRequest = () => {
      testDoubles.currentApplication = {
        id: "application-1",
        eligibleProviders: [],
        providerApplicationId: "provider-application-1",
        sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
        stage: "APPLICATION",
        subStage: "INFO_NEEDED",
        updatedAt: new Date("2026-06-12T00:00:00.000Z"),
      };
      testDoubles.providerInfoRequest = {
        infoRequests: [
          {
            id: "info-request-1",
            messages: [
              {
                body: message,
                createdAt: new Date("2026-06-12T00:00:00.000Z"),
                senderType: "PROVIDER",
              },
            ],
          },
        ],
      };

      return renderProviderPreviewModal();
    };

    test("opens a prefilled modal and edits the existing message", async () => {
      const user = userEvent.setup();
      renderSubmittedInfoRequest();

      await act(async () => {
        await user.click(screen.getByRole("button", { name: "Edit request" }));
      });

      const textarea = screen.getByPlaceholderText(REQUEST_INFO_PLACEHOLDER);
      expect(textarea).toHaveValue(message);
      expect(
        screen.getByRole("button", { name: "Send info request" }),
      ).toBeDisabled();

      await act(async () => {
        await user.type(textarea, " Include dosages.");
      });

      expect(
        screen.getByRole("button", { name: "Send info request" }),
      ).toBeEnabled();

      await act(async () => {
        await user.click(
          screen.getByRole("button", { name: "Send info request" }),
        );
      });

      expect(testDoubles.editProviderInfoRequestMessage).toHaveBeenCalledWith(
        {
          applicationId: "application-1",
          message: `${message} Include dosages.`,
        },
        { onSuccess: expect.any(Function) },
      );
      expect(testDoubles.submitProviderResponse).not.toHaveBeenCalled();
    });

    test("leaves the response row available after cancelling the modal", async () => {
      const user = userEvent.setup();
      renderSubmittedInfoRequest();

      await act(async () => {
        await user.click(screen.getByRole("button", { name: "Edit request" }));
      });
      await act(async () => {
        await user.click(screen.getByRole("button", { name: "Cancel" }));
      });

      expect(
        screen.queryByText("What additional information do you need?"),
      ).not.toBeInTheDocument();
      expect(
        within(responseActions()).getByRole("button", {
          name: "Conditionally Approve",
        }),
      ).toBeEnabled();
      expect(
        within(responseActions()).getByRole("button", { name: "Decline" }),
      ).toBeEnabled();
    });
  });

  test("shows submitted decline state", () => {
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "CLOSED",
      subStage: "DECLINED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    expect(outsideSidebar("Declined")).toHaveLength(1);
    expect(
      screen.queryByText(
        "The client no longer needs housing and/or has other plans",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit request" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Application response" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request Info" }),
    ).not.toBeInTheDocument();
  });

  const REVOKE_PLACEHOLDER = "Describe why you are revoking this approval...";

  test("shows revoke button instead of edit button when conditionally approved", () => {
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "CONDITIONALLY_APPROVED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    expect(
      screen.getByRole("button", {
        name: "Revoke conditional approval",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit request" }),
    ).not.toBeInTheDocument();
  });

  test("shows edit button instead of revoke button when info needed", () => {
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "INFO_NEEDED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };
    testDoubles.providerInfoRequest = {
      infoRequests: [
        {
          id: "info-request-1",
          messages: [
            {
              body: "Need medication docs",
              createdAt: new Date("2026-06-12T00:00:00.000Z"),
              senderType: "PROVIDER",
            },
          ],
        },
      ],
    };

    renderProviderPreviewModal();

    expect(
      screen.getByRole("button", { name: "Edit request" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Revoke conditional approval",
      }),
    ).not.toBeInTheDocument();
  });

  test("opens revoke modal when clicking revoke button", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "CONDITIONALLY_APPROVED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        screen.getByRole("button", {
          name: "Revoke conditional approval",
        }),
      );
    });

    expect(screen.getByText("Revoke Conditional Approval")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(REVOKE_PLACEHOLDER)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revoke approval" }),
    ).toBeDisabled();
  });

  test("submits revoke with REVOKE_CONDITIONAL_APPROVAL response and entered reason", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "CONDITIONALLY_APPROVED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        screen.getByRole("button", {
          name: "Revoke conditional approval",
        }),
      );
    });

    const textarea = screen.getByPlaceholderText(REVOKE_PLACEHOLDER);
    await act(async () => {
      await user.type(textarea, "Tenant failed background check");
    });

    expect(
      screen.getByRole("button", { name: "Revoke approval" }),
    ).toBeEnabled();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Revoke approval" }));
    });

    expect(testDoubles.submitProviderResponse).toHaveBeenCalledWith(
      {
        applicationId: "application-1",
        response: "REVOKE_CONDITIONAL_APPROVAL",
        message: "Tenant failed background check",
      },
      { onSuccess: expect.any(Function) },
    );
  });

  test("closes revoke modal on cancel", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "CONDITIONALLY_APPROVED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        screen.getByRole("button", {
          name: "Revoke conditional approval",
        }),
      );
    });

    expect(screen.getByText("Revoke Conditional Approval")).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Cancel" }));
    });

    expect(
      screen.queryByText("Revoke Conditional Approval"),
    ).not.toBeInTheDocument();
  });

  test("tells the provider the revoke reason is shared with the case manager", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "CONDITIONALLY_APPROVED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Revoke conditional approval" }),
      );
    });

    expect(
      screen.getByText(
        "Your reason will also be shared with the case manager.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/revoking will close this application/),
    ).not.toBeInTheDocument();
  });

  test("warns the home plan provider that revoking closes the application", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPROVALS",
      subStage: "SELECTED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Revoke conditional approval" }),
      );
    });

    expect(
      screen.getByText(
        "As the selected home plan, revoking will close this application and it can't be undone.",
        { exact: false },
      ),
    ).toBeInTheDocument();
  });

  describe("after revoking before a home plan is picked", () => {
    beforeEach(() => {
      testDoubles.currentApplication = {
        id: "application-1",
        eligibleProviders: [],
        providerApplicationId: "provider-application-1",
        sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
        stage: "APPLICATION",
        subStage: "CONDITIONAL_APPROVAL_REVOKED",
        updatedAt: new Date("2026-06-12T00:00:00.000Z"),
      };
    });

    test("shows the revoked badge and an Edit response button, without the reason", () => {
      renderProviderPreviewModal();

      expect(outsideSidebar("Approval Canceled")).toHaveLength(1);
      expect(
        screen.getByRole("button", { name: "Edit response" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          "This case is now closed because you revoked the conditional approval. For any follow-ups, contact the Case Manager directly.",
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("group", { name: "Application response" }),
      ).not.toBeInTheDocument();
    });

    test("Edit response brings back all three responses", async () => {
      const user = userEvent.setup();
      renderProviderPreviewModal();

      await act(async () => {
        await user.click(screen.getByRole("button", { name: "Edit response" }));
      });

      const responses = screen.getByRole("group", {
        name: "Application response",
      });
      for (const name of ["Conditionally Approve", "Request Info", "Decline"]) {
        expect(within(responses).getByRole("button", { name })).toBeEnabled();
      }
    });
  });

  test.each([
    { stage: "APPROVALS", canRevoke: true },
    { stage: "RELEASE", canRevoke: false },
  ])(
    "home plan provider in $stage: revoke shown is $canRevoke, never Edit",
    ({ stage, canRevoke }) => {
      testDoubles.currentApplication = {
        id: "application-1",
        eligibleProviders: [],
        providerApplicationId: "provider-application-1",
        sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
        stage,
        subStage: "SELECTED",
        updatedAt: new Date("2026-06-12T00:00:00.000Z"),
      };

      renderProviderPreviewModal();

      expect(
        screen.queryByRole("button", { name: "Revoke conditional approval" }) !=
          null,
      ).toBe(canRevoke);
      expect(
        screen.queryByRole("button", { name: /^Edit/ }),
      ).not.toBeInTheDocument();
    },
  );

  test("shows the closed footnote and no actions after the home plan provider revokes", () => {
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "CLOSED",
      subStage: "CONDITIONAL_APPROVAL_REVOKED",
      updatedAt: new Date("2026-06-12T00:00:00.000Z"),
    };

    renderProviderPreviewModal();

    expect(outsideSidebar("Approval Canceled")).toHaveLength(1);
    expect(
      screen.getByText(
        "This case is now closed because you revoked the conditional approval. For any follow-ups, contact the Case Manager directly.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Revoke conditional approval" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Edit/ }),
    ).not.toBeInTheDocument();
  });

  test("shows application details when provider opens a sent application", async () => {
    const user = userEvent.setup();
    testDoubles.currentApplication = {
      id: "application-1",
      eligibleProviders: [],
      providerApplicationId: "provider-application-1",
      sentToProvidersAt: new Date("2026-06-11T00:00:00.000Z"),
      stage: "APPLICATION",
      subStage: "PROVIDER_REVIEW",
    };

    renderProviderPreviewModal();

    expect(
      screen.getByRole("button", { name: "Application Details" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Application details")).toBeInTheDocument();
    expect(
      within(responseActions()).getByRole("button", {
        name: "Conditionally Approve",
      }),
    ).toBeEnabled();
    expect(
      within(responseActions()).getByRole("button", { name: "Request Info" }),
    ).toBeEnabled();
    expect(
      within(responseActions()).getByRole("button", { name: "Decline" }),
    ).toBeEnabled();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Expand all" }));
    });

    const cmPoNameField = screen.getByText("CM/PO Name").closest("div");
    expect(cmPoNameField).not.toBeNull();
    expect(
      within(cmPoNameField as HTMLElement).getByText("Casey Manager"),
    ).toBeInTheDocument();

    const fullNameField = screen.getByText("Full Name").closest("div");
    expect(fullNameField).not.toBeNull();
    expect(
      within(fullNameField as HTMLElement).getByText("John Doe"),
    ).toBeInTheDocument();

    const idocNumberField = screen.getByText("IDOC#").closest("div");
    expect(idocNumberField).not.toBeNull();
    expect(
      within(idocNumberField as HTMLElement).getByText("999999"),
    ).toBeInTheDocument();
  });
});
