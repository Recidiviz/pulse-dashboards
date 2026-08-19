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

// TODO(OBT-44167): Similar to CategorySection in Program Catalog with extra customizations. This is
// a strong candidate to be factored out into ~@jii/common-ui once sticky-header offset and other
// regression risks are tested, and validated/addressed.

import { FC, ReactNode, useState } from "react";

import {
  Badge,
  Chevron,
  Content,
  Header,
  Section,
  Title,
} from "./CollapsibleSection.styles";

export type CollapsibleSectionProps = {
  title: string;
  badgeLabel?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  stickyHeader?: boolean;
  headerBorder?: boolean;
};

export const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  badgeLabel,
  children,
  defaultOpen = false,
  stickyHeader = false,
  headerBorder = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Section>
      <Header
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        $sticky={stickyHeader}
        $hasBorder={headerBorder}
        $isOpen={isOpen}
      >
        <Chevron rotate={isOpen ? 90 : 0} size={16} />
        <Title>{title}</Title>
        {badgeLabel !== undefined && <Badge>{badgeLabel}</Badge>}
      </Header>
      {isOpen && <Content>{children}</Content>}
    </Section>
  );
};
