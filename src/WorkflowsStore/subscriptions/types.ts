// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { DocumentData } from "firebase/firestore";

import { Hydratable } from "../../core/models/types";

export interface Subscription<DataFormat> {
  data: DataFormat;
  subscribe: () => void;
  unsubscribe: () => void;
}

export interface DocumentSubscription<DataFormat>
  extends Subscription<DataFormat | undefined>,
    Hydratable {}

export interface QuerySubscription<DataFormat>
  extends Subscription<DataFormat[]>,
    Hydratable {}

export type TransformFunction<DataFormat> = (
  rawRecord: DocumentData | undefined
) => DataFormat | undefined;

export type ValidateFunction<DataFormat> = (
  transformedRecord: DataFormat
) => void;
