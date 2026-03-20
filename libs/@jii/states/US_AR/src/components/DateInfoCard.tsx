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

import styled from "styled-components";

import { Card } from "~@jii/common-ui";
import { CardDateInfo } from "~@jii/earned-good-time";
import {
  useDateDistanceTranslation,
  useUsArTranslations,
} from "~@jii/translation";

const DateInfoContent = styled.p`
  margin-bottom: unset;
`;

export type DateInfoProps = {
  date: Date | undefined;
  label: string;
  description: string;
};

export function DateInfoCard({ date, label, description }: DateInfoProps) {
  const { t } = useUsArTranslations();
  const dateDistance = useDateDistanceTranslation(date);

  let dateCardValue;
  let subtitle;
  if (date) {
    // locale-aware formatting of the date
    dateCardValue = t(($) => $.importantDates.formatFullDate, {
      date,
    });
    subtitle = `(${dateDistance})`;
  } else {
    dateCardValue = t(($) => $.importantDates.missingDateMessage);
  }

  return (
    <Card key={label}>
      <CardDateInfo label={label} value={dateCardValue} subtitle={subtitle} />
      <DateInfoContent>{description}</DateInfoContent>
    </Card>
  );
}
