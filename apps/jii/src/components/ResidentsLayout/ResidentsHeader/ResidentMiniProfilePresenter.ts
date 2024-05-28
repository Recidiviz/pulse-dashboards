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

import { makeAutoObservable } from "mobx";

import { ResidentRecord } from "~datatypes";

import {
  cleanupInlineTemplate,
  hydrateTemplate,
} from "../../../configs/hydrateTemplate";
import { ProfileField, ResidentsConfig } from "../../../configs/types";

/**
 * To avoid redundant fetching, this presenter requires a hydrated Resident object
 * at construction time rather than implementing its own hydration.
 */
export class ResidentMiniProfilePresenter {
  constructor(
    public resident: ResidentRecord["output"],
    private config: ResidentsConfig,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get profileFields(): Array<ProfileField> {
    const templateContext = { resident: this.resident };
    return (
      this.config.headerProfileFields
        .map(
          (f: ProfileField): ProfileField => ({
            label: cleanupInlineTemplate(
              hydrateTemplate(f.label, templateContext),
            ),
            value: cleanupInlineTemplate(
              hydrateTemplate(f.value, templateContext),
            ),
            // unlike other fields this one is not expected to be inline
            moreInfo:
              f.moreInfo && hydrateTemplate(f.moreInfo, templateContext),
          }),
        )
        // exclude any empty fields
        .filter((f) => !!(f.label && f.value))
    );
  }

  get name() {
    const { personName } = this.resident;
    return `${personName.givenNames} ${personName.surname}`;
  }
}
