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

import { View, VirtualizedList } from "react-native";

import type { PostMeetingProcessingStatus } from "~@meetings/trpc-types";

import { Person, PersonType } from "../common/types";
import MeetingCardItem from "./MeetingCardItem";
import MeetingsHeaderContent from "./MeetingsHeaderContent";
import MeetingsPlaceholder from "./MeetingsPlaceholder";

type Meeting = {
  id: string;
  date: string;
  time: string;
  duration: string | null;
  content: string;
  status: PostMeetingProcessingStatus;
  recordingState: string;
  start: Date;
  end: Date | null;
  caseNote: string | null;
};

type Props = {
  meetings: Meeting[];
  person: Person;
  handleCreateMeeting: () => void;
  isMeetingCreating: boolean;
  handleAudioUpload: () => void;
  handleOpenBottomSheet: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOptions: string[];
  setSortBy: (option: string) => void;
  personType: PersonType;
  className?: string;
};

const MeetingsMobileList = ({
  meetings,
  person,
  handleCreateMeeting,
  isMeetingCreating,
  handleAudioUpload,
  handleOpenBottomSheet,
  searchQuery,
  setSearchQuery,
  sortOptions,
  setSortBy,
  personType,
  className,
}: Props) => {
  return (
    <VirtualizedList
      className={className}
      data={meetings}
      keyExtractor={(item: Meeting) => item.id}
      getItemCount={(data: Meeting[]) => data.length}
      getItem={(data: Meeting[], index) => data[index]}
      renderItem={({ item }: { item: Meeting }) => (
        <MeetingCardItem
          meeting={item}
          person={person}
          personType={personType}
        />
      )}
      initialNumToRender={10}
      ListHeaderComponentStyle={{ zIndex: 50, flex: 1 }}
      ListHeaderComponent={
        <View className="mx-auto w-full max-w-[960px]">
          <MeetingsHeaderContent
            person={person}
            meetingsCount={meetings.length}
            handleCreateMeeting={handleCreateMeeting}
            isMeetingCreating={isMeetingCreating}
            handleAudioUpload={handleAudioUpload}
            handleOpenBottomSheet={handleOpenBottomSheet}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortOptions={sortOptions}
            setSortBy={setSortBy}
          />
        </View>
      }
      ListEmptyComponent={
        <MeetingsPlaceholder
          handleCreateMeeting={handleCreateMeeting}
          isSearchResultEmpty={searchQuery.trim().length > 0}
        />
      }
      contentContainerStyle={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingBottom: 16,
      }}
    />
  );
};

export default MeetingsMobileList;
