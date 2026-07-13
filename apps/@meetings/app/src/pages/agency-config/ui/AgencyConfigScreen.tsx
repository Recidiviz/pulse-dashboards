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
import React, { useEffect, useState } from "react";
import { Platform, ScrollView, TextInput } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useUserContext } from "~@meetings/app/entities/user";
import { trpc } from "~@meetings/app/shared/api";
import { RootStackParamList } from "~@meetings/app/shared/config";
import { useSetDocumentTitle } from "~@meetings/app/shared/lib/platform";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { Header } from "~@meetings/app/widgets/header";

import Dropdown from "../../../shared/ui/Dropdown";

type AgencyConfigNavProp = NativeStackNavigationProp<RootStackParamList>;

export const AgencyConfigScreen = () => {
  useSetDocumentTitle("Agency Config - Recidiviz Meetings");
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AgencyConfigNavProp>();

  const { isRecidivizUser } = useUserContext();
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [editedConfigText, setEditedConfigText] = useState("");

  const { data: agencyIdToName, isLoading } = trpc.v1.config.getNames.useQuery(
    undefined,
    { enabled: isRecidivizUser },
  );

  const { data: configText } = trpc.v1.config.getByState.useQuery(
    { id: selectedConfigId },
    { enabled: !!selectedConfigId },
  );

  useEffect(() => {
    setEditedConfigText(configText ?? "");
  }, [configText]);

  const displayNameToId = agencyIdToName
    ? Object.fromEntries(
        Object.entries(agencyIdToName).map(([id, name]) => {
          const formattedId = id.toUpperCase();
          const displayName = name
            ? `${name} (${formattedId})`
            : `${id
                .split("_")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                )
                .join(" ")} (${formattedId})`;
          return [displayName, id];
        }),
      )
    : {};

  const displayNames = Object.keys(displayNameToId).sort();

  const handleSelect = (displayName: string) => {
    setSelectedConfigId(displayNameToId[displayName]);
  };

  return (
    <SafeAreaView className="flex-1 bg-screen" edges={["top"]}>
      <Header
        showDrawer
        showGoBack={false}
        onGoBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Typography className="mb-6 text-2xl font-semibold text-primary">
          Agency Configurations
        </Typography>
        {isLoading ? (
          <Typography>Loading…</Typography>
        ) : (
          <>
            <Dropdown
              variant="text"
              value={selectedConfigId}
              options={displayNames}
              onSelect={handleSelect}
              placeholder="Select an agency"
              defaultEmptyValue
            />
            {selectedConfigId && (
              <TextInput
                value={editedConfigText}
                onChangeText={setEditedConfigText}
                multiline
                spellCheck={false}
                style={{
                  fontFamily: Platform.OS === "web" ? "monospace" : "Courier",
                  fontSize: 13,
                  lineHeight: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  minHeight: 600,
                  textAlignVertical: "top",
                }}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
