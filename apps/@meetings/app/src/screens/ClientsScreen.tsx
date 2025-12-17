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

import React, { useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";

import { Client } from "~@meetings/app/common/types";

import Header from "../components/Header";
import Loading from "../components/Loading";
import PersonsCardsList from "../components/PersonsCardsList";
import PersonsHeaderContent from "../components/PersonsHeaderContent";
import PersonsPlaceholder from "../components/PersonsPlaceholder";
import PersonsTable from "../components/PersonsTable.web";
import { useRecording } from "../context/RecordingContext";
import { trpc } from "../trpc/client";

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
  const { status: recordingState } = useRecording();

  const {
    data: rawClients,
    isLoading,
    error,
    refetch,
  } = trpc.v1.staff.getClients.useQuery();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Name (A-Z)");

  const clients: Client[] = React.useMemo(() => {
    if (!rawClients) return [];
    return rawClients.map((c) => ({
      ...c,
      fullName: `${c.givenNames} ${c.surname}`,
      primaryMetadata: c.supervisionType,
      lastMeeting: "5d ago", // TODO: remove hardcode
    }));
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
    <View className="flex-1">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="grow">
        <View className="mx-auto w-full max-w-[960px] flex-1">
          <PersonsHeaderContent
            keyword="Client"
            description="All clients on your caseload are displayed below"
            personsCount={filteredClients.length}
            searchQuery={search}
            setSearchQuery={setSearch}
            setSortBy={setSortBy}
          />
          <View className="flex grow basis-0 flex-col p-4 pt-0">
            {filteredClients.length === 0 ? (
              <PersonsPlaceholder
                message="No clients found"
                onClearSearch={() => setSearch("")}
              />
            ) : (
              Platform.select({
                native: (
                  <PersonsCardsList
                    persons={filteredClients}
                    recordingState={recordingState}
                  />
                ),
                web: (
                  <View className="pb-4">
                    <View className="md:hidden">
                      <PersonsCardsList
                        persons={filteredClients}
                        recordingState={recordingState}
                      />
                    </View>
                    <View className="hidden md:block">
                      <PersonsTable persons={filteredClients} type="clients" />
                    </View>
                  </View>
                ),
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ClientsScreen;
