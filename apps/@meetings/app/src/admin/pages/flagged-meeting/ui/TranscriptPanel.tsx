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

import { ScrollView, View } from "react-native";

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { formatClock, formatDate, formatMinutes } from "../lib/format";

function emptyMessage(details: FlaggedMeetingDetails): string {
  if (details.transcriptDeletedAt) {
    return `Transcript and audio deleted ${formatDate(details.transcriptDeletedAt)} under the retention policy. Ratings and notes are kept.`;
  }
  return "No transcript available.";
}

export function TranscriptPanel({
  details,
}: {
  details: FlaggedMeetingDetails;
}) {
  const { transcript, durationMs } = details;
  const title =
    durationMs !== null
      ? `Transcript · ${formatMinutes(durationMs)}`
      : "Transcript";

  return (
    <View className="min-w-[320px] flex-[1.2] overflow-hidden rounded-lg border border-subtle">
      <View className="border-b border-subtle px-4 py-2.5">
        <Typography variant="caption-s-medium" className="!text-secondary">
          {title}
        </Typography>
      </View>
      {transcript && transcript.length > 0 ? (
        <ScrollView style={{ maxHeight: 560 }} contentContainerClassName="py-2">
          {transcript.map((utterance, index) => (
            <View key={index} className="flex-row gap-2.5 px-4 py-2">
              <Typography
                variant="caption-s-regular"
                className="w-11 font-mono !text-tertiary"
              >
                {formatClock(utterance.startTimeMs)}
              </Typography>
              <View className="flex-1 gap-0.5">
                <Typography
                  variant="caption-s-medium"
                  className="!text-secondary"
                >
                  {utterance.speaker}
                </Typography>
                <Typography variant="body-s-regular" className="!text-primary">
                  {utterance.text}
                </Typography>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="px-5 py-8">
          <Typography
            variant="body-s-regular"
            className="text-center !text-tertiary"
          >
            {emptyMessage(details)}
          </Typography>
        </View>
      )}
    </View>
  );
}
