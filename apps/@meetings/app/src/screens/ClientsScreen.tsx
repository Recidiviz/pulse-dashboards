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

import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Client } from "~@meetings/app/common/types";

import Header from "../components/Header";
import Loading from "../components/Loading";
import PersonsHeaderContent from "../components/PersonsHeaderContent";
import PersonsMobileList from "../components/PersonsMobileList";
import PersonsTable from "../components/PersonsTable.web";
import { useRecording } from "../context/RecordingContext";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../trpc/client";
import { deserializeClient } from "../utils/format";

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, "Clients">;

const sortClientsByOption = (data: Client[], option: string): Client[] => {
  const sorted = [...data];
  if (option.includes("Name")) {
    return sorted.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
  return sorted.sort(
    (a, b) =>
      Number(a.displayPersonExternalId) - Number(b.displayPersonExternalId),
  );
};

const ClientsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavProp>();
  const { status: recordingState } = useRecording();

  const isFocused = useIsFocused();
  const {
    data: rawClients,
    isLoading,
    error,
    refetch,
  } = trpc.v1.staff.getClients.useQuery(undefined, {
    enabled: isFocused,
  });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Name (A-Z)");

  const clients: Client[] = React.useMemo(() => {
    if (!rawClients) return [];
    return rawClients.map(deserializeClient);
  }, [rawClients]);

  // filtering and sorting clients
  const filteredClients = React.useMemo(() => {
    let results = clients;
    if (search) {
      results = results.filter((e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()),
      );
    }

    results = sortClientsByOption(results, sortBy);
    return results.sort(
      (a, b) => Number(!!b.activeMeetingId) - Number(!!a.activeMeetingId),
    );
  }, [clients, search, sortBy]);

  useEffect(() => {
    refetch();
  }, [recordingState, refetch]);

  if (isLoading) {
    return <Loading message="Loading clients..." />;
  }

  if (error) throw error;

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1" style={{ marginTop: -insets.top }}>
        <Header />
        {Platform.select({
          native: (
            <PersonsMobileList
              persons={filteredClients}
              recordingState={recordingState}
              navigation={navigation}
              searchQuery={search}
              setSearchQuery={setSearch}
              setSortBy={setSortBy}
              keyword="Client"
            />
          ),
          web: (
            <View className="flex-1 pb-4">
              <PersonsMobileList
                persons={filteredClients}
                recordingState={recordingState}
                navigation={navigation}
                searchQuery={search}
                setSearchQuery={setSearch}
                setSortBy={setSortBy}
                keyword="Client"
                className="md:hidden"
              />
              <ScrollView className="hidden flex-1 md:block">
                <View className="mx-auto w-full max-w-[960px] flex-1">
                  <PersonsHeaderContent
                    keyword="Client"
                    description="All clients on your caseload are displayed below"
                    personsCount={filteredClients.length}
                    searchQuery={search}
                    setSearchQuery={setSearch}
                    setSortBy={setSortBy}
                  />
                  <PersonsTable persons={filteredClients} type="clients" />
                </View>
              </ScrollView>
            </View>
          ),
        })}
      </View>
    </SafeAreaView>
  );
};

export default ClientsScreen;
