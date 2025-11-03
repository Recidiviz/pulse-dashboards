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

import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";

type MeetingCardProps = {
  meeting: {
    id: string;
    date: string;
    time: string;
    duration: string | null;
    content: string;
  };
  onPress?: (id: string) => void;
};

const MeetingCard = ({ meeting, onPress }: MeetingCardProps) => {
  // const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress && onPress(meeting.id)}
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-primary font-[inter] text-base font-semibold">
          {meeting.date}
        </Text>
        <Image
          source={Icons.ArrowRight}
          className="ml-2 size-3.5"
          style={{ resizeMode: "contain" }}
        />
      </View>

      <Text className="text-primary mr-1 text-xs font-medium">
        {meeting.time} • {meeting.duration || "In progress..."}
      </Text>
      {/* <View className="my-2 border-b border-gray-200" />
       <View className="mt-3">
        <Text
          className="text-sm leading-5 text-gray-700"
          numberOfLines={isExpanded ? undefined : 2}
        >
          {meeting.content}
        </Text>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="mt-1 flex-row items-center"
        >
          <Text className="mr-1 text-xs font-medium text-primary">
            {isExpanded ? "Less" : "More"}
          </Text>
          <Image
            source={isExpanded ? Icons.ArrowUp : Icons.ArrowDown}
            className="size-3.5"
            style={{ resizeMode: "contain" }}
          />
        </TouchableOpacity>
      </View> */}
    </TouchableOpacity>
  );
};

export default MeetingCard;
