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

export type SummaryFormat = "standard" | "ne-120-day";

// Map assessment_config_code → SummaryFormat.
// Any code not listed here defaults to "standard".
const CONFIG_CODE_TO_FORMAT: Record<string, SummaryFormat> = {
  RA: "ne-120-day",
};

export function getFormatForConfig(
  code: string | null | undefined,
): SummaryFormat {
  return (code && CONFIG_CODE_TO_FORMAT[code]) || "standard";
}
