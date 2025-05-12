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
import { ComponentType, useState } from "react";

import { useRootStore } from "../../components/StoreProvider";
import { SupervisionOfficerVitalsPresenter } from "../../InsightsStore/presenters/SupervisionOfficerVitalsPresenter";
import { Body, Grid } from "../InsightsPageLayout/InsightsPageLayout";
import InsightsPageSection from "../InsightsPageSection/InsightsPageSection";
import { InsightsStaffVitalsDetailCard } from "../InsightsStaffVitals/InsightsStaffVitalsDetailCard";
import { VitalsTaskDrilldownModal } from "../InsightsStaffVitals/VitalsTaskDrilldownModal";
import ModelHydrator from "../ModelHydrator";

function withPresenter(Component: ComponentType<StaffVitalsProps>) {
  return observer(function StaffVitalsWrapper({
    officerPseudoId,
  }: {
    officerPseudoId: string;
  }) {
    const {
      insightsStore: { supervisionStore },
      workflowsRootStore: { justiceInvolvedPersonsStore },
    } = useRootStore();

    if (
      !supervisionStore ||
      !supervisionStore?.isVitalsEnabled ||
      !justiceInvolvedPersonsStore
    )
      return null;

    const presenter = new SupervisionOfficerVitalsPresenter(
      supervisionStore,
      justiceInvolvedPersonsStore,
      officerPseudoId,
    );

    return (
      <ModelHydrator hydratable={presenter}>
        <Component presenter={presenter} />
      </ModelHydrator>
    );
  });
}

type StaffVitalsProps = {
  presenter: SupervisionOfficerVitalsPresenter;
};

export const InsightsStaffVitals = withPresenter(
  observer(function InsightsStaffVitalsSection({
    presenter,
  }: StaffVitalsProps) {
    const [modalOpen, setModalOpen] = useState(false);

    const {
      vitalsMetricDetails,
      selectedMetricDetails,
      setSelectedMetricId,
      isDrilldownEnabled,
      labels,
      officerRecord,
    } = presenter;

    if (vitalsMetricDetails.length === 0) return;

    const handleCardClick = (metricId: string) => {
      setSelectedMetricId(metricId);
      setModalOpen(true);
    };

    return (
      <InsightsPageSection sectionTitle="Operations">
        <Body>
          <Grid>
            {vitalsMetricDetails.map((metric) => {
              return (
                <InsightsStaffVitalsDetailCard
                  key={metric.metricId}
                  vitalsMetricDetails={metric}
                  isDrilldownEnabled={isDrilldownEnabled}
                  onClick={handleCardClick}
                />
              );
            })}
          </Grid>
        </Body>
        {isDrilldownEnabled && (
          <VitalsTaskDrilldownModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            metricDetails={selectedMetricDetails}
            labels={labels}
            officer={officerRecord}
          />
        )}
      </InsightsPageSection>
    );
  }),
);
