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

import { FC } from "react";

import { Card, CardHeading, CardValue } from "~@jii/common-ui";
import { useUsAzTranslations } from "~@jii/translation";

import { UsAzDateField } from "../UsAzSingleResidentContext/SingleResidentContextPresenter";

export const MissingDateCard: FC<{ dateKey: UsAzDateField }> = ({
  dateKey,
}) => {
  const { t } = useUsAzTranslations();
  return (
    <Card>
      <CardHeading>
        {t(($) => $.importantDates.dates[dateKey].title)}
      </CardHeading>
      <CardValue>{t(($) => $.importantDates.missingDateMessage)}</CardValue>
    </Card>
  );
};
