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

import { FlashList } from "@shopify/flash-list";
import { View } from "react-native";

import { Person, PersonType } from "../common/types";
import PersonCardItem from "./PersonCardItem";
import PersonsHeaderContent from "./PersonsHeaderContent";
import PersonsPlaceholder from "./PersonsPlaceholder";

type Props = {
  persons: Person[];
  recordingState: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSortBy: (option: string) => void;
  personType: PersonType;
};

const PersonsMobileList = ({
  persons,
  recordingState,
  searchQuery,
  setSearchQuery,
  setSortBy,
  personType,
}: Props) => {
  const headerDescription =
    personType === "client"
      ? "All clients on your caseload are displayed below"
      : "All residents are displayed below";

  return (
    <FlashList
      data={persons}
      keyExtractor={(item: Person) => item.personId.toString()}
      renderItem={({ item }: { item: Person }) => (
        <PersonCardItem
          person={item}
          recordingState={recordingState}
          personType={personType}
        />
      )}
      ListEmptyComponent={
        <PersonsPlaceholder
          personType={personType}
          isSearchResultEmpty={searchQuery.trim().length > 0}
        />
      }
      ListHeaderComponentStyle={{ zIndex: 50, flex: 1 }}
      ListHeaderComponent={
        <View className="mx-auto w-full max-w-[960px]">
          <PersonsHeaderContent
            personType={personType}
            description={headerDescription}
            personsCount={persons.length}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSortBy={setSortBy}
          />
        </View>
      }
    />
  );
};

export default PersonsMobileList;
