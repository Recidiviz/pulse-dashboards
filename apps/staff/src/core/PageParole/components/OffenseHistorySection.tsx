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

import { ParoleOffenseHistory } from "~datatypes";
import { Icon, IconSVG } from "~design-system";

import { SectionCard, SectionCardHeader } from "../../SectionCard";
import { PaddedSectionCardBody } from "./PaddedSectionCardBody";
import {
  AlertBanner,
  FactGrid,
  FactLabel,
  FactValue,
  formatDate,
  Hr,
  SectionStack,
  SubsectionTitle,
  WideFactItem,
} from "./shared";

const VICTIM_ALERT_COLOR = "#D97706";
const VICTIM_ALERT_BACKGROUND_COLOR = "rgba(217, 119, 6, 0.08)";

export function OffenseHistorySection({
  offenseHistory,
}: {
  offenseHistory: ParoleOffenseHistory;
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
              />
              Victim involved in current offense
            </AlertBanner>
          )}

          <div>
            <SubsectionTitle>Current Offense</SubsectionTitle>
            <FactGrid>
              <div>
                <FactLabel>County</FactLabel>
                <FactValue>{offenseHistory.county}</FactValue>
              </div>
              <div>
                <FactLabel>Docket</FactLabel>
                <FactValue>{offenseHistory.docket}</FactValue>
              </div>
              <div>
                <FactLabel>Class Felony</FactLabel>
                <FactValue>{offenseHistory.classFelony}</FactValue>
              </div>
              <div>
                <FactLabel>Conviction</FactLabel>
                <FactValue>{offenseHistory.conviction}</FactValue>
              </div>
              <div>
                <FactLabel>Sentence</FactLabel>
                <FactValue>{offenseHistory.sentence}</FactValue>
              </div>
              <div>
                <FactLabel>Date of Offense</FactLabel>
                <FactValue>
                  {formatDate(offenseHistory.dateOfOffense)}
                </FactValue>
              </div>
              <div>
                <FactLabel>Conviction Date</FactLabel>
                <FactValue>
                  {formatDate(offenseHistory.convictionDate)}
                </FactValue>
              </div>
              <WideFactItem>
                <FactLabel>Brief Description of Offense</FactLabel>
                <FactValue>{offenseHistory.offenseNarrative}</FactValue>
              </WideFactItem>
            </FactGrid>
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
