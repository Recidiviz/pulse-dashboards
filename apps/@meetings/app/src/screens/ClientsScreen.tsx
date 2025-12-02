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
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Client } from "~@meetings/app/common/types";

import Icons from "../../assets/icons";
import ClientsCardsList from "../components/ClientsCardsList";
import ClientsTable from "../components/ClientsTable.web";
import Dropdown from "../components/Dropdown";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
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
      supervision: c.supervisionType,
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
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-700 text-base">Loading clients...</Text>
      </View>
    );
  }

  if (error) throw error;

  return (
    <View className="flex-1">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="grow">
        <View className="flex-1 mx-auto w-full max-w-[960px]">
          <View
            className={
              "rounded-b-[24px] bg-white p-4 sm:flex-row sm:justify-between sm:gap-x-4 md:bg-[initial]"
            }
          >
            <View>
              <Text className="font-inter font-semibold text-black text-3xl">
                Clients
              </Text>
              <Text className="my-2 font-inter font-normal text-[#707070] text-sm">
                All clients on your caseload are displayed below
              </Text>
            </View>
            <View className="flex-row justify-end items-center mt-3 grow">
              <View className="w-full sm:max-w-[300px]">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder="Search clients by name"
                  onExit={() => {
                    setSearch("");
                  }}
                />
              </View>
              {/* <TouchableOpacity className="justify-center items-center bg-gray-50 ml-2 border border-gray-300 rounded-xl size-10">
              <Image
                source={Icons.Filter}
                className="!size-[16]"
                style={{ resizeMode: "contain" }}
              />
            </TouchableOpacity> */}
            </View>
          </View>
          <View className="z-10 flex-row justify-between items-center my-4 px-4">
            <Text className="text-[#707070] text-sm">
              {filteredClients.length} client
              {filteredClients.length > 1 ? "s" : ""}
            </Text>
            <Dropdown
              label="Sort by"
              options={["Name (A-Z)", "ID"]}
              onSelect={setSortBy}
            />
          </View>
          <View className="p-4 pt-0 grow basis-0">
            {filteredClients.length === 0 ? (
              <View className="justify-center items-center py-16">
                <View className="justify-center items-center bg-[#2B696908] mb-6 p-3 border-2 border-gray-200 rounded-3xl">
                  <Image source={Icons.Lock} className="!size-14" />
                </View>
                <Text className="mb-2 font-LibreBaskerville font-extrabold text-[#9CA3AF] text-3xl text-center leading-[32px] tracking-[-0.5px]">
                  No clients found
                </Text>
                <Text className="mb-6 font-inter font-normal text-[#9CA3AF] text-sm text-center leading-5 tracking-[-0.28px]">
                  Try adjusting your search or use different keywords.
                </Text>
                <TouchableOpacity
                  onPress={() => setSearch("")}
                  className="px-6 py-3 border border-gray-300 rounded-full"
                >
                  <Text className="font-inter font-medium text-[16px] text-gray-700">
                    Clear search
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              Platform.select({
                native: (
                  <ClientsCardsList
                    clients={filteredClients}
                    recordingState={recordingState}
                  />
                ),
                web: (
                  <View className="pb-4">
                    <View className="md:hidden">
                      <ClientsCardsList
                        clients={filteredClients}
                        recordingState={recordingState}
                      />
                    </View>
                    <View className="hidden md:block">
                      <ClientsTable clients={filteredClients} />
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
