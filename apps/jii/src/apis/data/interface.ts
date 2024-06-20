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

import { ResidentRecord } from "~datatypes";
import { FilterParams } from "~firestore-api";

import {
  IncarcerationOpportunityId,
  OpportunityRecord,
  ResidentsConfig,
} from "../../configs/types";

export interface DataAPI {
  /**
   * Fetches residents application config object for the active StateCode.
   */
  residentsConfig(): Promise<ResidentsConfig>;
  /**
   * Fetches data for available residents for the active StateCode, applying
   * additional filters as specified.
   */
  residents(
    filters?: Array<FilterParams>,
  ): Promise<Array<ResidentRecord["output"]>>;
  /**
   * Fetches data for the resident with personExternalId matching `residentExternalId`
   * for the active StateCode. Throws if a match cannot be found.
   */
  residentById(residentExternalId: string): Promise<ResidentRecord["output"]>;
  /**
   * Fetches the opportunity eligibility record for the specified resident
   * and opportunity type for the active StateCode. Will not throw if a record cannot be found;
   * the lack of a record should indicate that the resident is not currently eligible.
   */
  residentEligibility<O extends IncarcerationOpportunityId>(
    residentExternalId: string,
    opportunity: IncarcerationOpportunityId,
  ): Promise<OpportunityRecord<O> | undefined>;
}
