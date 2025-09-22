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
import { FlatList, StyleSheet, Text, View } from "react-native";

import ClientCard from "../components/ClientCard";
import Dropdown from "../components/Dropdown";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import clientsData from "../data/clients";

type Client = {
  id: string;
  name: string;
  supervision: string;
  lastMeeting: string;
};

const sortClientsByOption = (data: Client[], option: string): Client[] => {
  const sorted = [...data];
  if (option.includes("Name")) {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted.sort((a, b) => Number(a.id) - Number(b.id));
};

const ClientsScreen = () => {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Client[]>(clientsData);
  const [sortBy, setSortBy] = useState("Name (A-Z)");

  const handleSearch = (text: string) => {
    setSearch(text);
    const results = text
      ? clientsData.filter((c) =>
          c.name.toLowerCase().includes(text.toLowerCase()),
        )
      : clientsData;
    setFiltered(sortClientsByOption(results, sortBy));
  };

  const handleSort = (option: string) => {
    setSortBy(option);
    setFiltered(sortClientsByOption(filtered, option));
  };

  return (
    <View style={styles.safeArea}>
      <Header />
      <View style={styles.container}>
        <Text style={styles.title}>Clients</Text>
        <Text style={styles.description}>
          All clients on your caseload are displayed below
        </Text>

        <Dropdown options={["Probation", "Absconded", "Incarceration"]} />

        <SearchBar value={search} onChange={handleSearch} />

        <Dropdown
          label="Sort by"
          options={["Name (A-Z)", "ID"]}
          onSelect={handleSort}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ClientCard client={item} />}
        />
      </View>
    </View>
  );
};

export default ClientsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 15,
  },
  title: {
    fontFamily: "Inter",
    fontWeight: "600",
    fontSize: 28,
    color: "#000",
  },
  description: {
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: 14,
    marginVertical: 14,
    color: "#707070",
  },
});
