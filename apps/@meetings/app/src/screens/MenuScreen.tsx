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

import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth0 } from "react-native-auth0";
import { SafeAreaView } from "react-native-safe-area-context";

import Icons from "../../assets/icons";
import MenuItem from "../components/MenuItem";

const MenuScreen = ({ onClose }: { onClose: () => void }) => {
  const { clearSession } = useAuth0();
  const navigation = useNavigation();

  const handleMenuPress = (screen: string) => {
    navigation.navigate(screen as never);
    onClose();
  };

  const onLogout = async () => {
    await clearSession();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Image source={Icons.Cross} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log("Bell pressed")}>
          <Image source={Icons.Bell} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MenuItem
          icon={Icons.Home}
          title="Home"
          onPress={() => handleMenuPress("Home")}
        />
        <MenuItem
          icon={Icons.Trends}
          title="Trends"
          onPress={() => handleMenuPress("Trends")}
        />
        <MenuItem
          icon={Icons.Clients}
          title="Clients"
          onPress={() => handleMenuPress("Clients")}
        />
        <MenuItem
          icon={Icons.Messages}
          title="Messages"
          badge={2}
          onPress={() => handleMenuPress("Messages")}
        />
        <MenuItem
          icon={Icons.Schedule}
          title="Schedule"
          onPress={() => handleMenuPress("Schedule")}
        />
        <MenuItem
          icon={Icons.Resources}
          title="Resources"
          onPress={() => handleMenuPress("Resources")}
        />

        <View style={styles.footer}>
          <TouchableOpacity>
            <Text style={styles.link}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.link}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.link}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  scrollContent: {
    padding: 16,
  },
  footer: {
    marginTop: 50,
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 20,
  },
  link: {
    fontSize: 16,
    fontWeight: "500",
    marginVertical: 8,
    color: "#808283",
  },
});
