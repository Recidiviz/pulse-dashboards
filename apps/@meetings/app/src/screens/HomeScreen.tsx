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
import { Text, View } from "react-native";

import Header from "../components/Header";

const HomeScreen: React.FC = () => {
  return (
    <View className="flex-1">
      <Header />
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-semibold">Home Screen</Text>
      </View>
    </View>
  );
};

export default HomeScreen;
