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
import clsx from "clsx";
import { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";
import ExternalLinkIcon from "react-native-heroicons/outline/ExternalLinkIcon";

import { useUserContext } from "~@meetings/app/entities/user";
import { ImpersonationModal } from "~@meetings/app/features/impersonation";
import { useStateSelection } from "~@meetings/app/features/state-selection";
import BgAvatarImage from "~@meetings/app/shared/assets/images/bg-avatar.png";
import { IS_PROD } from "~@meetings/app/shared/config";
import { getInitials } from "~@meetings/app/shared/lib/format";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { cpaUrl, dashboardUrl } from "../config/external-links";
import { HeaderNavProp } from "../model/header";
import { ProfileMenuItem } from "./ProfileMenuItem";

export const ProfileMenu = () => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showImpersonationModal, setShowImpersonationModal] = useState(false);
  const navigation = useNavigation<HeaderNavProp>();
  const {
    onLogout,
    name,
    email,
    hasSupervisionAssistantAccess,
    hasFacilitiesAssistantAccess,
    hasCasePlanningAssistantAccess,
    isRecidivizUser,
  } = useUserContext();
  const { canSelectStateCode, currentStateName } = useStateSelection();

  const handleDropdownMenuPress = (callback?: () => void) => {
    setProfileDropdownOpen(false);
    callback?.();
  };

  return (
    <View className="relative">
      <TouchableOpacity
        onPress={() => setProfileDropdownOpen(!profileDropdownOpen)}
      >
        <View
          className={clsx(
            "flex-row items-center gap-x-1 rounded-full border p-1.5 transition-all duration-300",
            profileDropdownOpen
              ? "border-brand hover:border-brand"
              : "border-transparent hover:border-subtle",
          )}
        >
          <ImageBackground
            source={BgAvatarImage}
            className="size-8 items-center justify-center overflow-hidden rounded-full"
            imageClassName="!size-8"
          >
            <Typography className="text-base text-on-brand">
              {name ? getInitials(name) : "SS"}
            </Typography>
          </ImageBackground>
          {profileDropdownOpen ? (
            <ChevronUpIcon className="size-4 stroke-[3px] text-primary" />
          ) : (
            <ChevronDownIcon className="size-4 stroke-[3px] text-primary" />
          )}
        </View>
      </TouchableOpacity>
      {profileDropdownOpen && (
        <>
          <TouchableWithoutFeedback
            onPress={() => setProfileDropdownOpen(false)}
          >
            <View className="fixed inset-0 z-40" />
          </TouchableWithoutFeedback>
          <View className="absolute right-0 top-16 z-50 rounded-[20px] bg-primary p-2 shadow-sm">
            <ScrollView contentContainerClassName="gap-1 cursor-pointer">
              <View className="mb-1 flex min-w-[337px] cursor-default flex-row items-center gap-3 rounded-2xl bg-brand-light-secondary p-3.5">
                <ImageBackground
                  source={BgAvatarImage}
                  className="size-12 items-center justify-center overflow-hidden rounded-full"
                  imageClassName="!size-12"
                >
                  <Typography className="text-2xl leading-6 text-on-brand">
                    {name ? getInitials(name) : "SS"}
                  </Typography>
                </ImageBackground>
                <View className="flex flex-col justify-between">
                  <Typography className="text-base font-semibold leading-5 text-primary">
                    {name ?? "Test User"}
                  </Typography>
                  <Typography className="text-base font-normal text-secondary">
                    {email ?? "testuser@example.com"}
                  </Typography>
                </View>
              </View>
              {canSelectStateCode && (
                <ProfileMenuItem
                  link={{
                    screen: "StateSelection",
                    onPress: () => setProfileDropdownOpen(false),
                  }}
                  label="Profile"
                  helperText={`Current state: ${currentStateName}`}
                />
              )}
              {!IS_PROD && (
                <ProfileMenuItem
                  pressable={{
                    onPress: () => navigation.navigate("Onboarding"),
                  }}
                  label="Set Up"
                />
              )}
              {hasSupervisionAssistantAccess && (
                <ProfileMenuItem
                  pressable={{
                    onPress: () =>
                      handleDropdownMenuPress(() =>
                        window.open(
                          dashboardUrl,
                          "_blank",
                          "noopener,noreferrer",
                        ),
                      ),
                  }}
                  label="Go to Supervision Assistant"
                  icon={
                    <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-secondary" />
                  }
                />
              )}
              {hasFacilitiesAssistantAccess && (
                <ProfileMenuItem
                  pressable={{
                    onPress: () =>
                      handleDropdownMenuPress(() =>
                        window.open(
                          dashboardUrl,
                          "_blank",
                          "noopener,noreferrer",
                        ),
                      ),
                  }}
                  label="Go to Facilities Assistant"
                  icon={
                    <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-secondary" />
                  }
                />
              )}
              {hasCasePlanningAssistantAccess && (
                <ProfileMenuItem
                  pressable={{
                    onPress: () =>
                      handleDropdownMenuPress(() =>
                        window.open(cpaUrl, "_blank", "noopener,noreferrer"),
                      ),
                  }}
                  label="Go to Case Planning Assistant"
                  icon={
                    <ExternalLinkIcon className="ml-auto size-4 stroke-[3px] text-secondary" />
                  }
                />
              )}
              {isRecidivizUser && (
                <ProfileMenuItem
                  pressable={{
                    onPress: () => {
                      setShowImpersonationModal(true);
                    },
                  }}
                  label="Impersonate User"
                />
              )}
              <ProfileMenuItem
                pressable={{
                  onPress: () => handleDropdownMenuPress(onLogout),
                }}
                label="Log Out"
              />
            </ScrollView>
          </View>
        </>
      )}
      <ImpersonationModal
        visible={showImpersonationModal}
        onClose={() => setShowImpersonationModal(false)}
      />
    </View>
  );
};
