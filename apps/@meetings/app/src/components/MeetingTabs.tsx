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

import { Pressable, ScrollView } from "react-native";
import LockClosedIcon from "react-native-heroicons/solid/LockClosedIcon";

import { Typography } from "../shared/ui/Typography";

export enum Tab {
  DraftCaseNotes = "Draft Case Notes",
  ActionItems = "Action Items",
  CriticalUpdates = "Critical Updates",
  Transcript = "Transcript",
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
    : Object.values(Tab).filter((tab) => tab !== Tab.Transcript);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-1 bg-screen rounded-full p-1"
    >
      {visibleTabs.map((tab) => (
        <Pressable
          key={tab}
          className={`shrink-0 flex-row items-center justify-center gap-2 rounded-full px-4 py-1.5 ${tab === activeTab ? "bg-primary" : "bg-transparent"}`}
          onPress={() => setActiveTab(tab)}
          disabled={tab === Tab.Transcript && isTranscriptionUnavailable}
          style={
            tab === activeTab
              ? {
                  shadowColor: "#000000",
                  shadowOffset: { width: 3, height: 5 },
                  shadowRadius: 30,
                  shadowOpacity: 0.05,
                  elevation: 5,
                }
              : undefined
          }
        >
          <Typography
            className={`text-base ${tab === activeTab ? "text-primary" : "text-secondary"}`}
          >
            {tab}
          </Typography>
          {tab === Tab.Transcript && isTranscriptionUnavailable && (
            <LockClosedIcon className="size-3 fill-disabled" />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default MeetingTabs;
