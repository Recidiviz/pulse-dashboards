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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { useRootStore } from "~@jii/data";
import { spacing, Toggle } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import type { DateLabels, SentenceDatesData } from "../../data/types";
import { SentenceDatesPresenter } from "./SentenceDatesPresenter";
import { SentenceDatesComponents, StateCodeWithSentenceDates } from "./types";

const ToggleWrapper = styled.div`
  margin-bottom: ${rem(spacing.lg)};
`;

export type SentenceDatesProps = {
  data: SentenceDatesData;
  stateCode: StateCodeWithSentenceDates;
  componentOverrides?: Partial<SentenceDatesComponents>;
  showToggle?: boolean;
  alwaysStartHidden?: boolean;
  dateLabels?: DateLabels;
};

const ManagedComponent = observer(function ManagedComponent({
  presenter,
  showToggle,
}: { presenter: SentenceDatesPresenter } & Pick<
  SentenceDatesProps,
  "showToggle"
>) {
  const {
    components: {
      SectionWrapper,
      SectionHeading,
      CardsWrapper,
      DateCard,
      DateLabel,
      DateValue,
      DateValueSupplemental,
      DateDescription,
      DateCardHeadingWrapper,
      DateCardBodyWrapper,
      DateAdjustment,
      HiddenDatesCard,
    },
    datePresenters,
    sectionHeadingText,
    hiddenMessageText,
    showToggleText,
    hideToggleText,
    hidden,
  } = presenter;

  return (
    <SectionWrapper>
      <SectionHeading>{sectionHeadingText}</SectionHeading>
      <CardsWrapper hidden={showToggle && hidden}>
        {showToggle && hidden ? (
          <HiddenDatesCard>{hiddenMessageText}</HiddenDatesCard>
        ) : (
          datePresenters.map((datePresenter) => (
            <DateCard key={datePresenter.id} datePresenter={datePresenter}>
              <DateCardHeadingWrapper datePresenter={datePresenter}>
                <DateLabel datePresenter={datePresenter}>
                  {datePresenter.cardLabelText}
                </DateLabel>
                <DateValue datePresenter={datePresenter}>
                  {datePresenter.cardValueText.primary}
                </DateValue>
                <DateValueSupplemental datePresenter={datePresenter}>
                  {datePresenter.cardValueText.supplemental}
                </DateValueSupplemental>
              </DateCardHeadingWrapper>
              <DateCardBodyWrapper datePresenter={datePresenter}>
                {datePresenter.cardDescriptionText && (
                  <DateDescription datePresenter={datePresenter}>
                    {datePresenter.cardDescriptionText}
                  </DateDescription>
                )}
                <DateAdjustment datePresenter={datePresenter} />
              </DateCardBodyWrapper>
            </DateCard>
          ))
        )}
      </CardsWrapper>
      {showToggle && (
        <ToggleWrapper>
          <Toggle
            checked={!hidden}
            onChange={(checked) => presenter.setHidden(!checked)}
          >
            {hidden ? showToggleText : hideToggleText}
          </Toggle>
        </ToggleWrapper>
      )}
    </SectionWrapper>
  );
});

function usePresenter({
  stateCode,
  data,
  componentOverrides,
  alwaysStartHidden,
  dateLabels,
}: SentenceDatesProps) {
  const { t } = useTranslation([stateCode, "common"]);
  const [sessionHidden, setSessionHidden] = useState(true);
  const {
    residentsStore,
    userStore: { segmentClient },
  } = useRootStore();

  return new SentenceDatesPresenter(
    data,
    t,
    componentOverrides,
    residentsStore,
    segmentClient,
    alwaysStartHidden
      ? { hidden: sessionHidden, setHidden: setSessionHidden }
      : undefined,
    dateLabels,
  );
}

/**
 * Entry point for the Sentence Dates module.
 *
 * Default behavior is based on a combination of the data passed in here
 * and the corresponding copy (which is accessed via the translation framework).
 */
export const SentenceDates: FC<SentenceDatesProps> = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
});
