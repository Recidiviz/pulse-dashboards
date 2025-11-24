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

import React, { useState } from "react";
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
import ClientsCardsTable from "../components/ClientsCardsTable.web";
import Dropdown from "../components/Dropdown";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
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
  const {
    data: rawClients,
    isLoading,
    error,
  } = trpc.v1.staff.getClients.useQuery();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Name (A-Z)");

  const clients: Client[] = React.useMemo(() => {
    if (!rawClients) return [];
    return rawClients.map((c) => ({
      ...c,
      fullName: `${c.givenNames} ${c.surname}`,
      supervision: "Probation", // TODO: remove hardcode
      lastMeeting: "5d ago", // TODO: remove hardcode
    }));
  }, [rawClients]);

  // filtering + sorting
  const filteredClients = React.useMemo(() => {
    let results = clients;
    if (search) {
      results = results.filter((e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return sortClientsByOption(results, sortBy);
  }, [clients, search, sortBy]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-base text-gray-700">Loading clients...</Text>
      </View>
    );
  }

  if (error) throw error;

  return (
    <View className="flex-1">
      <Header />
      <ScrollView className="flex-1" contentContainerClassName="grow">
        <View className="mx-auto w-full max-w-[960px] flex-1">
          <View
            className={
              "rounded-b-[24px] bg-white p-4 sm:flex-row sm:justify-between sm:gap-x-4 md:bg-[initial]"
            }
          >
            <View>
              <Text className="font-inter text-3xl font-semibold text-black">
                Clients
              </Text>
              <Text className="my-2 font-inter text-sm font-normal text-[#707070]">
                All clients on your caseload are displayed below
              </Text>
            </View>
            <View className="mt-3 grow flex-row items-center justify-end">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search clients by name"
                onExit={() => {
                  setSearch("");
                }}
              />
              {/* <TouchableOpacity className="ml-2 size-10 items-center justify-center rounded-xl border border-gray-300 bg-gray-50">
              <Image
                source={Icons.Filter}
                className="!size-[16]"
                style={{ resizeMode: "contain" }}
              />
            </TouchableOpacity> */}
            </View>
          </View>
          <View className="z-10 flex-row items-center justify-between px-4">
            <Text className="text-sm text-[#707070]">
              {filteredClients.length} client
              {filteredClients.length > 1 ? "s" : ""}
            </Text>
            <Dropdown
              label="Sort by"
              options={["Name (A-Z)", "ID"]}
              onSelect={setSortBy}
            />
          </View>
          <View className="grow basis-0 p-4 pt-0">
            {filteredClients.length === 0 ? (
              <View className="items-center justify-center py-16">
                <View className="mb-6 items-center justify-center rounded-3xl border-2 border-gray-200 bg-[#2B696908] p-3">
                  <Image source={Icons.Lock} className="!size-14" />
                </View>
                <Text className="font-LibreBaskerville mb-2 text-center text-3xl font-extrabold leading-[32px] tracking-[-0.5px] text-[#9CA3AF]">
                  No clients found
                </Text>
                <Text className="mb-6 text-center font-inter text-sm font-normal leading-5 tracking-[-0.28px] text-[#9CA3AF]">
                  Try adjusting your search or use different keywords.
                </Text>
                <TouchableOpacity
                  onPress={() => setSearch("")}
                  className="rounded-full border border-gray-300 px-6 py-3"
                >
                  <Text className="font-inter text-[16px] font-medium text-gray-700">
                    Clear search
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              Platform.select({
                native: <ClientsCardsList clients={filteredClients} />,
                web: (
                  <View className="pb-4">
                    <View className="md:hidden">
                      <ClientsCardsList clients={filteredClients} />
                    </View>
                    <View className="hidden md:block">
                      <ClientsCardsTable clients={filteredClients} />
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
