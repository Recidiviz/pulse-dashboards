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

import { ChevronRight } from "lucide-react";
import { FC } from "react";

import { Chip } from "../Chip/Chip";
import {
  CardBody,
  CardChevron,
  CardChips,
  CardContact,
  CardLink,
  CardName,
  CardPreview,
  CompactCardLink,
} from "./ResourceCard.styles";

export type ResourceCardProps = {
  name: string;
  to: string;
  description?: string;
  primaryContact?: string;
  chips?: string[];
  compact?: boolean;
};

const RESOURCE_CARD_COPY = {
  primaryContact: "Primary contact:",
};

// TODO(OBT-44166): full-card link has accessibility implications — see https://inclusive-components.design/cards/
export const ResourceCard: FC<ResourceCardProps> = ({
  name,
  to,
  description,
  primaryContact,
  chips,
  compact = false,
}) => {
  const Container = compact ? CompactCardLink : CardLink;

  return (
    <Container to={to}>
      <CardBody>
        <CardName>{name}</CardName>
        {!compact && description ? (
          <CardPreview>{description}</CardPreview>
        ) : null}
        {!compact && primaryContact ? (
          <CardContact>
            {RESOURCE_CARD_COPY.primaryContact} {primaryContact}
          </CardContact>
        ) : null}
        {chips?.length ? (
          <CardChips>
            {chips.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </CardChips>
        ) : null}
      </CardBody>
      <CardChevron aria-hidden="true">
        <ChevronRight size={18} strokeWidth={2} />
      </CardChevron>
    </Container>
  );
};
