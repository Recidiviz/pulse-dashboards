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

import styled from "styled-components";

import { useSingleResidentContext } from "~@jii/data";
import {
  defaultComponents,
  SentenceDatesComponents,
} from "~@jii/sentence-dates";
import { useUsCoTranslations } from "~@jii/translation";
import { palette } from "~design-system";

const MutedDescription = styled(defaultComponents.DateDescription)`
  color: ${palette.slate85};
`;

/**
 * Returns a message that replaces the resident's MRD while CDOC recalculates
 * it, or undefined when the MRD should display normally. The usCoMrdOverride
 * flag marks residents whose MRD moved up after completing Achievement Earned
 * Time and usCoMrdOverrideFullState is copy that replaces MRD statewide. When both
 * are on, the statewide message wins.
 */
function useMrdOverrideMessage(): string | undefined {
  const { t } = useUsCoTranslations();
  const { residentFlags } = useSingleResidentContext();

  if (residentFlags.usCoMrdOverrideFullState)
    return t(($) => $.homepage.sentenceDates.mrdOverrideFullState);
  if (residentFlags.usCoMrdOverride)
    return t(($) => $.homepage.sentenceDates.mrdOverride);
  return undefined;
}

/**
 * While an MRD override message applies, the MRD card shows only its label and
 * that message. Every other card renders the default.
 */
// TODO(JII2-45): remove once CDOC sends the new MRDs
export const SentenceDatesDateCardOverride: SentenceDatesComponents["DateCard"] =
  (props) => {
    const mrdOverrideMessage = useMrdOverrideMessage();
    const { datePresenter } = props;

    if (datePresenter.id === "mrdTent" && mrdOverrideMessage) {
      return (
        <defaultComponents.DateCard datePresenter={datePresenter}>
          <defaultComponents.DateCardHeadingWrapper
            datePresenter={datePresenter}
          >
            <defaultComponents.DateLabel datePresenter={datePresenter}>
              {datePresenter.cardLabelText}
            </defaultComponents.DateLabel>
          </defaultComponents.DateCardHeadingWrapper>
          <defaultComponents.DateCardBodyWrapper datePresenter={datePresenter}>
            <MutedDescription datePresenter={datePresenter}>
              {mrdOverrideMessage}
            </MutedDescription>
          </defaultComponents.DateCardBodyWrapper>
        </defaultComponents.DateCard>
      );
    }
    return <defaultComponents.DateCard {...props} />;
  };
