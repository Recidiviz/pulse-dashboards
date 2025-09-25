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
import { Image, Modal, TouchableOpacity, View } from "react-native";
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
    <SafeAreaView edges={["top"]} className="bg-gray-100">
      <View className="flex-row items-center justify-between border-b border-gray-300 bg-gray-100 px-4 py-3">
        {showDrawer && (
          <TouchableOpacity onPress={() => setDrawerOpen(true)} className="p-1">
            <Image
              source={Icons.Menu}
              className="size-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {showBell && (
          <TouchableOpacity
            onPress={() => console.log("Notification screen")}
            className="p-1"
          >
            <Image
              source={Icons.Bell}
              className="size-6"
              resizeMode="contain"
            />
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
