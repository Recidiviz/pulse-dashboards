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

import { useIsFocused } from "@react-navigation/native";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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
import { SortOption } from "../utils/sort";

const ClientsScreen = () => {
  useSetDocumentTitle("Clients - Recidiviz Meetings");
  const insets = useSafeAreaInsets();
  const isMobileWidth = useIsMobileWidth();
  const { status: recordingState } = useRecording();
  const isFocused = useIsFocused();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(SortOption.Name as string);

  // Drives screen-level loading / empty states. PersonsTable / PersonsMobileList
  // run their own paginated queries for the actual rows.
  const {
    data: countData,
    isLoading,
    error,
    refetch,
  } = trpc.v1.client.list.useQuery(
    { size: 1, filters: { search } },
    { enabled: isFocused },
  );

  useEffect(() => {
    if (recordingState) {
      refetch();
    }
  }, [recordingState, refetch]);

  if (isLoading) {
    return <Loading message="Loading clients..." />;
  }

  if (error) throw error;

  const total = countData?.total ?? 0;

  return (
    <SafeAreaView className="flex-1">
      <View
        className={clsx(
          "flex-1",
          Platform.OS !== "web" && total === 0 && "bg-primary",
        )}
        style={{ marginTop: -insets.top }}
      >
        <Header />
        {Platform.select({
          native: (
            <PersonsMobileList
              personType="client"
              sortBy={sortBy as SortOption}
              recordingState={recordingState}
              searchQuery={search}
              setSearchQuery={setSearch}
              setSortBy={setSortBy}
            />
          ),
          web: (
            <View className="flex-1 pb-4">
              {isFocused && isMobileWidth && (
                <View className="flex-1">
                  <PersonsMobileList
                    personType="client"
                    sortBy={sortBy as SortOption}
                    recordingState={recordingState}
                    searchQuery={search}
                    setSearchQuery={setSearch}
                    setSortBy={setSortBy}
                  />
                </View>
              )}
              {isFocused && !isMobileWidth && (
                <ScrollView className="flex-1">
                  <View className="mx-auto w-full max-w-[960px] flex-1">
                    <PersonsHeaderContent
                      personType="client"
                      description="Search for clients across all caseloads"
                      personsCount={total}
                      searchQuery={search}
                      setSearchQuery={setSearch}
                      setSortBy={setSortBy}
                    />
                    <PersonsTable
                      type="client"
                      caseload="mine"
                      search={search}
                      sortBy={sortBy as SortOption}
                      sectionTitle="My caseload"
                    />
                    <PersonsTable
                      type="client"
                      caseload="others"
                      search={search}
                      sortBy={sortBy as SortOption}
                      sectionTitle="Results from other caseloads"
                    />
                    {total === 0 && (
                      <View className="flex h-[560px] w-full items-center justify-center">
                        <PersonsPlaceholder
                          personType="client"
                          isSearchResultEmpty={!!search}
                        />
                      </View>
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
          Platform.OS !== "web" && total === 0 && "bg-primary",
        )}
        style={{ height: insets.bottom }}
      />
    </SafeAreaView>
  );
};

export default ClientsScreen;
