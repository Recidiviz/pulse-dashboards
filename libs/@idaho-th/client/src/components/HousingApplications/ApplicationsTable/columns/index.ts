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

import "./types";

import { ColumnDef } from "@tanstack/react-table";

import { HousingApplication } from "../../../../interfaces/common";
import { clientNameColumn } from "./clientName.column";
import { expectedReleaseDateColumn } from "./expectedReleaseDate.column";
import { idocNumberColumn } from "./idocNumber.column";
import { lastActivityAtColumn } from "./lastActivityAt.column";
import { stageColumn } from "./stage.column";
import { statusColumn } from "./status.column";

export const COLUMNS: ColumnDef<HousingApplication>[] = [
  clientNameColumn,
  idocNumberColumn,
  expectedReleaseDateColumn,
  stageColumn,
  statusColumn,
  lastActivityAtColumn,
];

export const PROVIDER_COLUMNS: ColumnDef<HousingApplication>[] = [
  clientNameColumn,
  idocNumberColumn,
  expectedReleaseDateColumn,
  stageColumn,
  statusColumn,
  lastActivityAtColumn,
];
