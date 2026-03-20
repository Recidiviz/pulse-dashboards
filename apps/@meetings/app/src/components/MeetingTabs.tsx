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

import { Pressable, View } from "react-native";
import LockClosedIcon from "react-native-heroicons/solid/LockClosedIcon";

import { Typography } from "../shared/ui/Typography";

export enum Tab {
  Notes = "Notes",
  Transcription = "Transcription",
}

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isTranscriptionUnavailable?: boolean;
  showTranscription: boolean;
};

const MeetingTabs = ({
  activeTab,
  setActiveTab,
  isTranscriptionUnavailable,
  showTranscription,
}: Props) => {
  const visibleTabs = showTranscription
    ? Object.values(Tab)
    : Object.values(Tab).filter((tab) => tab !== Tab.Transcription);

  // Hide tabs entirely if only one tab is visible
  if (visibleTabs.length <= 1) {
    return null;
  }

  return (
    <View className="flex w-full flex-row rounded-full bg-screen p-1">
      {visibleTabs.map((tab) => (
        <Pressable
          key={tab}
          className={`flex w-1/2 items-center justify-center rounded-full p-2.5 ${tab === activeTab ? "bg-primary" : "bg-transparent"}`}
          onPress={() => setActiveTab(tab)}
          disabled={tab === Tab.Transcription && isTranscriptionUnavailable}
        >
          <View className="flex flex-row items-center justify-center gap-1">
            <Typography
              className={`text-sm font-medium leading-[16px] ${tab === activeTab ? "text-primary" : "text-tertiary"}`}
            >
              {tab}
            </Typography>
            {tab === Tab.Transcription && isTranscriptionUnavailable && (
              <LockClosedIcon className="size-3 fill-disabled" />
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default MeetingTabs;
