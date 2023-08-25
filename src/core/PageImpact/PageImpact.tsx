// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
// ===================== ========================================================

import dedent from "dedent";
import { observer } from "mobx-react-lite";
import React from "react";

import { useRootStore } from "../../components/StoreProvider";
import ChartNote from "../ChartNote";
import ImpactLeftPanel from "../ImpactLeftPanel/ImpactLeftPanel";
import ModelHydrator from "../ModelHydrator";
import PageTemplate from "../PageTemplate";
import VizAvgDailyPopulation from "../VizAvgDailyPopulation/VizAvgDailyPopulation";

const PageImpact: React.FC = () => {
  window.scrollTo({
    top: 0,
  });
  const { impactStore } = useRootStore();

  const metric = impactStore.usTnCompliantReportingWorkflowsImpact;

  return (
    <ModelHydrator model={impactStore}>
      <PageTemplate
        leftPanel={
          <ImpactLeftPanel
            title="Compliant Reporting Workflows"
            description={dedent`In April 2022, Recidiviz launched a Workflows tool
                              in Tennessee designed to increase timely transfers
                              to Compliant Reporting, TN's version of limited
                              supervision.`}
          />
        }
      >
        <VizAvgDailyPopulation metric={metric} />
        <ChartNote
          note='Compliant Reporting Workflows was launched to the entire 
          state in April of 2022. "Average daily population on Compliant Reporting" 
          is defined as the average number of individuals with "LIMITED" supervision 
          level in Tennessee.'
          chartTitle="Average Daily Population on Compliant Reporting"
        />
      </PageTemplate>
    </ModelHydrator>
  );
};

export default observer(PageImpact);
