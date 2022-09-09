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

import React, { useState } from "react";

import CaseTable from "../../../../components/charts/new_revocations/CaseTable/CaseTable";
import RevocationCharts from "../../../../components/charts/new_revocations/RevocationCharts";
import RevocationsByRiskLevel from "../../../../components/charts/new_revocations/RevocationsByRiskLevel/RevocationsByRiskLevel";
import RevocationsByViolation from "../../../../components/charts/new_revocations/RevocationsByViolation";
import RevocationsByGender from "../../../../components/charts/new_revocations/RevocationsByGender/RevocationsByGender";
import RevocationsByRace from "../../../../components/charts/new_revocations/RevocationsByRace/RevocationsByRace";
import RevocationsByDistrict from "../../../../components/charts/new_revocations/RevocationsByDistrict/RevocationsByDistrict";
import RevocationCountOverTime from "../../../../components/charts/new_revocations/RevocationsOverTime";
import RevocationMatrix from "../../../../components/charts/new_revocations/RevocationMatrix/RevocationMatrix";
import RevocationMatrixExplanation from "../../../../components/charts/new_revocations/RevocationMatrixExplanation";
import ToggleBar from "../../../../components/charts/new_revocations/ToggleBar/ToggleBar";
import MetricPeriodMonthsFilter from "../../../../components/charts/new_revocations/ToggleBar/MetricPeriodMonthsFilter";
import DistrictFilter from "../../../../components/charts/new_revocations/ToggleBar/DistrictFilter";
import ChargeCategoryFilter from "../../../../components/charts/new_revocations/ToggleBar/ChargeCategoryFilter";
import AdmissionTypeFilter from "../../../../components/charts/new_revocations/ToggleBar/AdmissionTypeFilter";
import ViolationFilter from "../../../../components/charts/new_revocations/ToggleBar/ViolationFilter";
import SupervisionLevelFilter from "../../../../components/charts/new_revocations/ToggleBar/SupervisionLevelFilter";
import ErrorBoundary from "../../../../components/ErrorBoundary";
import {
  applyAllFilters,
  applyTopLevelFilters,
  limitFiltersToUserDistricts,
} from "../../../../components/charts/new_revocations/helpers";
import {
  DEFAULT_METRIC_PERIOD,
  METRIC_PERIODS,
  SUPERVISION_LEVELS,
} from "../../../../components/charts/new_revocations/ToggleBar/options";
import { getTimeDescription } from "../../../../components/charts/new_revocations/helpers/format";
import { useAuth0 } from "../../../../react-auth0-spa";
import {
  getUserAppMetadata,
  getUserDistricts,
} from "../../../../utils/authentication/user";
import flags from "../../../../flags";
import * as lanternTenant from "../../utils/lanternTenants";

const stateCode = lanternTenant.PA;
const admissionTypeOptions = [
  { value: "All", label: "ALL" },
  { value: "REVOCATION", label: "Revocation" },
  {
    label: "SCI",
    allSelectedLabel: "All Short Term",
    options: [
      { value: "SCI_6", label: "SCI 6 months" },
      { value: "SCI_9", label: "SCI 9 months" },
      { value: "SCI_12", label: "SCI 12 months" },
    ],
  },
  { value: "PVC", label: "PVC" },
  { value: "INPATIENT_DA", label: "Inpatient D&A" },
  { value: "DA_DETOX", label: "D&A Detox" },
  { value: "MENTAL_HEALTH", label: "Mental Health" },
];
const chargeCategoryOptions = [
  { value: "All", label: "All" },
  { value: "GENERAL", label: "General" },
  { value: "SEX_OFFENDER", label: "Sex Offense" },
  { value: "DOMESTIC_VIOLENCE", label: "Domestic Violence" },
  { value: "SERIOUS_MENTAL_ILLNESS", label: "Mental Health" },
  { value: "ALCOHOL_DRUG", label: "AOD" },
];
const violationTypes = [
  { key: "low_tech_count", label: "Low tech.", type: "TECHNICAL" },
  { key: "med_tech_count", label: "Med tech.", type: "TECHNICAL" },
  {
    key: "elec_monitoring_count",
    label: "Elec. monitoring",
    type: "TECHNICAL",
  },
  { key: "substance_count", label: "Subs. use", type: "TECHNICAL" },
  { key: "absconded_count", label: "Absconsion", type: "TECHNICAL" },
  { key: "high_tech_count", label: "High tech.", type: "TECHNICAL" },
  { key: "summary_offense_count", label: "Summary offense", type: "LAW" },
  { key: "misdemeanor_count", label: "Misdemeanor", type: "LAW" },
  { key: "felony_count", label: "Felony", type: "LAW" },
];

const Revocations = () => {
  const { user } = useAuth0();
  const { district } = getUserAppMetadata(user);
  const userDistricts = getUserDistricts(user);

  const [filters, setFilters] = useState({
    metricPeriodMonths: DEFAULT_METRIC_PERIOD.value,
    chargeCategory: chargeCategoryOptions[0].value,
    district: [district || "All"],
    admissionType: [admissionTypeOptions[0].value],
    reportedViolations: "",
    violationType: "",
    supervisionType: "All",
    ...(flags.enableAdmissionTypeFilter
      ? { admissionType: [admissionTypeOptions[1].value] }
      : {}),
    supervisionLevel: SUPERVISION_LEVELS[0].value,
  });

  const updateFilters = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };
  const transformedFilters = limitFiltersToUserDistricts(
    filters,
    userDistricts
  );
  const allDataFilter = applyAllFilters(transformedFilters);

  const timeDescription = getTimeDescription(
    filters.metricPeriodMonths,
    admissionTypeOptions,
    filters.admissionType
  );

  return (
    <main className="dashboard bgc-grey-100">
      <ToggleBar>
        <div className="top-level-filters d-f">
          <MetricPeriodMonthsFilter
            options={METRIC_PERIODS}
            defaultValue={DEFAULT_METRIC_PERIOD}
            onChange={updateFilters}
          />
          <ErrorBoundary>
            <DistrictFilter stateCode={stateCode} onChange={updateFilters} />
          </ErrorBoundary>
          <ChargeCategoryFilter
            options={chargeCategoryOptions}
            defaultValue={chargeCategoryOptions[0]}
            onChange={updateFilters}
          />
          <SupervisionLevelFilter onChange={updateFilters} />
          {flags.enableAdmissionTypeFilter && (
            <AdmissionTypeFilter
              options={admissionTypeOptions}
              summingOption={admissionTypeOptions[0]}
              defaultValue={[admissionTypeOptions[1]]}
              onChange={updateFilters}
            />
          )}
        </div>
        <ViolationFilter
          violationType={filters.violationType}
          reportedViolations={filters.reportedViolations}
          onClick={updateFilters}
        />
      </ToggleBar>

      <div className="bgc-white p-20 m-20">
        <ErrorBoundary>
          <RevocationCountOverTime
            dataFilter={allDataFilter}
            skippedFilters={["metricPeriodMonths", "supervisionType"]}
            filterStates={filters}
            metricPeriodMonths={filters.metricPeriodMonths}
            stateCode={stateCode}
          />
        </ErrorBoundary>
      </div>
      <div className="d-f m-20 container-all-charts">
        <div className="matrix-container bgc-white p-20 mR-20">
          <ErrorBoundary>
            <RevocationMatrix
              dataFilter={applyTopLevelFilters(transformedFilters)}
              filterStates={filters}
              updateFilters={updateFilters}
              timeDescription={timeDescription}
              stateCode={stateCode}
              violationTypes={[
                "LOW_TECH",
                "MED_TECH",
                "ELEC_MONITORING",
                "SUBSTANCE_ABUSE",
                "ABSCONDED",
                "HIGH_TECH",
                "SUMMARY_OFFENSE",
                "MISDEMEANOR",
                "FELONY",
              ]}
            />
          </ErrorBoundary>
        </div>
        <RevocationMatrixExplanation />
      </div>

      <RevocationCharts
        riskLevelChart={
          <ErrorBoundary>
            <RevocationsByRiskLevel
              dataFilter={allDataFilter}
              filterStates={filters}
              stateCode={stateCode}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
        violationChart={
          <ErrorBoundary>
            <RevocationsByViolation
              dataFilter={allDataFilter}
              filterStates={filters}
              stateCode={stateCode}
              timeDescription={timeDescription}
              violationTypes={violationTypes}
            />
          </ErrorBoundary>
        }
        genderChart={
          <ErrorBoundary>
            <RevocationsByGender
              dataFilter={allDataFilter}
              filterStates={filters}
              stateCode={stateCode}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
        raceChart={
          <ErrorBoundary>
            <RevocationsByRace
              dataFilter={allDataFilter}
              filterStates={filters}
              stateCode={stateCode}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
        districtChart={
          <ErrorBoundary>
            <RevocationsByDistrict
              dataFilter={allDataFilter}
              skippedFilters={["district"]}
              filterStates={filters}
              currentDistricts={filters.district}
              stateCode={stateCode}
              timeDescription={timeDescription}
            />
          </ErrorBoundary>
        }
      />

      <div className="bgc-white m-20 p-20">
        <ErrorBoundary>
          <CaseTable
            dataFilter={allDataFilter}
            treatCategoryAllAsAbsent
            filterStates={filters}
            metricPeriodMonths={filters.metricPeriodMonths}
            stateCode={stateCode}
          />
        </ErrorBoundary>
      </div>
    </main>
  );
};

export default Revocations;
