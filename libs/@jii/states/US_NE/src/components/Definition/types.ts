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

import { RouteParams, State } from "~@jii/paths";
import { UsNeTranslationsObject } from "~@jii/translation";

export type UsNeInfoPageSlugs = keyof UsNeTranslationsObject["infoPages"];

type ErrorIfUnroutableSlugs<
  T extends RouteParams<typeof State.Resident.UsNeMoreInformation>["pageSlug"],
> = T;

// This type exists to check that all info pages defined in the translations file
// have been added to the UsNeMoreInformation route in libs/@jii/paths/src/paths.ts.
// If it's throwing an error, add the missing slug there. The other direction
// is already checked implicitly in the Definitions component.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type InfoPagesRoutableCheck = ErrorIfUnroutableSlugs<UsNeInfoPageSlugs>;
