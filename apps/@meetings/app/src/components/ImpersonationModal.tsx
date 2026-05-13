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
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import { useImpersonationStore } from "../hooks/useImpersonationStore";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import { trpc } from "../shared/api";
import { queryCachePersister } from "../shared/lib/queryCachePersister";
import Modal from "../shared/ui/Modal";
import PrimaryButton from "../shared/ui/PrimaryButton";
import { useSnackbar } from "../shared/ui/Snackbar";
import { Typography } from "../shared/ui/Typography";

type ImpersonationModalNavProp = NativeStackNavigationProp<RootStackParamList>;

interface ImpersonationModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ImpersonationModal({
  visible,
  onClose,
}: ImpersonationModalProps) {
  const { startImpersonating, stopImpersonating, impersonatedEmail } =
    useImpersonationStore();
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();
  const navigation = useNavigation<ImpersonationModalNavProp>();
  const utils = trpc.useUtils();
  const snackbar = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  // Clears our tanstack-query caches so we see data as it pertains to the user.
  const clearCache = () => {
    queryClient.clear();
    queryCachePersister.removeClient();
    navigation.navigate("ClientsRoot", { screen: "Clients" });
  };

  const handleStart = async () => {
    if (!email.trim()) {
      return;
    }

    setIsLoading(true);
    let stateCode: string | undefined;

    try {
      const res = await utils.v1.impersonation.lookupUser.fetch({
        email: email.trim(),
      });

      stateCode = res.stateCode;
      if (!stateCode) {
        snackbar.showSnackbar("No user found with that email.");
      } else {
        startImpersonating(email.trim(), stateCode);
        clearCache();
        onClose();
      }
    } catch (error) {
      snackbar.showSnackbar("Failed to lookup user.");
      console.error("Error looking up impersonation user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    stopImpersonating();
    clearCache();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      containerClassName="max-w-[520px] items-center p-6"
    >
      <View className="gap-4">
        <View className="w-full flex-row items-center justify-between">
          <Typography className="text-xl font-semibold text-primary">
            Impersonate User
          </Typography>
          <TouchableOpacity onPress={onClose}>
            <XIcon className="stroke-muted size-5" />
          </TouchableOpacity>
        </View>

        {impersonatedEmail ? (
          <>
            <Typography className="text-sm text-secondary">
              Currently impersonating:{" "}
              <Typography className="font-semibold text-primary">
                {impersonatedEmail}
              </Typography>
            </Typography>
            <PrimaryButton label="Stop Impersonating" onPress={handleStop} />
          </>
        ) : (
          <>
            <View className="gap-1">
              <Typography className="text-sm text-secondary">Email</Typography>
              <TextInput
                className="rounded-lg border border-subtle bg-primary px-3 py-2 text-base text-primary"
                value={email}
                onChangeText={setEmail}
                placeholder="User's email address"
                autoCapitalize="none"
                keyboardType="email-address"
                onSubmitEditing={handleStart}
                returnKeyType="go"
              />
            </View>
            <PrimaryButton
              label={isLoading ? "Please wait..." : "Impersonate"}
              onPress={handleStart}
              disabled={!email.trim() || isLoading}
            />
          </>
        )}
      </View>
    </Modal>
  );
}
