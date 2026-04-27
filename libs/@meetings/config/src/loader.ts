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

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "yaml";

import {
  AgencyConfig,
  AgencyConfigFile,
  AgencyConfigFileSchema,
  AgencyConfigSchema,
} from "~@meetings/config/types";

// Base YAML omits name/stateCode — make them optional for parsing
const BaseConfigFileSchema = AgencyConfigFileSchema.omit({
  name: true,
  stateCode: true,
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- @ts-expect-error can't be used here: the error only appears when
// checked under a tsconfig with module:commonjs; under this lib's own esm tsconfig
// import.meta.url is valid and no error exists, so @ts-expect-error would itself error.
const YAML_DIR = fileURLToPath(new URL("yaml", import.meta.url).href);

function loadYaml(filename: string): unknown {
  const filePath = path.join(YAML_DIR, filename);
  return parse(fs.readFileSync(filePath, "utf8"));
}

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
    // Strip additional* fields — not part of resolved AgencyConfig
    additionalKeywords: undefined,
    additionalGlossary: undefined,
    additionalRules: undefined,
    additionalOutputs: undefined,
    outputPatches: undefined,
  };
}

export function loadAgencyConfig(stateCode: string): AgencyConfig {
  const filename = `${stateCode.toLowerCase()}.yaml`;

  const rawBase = BaseConfigFileSchema.parse(loadYaml("base.yaml"));
  const rawAgency = AgencyConfigFileSchema.parse(loadYaml(filename));

  const merged = mergeWithBase(rawBase, rawAgency);
  return AgencyConfigSchema.parse(merged);
}

/**
 * Loads and validates all agency configs at startup.
 * Fails loudly on any invalid YAML or schema violation.
 */
function loadAllAgencyConfigs(): Record<string, AgencyConfig> {
  const files = fs
    .readdirSync(YAML_DIR)
    .filter((f) => f.endsWith(".yaml") && f !== "base.yaml");

  const configs: Record<string, AgencyConfig> = {};

  for (const file of files) {
    const stateCode = path.basename(file, ".yaml").toUpperCase();
    configs[stateCode] = loadAgencyConfig(stateCode);
  }

  return configs;
}

export const AGENCY_CONFIGS: Record<string, AgencyConfig> =
  loadAllAgencyConfigs();

export function generateConfigKey(config: AgencyConfig): string {
  return `${config.stateCode}@v${config.version}-base@v${config.baseVersion}`;
}
