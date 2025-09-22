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
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Icons from "../../assets/icons";

type DropdownProps = {
  options: string[];
  label?: string;
  onSelect?: (value: string) => void;
};

const Dropdown = ({ options, label, onSelect }: DropdownProps) => {
  const [selected, setSelected] = useState(options[0]);
  const [open, setOpen] = useState(false);

  const handleSelect = (opt: string) => {
    setSelected(opt);
    setOpen(false);
    if (onSelect) onSelect(opt);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {label && <Text style={styles.label}>{label}: </Text>}

        <TouchableOpacity
          style={styles.selector}
          onPress={() => setOpen((p) => !p)}
        >
          <Text style={styles.selected}>{selected}</Text>
          <Image
            source={open ? Icons.ArrowRight : Icons.ArrowDown}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {open && (
        <View style={styles.optionsContainer}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.optionButton}
              onPress={() => handleSelect(opt)}
            >
              <Text style={styles.option}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default Dropdown;

const styles = StyleSheet.create({
  container: { alignSelf: "flex-start", marginVertical: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    color: "#111",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f2f2f2",
    gap: 6,
  },
  selected: {
    fontSize: 14,
    color: "#111",
  },
  icon: { width: 14, height: 14, tintColor: "#111", resizeMode: "contain" },
  optionsContainer: {
    position: "absolute",
    top: 42,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionButton: {
    padding: 10,
  },
  option: {
    fontSize: 14,
    color: "#333",
  },
});
