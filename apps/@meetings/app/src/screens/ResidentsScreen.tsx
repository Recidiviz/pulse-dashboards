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

import { Resident } from "~@meetings/app/common/types";

import Header from "../components/Header";
import Loading from "../components/Loading";
import PersonsCardsList from "../components/PersonsCardsList";
import PersonsHeaderContent from "../components/PersonsHeaderContent";
import PersonsPlaceholder from "../components/PersonsPlaceholder";
import PersonsTable from "../components/PersonsTable.web";
import { useRecording } from "../context/RecordingContext";
import { SortOption, sortUsers } from "../utils/sort";

const mock = {
  data: [
    {
      activeMeetingId: "1",
      personId: BigInt(1000),
      displayPersonExternalId: "1000",
      givenNames: "Peter",
      surname: "Parker",
      facilityName: "facility 1",
    },
    {
      activeMeetingId: "3",
      personId: BigInt(1001),
      displayPersonExternalId: "1001",
      givenNames: "Jin",
      surname: "Kazama",
      facilityName: "facility 2",
    },
    {
      activeMeetingId: "5",
      personId: BigInt(1002),
      displayPersonExternalId: "1002",
      givenNames: "Lara",
      surname: "Croft",
      facilityName: "facility 3",
    },
    {
      activeMeetingId: "7",
      personId: BigInt(1003),
      displayPersonExternalId: "1003",
      givenNames: "Sylvanas",
      surname: "Windrunner",
      facilityName: "facility 4",
    },
  ],
  isLoading: false,
  error: null,
  refetch: () => null,
};

const ResidentsScreen = () => {
  const { status: recordingState } = useRecording();

  // TODO: for test purposes, after backend is ready replace getClients with getResidents call
  const { data: rawResidents, isLoading, error, refetch } = mock;

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(SortOption.Name as string);

  const residents: Resident[] = React.useMemo(() => {
    if (!rawResidents) return [];
    return rawResidents.map((r) => ({
      ...r,
      fullName: `${r.givenNames} ${r.surname}`,
      primaryMetadata: r.facilityName,
      lastMeeting: "5d ago", // TODO: remove hardcode
    }));
  }, [rawResidents]);

  // filtering and sorting clients
  const filteredResidents = React.useMemo(() => {
    let results = residents;
    if (search) {
      results = results.filter((e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()),
      );
    }

    results = sortUsers(results, sortBy as SortOption);
    return results.sort(
      (a, b) => Number(!!b.activeMeetingId) - Number(!!a.activeMeetingId),
    );
  }, [residents, search, sortBy]);

  useEffect(() => {
    refetch();
  }, [recordingState, refetch]);

  if (isLoading) {
    return <Loading message="Loading residents..." />;
  }

  if (error) throw error;

  return (
    <View className="flex-1">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="grow">
        <View className="mx-auto w-full max-w-[960px] flex-1">
          <PersonsHeaderContent
            keyword="Resident"
            description="All residents are displayed below"
            personsCount={filteredResidents.length}
            searchQuery={search}
            setSearchQuery={setSearch}
            setSortBy={setSortBy}
          />
          <View className="flex grow basis-0 p-4 pt-0">
            {filteredResidents.length === 0 ? (
              <PersonsPlaceholder
                message="No residents found"
                onClearSearch={() => setSearch("")}
              />
            ) : (
              Platform.select({
                native: (
                  <PersonsCardsList
                    persons={filteredResidents}
                    recordingState={recordingState}
                  />
                ),
                web: (
                  <View className="pb-4">
                    <View className="md:hidden">
                      <PersonsCardsList
                        persons={filteredResidents}
                        recordingState={recordingState}
                      />
                    </View>
                    <View className="hidden md:block">
                      <PersonsTable persons={filteredResidents} />
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

export default ResidentsScreen;
