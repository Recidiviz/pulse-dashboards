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

import clsx from "clsx";
import { useWindowDimensions, View } from "react-native";
import { PlusIcon } from "react-native-heroicons/outline";

import { useRecording } from "~@meetings/app/features/recording";
import { Person } from "~@meetings/app/shared/api";
import { usePlatform } from "~@meetings/app/shared/lib/platform";
import { Button } from "~@meetings/app/shared/ui/Button";
import Dropdown from "~@meetings/app/shared/ui/Dropdown";
import SearchBar from "~@meetings/app/shared/ui/SearchBar";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  person: Person;
  meetingsCount: number;
  handleOpenBottomSheet: () => void;
  handleOpenModal: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortOptions: string[];
  setSortBy: (value: string) => void;
};

const MeetingsHeaderContent = ({
  person,
  meetingsCount,
  handleOpenBottomSheet,
  handleOpenModal,
  searchQuery,
  setSearchQuery,
  sortOptions,
  setSortBy,
}: Props) => {
  const { status: recordingState } = useRecording<"native">();
  const { isWeb, isMobile } = usePlatform();
  const { width } = useWindowDimensions();
  const showSearchAndSort = !(meetingsCount <= 1 && !searchQuery);
  const showCountAndCreate = !(meetingsCount === 0 && !searchQuery);

  const onPressNewMeeting =
    isWeb && width >= 768 ? handleOpenModal : handleOpenBottomSheet;

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
          <Typography variant="body-m-regular" className="text-secondary">
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
            <Typography variant="heading-4">
              Meetings{" "}
              <Typography variant="heading-4" className="text-tertiary">
                ({meetingsCount})
              </Typography>
            </Typography>
            {recordingState === "idle" && (
              <Button
                variant="primary"
                icon={{ icon: PlusIcon, className: "!size-4 stroke-[3px]" }}
                onPress={onPressNewMeeting}
              >
                Meeting
              </Button>
            )}
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
