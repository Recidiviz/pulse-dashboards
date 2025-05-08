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

import { where } from "firebase/firestore";
import { z } from "zod";

import { ResidentRecord } from "~datatypes";

import { FirestoreCollectionKey } from "../types";

export type FilterParams = Parameters<typeof where>;

export interface FirestoreAPI {
  authenticate(firebaseToken: string): Promise<void>;

  residents(
    stateCode: string,
    filters?: Array<FilterParams>,
  ): Promise<Array<ResidentRecord>>;

  resident(
    stateCode: string,
    externalId: string,
  ): Promise<ResidentRecord | undefined>;

  residentByPseudoId(
    stateCode: string,
    pseudoId: string,
  ): Promise<ResidentRecord | undefined>;

  recordForExternalId<Schema extends z.ZodTypeAny>(
    stateCode: string,
    collection: FirestoreCollectionKey,
    externalId: string,
    recordSchema: Schema,
  ): Promise<z.infer<Schema> | undefined>;
}
