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

import startCase from "lodash/startCase";
import { useMemo } from "react";
import { View } from "react-native";

import { PersonType } from "../common/types";
import Dropdown from "../shared/ui/Dropdown";
import SearchBar from "../shared/ui/SearchBar";
import { Typography } from "../shared/ui/Typography";
import { SortOption } from "../utils/sort";

type Props = {
  personType: PersonType;
  description: string;
  personsCount: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setSortBy: (value: string) => void;
};

const PersonsHeaderContent = ({
  personType,
  description,
  personsCount,
  searchQuery,
  setSearchQuery,
  setSortBy,
}: Props) => {
  const options = useMemo(() => {
    if (personType === "client") {
      return Object.values(SortOption).filter(
        (option) => option !== SortOption.Facility,
      );
    }
    if (personType === "resident") {
      return Object.values(SortOption).filter(
        (option) => option !== SortOption.SupervisionType,
      );
    }
    return Object.values(SortOption);
  }, [personType]);

  const personsCountString =
    personsCount === 1 ? `1 ${personType}` : `${personsCount} ${personType}s`;

  const hasNoPersons = !searchQuery && personsCount === 0;

  if (hasNoPersons) {
    return (
      <View className="mb-4 rounded-b-[24px] bg-primary p-4 sm:flex-row sm:justify-between sm:gap-x-4 md:bg-transparent md:px-0 md:pb-0 md:pt-10">
        <View>
          <Typography className="font-libre-baskerville text-3xl font-semibold text-primary">
            {startCase(personType)}s
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="mb-4 rounded-b-[24px] bg-primary p-4 sm:flex-row sm:justify-between sm:gap-x-4 md:bg-transparent md:px-0 md:pb-0 md:pt-10">
        <View>
          <Typography className="font-libre-baskerville text-3xl font-semibold text-primary">
            {startCase(personType)}s
          </Typography>
          <Typography className="my-2 text-sm font-normal text-secondary">
            {description}
          </Typography>
        </View>
        <View className="mt-3 w-full flex-1 flex-row items-center justify-end sm:mt-0">
          <View className="flex-1 sm:max-w-[300px]">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name or ID"
              onExit={() => {
                setSearchQuery("");
              }}
            />
          </View>
        </View>
      </View>
      <View className="z-10 mb-3 flex-row items-center justify-between px-4 md:my-0 md:px-0">
        <Typography className="text-sm leading-4 text-secondary">
          {personsCountString}
        </Typography>
        <Dropdown label="Sort by" options={options} onSelect={setSortBy} />
      </View>
    </>
  );
};

export default PersonsHeaderContent;
