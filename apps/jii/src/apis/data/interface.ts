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
  LandingPageConfig,
  OpportunityRecord,
  ResidentsConfig,
  StateCode,
  StateLandingPageConfig,
} from "../../configs/types";

export interface DataAPI {
  /**
   * Fetches application config object for the landing page (pre-login)
   */
  landingPageConfig(): Promise<LandingPageConfig>;
  /**
   * Fetches application config object for a state-specific landing page (pre-login)
   */
  stateLandingPageConfig(stateCode: StateCode): Promise<StateLandingPageConfig>;
  /**
   * Fetches residents application config object for the active StateCode.
   */
  residentsConfig(): Promise<ResidentsConfig>;
  /**
   * Fetches data for available residents for the active StateCode, applying
   * additional filters as specified.
   */
  residents(filters?: Array<FilterParams>): Promise<Array<ResidentRecord>>;
  /**
   * Fetches data for the resident with personExternalId matching `residentExternalId`
   * for the active StateCode. Throws if a match cannot be found.
   */
  residentById(residentExternalId: string): Promise<ResidentRecord>;
  /**
   * Fetches data for the resident with pseudonymizedId matching `residentPseudoId`
   * for the active StateCode. Throws if a match cannot be found.
   */
  residentByPseudoId(residentPseudoId: string): Promise<ResidentRecord>;
  /**
   * Fetches the opportunity eligibility record for the specified resident
   * and opportunity type for the active StateCode. Throws if a record is not found.
   * (i.e., unlike Workflows this API requires a record even for ineligible residents.)
   */
  residentEligibility<O extends IncarcerationOpportunityId>(
    residentExternalId: string,
    opportunity: IncarcerationOpportunityId,
  ): Promise<OpportunityRecord<O>>;
}
