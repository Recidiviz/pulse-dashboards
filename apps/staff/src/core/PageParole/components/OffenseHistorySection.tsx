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

import { Fragment } from "react";

import { ParoleOffenseHistory } from "~datatypes";
import { Icon, IconSVG } from "~design-system";

import { SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import {
  AlertBanner,
  FactGrid,
  FactLabel,
  FactStack,
  formatDate,
  Hr,
  SectionCard,
  SectionStack,
  SubsectionTitle,
  WideFactItem,
} from "./shared";

const VICTIM_ALERT_COLOR = "#D97706";
const VICTIM_ALERT_BACKGROUND_COLOR = "rgba(217, 119, 6, 0.08)";

export function OffenseHistorySection({
  offenseHistory,
  title,
}: {
  offenseHistory: ParoleOffenseHistory;
  title: string;
}) {
  return (
    <SectionCard>
      <SectionCardHeader>Offense & Criminal History</SectionCardHeader>
      <PaddedSectionCardBody>
        <SectionStack>
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
              Victim involved in current offense
            </AlertBanner>
          )}

          <div>
            <SubsectionTitle>{title}</SubsectionTitle>
            <SectionStack>
              {offenseHistory.offenses.map((offense, index) => (
                <Fragment key={`${offense.docket}-${offense.conviction}`}>
                  {index > 0 && <Hr />}
                  <FactGrid>
                    <FactStack>
                      <div>County</div>
                      <FactLabel>{offense.county}</FactLabel>
                    </FactStack>
                    <FactStack>
                      <div>Docket</div>
                      <FactLabel>{offense.docket}</FactLabel>
                    </FactStack>
                    <FactStack>
                      <div>Class Felony</div>
                      <FactLabel>{offense.classFelony}</FactLabel>
                    </FactStack>
                    <FactStack>
                      <div>Conviction</div>
                      <FactLabel>{offense.conviction}</FactLabel>
                    </FactStack>
                    <FactStack>
                      <div>Sentence</div>
                      <FactLabel>{offense.sentence}</FactLabel>
                    </FactStack>
                    <FactStack>
                      <div>Date of Offense</div>
                      <FactLabel>{formatDate(offense.dateOfOffense)}</FactLabel>
                    </FactStack>
                    <FactStack>
                      <div>Conviction Date</div>
                      <FactLabel>
                        {formatDate(offense.convictionDate)}
                      </FactLabel>
                    </FactStack>
                    <WideFactItem>
                      <FactStack>
                        <div>Brief Description of Offense</div>
                        <FactLabel>{offense.offenseNarrative}</FactLabel>
                      </FactStack>
                    </WideFactItem>
                  </FactGrid>
                </Fragment>
              ))}
            </SectionStack>
          </div>

          {offenseHistory.priorConvictions.length > 0 && (
            <>
              <Hr />
              <div>
                <SubsectionTitle>Prior Convictions</SubsectionTitle>
                {offenseHistory.priorConvictions.map((conviction) => (
                  <div key={`${conviction.charge}-${conviction.date}`}>
                    {conviction.charge} — {formatDate(conviction.date)}
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionStack>
      </PaddedSectionCardBody>
    </SectionCard>
  );
}
