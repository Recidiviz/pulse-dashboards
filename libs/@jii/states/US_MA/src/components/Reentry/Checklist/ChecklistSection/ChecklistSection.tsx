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

import { ReactNode, useId, useState } from "react";

import { Chip } from "~@jii/common-ui";
import { Icon } from "~design-system";

import {
  ChevronArea,
  Description,
  Header,
  Heading,
  Items,
  Title,
  Toggle,
} from "./ChecklistSection.styles";

export type ChecklistSectionProps = {
  title: string;
  description: string;
  progressLabel: string;
  children: ReactNode;
};

// TODO(OBT-44167): Close to US_NYC's CollapsibleSection, apart from the
// description and the bordered card layout. Consider folding both into one
// shared component when that one moves to ~@jii/common-ui.

/**
 * A collapsible card that groups checklist items under a title, with a
 * progress chip and a short description. Defaults to open.
 */
export const ChecklistSection = ({
  title,
  description,
  progressLabel,
  children,
}: ChecklistSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const itemsId = useId();

  return (
    <section>
      <Header $isOpen={isOpen}>
        <Heading>
          <Toggle
            aria-expanded={isOpen}
            aria-controls={itemsId}
            onClick={() => setIsOpen(!isOpen)}
          >
            <ChevronArea>
              <Icon
                kind="ChevronDown"
                rotate={isOpen ? 180 : 0}
                size={18}
                strokeWidth={2.5}
              />
            </ChevronArea>
            <Title>{title}</Title>
            <Chip color="gray">{progressLabel}</Chip>
          </Toggle>
        </Heading>
        <Description>{description}</Description>
      </Header>
      <Items id={itemsId} hidden={!isOpen}>
        {children}
      </Items>
    </section>
  );
};
