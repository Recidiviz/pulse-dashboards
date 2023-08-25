/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 *
 */

import React from "react";

import { useRootStore } from "../../components/StoreProvider";
import {
  Bounds,
  Container,
  LargeText,
  TreatmentEffectSection,
  XSmallText,
} from "./styles";

const TreatmentEffectEstimate: React.FC = () => {
  const { impactStore } = useRootStore();

  const metric = impactStore.usTnCompliantReportingWorkflowsImpact;

  const { avgDailyPopulationTreatment } = metric;

  const symbol = avgDailyPopulationTreatment > 0 ? "+" : "";
  const avgDailyPopulationTreatmentNum = `${symbol}${avgDailyPopulationTreatment}`;

  const shift = avgDailyPopulationTreatment >= 0 ? "Increase" : "Decrease";
  const avgDailyPopulationTreatmentText = `${shift} in Average Daily Population.`;

  // TODO: confidence intervals remain static until values are available from the backend

  const confindenceInterval = 50;
  const confindenceIntervalText = `${confindenceInterval}% Confidence Interval:`;

  const upperBound = 100;
  const lowerBound = 0;

  const upperBoundSymbol = upperBound >= 0 ? "+" : "-";
  const lowerBoundSymbol = lowerBound >= 0 ? "+" : "-";

  const upperBoundNum = `${upperBoundSymbol}${upperBound}`;
  const lowerBoundNum = `${lowerBoundSymbol}${lowerBound}`;

  return (
    <Container>
      <TreatmentEffectSection>
        <LargeText>{avgDailyPopulationTreatmentNum}</LargeText>
        <XSmallText>{avgDailyPopulationTreatmentText}</XSmallText>
      </TreatmentEffectSection>
      <TreatmentEffectSection>
        <XSmallText>{confindenceIntervalText}</XSmallText>
        <Bounds>
          <p className="number">{upperBoundNum}</p>
          <p className="text">Upper Bound</p>
        </Bounds>
        <Bounds>
          <p className="number">{lowerBoundNum}</p>
          <p className="text">Lower Bound</p>
        </Bounds>
      </TreatmentEffectSection>
    </Container>
  );
};

export default TreatmentEffectEstimate;
