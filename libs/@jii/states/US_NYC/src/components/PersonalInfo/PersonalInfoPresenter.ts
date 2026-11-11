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

import { makeAutoObservable } from "mobx";

import type { UsNycResidentJiiData } from "~@jii/schemas";
import type { UsNycTFunction } from "~@jii/translation";
import { toTitleCase } from "~datatypes";

export type PersonalInfoField = {
  id: string;
  label: string;
  value: string;
  subheading?: string;
  description?: string;
};

export class PersonalInfoPresenter {
  constructor(
    private readonly stateSpecificData: UsNycResidentJiiData,
    private readonly t: UsNycTFunction,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });
  }

  get heading(): string {
    return this.t(($) => $.personalInformation.general.heading);
  }

  get commissaryBalance(): string | undefined {
    const { commissaryBalance } = this.stateSpecificData;
    if (commissaryBalance == null) return;
    return this.t(($) => $.personalInformation.dates.commissaryBalance.value, {
      commissaryBalance: commissaryBalance,
    });
  }

  get emergencyContactName(): string | undefined {
    const { emergencyContactFullName } = this.stateSpecificData;
    if (!emergencyContactFullName) return;
    const { givenNames, middleNames, surname } = emergencyContactFullName;

    // The existing addDisplayName and firstNameLastName helpers don't quite fit what we needed here.
    // addDisplayName does not handle casing and firstNameLastName requires ResidentRecord type
    const name = [givenNames, middleNames, surname]
      .filter((part): part is string => !!part)
      .map(toTitleCase)
      .join(" ");
    return name || undefined;
  }

  get emergencyContactAddress(): string | undefined {
    const { emergencyContactAddress } = this.stateSpecificData;
    if (!emergencyContactAddress) return;
    const { addressLine1, addressLine2, addressCity, addressState } =
      emergencyContactAddress;
    const address = [addressLine1, addressLine2, addressCity, addressState]
      .filter((part): part is string => !!part)
      .join(", ");
    return address || undefined;
  }

  get asOfDate(): string | undefined {
    const { lastUpdatedDate } = this.stateSpecificData;
    if (!lastUpdatedDate) return;

    const asofDate = this.t(
      ($) => $.personalInformation.dates.commissaryBalance.subheading,
      {
        asOfDate: lastUpdatedDate,
        formatParams: {
          asOfDate: { year: "numeric", month: "long", day: "numeric" },
        },
      },
    );

    return asofDate;
  }

  get fields(): Array<PersonalInfoField> {
    const fields: Array<PersonalInfoField> = [];

    const { commissaryBalance, emergencyContactName, asOfDate } = this;

    if (commissaryBalance) {
      fields.push({
        id: "commissaryBalance",
        label: this.t(
          ($) => $.personalInformation.dates.commissaryBalance.label,
        ),
        value: commissaryBalance,
        subheading: asOfDate,
        description: this.t(
          ($) => $.personalInformation.dates.commissaryBalance.description,
        ),
      });
    }

    if (emergencyContactName) {
      fields.push({
        id: "emergencyContact",
        label: this.t(
          ($) => $.personalInformation.dates.emergencyContact.label,
        ),
        value: emergencyContactName,
        description: this.emergencyContactAddress,
      });
    }

    return fields;
  }
}
