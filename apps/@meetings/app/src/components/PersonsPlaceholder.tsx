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

import clsx from "clsx";
import { View } from "react-native";
import SearchIcon from "react-native-heroicons/solid/SearchIcon";

import { PersonType } from "../common/types";
import { Typography } from "../shared/ui/Typography";

type Props = {
  personType: PersonType;
  isSearchResultEmpty: boolean;
};

const PersonsPlaceholder = ({ personType, isSearchResultEmpty }: Props) => {
  const emptyListPlaceholderTitle = `No ${personType}s yet`;
  const emptySearchPlaceholderTitle =
    personType === "client" ? "No clients on caseload" : "No residents found";
  const emptyListPlaceholderSubtitle = `Your ${personType}s will be listed here.`;
  const emptySearchPlaceholderSubtitle =
    "Try adjusting your search or use different keywords.";

  return (
    <View
      className={clsx(
        "min-h-full flex-1 items-center justify-center",
        isSearchResultEmpty ? "pt-16" : "pt-48",
      )}
    >
      <View className="mb-4 flex size-11 items-center justify-center rounded-xl border border-subtle bg-secondary">
        <SearchIcon className="!size-6 fill-tertiary" />
      </View>
      <Typography className="text-center font-libre-baskerville text-2xl font-extrabold leading-[30px] tracking-[-0.56px] text-primary">
        {isSearchResultEmpty
          ? emptySearchPlaceholderTitle
          : emptyListPlaceholderTitle}
      </Typography>
      <Typography className="mb-6 text-center text-sm font-normal tracking-[-0.28px] text-secondary">
        {isSearchResultEmpty
          ? emptySearchPlaceholderSubtitle
          : emptyListPlaceholderSubtitle}
      </Typography>
    </View>
  );
};

export default PersonsPlaceholder;
