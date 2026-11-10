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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { APPLICATION_STAGE } from "~@idaho-th/shared";

import {
  createTrpcDouble,
  type TrpcDouble,
} from "../../../../hooks/__tests__/trpcHookDouble";
import { TimelineView } from "../TimelineView";

const mocks = vi.hoisted(() => ({
  staffTimeline: vi.fn(),
  providerTimeline: vi.fn(),
  detail: vi.fn(),
}));

vi.mock("../../../../hooks/useTimeline", () => ({
  useStaffTimeline: (...args: unknown[]) => mocks.staffTimeline(...args),
  useProviderTimeline: (...args: unknown[]) => mocks.providerTimeline(...args),
}));

vi.mock("../../StaffPreviewModal/StaffClosedBanner", () => ({
  StaffClosedBanner: () => <div>Staff closed banner</div>,
}));

vi.mock("../../../../hooks/useApplicationDetail", () => ({
  useApplicationDetailByRole: (...args: unknown[]) => mocks.detail(...args),
}));

const trpcDouble: { current: TrpcDouble | undefined } = vi.hoisted(() => ({
  current: undefined,
}));

vi.mock("../../../../trpc/client", () => ({
  get trpc() {
    return trpcDouble.current?.trpc;
  },
}));

const APPLICATION_ID = "app-1";

function queryResult({
  events = [] as unknown[],
  isSuccess = true,
  isLoading = false,
  isError = false,
} = {}) {
  return {
    data: isSuccess ? { events } : undefined,
    isSuccess,
    isLoading,
    isError,
  };
}

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: "event-1",
    actorRole: "STAFF",
    description: "Application submitted",
    message: null,
    createdAt: new Date("2026-03-04T15:30:00Z"),
    ...overrides,
  };
}

let double: TrpcDouble;

beforeEach(() => {
  vi.clearAllMocks();
  double = createTrpcDouble();
  trpcDouble.current = double;
  mocks.staffTimeline.mockReturnValue(queryResult());
  mocks.providerTimeline.mockReturnValue(queryResult());
  mocks.detail.mockReturnValue({ stage: APPLICATION_STAGE.APPROVALS });
});

function renderTimeline({
  withApplication = true,
  variant = "staff" as "staff" | "provider",
} = {}) {
  // A destructuring default fires for an explicit `undefined`, so the absent
  // application is expressed as a flag rather than as `applicationId: undefined`.
  return render(
    <TimelineView
      applicationId={withApplication ? APPLICATION_ID : undefined}
      variant={variant}
    />,
  );
}

describe("TimelineView", () => {
  describe("role routing", () => {
    it("reads the staff timeline for staff and leaves the provider query off", () => {
      renderTimeline({ variant: "staff" });

      expect(mocks.staffTimeline).toHaveBeenCalledWith(APPLICATION_ID, true);
      expect(mocks.providerTimeline).toHaveBeenCalledWith(
        APPLICATION_ID,
        false,
      );
    });

    it("reads the provider timeline for a provider and leaves the staff query off", () => {
      renderTimeline({ variant: "provider" });

      expect(mocks.providerTimeline).toHaveBeenCalledWith(APPLICATION_ID, true);
      expect(mocks.staffTimeline).toHaveBeenCalledWith(APPLICATION_ID, false);
    });

    it("disables both queries with no application id", () => {
      renderTimeline({ withApplication: false });

      expect(mocks.staffTimeline).toHaveBeenCalledWith(undefined, false);
      expect(mocks.providerTimeline).toHaveBeenCalledWith(undefined, false);
    });

    it("renders the provider's own events, not the staff feed", () => {
      mocks.staffTimeline.mockReturnValue(
        queryResult({ events: [event({ description: "Staff only" })] }),
      );
      mocks.providerTimeline.mockReturnValue(
        queryResult({ events: [event({ description: "Provider only" })] }),
      );

      renderTimeline({ variant: "provider" });

      expect(screen.getByText("Provider only")).toBeInTheDocument();
      expect(screen.queryByText("Staff only")).not.toBeInTheDocument();
    });
  });

  describe("marking the timeline viewed", () => {
    it("marks it viewed for staff once the query succeeds", () => {
      renderTimeline({ variant: "staff" });

      expect(double.mutation("timeline.markViewedForStaff")).toBeDefined();
      expect(double.mutation("timeline.markViewedForProvider")).toBeDefined();
    });

    it("refreshes the staff timeline after marking it viewed", () => {
      renderTimeline({ variant: "staff" });
      const onSuccess = double.mutation("timeline.markViewedForStaff").options[
        "onSuccess"
      ] as () => void;

      onSuccess();

      expect(double.invalidatedPaths()).toEqual(["timeline.getForStaff"]);
    });

    it("refreshes the provider timeline after marking it viewed", () => {
      renderTimeline({ variant: "provider" });
      const onSuccess = double.mutation("timeline.markViewedForProvider")
        .options["onSuccess"] as () => void;

      onSuccess();

      expect(double.invalidatedPaths()).toEqual(["timeline.getForProvider"]);
    });
  });

  describe("panel states", () => {
    it("says it is loading while the query is in flight", () => {
      mocks.staffTimeline.mockReturnValue(
        queryResult({ isSuccess: false, isLoading: true }),
      );

      renderTimeline();

      expect(screen.getByText("Loading timeline…")).toBeInTheDocument();
    });

    it("reports a load failure", () => {
      mocks.staffTimeline.mockReturnValue(
        queryResult({ isSuccess: false, isError: true }),
      );

      renderTimeline();

      expect(screen.getByText("Failed to load timeline.")).toBeInTheDocument();
    });

    it("says the timeline is empty rather than showing a blank panel", () => {
      renderTimeline();

      expect(screen.getByText("No timeline events yet.")).toBeInTheDocument();
    });

    it("shows the closed banner to staff on a closed case", () => {
      mocks.detail.mockReturnValue({ stage: APPLICATION_STAGE.CLOSED });

      renderTimeline({ variant: "staff" });

      expect(screen.getByText("Staff closed banner")).toBeInTheDocument();
    });

    it("does not show the staff closed banner to a provider", () => {
      mocks.detail.mockReturnValue({ stage: APPLICATION_STAGE.CLOSED });

      renderTimeline({ variant: "provider" });

      expect(screen.getByText("Timeline")).toBeInTheDocument();
      expect(screen.queryByText("Staff closed banner")).not.toBeInTheDocument();
    });
  });

  describe("events", () => {
    it("renders each event with its actor, description and date", () => {
      mocks.staffTimeline.mockReturnValue(
        queryResult({
          events: [
            event({ id: "event-1", description: "Application submitted" }),
            event({ id: "event-2", description: "Sent to providers" }),
          ],
        }),
      );

      renderTimeline();

      expect(screen.getByText("Application submitted")).toBeInTheDocument();
      expect(screen.getByText("Sent to providers")).toBeInTheDocument();
      expect(screen.getAllByText("Mar 4")).toHaveLength(2);
    });

    it("shows no expand control for an event with no message", () => {
      mocks.staffTimeline.mockReturnValue(queryResult({ events: [event()] }));

      renderTimeline();

      expect(
        screen.queryByRole("button", { name: /Show more/ }),
      ).not.toBeInTheDocument();
    });

    it("expands and collapses an event that carries a message", async () => {
      const user = userEvent.setup();
      mocks.staffTimeline.mockReturnValue(
        queryResult({
          events: [
            event({ message: "Please confirm the release date.", id: "e1" }),
          ],
        }),
      );

      renderTimeline();

      expect(
        screen.getByText("Please confirm the release date."),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Show more/ }));
      expect(
        screen.getByRole("button", { name: /Collapse/ }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Collapse/ }));
      expect(
        screen.getByRole("button", { name: /Show more/ }),
      ).toBeInTheDocument();
    });

    it("expands one event without expanding its siblings", async () => {
      const user = userEvent.setup();
      mocks.staffTimeline.mockReturnValue(
        queryResult({
          events: [
            event({ id: "e1", message: "First message" }),
            event({ id: "e2", message: "Second message" }),
          ],
        }),
      );

      renderTimeline();

      await user.click(
        screen.getAllByRole("button", { name: /Show more/ })[0] as HTMLElement,
      );

      expect(screen.getAllByRole("button", { name: /Collapse/ })).toHaveLength(
        1,
      );
      expect(screen.getAllByRole("button", { name: /Show more/ })).toHaveLength(
        1,
      );
    });
  });
});
