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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import type { AdminScreen } from "~@meetings/app/admin/features/admin-navigation";
import { Header } from "~@meetings/app/widgets/header";

import { AdminSidebar } from "./AdminSidebar";

type AdminLayoutProps = {
  /** The sidebar entry to highlight. */
  active: AdminScreen;
  children: React.ReactNode;
};

/** The app header and Admin sidebar around one Admin screen's content. */
export const AdminLayout = ({ active, children }: AdminLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      className="flex-1 bg-primary"
      style={{ marginTop: -insets.top, marginBottom: insets.bottom }}
      edges={["top"]}
    >
      <Header />
      <View className="flex-1 flex-row">
        <AdminSidebar active={active} />
        <View className="flex-1 px-4 pb-16 pt-8 md:px-10">
          <View className="mx-auto w-full max-w-[1240px] flex-1">
            {children}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
