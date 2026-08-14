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

// @monaco-editor/react loads the editor engine from cdn.jsdelivr.net at a
// version baked into @monaco-editor/loader's own code (not derived from our
// package.json). firebase.meetings.json's CSP pins that exact URL, so
// monaco-editor/@monaco-editor/react/@monaco-editor/loader are version-locked
// (exact, no ^) in package.json — bumping any of them requires updating the
// CSP entry to match, or Monaco silently stops loading in deployed envs.
import Editor, { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { trpc } from "~@meetings/app/shared/api";
import { DEPLOY_ENV_LABEL } from "~@meetings/app/shared/config";
import { humanReadableTitleCase } from "~@meetings/app/shared/lib/format";
import { useSetDocumentTitle } from "~@meetings/app/shared/lib/platform";
import { Button } from "~@meetings/app/shared/ui/Button";
import Dropdown from "~@meetings/app/shared/ui/Dropdown";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { Header } from "~@meetings/app/widgets/header";
import {
  AgencyConfigFileSchema,
  BaseConfigFileSchema,
  MEETINGS_STATE_CODES,
  newAgencyConfigYamlTemplate,
} from "~@meetings/config";

import {
  computeMarkers,
  ConfigSchema,
  MARKER_OWNER,
  parseIdentity,
  parseVersion,
} from "../lib/configValidation";

// Currently only one base exists, all agency configs default to merge with this base
const BASE_CONFIG_ID = "base";

export const AgencyConfigScreen = () => {
  const insets = useSafeAreaInsets();
  useSetDocumentTitle("Agency Config - Recidiviz Meetings");
  const utils = trpc.useUtils();

  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [editedConfigText, setEditedConfigText] = useState("");
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  const snackbar = useSnackbar();

  const { data: agencyIdToName, isLoading } =
    trpc.v1.config.getNames.useQuery(undefined);

  const isCreatingNew =
    !!selectedConfigId &&
    !!agencyIdToName &&
    !(selectedConfigId in agencyIdToName);

  const { data: selectedAgencyConfig } = trpc.v1.config.getByState.useQuery(
    { id: selectedConfigId },
    { enabled: !!selectedConfigId && !isCreatingNew },
  );

  // null when creating new so we don't derive everything from stale cache
  const savedConfig = isCreatingNew ? undefined : selectedAgencyConfig;

  const addNewConfig = trpc.v1.config.saveNewConfig.useMutation({
    onSuccess: () => {
      // So just-saved content is used for tracking unsaved-changes/updated version
      utils.v1.config.getByState.invalidate({ id: selectedConfigId });
      utils.v1.config.getNames.invalidate();
      utils.v1.config.getAll.invalidate();
      snackbar.showSnackbar("Changes saved.");
    },
    onError: () => {
      snackbar.showSnackbar("Failed to save changes.");
    },
  });

  useEffect(
    function initializeConfigTextOnSelect() {
      // handleCreateNew sets editedConfigText to the starter template, so we don't want to overwrite here
      if (isCreatingNew) {
        return;
      }
      setEditedConfigText(savedConfig?.config ?? "");
    },
    [savedConfig, isCreatingNew],
  );

  const displayNameToId = agencyIdToName
    ? Object.fromEntries(
        Object.entries(agencyIdToName).map(([id, name]) => {
          const formattedId = id.toUpperCase();
          const displayName = name
            ? `${name} (${formattedId})`
            : `${humanReadableTitleCase(id)} (${formattedId})`;
          return [displayName, id];
        }),
      )
    : {};

  const displayNames = Object.keys(displayNameToId).sort();

  const selectedDisplayName =
    Object.entries(displayNameToId).find(
      ([, id]) => id === selectedConfigId,
    )?.[0] ?? (isCreatingNew ? `${selectedConfigId.toUpperCase()}` : undefined);

  const missingStateCodes = MEETINGS_STATE_CODES.filter(
    (stateCode) => !(stateCode.toLowerCase() in (agencyIdToName ?? {})),
  );

  const handleSelect = (displayName: string) => {
    setSelectedConfigId(displayNameToId[displayName]);
  };

  const handleCreateNew = (stateCode: string) => {
    setSelectedConfigId(stateCode.toLowerCase());
    setEditedConfigText(newAgencyConfigYamlTemplate(stateCode));
  };

  const hasUnsavedChanges =
    !!editedConfigText && editedConfigText !== savedConfig?.config;

  // configs created in the UI are agency configs not bases
  const configSchema: ConfigSchema =
    isCreatingNew || savedConfig?.parentId
      ? AgencyConfigFileSchema
      : BaseConfigFileSchema;

  const originalVersion = savedConfig
    ? parseVersion(savedConfig.config, configSchema)
    : null;

  const canSave =
    hasUnsavedChanges && !hasValidationErrors && !addNewConfig.isPending;

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    addNewConfig.mutate({
      id: selectedConfigId,
      newConfig: editedConfigText,
      parentId: isCreatingNew ? BASE_CONFIG_ID : savedConfig?.parentId ?? null,
    });
  };
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const validate = useCallback(
    function generateErrorMarkersFromText(text: string) {
      const monaco = monacoRef.current;
      const model = editorRef.current?.getModel();
      if (!monaco || !model) {
        return;
      }
      const minVersion = hasUnsavedChanges ? originalVersion : null;
      const originalIdentity = savedConfig
        ? parseIdentity(savedConfig.config, configSchema)
        : { stateCode: selectedConfigId.toUpperCase() };
      const markers = computeMarkers(
        monaco,
        text,
        configSchema,
        minVersion,
        originalIdentity,
      );
      monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
      setHasValidationErrors(
        markers.some(
          (marker) => marker.severity === monaco.MarkerSeverity.Error,
        ),
      );
    },
    [
      hasUnsavedChanges,
      originalVersion,
      configSchema,
      savedConfig,
      selectedConfigId,
    ],
  );

  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    monacoRef.current = monaco;
    editorRef.current = editorInstance;
    validate(editorInstance.getValue());
  };

  useEffect(
    function revalidateUpdatedConfigText() {
      validate(editedConfigText);
    },
    [editedConfigText, validate],
  );

  return (
    <SafeAreaView
      className="flex-1 bg-screen"
      style={{ marginTop: -insets.top, marginBottom: insets.bottom }}
      edges={["top"]}
    >
      <Header />
      <View className="flex-1 px-4 pb-6 pt-10 md:px-10">
        <View className="mx-auto w-full max-w-[960px] flex-1">
          {/* Toolbar: relative + z-50 is critical so the dropdown renders above Monaco */}
          <View className="relative z-50 mb-6">
            <Typography variant="heading-1">Agency Configurations</Typography>
            <Typography className="my-2" variant="body-s-regular">
              View and edit agency configs for {DEPLOY_ENV_LABEL}.
            </Typography>
            <View className="flex-row items-center justify-between pt-3">
              {isLoading ? (
                <Typography>Loading…</Typography>
              ) : (
                <Dropdown
                  key={selectedDisplayName ?? "none"}
                  value={selectedDisplayName}
                  variant="text"
                  options={displayNames}
                  onSelect={handleSelect}
                  label="Select existing agency"
                  defaultEmptyValue
                  className="my-1"
                />
              )}
              {hasUnsavedChanges && (
                <TouchableOpacity onPress={handleSave} disabled={!canSave}>
                  <View
                    className={`flex-row items-center gap-1 rounded-full px-4 py-2 ${
                      canSave ? "bg-brand" : "bg-disabled"
                    }`}
                  >
                    <Typography
                      className={`text-sm font-semibold leading-4 ${
                        canSave ? "text-on-brand" : "text-on-disabled"
                      }`}
                    >
                      {isCreatingNew
                        ? "Create config"
                        : "Save as a new version"}
                    </Typography>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {!isLoading && selectedConfigId && (
            <View className="flex-1 overflow-hidden rounded-lg shadow-sm">
              <Editor
                height="100%"
                defaultLanguage="yaml"
                theme="vs"
                value={editedConfigText}
                onChange={(val) => setEditedConfigText(val ?? "")}
                onMount={handleEditorDidMount}
                options={{
                  fixedOverflowWidgets: true, // Forces Monaco popups to absolute float, preventing clipping
                  minimap: { enabled: false },
                  padding: { top: 16, bottom: 16 },
                  fontSize: 14,
                  fontFamily: "monospace",
                  lineNumbers: "on",
                  scrollBeyondLastLine: true,
                  automaticLayout: true,
                  renderLineHighlight: "none",
                }}
              />
            </View>
          )}
          {!isLoading && missingStateCodes.length > 0 && (
            <View className="mt-6 flex-row items-center gap-2">
              <Typography className="text-sm text-secondary md:text-base">
                Create a new config for:
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {missingStateCodes.map((stateCode) => (
                  <Button
                    key={stateCode}
                    variant="secondary"
                    onPress={() => handleCreateNew(stateCode)}
                  >
                    {stateCode}
                  </Button>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
