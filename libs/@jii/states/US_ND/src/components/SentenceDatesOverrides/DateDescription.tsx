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

import {
  defaultComponents,
  SentenceDatesComponents,
} from "~@jii/sentence-dates";
import { useUsNdTranslations } from "~@jii/translation";

import { isUnavailableDateId } from "../ResidentHomepage/types";

/**
 * Appends some supplemental copy for unavailable dates
 */
export const DateDescriptionOverride: SentenceDatesComponents["DateDescription"] =
  ({ datePresenter, children, ...rest }) => {
    const { t } = useUsNdTranslations();

    if (isUnavailableDateId(datePresenter.id)) {
      return (
        <defaultComponents.DateDescription {...{ datePresenter, ...rest }}>
          {/* copy not expected to be missing, 
          but for type safety we don't want to print "undefined" */}
          {`${children ?? ""}

${t(($) => $.unavailableDates.additionalDescriptionCopy)}`}
        </defaultComponents.DateDescription>
      );
    }
    return (
      <defaultComponents.DateDescription
        {...{ datePresenter, children, ...rest }}
      />
    );
  };
