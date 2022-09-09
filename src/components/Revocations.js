// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import Sticky from "react-sticky-fill";
import { get } from "mobx";

import {
  matchesAllFilters,
  matchesTopLevelFilters,
} from "./charts/new_revocations/helpers";
import { getTimeDescription } from "./charts/new_revocations/helpers/format";
import ToggleBarFilter from "./charts/new_revocations/ToggleBar/ToggleBarFilter";
import ErrorBoundary from "./ErrorBoundary";
import DistrictFilter from "./charts/new_revocations/ToggleBar/DistrictFilter";
import AdmissionTypeFilter from "./charts/new_revocations/ToggleBar/AdmissionTypeFilter";
import ViolationFilter from "./charts/new_revocations/ToggleBar/ViolationFilter";
import RevocationsOverTime from "./charts/new_revocations/RevocationsOverTime";
import Matrix from "./charts/new_revocations/Matrix";
import MatrixExplanation from "./charts/new_revocations/Matrix/MatrixExplanation";
import RevocationCharts from "./charts/new_revocations/RevocationCharts";
import RevocationsByRiskLevel from "./charts/new_revocations/RevocationsByRiskLevel/RevocationsByRiskLevel";
import RevocationsByOfficer from "./charts/new_revocations/RevocationsByOfficer";
import RevocationsByViolation from "./charts/new_revocations/RevocationsByViolation";
import RevocationsByGender from "./charts/new_revocations/RevocationsByGender/RevocationsByGender";
import RevocationsByRace from "./charts/new_revocations/RevocationsByRace/RevocationsByRace";
import RevocationsByDistrict from "./charts/new_revocations/RevocationsByDistrict/RevocationsByDistrict";
import CaseTable from "./charts/new_revocations/CaseTable/CaseTable";
import { useAuth0 } from "../react-auth0-spa";
import { getUserAppMetadata } from "../utils/authentication/user";
import {
  ADMISSION_TYPE,
  CHARGE_CATEGORY,
  DISTRICT,
  METRIC_PERIOD_MONTHS,
  SUPERVISION_LEVEL,
  SUPERVISION_TYPE,
} from "../constants/filterTypes";
import flags from "../flags";
import { useRootStore } from "../StoreProvider";

import "./Revocations.scss";

const Revocations = () => {
  const { filtersStore } = useRootStore();
  const { filters, filterOptions } = filtersStore;
  const { user } = useAuth0();
  const { district } = getUserAppMetadata(user);
  useEffect(() => {
    if (district) {
      filtersStore.setRestrictedDistrict(district);
    }
  }, [district, filtersStore]);

  const timeDescription = getTimeDescription(
    get(filters, METRIC_PERIOD_MONTHS),
    filterOptions[ADMISSION_TYPE].options,
    get(filters, ADMISSION_TYPE)
  );

  return (
    <main className="Revocations">
      <Sticky style={{ zIndex: 700, top: 65 }}>
        <>
          <div className="top-level-filters d-f">
            <ToggleBarFilter
              label="Time Period"
              dimension={METRIC_PERIOD_MONTHS}
            />
            <ErrorBoundary>
              <DistrictFilter />
            </ErrorBoundary>
            <ToggleBarFilter label="Case Type" dimension={CHARGE_CATEGORY} />
            {filterOptions[SUPERVISION_LEVEL].componentEnabled && (
              <ToggleBarFilter
                label="Supervision Level"
                dimension={SUPERVISION_LEVEL}
              />
            )}
            {filterOptions[ADMISSION_TYPE].componentEnabled && (
              <AdmissionTypeFilter />
            )}
            {filterOptions[SUPERVISION_TYPE].componentEnabled && (
              <ToggleBarFilter
                label="Supervision Type"
                dimension={SUPERVISION_TYPE}
              />
            )}
          </div>
          <ViolationFilter />
        </>
      </Sticky>

      <div className="bgc-white p-20 m-20">
        <ErrorBoundary>
          <RevocationsOverTime
            dataFilter={matchesAllFilters({
              filters,
              skippedFilters: [METRIC_PERIOD_MONTHS],
            })}
          />
        </ErrorBoundary>
      </div>
      <div className="d-f m-20 container-all-charts">
        <div className="Revocations__matrix">
          <ErrorBoundary>
            <Matrix
              dataFilter={matchesTopLevelFilters({
                filters,
              })}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        </div>
        <MatrixExplanation />
      </div>

      <RevocationCharts
        riskLevelChart={
          <ErrorBoundary>
            <RevocationsByRiskLevel
              dataFilter={matchesAllFilters({ filters })}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
        officerChart={
          flags.enableOfficerChart && (
            <ErrorBoundary>
              <RevocationsByOfficer
                dataFilter={matchesAllFilters({ filters })}
                timeDescription={timeDescription}
              />
            </ErrorBoundary>
          )
        }
        violationChart={
          <ErrorBoundary>
            <RevocationsByViolation
              dataFilter={matchesAllFilters({ filters })}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
        genderChart={
          <ErrorBoundary>
            <RevocationsByGender
              dataFilter={matchesAllFilters({ filters })}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
        raceChart={
          <ErrorBoundary>
            <RevocationsByRace
              dataFilter={matchesAllFilters({ filters })}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
        districtChart={
          <ErrorBoundary>
            <RevocationsByDistrict
              dataFilter={matchesAllFilters({
                filters,
                skippedFilters: [DISTRICT],
              })}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
      />

      <div className="bgc-white m-20 p-20">
        <ErrorBoundary>
          <CaseTable
            dataFilter={matchesAllFilters({
              filters,
              treatCategoryAllAsAbsent: true,
            })}
          />
        </ErrorBoundary>
      </div>
    </main>
  );
};

Revocations.propTypes = {};

export default observer(Revocations);
