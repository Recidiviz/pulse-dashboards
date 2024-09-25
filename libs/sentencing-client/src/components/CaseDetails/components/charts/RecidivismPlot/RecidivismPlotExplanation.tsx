// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import moment from "moment";

import { CaseInsight } from "../../../../../api";
import { TextContainer } from "../components/Styles";

interface OffenseSpanProps {
  rollupOffense: string | undefined;
  rollupNcicCategory: string | null;
  rollupCombinedOffenseCategory: string | null;
  rollupViolentOffense: boolean | null;
}

export function getOffenseName({
  rollupOffense,
  rollupNcicCategory,
  rollupCombinedOffenseCategory,
}: Omit<OffenseSpanProps, "rollupViolentOffense">) {
  return rollupOffense || rollupCombinedOffenseCategory || rollupNcicCategory;
}

function OffenseText({
  rollupOffense,
  rollupNcicCategory,
  rollupCombinedOffenseCategory,
  rollupViolentOffense,
}: OffenseSpanProps) {
  const offenseString =
    getOffenseName({
      rollupOffense,
      rollupNcicCategory,
      rollupCombinedOffenseCategory,
    }) ||
    (rollupViolentOffense === true ? "violent" : null) ||
    (rollupViolentOffense === false ? "non-violent" : null);

  return offenseString ? <span>{offenseString} convictions</span> : null;
}

interface RecidivismPlotExplanationProps {
  insight: CaseInsight;
}

export function RecidivismPlotExplanation({
  insight,
}: RecidivismPlotExplanationProps) {
  const {
    rollupOffense,
    rollupNcicCategory,
    rollupCombinedOffenseCategory,
    rollupViolentOffense,
  } = insight;

  return (
    <TextContainer>
      These recidivism rates represent the percentage of individuals who have
      been incarcerated or re-incarcerated during the three years immediately
      after the start of their probation sentence or their release into the
      community. The rates are based on{" "}
      <span>
        <OffenseText
          rollupOffense={rollupOffense}
          rollupNcicCategory={rollupNcicCategory}
          rollupCombinedOffenseCategory={rollupCombinedOffenseCategory}
          rollupViolentOffense={rollupViolentOffense}
        />
      </span>
      , using IDOC data from 2010-{moment().year() - 3}. The shaded areas
      represent the confidence intervals, or the range of possible values for
      the true recidivism rate.
    </TextContainer>
  );
}
