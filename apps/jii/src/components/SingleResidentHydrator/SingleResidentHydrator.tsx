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

import { memo } from "react";

import { useNewResidentData } from "~@jii/data";

import { SingleResidentFirestoreHydrator } from "./SingleResidentFirestoreHydrator";
import { SingleResidentTrpcHydrator } from "./SingleResidentTrpcHydrator";

export const SingleResidentHydrator = memo(function SingleResidentHydrator() {
  return useNewResidentData() ? (
    <SingleResidentTrpcHydrator />
  ) : (
    // TODO(OBT-29541): get rid of this entirely
    <SingleResidentFirestoreHydrator />
  );
});
