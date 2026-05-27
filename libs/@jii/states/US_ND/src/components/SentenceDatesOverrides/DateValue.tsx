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
 * Displays a placeholder value for unavailable dates
 */
export const DateValueOverride: SentenceDatesComponents["DateValue"] = ({
  datePresenter,
  children,
  ...rest
}) => {
  const { t } = useUsNdTranslations();

  if (isUnavailableDateId(datePresenter.id)) {
    return (
      <defaultComponents.DateValue {...{ datePresenter, ...rest }}>
        {t(($) => $.unavailableDates.placeholderValue)}
      </defaultComponents.DateValue>
    );
  }
  return (
    <defaultComponents.DateValue {...{ datePresenter, children, ...rest }} />
  );
};
