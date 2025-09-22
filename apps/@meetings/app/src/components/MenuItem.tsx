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
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Icons from "../../assets/icons";

type MenuItemProps = {
  icon: ImageSourcePropType;
  title: string;
  badge?: number;
  onPress?: () => void;
};

const MenuItem = ({ icon, title, badge, onPress }: MenuItemProps) => {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.left}>
        <Image source={icon} style={styles.icon} />
        <Text style={styles.text}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Image source={Icons.ArrowRight} style={styles.chevron} />
    </TouchableOpacity>
  );
};

export default MenuItem;

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  left: { flexDirection: "row", alignItems: "center" },
  icon: { width: 24, height: 24, marginRight: 12, resizeMode: "contain" },
  text: { fontSize: 16, fontWeight: "500" },
  badge: {
    backgroundColor: "#505050",
    borderRadius: 20,
    width: 24,
    height: 18,
    marginLeft: 8,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  chevron: {
    width: 14,
    height: 14,
    resizeMode: "contain",
    tintColor: "#000000",
  },
});
