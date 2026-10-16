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
  StaffEmailTask,
} from "~@meetings/app/admin/api/flaggedMeetings";

import { useFlaggedMeetingsTabStore } from "../model/tabStore";
import { FlaggedMeetingsScreen } from "./FlaggedMeetingsScreen";

const mockNavigate = jest.fn();
const mockRefetch = jest.fn();
const mockUseQuery = jest.fn();
const mockStaffEmailTasks = jest.fn();
const mockSetSent = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("~@meetings/app/shared/api", () => ({
  trpc: {
    v1: {
      flaggedMeetings: {
        list: { useQuery: (...args: unknown[]) => mockUseQuery(...args) },
        listStaffEmails: { useQuery: () => mockStaffEmailTasks() },
        setStaffEmailSent: {
          useMutation: () => ({
            mutate: mockSetSent,
            isPending: false,
            error: null,
          }),
        },
      },
    },
    useUtils: () => ({}),
  },
}));

jest.mock("~@meetings/app/shared/ui/Snackbar", () => ({
  useSnackbar: () => ({ showSnackbar: jest.fn() }),
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

const needsReview = {
  status: "needs_review",
  latestOutcome: null,
  reopened: null,
};
const notFlagged = {
  status: "not_flagged",
  latestOutcome: null,
  reopened: null,
};

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
  reviews: {
    CASE_NOTE: needsReview,
    ACTION_ITEMS: needsReview,
    OVERALL: notFlagged,
  },
} as unknown as FlaggedMeetingSummary;

const reviewedMeeting = {
  ...meeting,
  meetingId: "m-456",
  startTime: new Date(),
  reviews: {
    CASE_NOTE: {
      status: "reviewed",
      latestOutcome: {
        id: "outcome-1",
        outcome: "CONFIRMED_BAD",
        followUp: "EMAIL_STAFF",
        correctedGrade: null,
        overriddenSources: [],
        appliesTo: [],
        notetakingPromptFollowUp: false,
        judgePromptFollowUp: false,
        staffEmailSentAt: null,
        staffEmailSentBy: null,
        notes: null,
        reviewerEmail: "admin@example.org",
        createdAt: new Date(),
      },
      reopened: null,
    },
    ACTION_ITEMS: notFlagged,
    OVERALL: notFlagged,
  },
} as unknown as FlaggedMeetingSummary;

const okSources: FlaggedMeetingSourceStatus[] = [
  { name: "database", status: "ok" },
  { name: "evaluations", status: "ok" },
  { name: "labelStudio", status: "ok" },
  { name: "inAppFeedback", status: "ok" },
];

const emailTask = {
  outcomeId: "outcome-1",
  stateCode: "US_NE",
  meetingId: "m-po",
  startTime: new Date("2026-09-10T12:00:00Z"),
  staffEmail: "officer@example.org",
  section: "CASE_NOTE",
  outcome: "CONFIRMED_BAD",
  notes: "Wrong curfew time.",
  reviewerEmail: "admin@example.org",
  recordedAt: new Date("2026-09-11T12:00:00Z"),
  sentAt: null,
  sentBy: null,
} satisfies StaffEmailTask;

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
  beforeEach(() => {
    jest.clearAllMocks();
    useFlaggedMeetingsTabStore.setState({
      tab: "needs",
      staffEmailsView: "toSend",
    });
    mockStaffEmailTasks.mockReturnValue({
      data: [
        emailTask,
        {
          ...emailTask,
          outcomeId: "outcome-2",
          meetingId: "m-sent",
          sentAt: new Date("2026-09-12T12:00:00Z"),
          sentBy: "admin@example.org",
        },
      ],
      isLoading: false,
      isError: false,
    });
  });

  it("lists staff emails to send in their own tab, without the list filters", () => {
    mockResult({ data: { sources: okSources, meetings: [meeting] } });
    render(<FlaggedMeetingsScreen />);

    fireEvent.press(screen.getByRole("tab", { name: /Staff emails/ }));
    expect(screen.queryByRole("button", { name: /Flagged by/ })).toBeNull();
    expect(screen.getByText("m-po")).toBeTruthy();
    expect(screen.getByText("officer@example.org")).toBeTruthy();
    expect(screen.queryByText("m-sent")).toBeNull();

    fireEvent.press(screen.getByText("Mark as sent"));
    expect(mockSetSent).toHaveBeenCalledWith(
      { stateCode: "US_NE", outcomeId: "outcome-1", sent: true },
      expect.anything(),
    );

    fireEvent.press(screen.getByRole("radio", { name: /Sent/ }));
    expect(screen.getByText("m-sent")).toBeTruthy();
    fireEvent.press(screen.getByText("Undo"));
    expect(mockSetSent).toHaveBeenLastCalledWith(
      { stateCode: "US_NE", outcomeId: "outcome-2", sent: false },
      expect.anything(),
    );
  });

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
    // The tab and the row's Outcome badge.
    expect(screen.getAllByText("Needs review")).toHaveLength(2);
  });

  it("splits meetings across the Needs review, Reviewed and All tabs", () => {
    mockResult({
      data: { sources: okSources, meetings: [meeting, reviewedMeeting] },
    });
    render(<FlaggedMeetingsScreen />);

    // Needs review is the default tab.
    expect(screen.getByText("m-123")).toBeTruthy();
    expect(screen.queryByText("m-456")).toBeNull();

    fireEvent.press(screen.getByRole("tab", { name: /Reviewed/ }));
    expect(screen.queryByText("m-123")).toBeNull();
    expect(screen.getByText("m-456")).toBeTruthy();
    expect(
      screen.getByText("Confirmed BAD · Staff email pending"),
    ).toBeTruthy();

    // All flagged follows the meeting-date filter, which leaves out the 2020 meeting.
    fireEvent.press(screen.getByRole("tab", { name: /All flagged/ }));
    expect(screen.queryByText("m-123")).toBeNull();
    expect(screen.getByText("m-456")).toBeTruthy();
  });

  it("shows a count only on Needs review", () => {
    mockResult({ data: { sources: okSources, meetings: [meeting] } });
    render(<FlaggedMeetingsScreen />);

    expect(screen.getByRole("tab", { name: /Needs review/ })).toHaveTextContent(
      "Needs review1",
    );
    expect(screen.getByRole("tab", { name: /Reviewed/ })).toHaveTextContent(
      "Reviewed",
      { exact: true },
    );
    expect(screen.getByRole("tab", { name: /All flagged/ })).toHaveTextContent(
      "All flagged",
      { exact: true },
    );
  });

  it("limits Reviewed and All by meeting date but not Needs review", () => {
    // The fixture meetings are from 2020, far outside the default 30 days.
    mockResult({ data: { sources: okSources, meetings: [meeting] } });
    render(<FlaggedMeetingsScreen />);

    expect(screen.queryByRole("button", { name: /Meeting date/ })).toBeNull();
    expect(screen.getByText("m-123")).toBeTruthy();

    fireEvent.press(screen.getByRole("tab", { name: /All flagged/ }));
    expect(screen.getByRole("button", { name: /Meeting date/ })).toBeTruthy();
    expect(screen.queryByText("m-123")).toBeNull();
  });

  it("shows the empty state", () => {
    mockResult({ data: { sources: okSources, meetings: [] } });
    render(<FlaggedMeetingsScreen />);

    expect(
      screen.getByText(
        "Nothing here. Every meeting in this view has an outcome.",
      ),
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
