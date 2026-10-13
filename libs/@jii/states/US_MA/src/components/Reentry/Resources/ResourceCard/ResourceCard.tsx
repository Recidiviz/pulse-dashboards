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

import { useUsMaTranslations } from "~@jii/translation";

import { Chip } from "../Chip/Chip";
import { Card, CardChips, CardContact, CardName } from "./ResourceCard.styles";

// Props follow the NYC ResourceCard so the two can merge into a shared component.
export type ResourceCardProps = {
  name: string;
  to: string;
  primaryContact?: string;
  chips?: string[];
};

export const ResourceCard: FC<ResourceCardProps> = ({
  name,
  to,
  primaryContact,
  chips,
}) => {
  const { t } = useUsMaTranslations();

  return (
    <Card to={to}>
      <CardName>{name}</CardName>
      {primaryContact ? (
        <CardContact>
          {t(($) => $.reentry.resources.list.contactLabel, {
            address: primaryContact,
          })}
        </CardContact>
      ) : null}
      {chips?.length ? (
        <CardChips>
          {chips.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </CardChips>
      ) : null}
    </Card>
  );
};
