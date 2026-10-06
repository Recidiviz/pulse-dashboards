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

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import clsx from "clsx";
import { useEffect } from "react";
import { Pressable, View } from "react-native";

import {
  AdminScreen,
  useAdminNavigationStore,
} from "~@meetings/app/admin/features/admin-navigation";
import {
  DEPLOY_ENV_LABEL,
  RootStackParamList,
} from "~@meetings/app/shared/config";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type NavSection = {
  title: string;
  items: { screen: AdminScreen; label: string }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Meeting review",
    items: [{ screen: "AdminFlaggedMeetings", label: "Flagged meetings" }],
  },
  {
    title: "Configuration",
    items: [{ screen: "AgencyConfig", label: "Agency configurations" }],
  },
];

type AdminSidebarProps = {
  active: AdminScreen;
};

export const AdminSidebar = ({ active }: AdminSidebarProps) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setLastScreen = useAdminNavigationStore((s) => s.setLastScreen);

  useEffect(
    function rememberLastAdminScreen() {
      setLastScreen(active);
    },
    [active, setLastScreen],
  );

  return (
    <View className="w-[216px] flex-none gap-1 border-r border-subtle bg-primary px-3 py-8">
      <Typography variant="heading-3" className="px-2.5 pb-5">
        Admin
      </Typography>
      {NAV_SECTIONS.map((section, index) => (
        <View key={section.title} className="gap-1">
          <Typography
            variant="caption-s-medium"
            className={clsx("px-2.5 pb-1 !text-tertiary", index > 0 && "pt-5")}
          >
            {section.title}
          </Typography>
          {section.items.map(({ screen, label }) => {
            const isActive = screen === active;
            return (
              <Pressable
                key={screen}
                accessibilityRole="link"
                accessibilityState={{ selected: isActive }}
                onPress={() => navigation.navigate(screen)}
                className={clsx(
                  "rounded px-2.5 py-2 hover:bg-hover",
                  isActive && "bg-secondary",
                )}
              >
                <Typography
                  variant={isActive ? "body-s-medium" : "body-s-regular"}
                  className={isActive ? "!text-brand" : "!text-primary"}
                >
                  {label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      ))}
      <Typography variant="caption-s-regular" className="mt-auto px-2.5 pt-4">
        Recidiviz staff only · {DEPLOY_ENV_LABEL}
      </Typography>
    </View>
  );
};
