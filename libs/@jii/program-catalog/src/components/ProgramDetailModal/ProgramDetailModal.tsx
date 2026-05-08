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

import { Modal as ModalBase, typography } from "@recidiviz/design-system";
import { upperFirst } from "lodash";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Button, Icon, palette } from "~design-system";

import { Program, TFn } from "../../types";
import { StarButton } from "../StarButton/StarButton";

const StyledModal = styled(ModalBase)`
  .ReactModal__Content {
    padding: ${rem(24)};
    border-radius: ${rem(12)};
    max-width: ${rem(560)};
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(6)};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${rem(12)};
`;

const InlineStar = styled(StarButton)`
  display: inline-flex;
  margin-left: ${rem(12)};
  vertical-align: ${rem(-2)};
`;

const Title = styled.h2`
  ${typography.Sans24};
  color: ${palette.pine3};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: ${rem(6)};
  flex-shrink: 0;
`;

const EarnSubtitle = styled.p`
  ${typography.Sans12};
  font-weight: 700;
  color: ${palette.slate50};
  text-transform: uppercase;
  margin: 0;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${palette.slate20};
  margin: ${rem(20)} 0;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(28)};

  ${typography.Sans14};
  color: ${palette.slate85};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(12)};
`;

const SectionHeading = styled.h3`
  ${typography.Sans16};
  color: ${palette.pine1};
  margin: 0;
`;

const EligibilityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(8)};
`;

const EligibilityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${rem(8)};

  > svg {
    flex-shrink: 0;
  }
`;

const FacilitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(8)};
`;

const FacilityBadge = styled.span`
  ${typography.Sans12};
  font-weight: 600;
  color: ${palette.white};
  background-color: ${palette.pine2};
  padding: ${rem(6)} ${rem(10)};
  border-radius: ${rem(4)};
`;

type ProgramDetailModalProps = {
  program?: Program;
  isOpen: boolean;
  onClose: () => void;
  onToggleStar: (program: Program) => void;
  showCredits?: boolean;
  t: TFn;
};

// TODO: Once Colorado uses this logic too, move it into the server
function buildEligibilityItems(program: Program, t: TFn): string[] {
  const { eligibilityRequirements } = program;

  if (["None", ""].includes(eligibilityRequirements)) {
    return [t(($) => $.programs.modal.eligibilityNone)];
  }

  return program.eligibilityRequirements
    .split(/\s*;\s*(?:and\s*)?/)
    .filter(Boolean)
    .map(upperFirst);
}

const ProgramDetailModalComponent: FC<ProgramDetailModalProps> = ({
  program,
  isOpen,
  onClose,
  onToggleStar,
  showCredits,
  t,
}) => {
  const eligibilityItems = program ? buildEligibilityItems(program, t) : [];

  return (
    <StyledModal isOpen={isOpen} onRequestClose={onClose}>
      {program && (
        <>
          <Header>
            <TitleRow>
              <Title>
                {program.title.slice(0, program.title.lastIndexOf(" ") + 1)}
                <span style={{ whiteSpace: "nowrap" }}>
                  {program.title.slice(program.title.lastIndexOf(" ") + 1)}
                  <InlineStar
                    isStarred={program.isStarred}
                    onClick={() => onToggleStar(program)}
                    size={20}
                  />
                </span>
              </Title>
              <CloseButton type="button" onClick={onClose} aria-label="Close">
                <Icon kind="Close" size={16} color={palette.slate85} />
              </CloseButton>
            </TitleRow>
            {showCredits && (
              <EarnSubtitle>
                {t(($) => $.programs.modal.earnSubtitle, {
                  count: program.numberOfDaysThatCanBeEarned,
                })}
              </EarnSubtitle>
            )}
          </Header>

          <Divider />

          <Body>
            {program.description && (
              <Section>
                <SectionHeading>
                  {t(($) => $.programs.modal.programDescription)}
                </SectionHeading>
                {program.description}
              </Section>
            )}

            <Section>
              <SectionHeading>
                {t(($) => $.programs.modal.eligibility)}
              </SectionHeading>
              <EligibilityList>
                {eligibilityItems.map((item) => (
                  <EligibilityItem key={item}>
                    <Icon
                      kind="ArrowCircled"
                      size={16}
                      color={palette.slate40}
                    />
                    {item}
                  </EligibilityItem>
                ))}
              </EligibilityList>
            </Section>

            <Section>
              <SectionHeading>
                {t(($) => $.programs.modal.availableFacilities)}
              </SectionHeading>
              <FacilitiesList>
                {program.facilitiesOffered.map((facility) => (
                  <FacilityBadge key={facility}>{facility}</FacilityBadge>
                ))}
              </FacilitiesList>
            </Section>

            {t(($) => $.programs.modalCallToAction)}
            <div>
              <Button type="button" kind="secondary" onClick={onClose}>
                {t(($) => $.programs.modal.closeWindow)}
              </Button>
            </div>
          </Body>
        </>
      )}
    </StyledModal>
  );
};

export const ProgramDetailModal = observer(ProgramDetailModalComponent);
