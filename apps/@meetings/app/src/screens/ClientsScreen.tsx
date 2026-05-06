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
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Client } from "../common/types";
import Header from "../components/Header";
import PersonsHeaderContent from "../components/PersonsHeaderContent";
import PersonsMobileList from "../components/PersonsMobileList";
import PersonsPlaceholder from "../components/PersonsPlaceholder";
import PersonsTable from "../components/PersonsTable.web";
import { useUserContext } from "../context/UserContext";
import { useRecording } from "../features/recording";
import { trpc } from "../shared/api";
import { useIsMobileWidth } from "../shared/lib/useIsMobileWidth";
import { useSetDocumentTitle } from "../shared/lib/useSetDocumentTitle";
import Loading from "../shared/ui/Loading";
import { deserializeClient } from "../utils/format";
import { SortOption, sortUsers } from "../utils/sort";

const filterAndSortClients = (
  clients: Client[],
  search: string,
  sortBy: string,
): Client[] => {
  let results = clients;
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
};

const ClientsScreen = () => {
  useSetDocumentTitle("Clients - Recidiviz Meetings");
  const insets = useSafeAreaInsets();
  const isMobileWidth = useIsMobileWidth();
  const { status: recordingState } = useRecording();
  const { email: userEmail } = useUserContext();

  const isFocused = useIsFocused();
  const {
    data: rawClients,
    isLoading,
    error,
    refetch,
  } = trpc.v1.client.list.useQuery(undefined, {
    enabled: isFocused,
  });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(SortOption.Name as string);

  const clients: Client[] = React.useMemo(() => {
    if (!rawClients) return [];
    return rawClients.map(deserializeClient);
  }, [rawClients]);

  // Separate clients by caseload ownership
  const { myCaseloadClients, otherCaseloadClients } = React.useMemo(() => {
    const myCaseload = userEmail
      ? clients.filter((c) => c.staffEmails.includes(userEmail.toLowerCase()))
      : [];
    const otherCaseload = userEmail
      ? clients.filter((c) => !c.staffEmails.includes(userEmail.toLowerCase()))
      : clients;
    return {
      myCaseloadClients: filterAndSortClients(myCaseload, search, sortBy),
      otherCaseloadClients: filterAndSortClients(otherCaseload, search, sortBy),
    };
  }, [clients, search, sortBy, userEmail]);

  useEffect(() => {
    if (recordingState) {
      refetch();
    }
  }, [recordingState, refetch]);

  if (isLoading) {
    return <Loading message="Loading clients..." />;
  }

  if (error) throw error;

  return (
    <SafeAreaView className="flex-1">
      <View
        className={clsx(
          "flex-1",
          Platform.OS !== "web" &&
            [...myCaseloadClients, ...otherCaseloadClients].length === 0 &&
            "bg-primary",
        )}
        style={{ marginTop: -insets.top }}
      >
        <Header />
        {Platform.select({
          native: (
            <PersonsMobileList
              persons={[...myCaseloadClients, ...otherCaseloadClients]}
              recordingState={recordingState}
              searchQuery={search}
              setSearchQuery={setSearch}
              setSortBy={setSortBy}
              personType="client"
            />
          ),
          web: (
            <View className="flex-1 pb-4">
              {isMobileWidth && (
                <View className="flex-1">
                  <PersonsMobileList
                    persons={[...myCaseloadClients, ...otherCaseloadClients]}
                    recordingState={recordingState}
                    searchQuery={search}
                    setSearchQuery={setSearch}
                    setSortBy={setSortBy}
                    personType="client"
                  />
                </View>
              )}
              {!isMobileWidth && (
                <ScrollView className="flex-1">
                  <View className="mx-auto w-full max-w-[960px] flex-1">
                    <PersonsHeaderContent
                      personType="client"
                      description="Search for clients across all caseloads"
                      personsCount={
                        [...myCaseloadClients, ...otherCaseloadClients].length
                      }
                      searchQuery={search}
                      setSearchQuery={setSearch}
                      setSortBy={setSortBy}
                    />
                    {myCaseloadClients.length > 0 && (
                      <PersonsTable
                        persons={myCaseloadClients}
                        type="client"
                        sectionTitle="My caseload"
                      />
                    )}
                    {otherCaseloadClients.length > 0 && (
                      <PersonsTable
                        persons={otherCaseloadClients}
                        type="client"
                        sectionTitle="Results from other caseloads"
                      />
                    )}
                    {[...myCaseloadClients, ...otherCaseloadClients].length ===
                      0 && (
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
          Platform.OS !== "web" &&
            [...myCaseloadClients, ...otherCaseloadClients].length === 0 &&
            "bg-primary",
        )}
        style={{ height: insets.bottom }}
      />
    </SafeAreaView>
  );
};

export default ClientsScreen;
