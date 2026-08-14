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

import { AgencyConfigFile } from "~@meetings/config/types";

export function mergeWithBase(
  base: Omit<AgencyConfigFile, "name" | "stateCode">,
  agency: AgencyConfigFile,
): Record<string, unknown> {
  return {
    ...base,
    ...agency,
    baseVersion: base.version,
    keywords: agency.keywords ?? [
      ...(base.keywords ?? []),
      ...(agency.additionalKeywords ?? []),
    ],
    glossary: agency.glossary ?? {
      ...(base.glossary ?? {}),
      ...(agency.additionalGlossary ?? {}),
    },
    rules: agency.rules ?? [
      ...(base.rules ?? []),
      ...(agency.additionalRules ?? []),
    ],
    outputs: (() => {
      const resolved = agency.outputs ?? [
        ...(base.outputs ?? []),
        ...(agency.additionalOutputs ?? []),
      ];
      return resolved.map((output) => {
        if (
          !agency.outputPatches ||
          agency.outputPatches[output.id] === undefined
        ) {
          return output;
        }
        const patch = agency.outputPatches[output.id];
        return patch ? { ...output, ...patch } : output;
      });
    })(),
    labels: { ...base.labels, ...(agency.labels ?? {}) },
    // Strip additional* fields — not part of resolved AgencyConfig
    additionalKeywords: undefined,
    additionalGlossary: undefined,
    additionalRules: undefined,
    additionalOutputs: undefined,
    outputPatches: undefined,
  };
}
