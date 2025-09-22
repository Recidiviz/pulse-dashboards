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
import { Image,StyleSheet, Text, View } from "react-native";

import Icons from "../../assets/icons";

const ClientCard = ({
  client,
}: {
  client: {
    id: string;
    name: string;
    supervision: string;
    lastMeeting: string;
  };
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts.pop() || "")[0]).toUpperCase();
  };

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(client.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{client.name}</Text>
            <Image source={Icons.ArrowRight} style={styles.chevron} />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.subText}>
              ID: {client.id} • {client.supervision}
            </Text>
            <Text style={styles.lastMeeting}>
              Last meeting {client.lastMeeting}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ClientCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 24,
    backgroundColor: "#E0E0E0",
    borderWidth: 1,
    borderColor: "#bbb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    fontFamily: "Inter",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    fontFamily: "Inter",
    marginRight: 6,
  },
  chevron: {
    width: 14,
    height: 14,
    tintColor: "#000000",
    resizeMode: "contain",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    gap: 5,
  },
  subText: {
    fontSize: 13,
    color: "#666",
  },
  lastMeeting: {
    fontSize: 13,
    color: "#666",
  },
});
