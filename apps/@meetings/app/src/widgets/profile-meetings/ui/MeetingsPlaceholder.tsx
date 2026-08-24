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

import { View } from "react-native";
import { PlusIcon } from "react-native-heroicons/outline";
import SearchIcon from "react-native-heroicons/solid/SearchIcon";

import { Button } from "~@meetings/app/shared/ui/Button";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type Props = {
  handleCreateMeeting: () => void;
  isSearchResultEmpty: boolean;
};

const MeetingsPlaceholder = ({
  handleCreateMeeting,
  isSearchResultEmpty,
}: Props) => {
  const emptyListPlaceholderTitle = "No meetings yet";
  const emptyListPlaceholderSubtitle =
    "Create a new meeting when you're ready.";
  const emptySearchPlaceholderTitle = "No meetings found";
  const emptySearchPlaceholderSubtitle =
    "Try adjusting your search or use different keywords.";

  return (
    <View className="flex min-h-[50vh] flex-1 items-center justify-center md:min-h-[40vh]">
      <View className="mb-4 flex size-11 items-center justify-center rounded-xl border border-subtle bg-secondary">
        <SearchIcon className="!size-6 fill-tertiary" />
      </View>
      <Typography className="text-center font-libre-baskerville text-2xl font-semibold leading-[30px] tracking-[-0.56px] text-primary">
        {isSearchResultEmpty
          ? emptySearchPlaceholderTitle
          : emptyListPlaceholderTitle}
      </Typography>
      <Typography variant="body-s-regular" className="mb-6 text-center">
        {isSearchResultEmpty
          ? emptySearchPlaceholderSubtitle
          : emptyListPlaceholderSubtitle}
      </Typography>
      {!isSearchResultEmpty && (
        <Button
          variant="primary"
          icon={{ icon: PlusIcon, className: "!size-4" }}
          onPress={handleCreateMeeting}
        >
          Meeting
        </Button>
      )}
    </View>
  );
};

export default MeetingsPlaceholder;
