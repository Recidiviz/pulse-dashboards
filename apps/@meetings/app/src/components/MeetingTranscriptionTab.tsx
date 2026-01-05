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

import { useState } from "react";
import { Image, Text, View } from "react-native";

import Icons from "../../assets/icons";
import SearchBar from "./SearchBar";

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
};

const formatSpeakerStartTime = (startTimeMs: number) => {
  const totalSeconds = startTimeMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const formattedSeconds = String(seconds).padStart(2, "0");

  return `${minutes}:${formattedSeconds}`;
};

const MeetingsTranscriptionTab = ({ transcription }: Props) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!transcription) {
    return (
      <View className="flex flex-col items-center gap-6 pt-[60px]">
        <View className="flex w-fit items-center justify-center rounded-2xl border-2 border-[#2B696908] bg-[#2B696908] p-[14px]">
          <Image
            source={Icons.LockBig}
            className="!size-10"
            resizeMode="contain"
          />
        </View>
        <View className="flex flex-col gap-[14px]">
          <Text className="text-center font-libre-baskerville text-[28px] font-bold leading-[32px] text-[#35536280]">
            Transcript unavailable
          </Text>
          <Text className="text-center font-inter text-sm font-normal text-gray-500">
            Transcript unavailable in this state due to legal restrictions.
          </Text>
        </View>
      </View>
    );
  }

  const filteredTranscriptions =
    transcription.utterances.filter((u) =>
      u.text.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <View className="flex flex-col gap-3">
      <SearchBar
        placeholder="Search by keyword or phrase"
        value={searchQuery}
        onChange={setSearchQuery}
        onExit={() => {
          setSearchQuery("");
        }}
      />
      {filteredTranscriptions.map((u) => (
        <View key={u.startTimeMs} className="flex flex-col gap-1">
          <View className="flex flex-row gap-2">
            <Text className="font-inter text-sm font-normal text-[#355362D9]">
              {formatSpeakerStartTime(u.startTimeMs)}
            </Text>
            <Text className="font-inter text-sm font-semibold text-[#355362D9]">
              {u.speaker}
            </Text>
          </View>
          <Text className="font-inter text-sm font-normal text-primary">
            {u.text}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default MeetingsTranscriptionTab;
