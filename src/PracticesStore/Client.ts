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

import { ClientRecord, subscribeToClientUpdates } from "../firestore";
import { ClientUpdate } from "./ClientUpdate";
import { observableSubscription, SubscriptionValue } from "./utils";

type FullName = {
  givenNames?: string;
  middleName?: string;
  surname?: string;
};

export class Client {
  id: string;

  stateCode: string;

  fullName: FullName;

  officerId: string;

  supervisionType: string;

  supervisionLevel: string;

  supervisionLevelStart: Date;

  compliantReportingEligible?: {
    offenseType: string[];
    judicialDistrict: string;
    drugNegativePastYear: Date[];
    sanctionsPastYear: { type: string }[];
  };

  private fetchedUpdates: SubscriptionValue<ClientUpdate>;

  constructor(record: ClientRecord) {
    this.id = record.personExternalId;
    this.stateCode = record.stateCode;
    this.fullName = JSON.parse(record.personName);
    this.officerId = record.officerId;
    this.supervisionType = record.supervisionType;
    this.supervisionLevel = record.supervisionLevel;
    this.supervisionLevelStart = record.supervisionLevelStart.toDate();

    const { compliantReportingEligible } = record;
    if (compliantReportingEligible) {
      this.compliantReportingEligible = {
        offenseType: compliantReportingEligible.offenseType,
        judicialDistrict: compliantReportingEligible.judicialDistrict,
        drugNegativePastYear: compliantReportingEligible.lastDrugNegative.map(
          (t) => t.toDate()
        ),
        sanctionsPastYear: compliantReportingEligible.lastSanction
          ? [{ type: compliantReportingEligible.lastSanction }]
          : [],
      };
    }

    // connect to additional data sources for this client
    this.fetchedUpdates = observableSubscription((handler) =>
      subscribeToClientUpdates(this.stateCode, this.id, (r) => {
        const [updateRecord] = r;
        if (updateRecord) {
          handler(new ClientUpdate(updateRecord));
        }
      })
    );
  }

  get displayName(): string {
    return [this.fullName.givenNames, this.fullName.surname]
      .filter((n) => Boolean(n))
      .join(" ");
  }

  get updates(): ClientUpdate | undefined {
    return this.fetchedUpdates.current();
  }
}
