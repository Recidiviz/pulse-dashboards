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

import { ScrollView, ScrollViewProps, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  fitContent: { flexGrow: 0, flexShrink: 1 },
});

/** The ScrollView to use inside a Sheet, for content that can outgrow it. */
export function SheetScrollView({ style, ...props }: ScrollViewProps) {
  return <ScrollView style={[styles.fitContent, style]} {...props} />;
}
