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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import {
  Accordion,
  AccordionItem,
  AccordionItemButton,
  AccordionItemHeading,
  AccordionItemPanel,
} from "react-accessible-accordion";
import styled from "styled-components";

import { ParoleDocProgram, ParoleEdovoProgram } from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import { SectionCard, SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import { formatDate } from "./shared";

const StyledAccordion = styled(Accordion)`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
`;

const StyledAccordionItem = styled(AccordionItem)`
  border: 1px solid ${palette.slate20};
  border-radius: ${rem(4)};
  overflow: hidden;
`;

const AccordionButton = styled(AccordionItemButton)`
  ${typography.Sans14}
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-weight: 600;
  color: ${palette.pine1};
  padding: ${rem(spacing.md)};
  background: ${palette.marble2};

  &[aria-expanded="true"] {
    border-bottom: 1px solid ${palette.slate10};
  }

  svg {
    transition: transform 150ms;
  }

  &[aria-expanded="true"] svg {
    transform: rotate(180deg);
  }
`;

const AccordionBody = styled(AccordionItemPanel)`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  padding: ${rem(spacing.md)} ${rem(spacing.md)};
`;

const ProgramRow = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid ${palette.slate10};
    padding-bottom: ${rem(spacing.md)};
  }
`;

const ProgramName = styled.div`
  font-weight: 600;
  color: ${palette.pine1};
`;

const ProgramMeta = styled.div`
  color: ${palette.slate70};
  font-size: 13px;
`;

const EmptyState = styled.div`
  color: ${palette.slate70};
  font-style: italic;
  padding: ${rem(spacing.sm)} 0;
`;

export function ProgramParticipationSection({
  docPrograms,
  edovoPrograms,
}: {
  docPrograms: Array<ParoleDocProgram>;
  edovoPrograms: Array<ParoleEdovoProgram>;
}) {
  const completedDocPrograms = docPrograms.filter(
    (program) => program.status === "completed",
  );
  const completedEdovoPrograms = edovoPrograms.filter(
    (program) => program.status === "completed",
  );

  return (
    <SectionCard>
      <SectionCardHeader>Program Participation</SectionCardHeader>
      <PaddedSectionCardBody>
        <StyledAccordion
          allowMultipleExpanded
          allowZeroExpanded
          preExpanded={["doc", "edovo"]}
        >
          <StyledAccordionItem uuid="doc">
            <AccordionItemHeading>
              <AccordionButton>
                DOC Programs ({completedDocPrograms.length})
                <Icon kind={IconSVG.DownChevron} size={10} />
              </AccordionButton>
            </AccordionItemHeading>
            <AccordionBody>
              {completedDocPrograms.length === 0 ? (
                <EmptyState>No completed DOC programs on record.</EmptyState>
              ) : (
                completedDocPrograms.map((program) => (
                  <ProgramRow key={program.name}>
                    <ProgramName>{program.name}</ProgramName>
                    {program.completionDate && (
                      <ProgramMeta>
                        Completed: {formatDate(program.completionDate)}
                      </ProgramMeta>
                    )}
                  </ProgramRow>
                ))
              )}
            </AccordionBody>
          </StyledAccordionItem>

          <StyledAccordionItem uuid="edovo">
            <AccordionItemHeading>
              <AccordionButton>
                Edovo Programs ({completedEdovoPrograms.length})
                <Icon kind={IconSVG.DownChevron} size={10} />
              </AccordionButton>
            </AccordionItemHeading>
            <AccordionBody>
              {completedEdovoPrograms.length === 0 ? (
                <EmptyState>No completed Edovo programs on record.</EmptyState>
              ) : (
                completedEdovoPrograms.map((program) => (
                  <ProgramRow key={program.title}>
                    <ProgramName>{program.title}</ProgramName>
                    {program.completionDate && (
                      <ProgramMeta>
                        Completed: {formatDate(program.completionDate)}
                      </ProgramMeta>
                    )}
                  </ProgramRow>
                ))
              )}
            </AccordionBody>
          </StyledAccordionItem>
        </StyledAccordion>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
