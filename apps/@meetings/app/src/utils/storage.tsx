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

import AsyncStorage from "@react-native-async-storage/async-storage";

import { RecordingStatus } from "../common/types";

export const saveItem = async (key: string, value: string) => {
  await AsyncStorage.setItem(key, value);
};

export const getItem = async (key: string) => {
  return (await AsyncStorage.getItem(key)) || "";
};

export const removeItem = async (key: string) => {
  await AsyncStorage.removeItem(key);
};

// --- Helpers for recording state persistence ---
export const setRecordingState = async (state: RecordingStatus) => {
  await saveItem("recordingState", state);
};

export const getRecordingState = async (): Promise<RecordingStatus> => {
  const saved = await getItem("recordingState");
  return (saved as RecordingStatus) || "idle";
};

// --- Helpers for recording URI persistence ---
export const saveRecordingUri = async (uri: string) => {
  await saveItem("recordingUri", uri);
};

export const getRecordingUri = async (): Promise<string | null> => {
  const saved = await getItem("recordingUri");
  return saved || null;
};

export const removeRecordingUri = async () => {
  await removeItem("recordingUri");
};
