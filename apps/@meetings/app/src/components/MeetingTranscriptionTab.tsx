// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import MenuAlt2Icon from "react-native-heroicons/outline/MenuAlt2Icon";
import DocumentSearchIcon from "react-native-heroicons/solid/DocumentSearchIcon";

import SearchBar from "../shared/ui/SearchBar";
import { Typography } from "../shared/ui/Typography";

type Props = {
  transcription?: {
    confidence: number | null;
    summary: string | null;
    utterances: {
      confidence: number;
      startTimeMs: number;
      text: string;
      speaker: string;
      endTimeMs: number;
    }[];
  };
  transcriptDeleted?: boolean;
};

const TranscriptUnavailable = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <>
    <Typography className="text-xl font-semibold text-primary">
      Transcript
    </Typography>
    <View className="flex flex-col items-center gap-6 pt-[100px]">
      <View className="flex w-fit items-center justify-center rounded-2xl border-2 border-subtle bg-secondary p-[14px]">
        {icon}
      </View>
      <View className="flex flex-col gap-[14px]">
        <Typography className="text-center font-libre-baskerville text-[28px] font-bold leading-[32px] text-primary">
          Transcript unavailable
        </Typography>
        <Typography className="text-center text-sm font-normal text-secondary">
          {children}
        </Typography>
      </View>
    </View>
  </>
);

const formatSpeakerStartTime = (startTimeMs: number) => {
  const totalSeconds = startTimeMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const formattedSeconds = String(seconds).padStart(2, "0");

  return `${minutes}:${formattedSeconds}`;
};

const MeetingsTranscriptionTab = ({
  transcription,
  transcriptDeleted,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (transcriptDeleted) {
    return (
      <TranscriptUnavailable
        icon={<MenuAlt2Icon className="size-10 stroke-tertiary" />}
      >
        {`This meeting’s transcript is no longer\navailable due to department policy`}
      </TranscriptUnavailable>
    );
  }

  if (!transcription) {
    return (
      <TranscriptUnavailable
        icon={<DocumentSearchIcon className="size-10 fill-tertiary" />}
      >
        Transcript unavailable in this state due to legal restrictions.
      </TranscriptUnavailable>
    );
  }

  const filteredTranscriptions =
    transcription.utterances.filter((u) =>
      u.text.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <ScrollView className="flex flex-col">
      <Typography className="mb-3 text-xl font-semibold text-primary">
        Transcript
      </Typography>
      <SearchBar
        placeholder="Search by keyword or phrase"
        value={searchQuery}
        onChange={setSearchQuery}
        onExit={() => {
          setSearchQuery("");
        }}
      />
      {filteredTranscriptions.map((u, index) => (
        <View
          key={`${u.startTimeMs}-${index}`}
          className="mt-3 flex flex-col gap-1"
        >
          <View className="flex flex-row gap-2">
            <Typography className="text-sm font-normal text-secondary">
              {formatSpeakerStartTime(u.startTimeMs)}
            </Typography>
            <Typography className="text-sm font-semibold text-secondary">
              {u.speaker}
            </Typography>
          </View>
          <Typography className="text-sm font-normal text-primary">
            {u.text}
          </Typography>
        </View>
      ))}
    </ScrollView>
  );
};

export default MeetingsTranscriptionTab;
