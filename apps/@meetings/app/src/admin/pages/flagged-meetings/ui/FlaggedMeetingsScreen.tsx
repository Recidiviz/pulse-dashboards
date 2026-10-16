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

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import type {
  FlaggedMeetingSummary,
  StaffEmailTask,
} from "~@meetings/app/admin/api/flaggedMeetings";
import { isNeedsReview } from "~@meetings/app/admin/entities/flagged-meeting-review";
import { SegmentedControl } from "~@meetings/app/admin/ui/SegmentedControl";
import { Tabs } from "~@meetings/app/admin/ui/Tabs";
import { AdminLayout } from "~@meetings/app/admin/widgets/admin-sidebar";
import { useUserContext } from "~@meetings/app/entities/user";
import { trpc } from "~@meetings/app/shared/api";
import { RootStackParamList } from "~@meetings/app/shared/config";
import { useSetDocumentTitle } from "~@meetings/app/shared/lib/platform";
import Loading from "~@meetings/app/shared/ui/Loading";
import SearchBar from "~@meetings/app/shared/ui/SearchBar";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { MEETINGS_STATE_CODES } from "~@meetings/config";

import {
  type DimensionFilter,
  filterByPromptFollowUp,
  filterFlaggedMeetings,
  type FlaggedBy,
  type PromptFollowUpFilter,
  withinLookback,
} from "../lib/filterFlaggedMeetings";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { useFlaggedMeetingsTabStore } from "../model/tabStore";
import { FilterDropdown, type FilterOption } from "./FilterDropdown";
import { FlaggedMeetingsTable } from "./FlaggedMeetingsTable";
import { LoadErrorPanel } from "./LoadErrorPanel";
import { StaffEmailsTable } from "./StaffEmailsTable";

const SEARCH_DEBOUNCE_MS = 300;
const ALL_STATES = "ALL";

/** Needs review is the whole backlog, so every tab reads the same 365-day window. */
const QUERY_LOOKBACK_DAYS = 365;

const LOOKBACK_OPTIONS: FilterOption<"30" | "90" | "365">[] = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 365 days" },
];

const FLAGGED_BY_OPTIONS: FilterOption<FlaggedBy>[] = [
  {
    value: "any",
    label: "Any source",
    subtitle: "LLM judge, Label Studio or staff",
  },
  {
    value: "llm",
    label: "LLM judge",
    subtitle: "BAD case note, action items or overall from LLMAJ",
  },
  {
    value: "labelStudio",
    label: "Label Studio",
    subtitle: "BAD after combining raters",
  },
  {
    value: "vote",
    label: "In-app thumbs down",
    subtitle: "A staff thumbs down in the app",
  },
];

const PROMPT_FOLLOW_UP_OPTIONS: FilterOption<PromptFollowUpFilter>[] = [
  { value: "any", label: "Any" },
  { value: "either", label: "Either prompt" },
  { value: "notetaking", label: "Notetaking prompt" },
  { value: "judge", label: "LLM judge prompt" },
];

const DIMENSION_OPTIONS: FilterOption<DimensionFilter>[] = [
  { value: "any", label: "Any" },
  { value: "CASE_NOTE", label: "Case note" },
  { value: "ACTION_ITEMS", label: "Action items" },
  { value: "OVERALL", label: "Overall" },
];

export const FlaggedMeetingsScreen = () => {
  useSetDocumentTitle("Flagged meetings");
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { recidivizAllowedStates } = useUserContext();

  const [state, setState] = useState(ALL_STATES);
  const [lookback, setLookback] =
    useState<(typeof LOOKBACK_OPTIONS)[number]["value"]>("30");
  const { tab, setTab, staffEmailsView, setStaffEmailsView } =
    useFlaggedMeetingsTabStore();
  const [flaggedBy, setFlaggedBy] = useState<FlaggedBy>("any");
  const [dimension, setDimension] = useState<DimensionFilter>("any");
  const [promptFollowUp, setPromptFollowUp] =
    useState<PromptFollowUpFilter>("any");
  const [searchText, setSearchText] = useState("");
  const search = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS).trim();

  // "All" leaves US_DEMO out, as the server does; it is listed here so it can be chosen by name.
  const stateOptions = useMemo<FilterOption<string>[]>(
    () => [
      { value: ALL_STATES, label: "All" },
      ...recidivizAllowedStates
        .filter((code) => MEETINGS_STATE_CODES.includes(code))
        .map((code) => ({ value: code, label: code.replace(/^US_/, "") }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ],
    [recidivizAllowedStates],
  );

  const { data, isLoading, isError, refetch } =
    trpc.v1.flaggedMeetings.list.useQuery({
      lookbackDays: QUERY_LOOKBACK_DAYS,
      ...(state !== ALL_STATES && {
        stateCodes: [state as FlaggedMeetingSummary["stateCode"]],
      }),
      ...(search && { search }),
    });

  const staffEmails = trpc.v1.flaggedMeetings.listStaffEmails.useQuery();
  const utils = trpc.useUtils();
  const snackbar = useSnackbar();
  const setStaffEmailSent =
    trpc.v1.flaggedMeetings.setStaffEmailSent.useMutation({
      onSuccess: async () => {
        await Promise.all([
          utils.v1.flaggedMeetings.listStaffEmails.invalidate(),
          utils.v1.flaggedMeetings.getDetails.invalidate(),
        ]);
      },
    });
  const markSent = (email: StaffEmailTask, sent: boolean) =>
    setStaffEmailSent.mutate(
      { stateCode: email.stateCode, outcomeId: email.outcomeId, sent },
      {
        onSuccess: () =>
          sent &&
          snackbar.showSnackbar(
            `Marked as sent to ${email.staffEmail ?? "staff"}.`,
          ),
      },
    );
  const toSend = staffEmails.data?.filter((e) => !e.sentAt) ?? [];
  const sent = staffEmails.data?.filter((e) => e.sentAt) ?? [];

  // The meeting-date filter only narrows the finished work; Needs review
  // always shows the whole backlog.
  const { meetings, needsCount } = useMemo(() => {
    const filtered = data
      ? filterFlaggedMeetings(data.meetings, flaggedBy, dimension)
      : [];
    const needs = filtered.filter((m) => isNeedsReview(m.reviews));
    // Only recorded outcomes carry prompt follow-ups, so the filter applies to
    // the finished work, like the meeting-date filter.
    const dated = filterByPromptFollowUp(
      withinLookback(filtered, Number(lookback)),
      promptFollowUp,
    );
    const reviewed = dated.filter((m) => !isNeedsReview(m.reviews));
    return {
      meetings: { needs, reviewed, all: dated, staffEmails: [] }[tab],
      needsCount: needs.length,
    };
  }, [data, flaggedBy, dimension, lookback, promptFollowUp, tab]);

  const sourceFailed = data?.sources.some((s) => s.status === "failed");

  const openMeeting = (meeting: { stateCode: string; meetingId: string }) =>
    navigation.navigate("AdminFlaggedMeeting", {
      stateCode: meeting.stateCode,
      meetingId: meeting.meetingId,
    });

  const renderStaffEmailTasks = () => {
    if (staffEmails.isError) {
      return <LoadErrorPanel onRetry={() => staffEmails.refetch()} />;
    }
    if (staffEmails.isLoading)
      return <Loading message="Loading staff emails…" />;
    const shown = staffEmailsView === "sent" ? sent : toSend;
    return (
      <View className="gap-3">
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            value={staffEmailsView}
            onChange={setStaffEmailsView}
            options={[
              { value: "toSend", label: `To send ${toSend.length}` },
              { value: "sent", label: `Sent ${sent.length}` },
            ]}
          />
          <Typography variant="body-s-regular" className="!text-secondary">
            Meetings where a reviewer chose &quot;Email staff&quot;. Send the
            email, then mark it sent here.
          </Typography>
        </View>
        {setStaffEmailSent.error && (
          <Typography variant="body-s-regular" className="!text-attention">
            {`Couldn't update the email: ${setStaffEmailSent.error.message}`}
          </Typography>
        )}
        {shown.length === 0 ? (
          <View className="items-center rounded-lg border border-subtle px-4 py-10">
            <Typography variant="body-s-regular" className="!text-tertiary">
              {staffEmailsView === "sent"
                ? "No emails marked as sent yet."
                : "No staff emails to send."}
            </Typography>
          </View>
        ) : (
          <StaffEmailsTable
            emails={shown}
            onOpen={openMeeting}
            onSetSent={markSent}
            pendingOutcomeId={
              setStaffEmailSent.isPending
                ? setStaffEmailSent.variables?.outcomeId ?? null
                : null
            }
          />
        )}
      </View>
    );
  };

  const renderResults = () => {
    if (tab === "staffEmails") return renderStaffEmailTasks();
    if (isError) return <LoadErrorPanel onRetry={() => refetch()} />;
    if (isLoading) return <Loading message="Loading flagged meetings…" />;
    if (!data) return null;
    if (sourceFailed) {
      return (
        <LoadErrorPanel sources={data.sources} onRetry={() => refetch()} />
      );
    }
    return (
      <View className="gap-3">
        {meetings.length === 0 ? (
          <View className="items-center rounded-lg border border-subtle px-4 py-10">
            <Typography variant="body-s-regular" className="!text-tertiary">
              {tab === "needs"
                ? "Nothing here. Every meeting in this view has an outcome."
                : "Nothing here. No meetings are flagged in this view."}
            </Typography>
          </View>
        ) : (
          <FlaggedMeetingsTable meetings={meetings} onOpen={openMeeting} />
        )}
        <Typography variant="caption-s-regular" className="!text-tertiary">
          {`${meetings.length} ${meetings.length === 1 ? "meeting" : "meetings"}`}
        </Typography>
      </View>
    );
  };

  return (
    <AdminLayout active="AdminFlaggedMeetings">
      <ScrollView contentContainerClassName="gap-6">
        <View className="gap-1">
          <Typography variant="heading-3" className="font-libre-baskerville">
            Flagged meetings
          </Typography>
          <Typography variant="body-s-regular">
            Meetings rated BAD by the LLM judge or in Label Studio, or given a
            thumbs down in the app.
          </Typography>
        </View>
        {/* Counts from a failed or partial load would mislead. */}
        {data && !sourceFailed && (
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              // Only the backlog gets a count. Reviewed and All flagged follow the
              // meeting-date filter, so their counts don't add up to the backlog.
              { value: "needs", label: "Needs review", count: needsCount },
              { value: "reviewed", label: "Reviewed" },
              { value: "all", label: "All flagged" },
              // To send and Sent counts are inside the tab.
              { value: "staffEmails", label: "Staff emails" },
            ]}
          />
        )}
        {/* z-20 keeps an open filter menu above the table. The filters don't apply to staff emails. */}
        {tab !== "staffEmails" && (
          <View className="relative z-20 flex-row flex-wrap items-center gap-x-6 gap-y-2">
            <FilterDropdown
              label="State"
              options={stateOptions}
              value={state}
              onChange={setState}
            />
            {tab !== "needs" && (
              <FilterDropdown
                label="Meeting date"
                options={LOOKBACK_OPTIONS}
                value={lookback}
                onChange={setLookback}
              />
            )}
            <FilterDropdown
              label="Flagged by"
              options={FLAGGED_BY_OPTIONS}
              value={flaggedBy}
              onChange={setFlaggedBy}
            />
            <FilterDropdown
              label="Dimension"
              options={DIMENSION_OPTIONS}
              value={dimension}
              onChange={setDimension}
            />
            {tab !== "needs" && (
              <FilterDropdown
                label="Prompt follow-up"
                options={PROMPT_FOLLOW_UP_OPTIONS}
                value={promptFollowUp}
                onChange={setPromptFollowUp}
              />
            )}
            <View className="ml-auto w-[260px]">
              <SearchBar
                value={searchText}
                placeholder="Meeting id or staff email"
                onChange={setSearchText}
                onExit={() => setSearchText("")}
              />
            </View>
          </View>
        )}
        {renderResults()}
      </ScrollView>
    </AdminLayout>
  );
};
