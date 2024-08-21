// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

// Put types that need to be exported to other apps here

// This is a workaround for the fact that we can't enforce type-only exports from a project
// TODO(https://github.com/Recidiviz/recidiviz-data/issues/31084): Remove this lint exception once sentencing-server code gets moved into a library
// eslint-disable-next-line @nx/enforce-module-boundaries
export type { AppRouter } from "~sentencing-server/shared/types";
