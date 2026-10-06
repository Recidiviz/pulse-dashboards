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

import type {
  FlaggedMeetingSourceStatus,
  FlaggedMeetingSummary,
} from "~@meetings/app/admin/api/flaggedMeetings";

import { FlaggedMeetingsScreen } from "./FlaggedMeetingsScreen";

const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("~@meetings/app/shared/api", () => ({
  trpc: {
    v1: {
      flaggedMeetings: {
        list: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
      },
    },
  },
}));

jest.mock("~@meetings/app/entities/user", () => ({
  useUserContext: () => ({ recidivizAllowedStates: ["US_NE", "US_DEMO"] }),
}));

jest.mock("~@meetings/app/shared/lib/platform", () => ({
  useSetDocumentTitle: jest.fn(),
}));

jest.mock("~@meetings/app/admin/widgets/admin-sidebar", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => children,
}));

const noVotes = { llm: false, labelStudio: false, vote: false };

const meeting = {
  meetingId: "m-123",
  stateCode: "US_NE",
  startTime: new Date("2020-08-11T12:00:00Z"),
  staffEmail: "officer@example.org",
  llm: {
    evaluatorVersion: "v1",
    createdAt: new Date(),
    grades: { caseNote: "BAD", actionItems: "GOOD", overall: "GOOD" },
  },
  labelStudio: {
    status: "rated",
    taskId: 1,
    raterCount: 2,
    combined: { caseNote: "PARTIAL", actionItems: "GOOD", overall: "GOOD" },
  },
  votes: [{ tab: "ACTION_ITEMS", vote: "DOWN" }],
  sections: {
    CASE_NOTE: { ...noVotes, llm: true },
    ACTION_ITEMS: { ...noVotes, vote: true },
    OVERALL: noVotes,
  },
} as unknown as FlaggedMeetingSummary;

const okSources: FlaggedMeetingSourceStatus[] = [
  { name: "database", status: "ok" },
  { name: "evaluations", status: "ok" },
  { name: "labelStudio", status: "ok" },
  { name: "inAppFeedback", status: "ok" },
];

function mockResult(overrides: Record<string, unknown>) {
  mockUseQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
    ...overrides,
  });
}

describe("FlaggedMeetingsScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders a row with a badge for each source", () => {
    mockResult({ data: { sources: okSources, meetings: [meeting] } });
    render(<FlaggedMeetingsScreen />);

    expect(screen.getByText("m-123")).toBeTruthy();
    expect(screen.getByText("NE")).toBeTruthy();
    expect(screen.getByText("Aug 11, 2020")).toBeTruthy();
    expect(screen.getByText("officer@example.org")).toBeTruthy();
    expect(screen.getByText("Bad · Case note")).toBeTruthy();
    expect(screen.getByText("Partial")).toBeTruthy();
    expect(screen.getByText("2 raters")).toBeTruthy();
    expect(screen.getByText("Thumbs down · Action items")).toBeTruthy();
    expect(screen.getByText("1 meeting")).toBeTruthy();
  });

  it("shows the empty state", () => {
    mockResult({ data: { sources: okSources, meetings: [] } });
    render(<FlaggedMeetingsScreen />);

    expect(
      screen.getByText("Nothing here. No meetings are flagged in this view."),
    ).toBeTruthy();
    expect(screen.getByText("0 meetings")).toBeTruthy();
  });

  it("hides the list and offers a retry when a source failed", () => {
    mockResult({
      data: {
        sources: [
          okSources[0],
          okSources[1],
          { name: "labelStudio", status: "failed", error: "IAP returned 401" },
          okSources[3],
        ],
        meetings: [meeting],
      },
    });
    render(<FlaggedMeetingsScreen />);

    expect(screen.getByText("Flagged meetings couldn't load")).toBeTruthy();
    expect(screen.getByText(/Label Studio didn't respond/)).toBeTruthy();
    expect(screen.getByText("IAP returned 401")).toBeTruthy();
    expect(screen.queryByText("m-123")).toBeNull();

    fireEvent.press(screen.getByText("Try again"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows the error panel without source statuses when the request fails", () => {
    mockResult({ isError: true });
    render(<FlaggedMeetingsScreen />);

    expect(screen.getByText("Flagged meetings couldn't load")).toBeTruthy();
    expect(screen.queryByText("Meetings database")).toBeNull();
    fireEvent.press(screen.getByText("Try again"));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("navigates with only the state code and meeting id on row click", () => {
    mockResult({ data: { sources: okSources, meetings: [meeting] } });
    render(<FlaggedMeetingsScreen />);

    fireEvent(screen.getByText("m-123"), "click");
    expect(mockNavigate).toHaveBeenCalledWith("AdminFlaggedMeeting", {
      stateCode: "US_NE",
      meetingId: "m-123",
    });
  });

  it("lists the states alphabetically after All", () => {
    mockResult({ data: { sources: okSources, meetings: [] } });
    render(<FlaggedMeetingsScreen />);

    fireEvent.press(screen.getByRole("button", { name: /State/ }));

    // The first "All" is the trigger's current value.
    expect(
      screen
        .getAllByText(/^(All|DEMO|NE)$/)
        .map((element) => element.props.children),
    ).toEqual(["All", "All", "DEMO", "NE"]);
  });

  it("queries the last 365 days across all states by default", () => {
    mockResult({ isLoading: true });
    render(<FlaggedMeetingsScreen />);

    expect(mockUseQuery).toHaveBeenCalledWith({ lookbackDays: 365 });
    expect(screen.getByText("Loading flagged meetings…")).toBeTruthy();
  });
});
