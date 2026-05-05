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

export const saveItem = async (key: string, value: string) => {
  await AsyncStorage.setItem(key, value);
};

export const getItem = async <T = string,>(
  key: string,
  parse?: (raw: string) => T,
): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) {
    return null;
  }

  return parse ? parse(raw) : (raw as unknown as T);
};

export const removeItem = async (key: string) => {
  await AsyncStorage.removeItem(key);
};
