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
import Dropdown from "~@meetings/app/shared/ui/Dropdown";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import { Header } from "~@meetings/app/widgets/header";
import {
  AgencyConfigFileSchema,
  BaseConfigFileSchema,
} from "~@meetings/config";

import {
  computeMarkers,
  ConfigSchema,
  MARKER_OWNER,
  parseVersion,
} from "../lib/configValidation";

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

  const { data: selectedAgencyConfig } = trpc.v1.config.getByState.useQuery(
    { id: selectedConfigId },
    { enabled: !!selectedConfigId },
  );

  const addNewConfig = trpc.v1.config.saveNewConfig.useMutation({
    onSuccess: () => {
      // So just-saved content is used for tracking unsaved-changes/updated version
      utils.v1.config.getByState.invalidate({ id: selectedConfigId });
      snackbar.showSnackbar("Changes saved.");
    },
    onError: () => {
      snackbar.showSnackbar("Failed to save changes.");
    },
  });

  useEffect(
    function initializeConfigTextOnSelect() {
      setEditedConfigText(selectedAgencyConfig?.config ?? "");
    },
    [selectedAgencyConfig],
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

  const handleSelect = (displayName: string) => {
    setSelectedConfigId(displayNameToId[displayName]);
  };

  const hasUnsavedChanges =
    !!editedConfigText && editedConfigText !== selectedAgencyConfig?.config;

  const configSchema: ConfigSchema = selectedAgencyConfig?.parentId
    ? AgencyConfigFileSchema
    : BaseConfigFileSchema;

  const originalVersion = selectedAgencyConfig
    ? parseVersion(selectedAgencyConfig.config, configSchema)
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
      parentId: selectedAgencyConfig?.parentId ?? null,
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
      const markers = computeMarkers(monaco, text, configSchema, minVersion);
      monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
      setHasValidationErrors(markers.length > 0);
    },
    [hasUnsavedChanges, originalVersion, configSchema],
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
                  variant="text"
                  options={displayNames}
                  onSelect={handleSelect}
                  placeholder="Select an agency"
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
                      Save as a new version
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
        </View>
      </View>
    </SafeAreaView>
  );
};
