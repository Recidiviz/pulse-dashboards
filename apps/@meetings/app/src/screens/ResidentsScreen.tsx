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

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { SafeAreaView,useSafeAreaInsets } from "react-native-safe-area-context";

import { Resident } from "~@meetings/app/common/types";

import Header from "../components/Header";
import Loading from "../components/Loading";
import PersonsHeaderContent from "../components/PersonsHeaderContent";
import PersonsMobileList from "../components/PersonsMobileList";
import PersonsTable from "../components/PersonsTable.web";
import { useRecording } from "../context/RecordingContext";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { SortOption, sortUsers } from "../utils/sort";

const mock = {
  data: [
    {
      activeMeetingId: "",
      personId: BigInt(1000),
      displayPersonExternalId: "1000",
      givenNames: "Peter",
      surname: "Parker",
      facilityName: "facility 1",
    },
    {
      activeMeetingId: "",
      personId: BigInt(1001),
      displayPersonExternalId: "1001",
      givenNames: "Jin",
      surname: "Kazama",
      facilityName: "facility 2",
    },
    {
      activeMeetingId: "",
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

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, "Residents">;

const ResidentsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavProp>();
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

  // filtering and sorting residents
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
    <SafeAreaView className="flex-1">
      <View className="flex-1" style={{ marginTop: -insets.top }}>
        <Header />
        {Platform.select({
          native: (
            <PersonsMobileList 
              persons={filteredResidents}
              recordingState={recordingState}
              navigation={navigation}
              searchQuery={search}
              setSearchQuery={setSearch}
              setSortBy={setSortBy}
              keyword="Resident"
            />
          ),
          web: (
            <View className="flex-1 pb-4">
              <PersonsMobileList 
                persons={filteredResidents}
                recordingState={recordingState}
                navigation={navigation}
                searchQuery={search}
                setSearchQuery={setSearch}
                setSortBy={setSortBy}
                keyword="Resident"
                className="md:hidden"
              />
              <ScrollView className="hidden md:block flex-1">
                <View className="flex-1 mx-auto w-full max-w-[960px]">
                  <PersonsHeaderContent
                    keyword="Resident"
                    description="All residents are displayed below"
                    personsCount={filteredResidents.length}
                    searchQuery={search}
                    setSearchQuery={setSearch}
                    setSortBy={setSortBy}
                  />
                  <PersonsTable persons={filteredResidents} type="residents" />
                </View>
              </ScrollView>
            </View>
          ),
        })}
      </View>
    </SafeAreaView>
  );
};

export default ResidentsScreen;
