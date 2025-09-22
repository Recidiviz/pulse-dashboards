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

import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import Icons from "../../assets/icons";

interface SearchBarProps {
  value: string;
  onChange: (t: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => (
  <View style={styles.container}>
    <Image source={Icons.Search as ImageSourcePropType} style={styles.icon} />

    <TextInput
      style={styles.input}
      placeholder="Search clients by name"
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChange}
    />
  </View>
);

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#F8F8F8",
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  icon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    fontWeight: "600",
    fontSize: 13,
    height: 40,
    marginLeft: 5,
    color: "#000",
  },
});
