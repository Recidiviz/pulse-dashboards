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
import { FlatList, Text, View } from "react-native";

import { Client } from "~@meetings/app/common/types";

import ClientCard from "../components/ClientCard";
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
  const filtered = React.useMemo(() => {
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
    <View className="flex-1 bg-white">
      <Header />
      <View className="p-4">
        <Text className="font-[inter] text-3xl font-semibold text-black">
          Clients
        </Text>
        <Text className="my-3.5 font-[inter] text-sm font-normal text-[#707070]">
          All clients on your caseload are displayed below
        </Text>

        <Dropdown options={["Probation", "Absconded", "Incarceration"]} />

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={"Search clients by name"}
        />

        <Dropdown
          label="Sort by"
          options={["Name (A-Z)", "ID"]}
          onSelect={setSortBy}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.displayPersonExternalId}
          renderItem={({ item }) => <ClientCard client={item} />}
        />
      </View>
    </View>
  );
};

export default ClientsScreen;
