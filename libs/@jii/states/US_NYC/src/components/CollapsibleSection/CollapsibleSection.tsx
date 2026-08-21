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

import { FC, ReactNode, useLayoutEffect, useRef, useState } from "react";

import { HIDDEN_HEADER_OFFSET } from "~@jii/common-ui";

import {
  Badge,
  Chevron,
  Content,
  Header,
  Section,
  Title,
} from "./CollapsibleSection.styles";

const PINNED_TOLERANCE_PX = 1;

export type CollapsibleSectionProps = {
  title: string;
  badgeLabel?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /**
   * When true, the section header sticks to the bottom of the app header on scroll.
   * Assumes a fixed header of HIDDEN_HEADER_OFFSET height from ~@jii/common-ui — if
   * used with a custom header via useHeaderOverride, that header must match this
   * constant or the scroll behavior will be off.
   */
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
  const headerRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => setIsOpen((prev) => !prev);

  // When a pinned sticky header is collapsed, scroll it back into its natural position so the user
  // doesn't lose their place. Runs in useLayoutEffect (not useEffect) so scrollIntoView fires
  // before paint — otherwise the browser's scroll anchoring kicks in and shifts the page unpredictably.
  useLayoutEffect(() => {
    if (!isOpen && stickyHeader && headerRef.current) {
      const { top } = headerRef.current.getBoundingClientRect();
      const isPinned = top <= HIDDEN_HEADER_OFFSET + PINNED_TOLERANCE_PX;
      if (isPinned) {
        headerRef.current.scrollIntoView({ block: "start" });
      }
    }
  }, [isOpen, stickyHeader]);

  return (
    <Section>
      <Header
        ref={headerRef}
        onClick={handleToggle}
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
