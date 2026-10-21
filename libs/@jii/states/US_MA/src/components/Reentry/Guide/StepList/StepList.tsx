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

import { GuideCopy } from "../Guide.styles";
import {
  StepDetail,
  StepHeader,
  StepHeading,
  StepItem,
  StepNumber,
  Steps,
} from "./StepList.styles";

export type GuideStep = { heading: string; body: string };

type StepListProps = {
  steps: Record<string, GuideStep>;
};

export const StepList = ({ steps }: StepListProps) => (
  <Steps>
    {Object.entries(steps).map(([stepId, step], index) => (
      <StepItem key={stepId}>
        <StepHeader>
          <StepNumber aria-hidden>{index + 1}</StepNumber>
          <StepHeading>{step.heading}</StepHeading>
        </StepHeader>

        <StepDetail>
          <GuideCopy>{step.body}</GuideCopy>
        </StepDetail>
      </StepItem>
    ))}
  </Steps>
);
