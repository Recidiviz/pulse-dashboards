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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { ReactNode, useState } from "react";
import styled from "styled-components";

import {
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleCase,
  ParoleOffense,
} from "~datatypes";
import { Icon, IconSVG, palette } from "~design-system";

import {
  PAROLE_RECORD_CORNER_RADIUS,
  paroleClickableRecordStyles,
  ParoleFactLabel,
  ParoleFactStack,
  paroleRecordCardStyles,
  ParoleRecordHeader,
  ParoleRecordHeaderDetail,
  ParoleRecordHeading,
  ParoleSectionCard,
  ParoleSectionTitle,
  ParoleSmallFactValue,
  ParoleSubsection,
  ParoleSubsectionTitle,
} from "../ParoleCaseProfileStyles";
import {
  ParoleRecordModal,
  ParoleRecordModalNarrative,
} from "../ParoleRecordModal";
import { AlertBanner, FactRow, formatDate, SectionStack } from "../shared";

const VICTIM_ALERT_COLOR = "#D97706";
const VICTIM_ALERT_BACKGROUND_COLOR = "rgba(217, 119, 6, 0.08)";
const VICTIM_ATTENDING_HEARING_ALERT_COLOR = palette.signal.warning;

const OffenseCard = styled.div`
  ${paroleRecordCardStyles}
  background-color: transparent;
`;

/** How many lines of the offense description show before it clips. */
const DESCRIPTION_PREVIEW_LINES = 3;

const ClampedDescription = styled(ParoleSmallFactValue)`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${DESCRIPTION_PREVIEW_LINES};
  overflow: hidden;
`;

/** Gap between a button's text and its hover outline. */
const DESCRIPTION_BUTTON_INSET = `calc(${rem(spacing.sm)} + 1px)`;

/**
 * The clickable description. Negative margins pull its outline out around the
 * text, so the text stays aligned with the facts above it.
 */
const DescriptionButton = styled.button.attrs({ type: "button" })`
  ${paroleClickableRecordStyles}
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
  background: none;
  border: 1px solid transparent;
  border-radius: ${PAROLE_RECORD_CORNER_RADIUS};
  padding: ${rem(spacing.sm)};
  margin: calc(-1 * ${DESCRIPTION_BUTTON_INSET});
  width: calc(100% + 2 * ${DESCRIPTION_BUTTON_INSET});
`;

const OffenseFact = styled(ParoleFactStack)`
  flex: 1 1 ${rem(150)};
  min-width: 0;
`;

const PriorConvictionList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.sm)};
  margin: 0;
  padding-left: ${rem(spacing.lg)};
  list-style: disc;
`;

const formatOffenseDate = (date: string): string =>
  isParoleUnknownDate(date) ? PAROLE_UNKNOWN_TEXT : formatDate(date);

/**
 * Returns the label and value of each fact shown below an offense's heading.
 * The conviction and class felony are in the heading, not here.
 */
function offenseFacts(offense: ParoleOffense) {
  return [
    { label: "County", value: offense.county },
    { label: "Docket", value: offense.docket },
    { label: "Sentence", value: offense.sentence },
    {
      label: "Date of Offense",
      value: formatOffenseDate(offense.dateOfOffense),
    },
    {
      label: "Conviction Date",
      value: formatOffenseDate(offense.convictionDate),
    },
  ];
}

/**
 * An offense's heading, with the conviction on the left and the class felony
 * on the right, then its facts in a row that wraps and stretches to fill the
 * width, then the description on its own line.
 *
 * @param offense - The offense to show.
 * @param description - The offense description, as the caller wants it drawn.
 */
function OffenseDetails({
  offense,
  description,
}: {
  offense: ParoleOffense;
  description: ReactNode;
}) {
  return (
    <>
      <ParoleRecordHeader>
        <ParoleRecordHeading>{offense.conviction}</ParoleRecordHeading>
        <ParoleRecordHeaderDetail>
          {offense.classFelony}
        </ParoleRecordHeaderDetail>
      </ParoleRecordHeader>
      <FactRow>
        {offenseFacts(offense).map((fact) => (
          <OffenseFact key={fact.label}>
            <ParoleFactLabel>{fact.label}</ParoleFactLabel>
            <ParoleSmallFactValue>{fact.value}</ParoleSmallFactValue>
          </OffenseFact>
        ))}
      </FactRow>
      {description}
    </>
  );
}

/**
 * Colorado's Offense & Criminal History section.
 *
 * @param caseDetail - The case whose offenses to show.
 */
export function UsCoOffenseHistorySection({
  caseDetail,
}: {
  caseDetail: ParoleCase;
}) {
  const { offenseHistory } = caseDetail;
  const [selectedOffense, setSelectedOffense] = useState<
    ParoleOffense | undefined
  >(undefined);

  return (
    <ParoleSectionCard>
      <ParoleSectionTitle>Offense & Criminal History</ParoleSectionTitle>
      {offenseHistory.victimAttendingHearing && (
        <AlertBanner
          $color={VICTIM_ATTENDING_HEARING_ALERT_COLOR}
          $textColor={VICTIM_ATTENDING_HEARING_ALERT_COLOR}
          $fontWeight="600"
          $alignItems="center"
          $marginBottom="0"
        >
          <Icon
            kind={IconSVG.Alert}
            width={16}
            color={VICTIM_ATTENDING_HEARING_ALERT_COLOR}
            aria-hidden="true"
          />
          Scheduled Victim Attendance
        </AlertBanner>
      )}

      {offenseHistory.victimInvolved && (
        <AlertBanner
          $color={VICTIM_ALERT_COLOR}
          $backgroundColor={VICTIM_ALERT_BACKGROUND_COLOR}
          $textColor={VICTIM_ALERT_COLOR}
          $fontWeight="600"
          $alignItems="center"
          $marginBottom="0"
        >
          <Icon
            kind={IconSVG.Alert}
            width={16}
            color={VICTIM_ALERT_COLOR}
            aria-hidden="true"
          />
          Victim Enrolled
        </AlertBanner>
      )}

      <ParoleSubsection>
        <ParoleSubsectionTitle>Current Offenses</ParoleSubsectionTitle>
        <SectionStack>
          {offenseHistory.offenses.map((offense) => (
            <OffenseCard key={`${offense.docket}-${offense.conviction}`}>
              <OffenseDetails
                offense={offense}
                description={
                  <DescriptionButton
                    onClick={() => setSelectedOffense(offense)}
                  >
                    <ParoleFactLabel>
                      Brief Description of Offense
                    </ParoleFactLabel>
                    <ClampedDescription>
                      {offense.offenseNarrative}
                    </ClampedDescription>
                  </DescriptionButton>
                }
              />
            </OffenseCard>
          ))}
        </SectionStack>
      </ParoleSubsection>

      {offenseHistory.priorConvictions.length > 0 && (
        <ParoleSubsection>
          <ParoleSubsectionTitle>Prior Convictions</ParoleSubsectionTitle>
          <PriorConvictionList>
            {offenseHistory.priorConvictions.map((conviction) => (
              <ParoleSmallFactValue
                as="li"
                key={`${conviction.charge}-${conviction.date}`}
              >
                {conviction.charge} — {formatDate(conviction.date)}
              </ParoleSmallFactValue>
            ))}
          </PriorConvictionList>
        </ParoleSubsection>
      )}

      <ParoleRecordModal
        isOpen={selectedOffense !== undefined}
        title="Offense Details"
        onRequestClose={() => setSelectedOffense(undefined)}
      >
        {selectedOffense && (
          <OffenseDetails
            offense={selectedOffense}
            description={
              <ParoleFactStack>
                <ParoleFactLabel>Brief Description of Offense</ParoleFactLabel>
                <ParoleRecordModalNarrative>
                  {selectedOffense.offenseNarrative}
                </ParoleRecordModalNarrative>
              </ParoleFactStack>
            }
          />
        )}
      </ParoleRecordModal>
    </ParoleSectionCard>
  );
}
