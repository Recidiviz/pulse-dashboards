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

import { ConfigArray } from "typescript-eslint";

type TagKey = "util" | "ui" | "feature" | "state";

export const TYPE_TAGS: Record<TagKey, string>;

declare const baseConfig: ConfigArray;
export default baseConfig;

type RestrictedImportsPath = {
  name: string;
  importNames?: string[];
  message: string;
};

export const designSystemRestrictedImports: RestrictedImportsPath;

export const esmRestrictedImports: Array<RestrictedImportsPath>;

export const jiiRestrictedImports: Array<RestrictedImportsPath>;

export const reactRestrictedImports: Array<RestrictedImportsPath>;

export const reactConfig: ConfigArray;
