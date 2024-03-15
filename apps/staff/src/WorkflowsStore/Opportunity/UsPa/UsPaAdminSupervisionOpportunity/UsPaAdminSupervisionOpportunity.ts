/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2024 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { Client } from "../../../Client";
import { UsPaAdminSupervisionForm } from "../../Forms/UsPaAdminSupervisionForm";
import { OpportunityBase } from "../../OpportunityBase";
import {
  UsPaAdminSupervisionReferralRecord,
  usPaAdminSupervisionSchema,
} from "./UsPaAdminSupervisionReferralRecord";

export class UsPaAdminSupervisionOpportunity extends OpportunityBase<
  Client,
  UsPaAdminSupervisionReferralRecord
> {
  form: UsPaAdminSupervisionForm;

  constructor(client: Client) {
    super(
      client,
      "usPaAdminSupervision",
      client.rootStore,
      usPaAdminSupervisionSchema.parse,
    );

    this.form = new UsPaAdminSupervisionForm(this, client.rootStore);
  }
}
