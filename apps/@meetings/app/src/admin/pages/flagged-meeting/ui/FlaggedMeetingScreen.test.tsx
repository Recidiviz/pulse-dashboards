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

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";

import { makeDetails, makeRater, withRaters } from "../lib/detailsFixture";
import { FlaggedMeetingScreen } from "./FlaggedMeetingScreen";

let mockQuery: {
  data?: FlaggedMeetingDetails;
  error?: { message: string };
  isLoading: boolean;
  refetch: jest.Mock;
};

jest.mock("~@meetings/app/shared/api", () => ({
  trpc: {
    v1: {
      flaggedMeetings: {
        getDetails: { useQuery: () => mockQuery },
      },
    },
  },
}));

jest.mock("~@meetings/app/admin/widgets/admin-sidebar", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("~@meetings/app/entities/agency-config", () => ({
  useAgencyConfigs: () => ({
    agencyConfigs: { US_NE: { name: "Nebraska" } },
  }),
}));

jest.mock("~@meetings/app/shared/lib/platform", () => ({
  useSetDocumentTitle: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useRoute: () => ({
    params: { stateCode: "US_NE", meetingId: "meeting-123" },
  }),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const renderWith = (data: FlaggedMeetingDetails) => {
  mockQuery = { data, isLoading: false, refetch: jest.fn() };
  return render(<FlaggedMeetingScreen />);
};

describe("FlaggedMeetingScreen", () => {
  it("shows the heading and meta line", () => {
    renderWith(makeDetails());
    expect(screen.getByText("meeting-123")).toBeTruthy();
    expect(
      screen.getByText("Nebraska · Sep 1, 2026 · 25 min · officer@example.com"),
    ).toBeTruthy();
  });

  it("shows Not sent when there is no Label Studio task", () => {
    renderWith(makeDetails());
    expect(screen.getAllByText("Not sent").length).toBeGreaterThan(0);
  });

  it("shows the task as not rated yet when it has no raters", () => {
    renderWith(makeDetails({ labelStudio: withRaters([]) }));
    expect(screen.getByText("Task 77 · not rated yet ↗")).toBeTruthy();
    expect(screen.getAllByText("Not rated yet").length).toBeGreaterThan(0);
  });

  it("renders a column per rater and the override note", () => {
    renderWith(
      makeDetails({
        labelStudio: withRaters(
          [
            makeRater(),
            makeRater({
              raterEmail: "admin@recidiviz.org",
              isAuthoritative: true,
            }),
          ],
          {
            overall: {
              grade: "GOOD",
              worst: "BAD",
              overriddenByAuthoritative: true,
            },
            caseNote: {
              grade: "BAD",
              worst: "BAD",
              overriddenByAuthoritative: false,
            },
            actionItems: {
              grade: "GOOD",
              worst: "GOOD",
              overriddenByAuthoritative: false,
            },
          },
        ),
      }),
    );
    expect(screen.getByText("alex")).toBeTruthy();
    expect(screen.getByText("admin (authoritative)")).toBeTruthy();
    expect(screen.getByText("Admin override · worst was Bad")).toBeTruthy();
    expect(
      screen.getByText(/Combined grade: admin@recidiviz.org/),
    ).toBeTruthy();
  });

  it("shows approval state on the case note", () => {
    renderWith(makeDetails());
    expect(screen.getByText(/^Approved /)).toBeTruthy();
    expect(screen.getByText("Not edited by staff.")).toBeTruthy();
  });

  it("only offers Generated/Final/Changes when edited with an original", () => {
    const edited = {
      current: "New text",
      original: "Old text",
      editedAt: new Date("2026-09-02T12:00:00Z"),
      approvedAt: null,
    };
    const { unmount } = renderWith(makeDetails());
    expect(screen.queryByText("Changes")).toBeNull();
    unmount();

    const first = renderWith(makeDetails({ caseNote: edited }));
    expect(screen.getByText("Changes")).toBeTruthy();
    expect(screen.getByText("Generated")).toBeTruthy();
    expect(screen.getByText("Not approved")).toBeTruthy();
    first.unmount();

    renderWith(makeDetails({ caseNote: { ...edited, original: null } }));
    expect(screen.queryByText("Changes")).toBeNull();
    expect(
      screen.getByText(
        "The original generated note isn't available for this meeting.",
      ),
    ).toBeTruthy();
  });

  it("opens an edited case note on the Changes view", () => {
    renderWith(
      makeDetails({
        caseNote: {
          current: "New text",
          original: "Old text",
          editedAt: new Date("2026-09-02T12:00:00Z"),
          approvedAt: null,
        },
      }),
    );
    expect(screen.getByText("Removed by staff")).toBeTruthy();
    expect(screen.getByText("Added by staff")).toBeTruthy();
  });

  it("marks action items staff added, edited and deleted", () => {
    const item = {
      assignee: "Client",
      editedTask: null,
      context: null,
      completed: false,
      deleted: false,
      addedByStaff: false,
    };
    renderWith(
      makeDetails({
        actionItems: {
          items: [
            { ...item, generatedTask: "Generated one" },
            { ...item, generatedTask: "Officer added", addedByStaff: true },
            { ...item, generatedTask: "Dropped", deleted: true },
          ],
          legacyItems: [],
          editedAt: null,
          approvedAt: null,
        },
      }),
    );
    fireEvent.press(screen.getByRole("tab", { name: /Action items/ }));
    expect(screen.getByText("Added by staff")).toBeTruthy();
    expect(screen.getByText("Deleted by staff")).toBeTruthy();
  });

  it("explains a deleted transcript", () => {
    renderWith(
      makeDetails({
        transcript: null,
        transcriptDeletedAt: new Date("2026-09-10T12:00:00Z"),
      }),
    );
    expect(
      screen.getByText(
        "Transcript and audio deleted Sep 10, 2026 under the retention policy. Ratings and notes are kept.",
      ),
    ).toBeTruthy();
  });

  it("shows the error message with a retry", () => {
    mockQuery = {
      error: { message: "Meeting not found" },
      isLoading: false,
      refetch: jest.fn(),
    };
    render(<FlaggedMeetingScreen />);
    expect(screen.getByText("Meeting not found")).toBeTruthy();
    fireEvent.press(screen.getByText("Retry"));
    expect(mockQuery.refetch).toHaveBeenCalled();
  });
});
