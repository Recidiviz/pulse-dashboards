// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { View } from "react-native";

const LinearProgressBar = () => {
  return (
    <View className="w-full">
      <View className="relative block h-1 w-full overflow-hidden bg-[#00665F33]">
        <View className="absolute inset-y-0 -left-full w-full animate-linear-progress-1 bg-[#006C67]" />
        <View className="absolute inset-y-0 -left-full w-full animate-linear-progress-2 bg-[#006C67]" />
      </View>
    </View>
  );
};

export default LinearProgressBar;
