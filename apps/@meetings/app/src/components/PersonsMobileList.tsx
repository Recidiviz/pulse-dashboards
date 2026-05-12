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

import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import { View } from "react-native";

import { Person, PersonType } from "../common/types";
import { trpc } from "../shared/api";
import { deserializeClient, deserializeResident } from "../utils/format";
import { serializeSort, SortOption } from "../utils/sort";
import PersonCardItem from "./PersonCardItem";
import PersonsHeaderContent from "./PersonsHeaderContent";
import PersonsPlaceholder from "./PersonsPlaceholder";

const PAGE_SIZE = 20;

type Props = {
  personType: PersonType;
  sortBy: SortOption;
  recordingState: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSortBy: (option: string) => void;
};

const PersonsMobileList = ({
  personType,
  sortBy,
  recordingState,
  searchQuery,
  setSearchQuery,
  setSortBy,
}: Props) => {
  const isFocused = useIsFocused();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedSort = serializeSort(sortBy) as any;

  const clientQuery = trpc.v1.client.list.useInfiniteQuery(
    {
      size: PAGE_SIZE,
      sortBy: serializedSort,
      filters: { search: searchQuery },
    },
    {
      enabled: isFocused && personType === "client",
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
      placeholderData: keepPreviousData,
    },
  );

  const residentQuery = trpc.v1.resident.list.useInfiniteQuery(
    {
      size: PAGE_SIZE,
      sortBy: serializedSort,
      filters: { search: searchQuery },
    },
    {
      enabled: isFocused && personType === "resident",
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
      placeholderData: keepPreviousData,
    },
  );

  const activeQuery = personType === "client" ? clientQuery : residentQuery;

  const persons: Person[] = useMemo(() => {
    if (personType === "client") {
      return (clientQuery.data?.pages ?? [])
        .flatMap((p) => p.data)
        .map(deserializeClient);
    }
    return (residentQuery.data?.pages ?? [])
      .flatMap((p) => p.data)
      .map(deserializeResident);
  }, [clientQuery.data, residentQuery.data, personType]);

  const total = activeQuery.data?.pages[0]?.total ?? 0;

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
      onEndReached={() => {
        if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
          activeQuery.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
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
            personsCount={total}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSortBy={setSortBy}
            isFetching={activeQuery.isFetching}
          />
        </View>
      }
    />
  );
};

export default PersonsMobileList;
