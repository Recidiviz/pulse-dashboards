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

import { Image, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";

export enum Tab {
  Notes = "Notes",
  Transcription = "Transcription",
}

type Props = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isTranscriptionUnavailable?: boolean;
};

const MeetingTabs = ({
  activeTab,
  setActiveTab,
  isTranscriptionUnavailable,
}: Props) => {
  return (
    <View className="flex w-full flex-row rounded-full bg-[#E6EAEB] p-1">
      {Object.values(Tab).map((tab) => (
        <TouchableOpacity
          key={tab}
          className={`flex w-1/2 items-center justify-center rounded-full bg-transparent p-2.5 ${tab === activeTab ? "bg-white" : "bg-[#E6EAEB]"}`}
          onPress={() => setActiveTab(tab)}
        >
          <View className="flex flex-row items-center justify-center gap-1">
            <Text
              className={`font-inter text-sm font-medium leading-[16px] ${tab === activeTab ? "text-primary" : "text-[#9AA6AC]"}`}
            >
              {tab}
            </Text>
            {tab === Tab.Transcription && isTranscriptionUnavailable && (
              <Image
                source={Icons.LockSmall}
                className="!size-3"
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default MeetingTabs;
