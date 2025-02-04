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

import { observer } from "mobx-react-lite";
import { ComponentType } from "react";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionSupervisorVitalsPresenter } from "../../InsightsStore/presenters/SupervisionSupervisorVitalsPresenter";
import { Body, Grid } from "../InsightsPageLayout/InsightsPageLayout";
import InsightsPageSection from "../InsightsPageSection/InsightsPageSection";
import ModelHydrator from "../ModelHydrator";
import { InsightsSupervisorVitalsDetailCard } from "./InsightsSupervisorVitalsDetailCard";

function withPresenter(Component: ComponentType<SupervisorVitalsProps>) {
  return observer(function SupervisorVitalsWrapper({
    supervisorPseudoId,
  }: {
    supervisorPseudoId: string;
  }) {
    const {
      insightsStore: { supervisionStore },
    } = useRootStore();

    if (!supervisionStore) return null;

    const presenter = new SupervisionSupervisorVitalsPresenter(
      supervisionStore,
      supervisorPseudoId,
    );

    return (
      <ModelHydrator hydratable={presenter}>
        <Component presenter={presenter} />
      </ModelHydrator>
    );
  });
}

type SupervisorVitalsProps = {
  presenter: SupervisionSupervisorVitalsPresenter;
};

export const InsightsSupervisorVitals = withPresenter(
  observer(function InsightsSupervisorVitalsSection({
    presenter,
  }: SupervisorVitalsProps) {
    const { vitalsMetricDetails, vitalsMetricsMethodologyUrl } = presenter;

    if (vitalsMetricDetails.length === 0) return;

    return (
      <InsightsPageSection
        sectionTitle="Operations"
        methodologyLinkCta="How did we calculate this rate?"
        methodologyLink={vitalsMetricsMethodologyUrl}
      >
        <Body>
          <Grid>
            {vitalsMetricDetails.map((metric) => {
              return (
                <InsightsSupervisorVitalsDetailCard
                  vitalsMetricDetails={metric}
                />
              );
            })}
          </Grid>
        </Body>
      </InsightsPageSection>
    );
  }),
);
