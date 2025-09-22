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
import { Image, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import MenuScreen from "../screens/MenuScreen";

interface HeaderProps {
  showBell?: boolean;
  showDrawer?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  showBell = true,
  showDrawer = true,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#F8F8F8" }}>
      <View style={styles.header}>
        {showDrawer && (
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={styles.iconButton}
          >
            <Image source={Icons.Menu} style={styles.iconImage} />
          </TouchableOpacity>
        )}

        {showBell && (
          <TouchableOpacity
            onPress={() => console.log("Notification screen")}
            style={styles.iconButton}
          >
            <Image source={Icons.Bell} style={styles.iconImage} />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={drawerOpen}
        animationType="slide"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <MenuScreen onClose={() => setDrawerOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#F8F8F8",
  },
  iconButton: {
    padding: 4,
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
  },
});
