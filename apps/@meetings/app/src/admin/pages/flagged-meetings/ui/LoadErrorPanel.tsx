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

import { View } from "react-native";

import type { FlaggedMeetingSourceStatus } from "~@meetings/app/admin/api/flaggedMeetings";
import { StatusBadge } from "~@meetings/app/admin/ui/StatusBadge";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Typography } from "~@meetings/app/shared/ui/Typography";

const SOURCE_LABEL: Record<FlaggedMeetingSourceStatus["name"], string> = {
  database: "Meetings database",
  evaluations: "LLM evaluations",
  labelStudio: "Label Studio",
  inAppFeedback: "In-app feedback",
};

function joinAnd(items: string[]): string {
  if (items.length < 2) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

type LoadErrorPanelProps = {
  /** Omitted when the request itself failed, so no source is blamed. */
  sources?: FlaggedMeetingSourceStatus[];
  onRetry: () => void;
};

export const LoadErrorPanel = ({ sources, onRetry }: LoadErrorPanelProps) => {
  const failed = (sources ?? []).filter((s) => s.status === "failed");

  return (
    <View className="max-w-[680px] gap-5 rounded-lg border border-subtle px-8 py-7">
      <View className="items-start gap-2">
        <StatusBadge tone="bad" dot>
          Data didn't load
        </StatusBadge>
        <Typography variant="heading-4">
          Flagged meetings couldn't load
        </Typography>
        <Typography variant="body-s-regular">
          {failed.length > 0
            ? `${joinAnd(failed.map((s) => SOURCE_LABEL[s.name]))} didn't respond, so the list is hidden. Showing the other sources on their own could leave meetings out of the queue.`
            : "The request failed, so the list is hidden. Try again in a moment."}
        </Typography>
      </View>
      {sources && (
        <View className="rounded-lg border border-subtle">
          {sources.map((source) => (
            <View
              key={source.name}
              className="flex-row items-center justify-between gap-3 border-b border-subtle px-3.5 py-2.5 last:border-b-0"
            >
              <Typography variant="body-s-medium">
                {SOURCE_LABEL[source.name]}
              </Typography>
              <View className="flex-row items-center gap-2.5">
                {source.error && (
                  <Typography
                    variant="caption-s-regular"
                    className="font-mono !text-tertiary"
                  >
                    {source.error}
                  </Typography>
                )}
                {source.status === "failed" && (
                  <StatusBadge tone="bad">Failed</StatusBadge>
                )}
                {source.status === "ok" && (
                  <StatusBadge tone="good">Loaded</StatusBadge>
                )}
                {source.status === "not_configured" && (
                  <StatusBadge tone="neutral">Not configured</StatusBadge>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
      <View className="flex-row">
        <Button variant="primary" onPress={onRetry}>
          Try again
        </Button>
      </View>
    </View>
  );
};
