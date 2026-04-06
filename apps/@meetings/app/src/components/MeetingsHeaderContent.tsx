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

import { TouchableOpacity } from "@gorhom/bottom-sheet";
import clsx from "clsx";
import { ActivityIndicator, Platform, View } from "react-native";
import { PlusIcon } from "react-native-heroicons/outline";
import UploadIcon from "react-native-heroicons/solid/UploadIcon";

import { Person } from "../common/types";
import { useRecording } from "../features/recording";
import useIsOnline from "../hooks/useIsOnline.native";
import { usePlatform } from "../hooks/usePlatform";
import { Typography } from "../shared/ui/Typography";
import Dropdown from "./Dropdown";
import SearchBar from "./SearchBar";

type Props = {
  person: Person;
  meetingsCount: number;
  handleCreateMeeting: () => void;
  isMeetingCreating: boolean;
  handleAudioUpload: () => void;
  handleOpenBottomSheet: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortOptions: string[];
  setSortBy: (value: string) => void;
};

const MeetingsHeaderContent = ({
  person,
  meetingsCount,
  handleCreateMeeting,
  handleAudioUpload,
  isMeetingCreating,
  handleOpenBottomSheet,
  searchQuery,
  setSearchQuery,
  sortOptions,
  setSortBy,
}: Props) => {
  const { status: recordingState } = useRecording<"native">();
  const { isWeb, isMobile } = usePlatform();
  const showSearchAndSort = !(meetingsCount <= 1 && !searchQuery);
  const showCountAndCreate = !(meetingsCount === 0 && !searchQuery);
  const { isOnline } = useIsOnline();

  const NativeMeetingControls = () => (
    <TouchableOpacity onPress={handleOpenBottomSheet}>
      <View className="flex flex-row items-center gap-1 rounded-full bg-brand px-4 py-2">
        <PlusIcon className="!size-4 stroke-on-brand stroke-[3px]" />
        <Typography className="text-sm font-semibold leading-4 text-on-brand">
          Meeting
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const WebMeetingControls = () => (
    <>
      <View className="md:hidden">
        <TouchableOpacity onPress={handleOpenBottomSheet}>
          <View className="flex flex-row items-center gap-1 rounded-full bg-brand px-4 py-2">
            <PlusIcon className="!size-4 stroke-on-brand stroke-[3px]" />
            <Typography className="text-sm font-semibold leading-4 text-on-brand">
              Meeting
            </Typography>
          </View>
        </TouchableOpacity>
      </View>
      <View className="hidden flex-row items-center gap-1 md:flex">
        <TouchableOpacity
          disabled={!isOnline}
          aria-disabled={!isOnline}
          onPress={handleAudioUpload}
        >
          <View className="flex-row items-center gap-1 px-4 py-2">
            <UploadIcon className="!size-4 fill-brand" />
            <Typography
              className={clsx(
                "text-sm font-semibold leading-4 text-brand",
                !isOnline && "text-gray-400",
              )}
            >
              Upload
            </Typography>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCreateMeeting}
          disabled={isMeetingCreating}
        >
          <View className="flex flex-row items-center gap-1 rounded-full bg-brand px-4 py-2">
            {isMeetingCreating ? (
              <ActivityIndicator className="!size-1 px-2" />
            ) : (
              <PlusIcon className="!size-4 stroke-on-brand stroke-[3px]" />
            )}
            <Typography className="text-sm font-semibold leading-4 text-on-brand">
              Meeting
            </Typography>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <>
      <View
        className={clsx(
          "rounded-b-3xl sm:flex-row sm:justify-between sm:gap-x-4",
          isMobile && "bg-primary",
          isWeb && "bg-primary md:bg-transparent md:pt-4",
        )}
      >
        <View
          className={clsx(
            "flex flex-col gap-1 p-4",
            isWeb && "md:px-0 md:pt-0",
          )}
        >
          <Typography className="font-libre-baskerville text-3xl font-semibold text-primary">
            {person.fullName}
          </Typography>
          <Typography className="text-base text-secondary">
            ID: {person.displayPersonExternalId} • {person.primaryMetadata}
          </Typography>
        </View>
      </View>
      <View
        className={clsx(
          "flex flex-col gap-3 px-4 pb-3 pt-5",
          isWeb && "md:px-0",
        )}
      >
        {showCountAndCreate && (
          <View className="flex flex-row items-center justify-between">
            <Typography className="text-xl font-semibold text-primary">
              Meetings{" "}
              <Typography className="text-xl font-semibold text-tertiary">
                ({meetingsCount})
              </Typography>
            </Typography>
            {recordingState === "idle" &&
              Platform.select({
                native: <NativeMeetingControls />,
                web: <WebMeetingControls />,
              })}
          </View>
        )}
        {showSearchAndSort && (
          <View className="flex-1">
            <SearchBar
              placeholder="Enter keyword or phrase"
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </View>
        )}
      </View>
      {showSearchAndSort && (
        <View
          className={clsx(
            "z-10 mb-2 flex-row items-center justify-end px-4",
            isWeb && "md:mb-4 md:px-0",
          )}
        >
          <Dropdown
            label="Sort by"
            options={sortOptions}
            onSelect={setSortBy}
          />
        </View>
      )}
    </>
  );
};

export default MeetingsHeaderContent;
