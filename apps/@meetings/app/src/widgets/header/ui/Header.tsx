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

import { Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeaderProps } from "../model/header";
import { DesktopNav } from "./DesktopNav";
import { MobileHeader } from "./MobileHeader";
import { StatusBanners } from "./StatusBanners";

export const Header = ({
  showDrawer = true,
  showGoBack = false,
  onGoBack,
}: HeaderProps) => {
  return (
    <SafeAreaView edges={["top"]} className="z-10 bg-primary">
      {Platform.select({
        native: (
          <MobileHeader
            showDrawer={showDrawer}
            showGoBack={showGoBack}
            onGoBack={onGoBack}
          />
        ),
        web: (
          <View>
            <MobileHeader
              showDrawer={showDrawer}
              showGoBack={showGoBack}
              onGoBack={onGoBack}
              className="md:hidden"
            />
            <DesktopNav />
          </View>
        ),
      })}
      <StatusBanners />
    </SafeAreaView>
  );
};
