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
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Resident } from "../common/types";
import Header from "../components/Header";
import PersonsHeaderContent from "../components/PersonsHeaderContent";
import PersonsMobileList from "../components/PersonsMobileList";
import PersonsPlaceholder from "../components/PersonsPlaceholder";
import PersonsTable from "../components/PersonsTable.web";
import { useRecording } from "../features/recording";
import { trpc } from "../shared/api";
import { useIsMobileWidth } from "../shared/lib/useIsMobileWidth";
import { useSetDocumentTitle } from "../shared/lib/useSetDocumentTitle";
import Loading from "../shared/ui/Loading";
import { deserializeResident } from "../utils/format";
import { SortOption, sortUsers } from "../utils/sort";

const ResidentsScreen = () => {
  useSetDocumentTitle("Residents - Recidiviz Meetings");
  const insets = useSafeAreaInsets();
  const isMobileWidth = useIsMobileWidth();
  const { status: recordingState } = useRecording();

  const isFocused = useIsFocused();
  const {
    data: rawResidents,
    isLoading,
    error,
    refetch,
  } = trpc.v1.resident.list.useQuery(undefined, { enabled: isFocused });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(SortOption.Name as string);

  const residents: Resident[] = React.useMemo(() => {
    if (!rawResidents) return [];
    return rawResidents.map(deserializeResident);
  }, [rawResidents]);

  // filtering and sorting residents
  const filteredResidents = React.useMemo(() => {
    let results = residents;
    if (search) {
      const lowerSearch = search.toLowerCase();
      results = results.filter(
        (e) =>
          e.fullName.toLowerCase().includes(lowerSearch) ||
          e.displayPersonExternalId?.toLowerCase().includes(lowerSearch),
      );
    }

    results = sortUsers(results, sortBy as SortOption);
    return results.sort(
      (a, b) => Number(!!b.activeMeetingId) - Number(!!a.activeMeetingId),
    );
  }, [residents, search, sortBy]);

  useEffect(() => {
    if (recordingState) {
      refetch();
    }
  }, [recordingState, refetch]);

  if (isLoading) {
    return <Loading message="Loading residents..." />;
  }

  if (error) throw error;

  return (
    <SafeAreaView className="flex-1">
      <View
        className={clsx(
          "flex-1",
          Platform.OS !== "web" &&
            filteredResidents.length === 0 &&
            "bg-primary",
        )}
        style={{ marginTop: -insets.top }}
      >
        <Header />
        {Platform.select({
          native: (
            <PersonsMobileList
              persons={filteredResidents}
              recordingState={recordingState}
              searchQuery={search}
              setSearchQuery={setSearch}
              setSortBy={setSortBy}
              personType="resident"
            />
          ),
          web: (
            <View className="flex-1 pb-4">
              {isMobileWidth && (
                <View className="flex-1">
                  <PersonsMobileList
                    persons={filteredResidents}
                    recordingState={recordingState}
                    searchQuery={search}
                    setSearchQuery={setSearch}
                    setSortBy={setSortBy}
                    personType="resident"
                  />
                </View>
              )}
              {!isMobileWidth && (
                <ScrollView className="flex-1">
                  <View className="mx-auto w-full max-w-[960px] flex-1">
                    <PersonsHeaderContent
                      personType="resident"
                      description="All residents are displayed below"
                      personsCount={filteredResidents.length}
                      searchQuery={search}
                      setSearchQuery={setSearch}
                      setSortBy={setSortBy}
                    />

                    {filteredResidents.length === 0 ? (
                      <View className="flex h-[560px] w-full items-center justify-center">
                        <PersonsPlaceholder
                          personType="resident"
                          isSearchResultEmpty={!!search}
                        />
                      </View>
                    ) : (
                      <PersonsTable
                        persons={filteredResidents}
                        type="resident"
                      />
                    )}
                  </View>
                </ScrollView>
              )}
            </View>
          ),
        })}
      </View>
      <View
        className={clsx(
          "absolute inset-x-0 bottom-0",
          Platform.OS !== "web" &&
            filteredResidents.length === 0 &&
            "bg-primary",
        )}
        style={{ height: insets.bottom }}
      />
    </SafeAreaView>
  );
};

export default ResidentsScreen;
