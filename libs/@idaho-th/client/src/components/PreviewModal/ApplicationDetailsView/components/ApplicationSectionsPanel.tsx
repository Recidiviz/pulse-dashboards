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

import React, { useState } from "react";

import { BodyS1 } from "../../../../styles";
import { ALL_SECTION_IDS, SECTIONS } from "../ApplicationDetailsView.constants";
import * as Styled from "../ApplicationDetailsView.styles";
import { SectionId } from "../types";
import { CollapsibleSection } from "./CollapsibleSection";

export const ApplicationSectionsPanel: React.FC = () => {
  const [openSections, setOpenSections] = useState<SectionId[]>([]);
  const allExpanded = ALL_SECTION_IDS.every((id) => openSections.includes(id));

  const toggleSection = (id: SectionId) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toggleAllSections = () => {
    setOpenSections(allExpanded ? [] : [...ALL_SECTION_IDS]);
  };

  return (
    <Styled.AccordionsContainer>
      <Styled.ExpandCollapseToggle
        type="button"
        aria-expanded={allExpanded}
        aria-label={allExpanded ? "Collapse all" : "Expand all"}
        onClick={toggleAllSections}
      >
        <BodyS1>{allExpanded ? "Collapse all" : "Expand all"}</BodyS1>
        <Styled.ChevronIcon $open={allExpanded} aria-hidden>
          <Styled.ArrowDown />
        </Styled.ChevronIcon>
      </Styled.ExpandCollapseToggle>

      {SECTIONS.map(({ id, title, Component }, index) => (
        <CollapsibleSection
          key={id}
          title={title}
          isOpen={openSections.includes(id)}
          showDivider={index < SECTIONS.length - 1}
          onToggle={() => toggleSection(id)}
        >
          <Component />
        </CollapsibleSection>
      ))}
    </Styled.AccordionsContainer>
  );
};
