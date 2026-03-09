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

import { useMemo } from "react";
import { Text, View } from "react-native";

import { SortOption } from "../utils/sort";
import Dropdown from "./Dropdown";
import SearchBar from "./SearchBar";

type Props = {
  keyword: "Client" | "Resident";
  description: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  setSortBy: (value: string) => void;
};

const PersonsHeaderContent = ({
  keyword,
  description,
  searchQuery,
  setSearchQuery,
  setSortBy,
}: Props) => {
  const options = useMemo(() => {
    if (keyword === "Client") {
      return Object.values(SortOption).filter(
        (option) => option !== SortOption.Facility,
      );
    }
    if (keyword === "Resident") {
      return Object.values(SortOption).filter(
        (option) => option !== SortOption.SupervisionType,
      );
    }
    return Object.values(SortOption);
  }, [keyword]);

  return (
    <>
      <View className="rounded-b-[24px] bg-white p-4 sm:flex-row sm:justify-between sm:gap-x-4 md:bg-[initial] md:px-0 md:pb-0 md:pt-10">
        <View>
          <Text className="font-libre-baskerville text-3xl font-semibold text-black">
            {keyword}s
          </Text>
          <Text className="my-2 font-inter text-sm font-normal text-[#707070]">
            {description}
          </Text>
        </View>
        <View className="mt-3 h-10 grow flex-row items-center justify-end">
          <View className="size-full sm:max-w-[300px]">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${keyword.toLowerCase()}s by name`}
              onExit={() => {
                setSearchQuery("");
              }}
            />
          </View>
        </View>
      </View>
      <View className="z-10 my-4 flex-row items-center justify-end px-4 md:my-0 md:px-0">
        <Dropdown label="Sort by" options={options} onSelect={setSortBy} />
      </View>
    </>
  );
};

export default PersonsHeaderContent;
