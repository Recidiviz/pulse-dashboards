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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { useUsCoTranslations } from "~@jii/translation";
import { Button, Icon, palette } from "~design-system";

import { UsCoProgram } from "../../presenters/UsCoProgramsPresenter";
import { StarButton } from "./StarButton";

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
  align-items: center;
  justify-content: space-between;
`;

const TitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(12)};
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
  // align-items: center;
  gap: ${rem(8)};
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
  program?: UsCoProgram;
  isOpen: boolean;
  onClose: () => void;
  onToggleStar: (program: UsCoProgram) => void;
};

const ProgramDetailModalComponent: FC<ProgramDetailModalProps> = ({
  program,
  isOpen,
  onClose,
  onToggleStar,
}) => {
  const { t } = useUsCoTranslations();

  const eligibilityItems: string[] = [];

  if (program) {
    if (program.eligibilityRequirements !== "None") {
      eligibilityItems.push(program.eligibilityRequirements);
    }
    if (program.prerequisites !== "None") {
      eligibilityItems.push(
        t(($) => $.programs.modal.eligibilityPrereq, {
          prereq: program.prerequisites,
        }),
      );
    }
    if (eligibilityItems.length === 0) {
      eligibilityItems.push(t(($) => $.programs.modal.eligibilityNone));
    }
  }

  return (
    <StyledModal isOpen={isOpen} onRequestClose={onClose}>
      {program && (
        <>
          <Header>
            <TitleRow>
              <TitleLeft>
                <Title>{program.title}</Title>
                <StarButton
                  isStarred={program.isStarred}
                  onClick={() => onToggleStar(program)}
                  size={20}
                />
              </TitleLeft>
              <CloseButton type="button" onClick={onClose} aria-label="Close">
                <Icon kind="Close" size={16} color={palette.slate85} />
              </CloseButton>
            </TitleRow>
            <EarnSubtitle>
              {t(($) => $.programs.modal.earnSubtitle, {
                count: program.numberOfDaysThatCanBeEarned,
              })}
            </EarnSubtitle>
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

            {t(($) => $.programs.modal.callToAction)}
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
