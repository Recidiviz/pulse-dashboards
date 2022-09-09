// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2019 Recidiviz, Inc.
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

import React, { useState, useEffect } from 'react';
import * as $ from 'jquery';

import Loading from '../../../components/Loading';
import '../../../assets/styles/index.scss';
import { useAuth0 } from '../../../react-auth0-spa';
import { callMetricsApi, awaitingResults } from '../../../utils/metricsClient';

import DaysAtLibertySnapshot from '../../../components/charts/snapshots/DaysAtLibertySnapshot';
import LsirScoreChangeSnapshot from '../../../components/charts/snapshots/LsirScoreChangeSnapshot';
import RevocationAdmissionsSnapshot
  from '../../../components/charts/snapshots/RevocationAdmissionsSnapshot';
import SupervisionSuccessSnapshot
  from '../../../components/charts/snapshots/SupervisionSuccessSnapshot';
import GeoViewTimeChart from '../../../components/charts/GeoViewTimeChart';

import GeoViewToggle from '../../../components/toggles/GeoViewToggle';
import ToggleBar from '../../../components/toggles/ToggleBar';
import * as ToggleDefaults from '../../../components/toggles/ToggleDefaults';
import PageTemplate from './PageTemplate';

const Snapshots = () => {
  const { loading, user, getTokenSilently } = useAuth0();
  const [apiData, setApiData] = useState({});
  const [awaitingApi, setAwaitingApi] = useState(true);
  const [chartMetricType, setChartMetricType] = useState(ToggleDefaults.metricType);
  const [chartMetricPeriodMonths, setChartMetricPeriodMonths] = useState(ToggleDefaults.metricPeriodMonths);
  const [chartSupervisionType, setChartSupervisionType] = useState(ToggleDefaults.supervisionType);
  const [chartDistrict, setChartDistrict] = useState(ToggleDefaults.district);
  const [geoViewEnabledSCOS, setGeoViewEnabledSCOS] = useState(ToggleDefaults.geoView);
  const [geoViewEnabledPDTR, setGeoViewEnabledPDTR] = useState(ToggleDefaults.geoView);
  const [geoViewEnabledALSI, setGeoViewEnabledALSI] = useState(ToggleDefaults.geoView);

  const importantNotes = [
    {
      header: 'PERSON-BASED COUNTING',
      body: `Unless noted otherwise, counts in this dashboard are based on people, not cases.

      Some individuals may have multiple cases over time. Those people will be counted
      towards all metrics for which at least one case is relevant. For example, if one
      person has a case that expires and a second case that ends in revocation a month
      later, that person would be counted towards both successful termination in the first
      month and revocation in the second.`,
    },
    {
      header: 'REVOCATIONS TO DOCR FACILITY',
      body: `Unless noted otherwise, "revocation" refers only to revocations resulting in
      incarceration at a DOCR facility. Revocations resulting in continuation of
      supervision, a county jail sentence, or termination of supervision are not considered.
      In addition, revocations are counted only when an individual's admittance to a
      facility is documented in Elite as a revocation. Individuals who have their
      supervision terminated due to revocation (resulting in incarceration) but are admitted
      back into the system with the code "new admission" are not included in
      revocation counts.`,
    },
    {
      header: 'DATA PULLED FROM ELITE & DOCSTARS',
      body: `Data in the dashboard is updated nightly using information pulled from Elite and
      Docstars.`,
    },
    {
      header: 'LEARN MORE',
      body: 'Click on "Methodology" for more information on the calculations behind that chart.',
    },
  ];

  $(() => {
    $('[data-toggle="tooltip"]').tooltip();
  });

  const fetchChartData = async () => {
    try {
      const responseData = await callMetricsApi('us_nd/snapshots', getTokenSilently);
      setApiData(responseData);
      setAwaitingApi(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  if (awaitingResults(loading, user, awaitingApi)) {
    return <Loading />;
  }

  const toggleBar = (
    <ToggleBar
      setChartMetricType={setChartMetricType}
      setChartMetricPeriodMonths={setChartMetricPeriodMonths}
      setChartSupervisionType={setChartSupervisionType}
      setChartDistrict={setChartDistrict}
      districtOffices={apiData.site_offices}
      availableDistricts={['beulah', 'bismarck', 'bottineau', 'devils-lake', 'dickson', 'fargo', 'grafton', 'grand-forks', 'jamestown', 'mandan', 'minot', 'oakes', 'rolla', 'washburn', 'wahpeton', 'williston']}
    />
  );

  return (
    <PageTemplate
      toggleBar={toggleBar}
      importantNotes={importantNotes}
    >
      <>
        {/* #Successful completion of supervision snapshot ==================== */}
        <div className="col-md-6">
          <div className="bd bgc-white p-20">
            <div className="layers">
              <div className="layer w-100 pX-20 pT-20">
                <h6 className="lh-1">
                  SUCCESSFUL COMPLETION OF SUPERVISION
                  {chartDistrict !== 'all' && (
                    <span className="pL-10 toggle-alert ti-alert" data-toggle="tooltip" data-placement="bottom" title="Filtering this graph by a specific office requires knowing the officer that was assigned to historical periods of supervision. Because the Docstars data system does not currently keep a full historical record of officer assignments, we cannot track this measurement by office prior to when we first began ingesting data from DOCR." />
                  )}
                  <span className="fa-pull-right">
                    <div className="geo-view-button pR-10">
                      <GeoViewToggle setGeoViewEnabled={setGeoViewEnabledSCOS} />
                    </div>
                    <div className="dropdown show export-button">
                      <a className="btn btn-secondary btn-sm dropdown-toggle" href="#" role="button" id="exportDropdownMenuButton-supervisionSuccessSnapshot" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Export
                      </a>
                      <div className="dropdown-menu" aria-labelledby="exportDropdownMenuButton-supervisionSuccesSnapshot">
                        {geoViewEnabledSCOS === false && (
                          <a className="dropdown-item" id="downloadChartAsImage-supervisionSuccessSnapshot" href="javascript:void(0);">Export image</a>
                        )}
                        <a className="dropdown-item" id="downloadChartData-supervisionSuccessSnapshot" href="javascript:void(0);">Export data</a>
                      </div>
                    </div>
                  </span>
                </h6>
              </div>
              <div className="layer w-100 pX-20 pT-20">
                {geoViewEnabledSCOS === false && (
                  <div className="dynamic-chart-header" id="supervisionSuccessSnapshot-header" />
                )}
              </div>
              <div className="layer w-100 p-20 fs-block">
                { /* TODO(XXX): Figure out why map will not show when delegated to by the Chart.js
                    chart. Then we can just encapsulate this logic inside of a single component. */ }
                {geoViewEnabledSCOS === false && (
                  <SupervisionSuccessSnapshot
                    metricType={chartMetricType}
                    metricPeriodMonths={chartMetricPeriodMonths}
                    supervisionType={chartSupervisionType}
                    district={chartDistrict}
                    supervisionSuccessRates={apiData.supervision_termination_by_type_by_month}
                    header="supervisionSuccessSnapshot-header"
                  />
                )}
                {geoViewEnabledSCOS === true && (
                  <GeoViewTimeChart
                    chartId="supervisionSuccessSnapshot"
                    chartTitle="SUCCESSFUL COMPLETION OF SUPERVISION"
                    metricType={chartMetricType}
                    metricPeriodMonths={chartMetricPeriodMonths}
                    supervisionType={chartSupervisionType}
                    keyedByOffice={true}
                    officeData={apiData.site_offices}
                    dataPointsByOffice={apiData.supervision_termination_by_type_by_period}
                    numeratorKeys={['successful_termination']}
                    denominatorKeys={['revocation_termination', 'successful_termination']}
                    centerLat={47.3}
                    centerLong={-100.5}
                  />
                )}
              </div>
              <div className="layer bdT p-20 w-100 accordion" id="methodologySupervisionSuccessSnapshot">
                <div className="mb-0" id="methodologyHeadingSupervisionSuccessSnapshot">
                  <div className="mb-0">
                    <button className="btn btn-link collapsed pL-0" type="button" data-toggle="collapse" data-target="#collapseMethodologySupervisionSuccessSnapshot" aria-expanded="true" aria-controls="collapseMethodologySupervisionSuccessSnapshot">
                      <h6 className="lh-1 c-blue-500 mb-0">Methodology</h6>
                    </button>
                  </div>
                </div>
                <div className="collapse" id="collapseMethodologySupervisionSuccessSnapshot" aria-labelledby="methodologyHeadingSupervisionSuccessSnapshot" data-parent="#methodologySupervisionSuccessSnapshot">
                  <div>
                    <ul>
                      <li>
                        A supervision is considered successfully completed
                        if the individual was discharged from supervision positively
                        or if their supervision period expired.
                      </li>
                      <li>
                        Unsuccessful completions of supervision occur when the
                        supervision ends due to absconsion, a revocation, or a
                        negative termination.
                      </li>
                      <li>
                        Deaths, suspensions, and &quot;other&quot; terminations are excluded from
                        these calculations because they&apos;re neither &quot;successful&quot; nor
                        &quot;unsuccessful&quot;.
                      </li>
                      <li>
                        Individuals are counted in their month of projected completion, even if
                        terminated earlier. Individuals who have not yet completed supervision by
                        their projected termination date are excluded.
                      </li>
                      <li>
                        While on supervision, individuals are attributed to the office of their
                        current supervising officer. Following supervision, individuals are attributed
                        to the office of the officer who terminated their supervision.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* #Prison admissions from revocations ==================== */}
        <div className="col-md-6">
          <div className="bd bgc-white p-20">
            <div className="layers">
              <div className="layer w-100 pX-20 pT-20">
                <h6 className="lh-1">
                  PRISON ADMISSIONS DUE TO REVOCATION
                  <span className="fa-pull-right">
                    <div className="geo-view-button pR-10">
                      <GeoViewToggle setGeoViewEnabled={setGeoViewEnabledPDTR} />
                    </div>
                    <div className="dropdown show export-button">
                      <a className="btn btn-secondary btn-sm dropdown-toggle" href="#" role="button" id="exportDropdownMenuButton-revocationAdmissionsSnapshot" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Export
                      </a>
                      <div className="dropdown-menu" aria-labelledby="exportDropdownMenuButton-revocationAdmissionsSnapshot">
                        {geoViewEnabledPDTR === false && (
                          <a className="dropdown-item" id="downloadChartAsImage-revocationAdmissionsSnapshot" href="javascript:void(0);">Export image</a>
                        )}
                        <a className="dropdown-item" id="downloadChartData-revocationAdmissionsSnapshot" href="javascript:void(0);">Export data</a>
                      </div>
                    </div>
                  </span>
                </h6>
              </div>
              <div className="layer w-100 pX-20 pT-20">
                {geoViewEnabledPDTR === false && (
                  <div className="dynamic-chart-header" id="revocationAdmissionsSnapshot-header" />
                )}
              </div>
              <div className="layer w-100 p-20 fs-block">
                {geoViewEnabledPDTR === false && (
                  <RevocationAdmissionsSnapshot
                    metricType={chartMetricType}
                    metricPeriodMonths={chartMetricPeriodMonths}
                    supervisionType={chartSupervisionType}
                    district={chartDistrict}
                    revocationAdmissionsByMonth={apiData.admissions_by_type_by_month}
                    header="revocationAdmissionsSnapshot-header"
                  />
                )}
                {geoViewEnabledPDTR === true && (
                  <GeoViewTimeChart
                    chartId="revocationAdmissionsSnapshot"
                    chartTitle="PRISON ADMISSIONS DUE TO REVOCATION"
                    metricType={chartMetricType}
                    metricPeriodMonths={chartMetricPeriodMonths}
                    supervisionType={chartSupervisionType}
                    keyedByOffice
                    shareDenominatorAcrossRates
                    officeData={apiData.site_offices}
                    dataPointsByOffice={apiData.admissions_by_type_by_period}
                    numeratorKeys={['technicals', 'non_technicals', 'unknown_revocations']}
                    denominatorKeys={['technicals', 'non_technicals', 'unknown_revocations', 'new_admissions']}
                    centerLat={47.3}
                    centerLong={-100.5}
                  />
                )}
              </div>
              <div className="layer bdT p-20 w-100 accordion" id="methodologyRevocationAdmissionsSnapshot">
                <div className="mb-0" id="methodologyHeadingRevocationAdmissionsSnapshot">
                  <div className="mb-0">
                    <button className="btn btn-link collapsed pL-0" type="button" data-toggle="collapse" data-target="#collapseMethodologyRevocationAdmissionsSnapshot" aria-expanded="true" aria-controls="collapseMethodologyRevocationAdmissionsSnapshot">
                      <h6 className="lh-1 c-blue-500 mb-0">Methodology</h6>
                    </button>
                  </div>
                </div>
                <div className="collapse" id="collapseMethodologyRevocationAdmissionsSnapshot" aria-labelledby="methodologyHeadingRevocationAdmissionsSnapshot" data-parent="#methodologyRevocationAdmissionsSnapshot">
                  <div>
                    <ul>
                      <li>
                        Prison admissions include individuals who are newly incarcerated in DOCR
                        facilities. Transfers, periods of temporary custody, returns from escape
                        and/or erroneous releases are not considered admissions.
                      </li>
                      <li>
                        Prison admissions are categorized as probation revocations, parole
                        revocations, or new admissions. New admissions are admissions for a reason
                        other than revocation.
                      </li>
                      <li>
                        Selecting an office or supervision type narrows down revocations to be
                        revocations from that office and/or supervision type.
                      </li>
                      <li>
                        &quot;Rate&quot; displays the percent of all admissions that occurred by
                        supervision revocation. When a supervision type and/or office is selected,
                        the chart displays the percent of all admissions that were revocations from
                        that office and/or supervision type.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* #Average days at liberty ==================== */}
        <div className="col-md-6">
          <div className="bd bgc-white p-20">
            <div className="layers">
              <div className="layer w-100 pX-20 pT-20">
                <h6 className="lh-1">
                  DAYS AT LIBERTY (AVERAGE)
                  {(chartMetricType !== 'counts' || chartSupervisionType !== 'all' || chartDistrict !== 'all') && (
                    <span className="pL-10 toggle-alert ti-alert" data-toggle="tooltip" data-placement="bottom" title="This graph is showing average days at liberty for all reincarcerated individuals. It does not support showing this metric as a rate. As individuals can be reincarcerated after completing supervision, this chart also does not support showing information only about a certain office or individuals on a certain type of supervision." />
                  )}
                  <span className="fa-pull-right">
                    <div className="dropdown show">
                      <a className="btn btn-secondary btn-sm dropdown-toggle" href="#" role="button" id="exportDropdownMenuButton-daysAtLibertySnapshot" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Export
                      </a>
                      <div className="dropdown-menu" aria-labelledby="exportDropdownMenuButton-daysAtLibertySnapshot">
                        <a className="dropdown-item" id="downloadChartAsImage-daysAtLibertySnapshot" href="javascript:void(0);">Export image</a>
                        <a className="dropdown-item" id="downloadChartData-daysAtLibertySnapshot" href="javascript:void(0);">Export data</a>
                      </div>
                    </div>
                  </span>
                </h6>
              </div>
              <div className="layer w-100 pX-20 pT-20">
                <div className="dynamic-chart-header" id="daysAtLibertySnapshot-header" />
              </div>
              <div className="layer w-100 p-20">
                <div className="ai-c jc-c gapX-20">
                  <div className="col-md-12 fs-block">
                    <DaysAtLibertySnapshot
                      metricPeriodMonths={chartMetricPeriodMonths}
                      daysAtLibertyByMonth={apiData.avg_days_at_liberty_by_month}
                      header="daysAtLibertySnapshot-header"
                    />
                  </div>
                </div>
              </div>
              <div className="layer bdT p-20 w-100 accordion" id="methodologyDaysAtLibertySnapshot">
                <div className="mb-0" id="methodologyHeadingDaysAtLibertySnapshot">
                  <div className="mb-0">
                    <button className="btn btn-link collapsed pL-0" type="button" data-toggle="collapse" data-target="#collapseMethodologyDaysAtLibertySnapshot" aria-expanded="true" aria-controls="collapseMethodologyDaysAtLibertySnapshot">
                      <h6 className="lh-1 c-blue-500 mb-0">Methodology</h6>
                    </button>
                  </div>
                </div>
                <div className="collapse" id="collapseMethodologyDaysAtLibertySnapshot" aria-labelledby="methodologyHeadingDaysAtLibertySnapshot" data-parent="#methodologyDaysAtLibertySnapshot">
                  <div>
                    <ul>
                      <li>
                        An individual&apos;s days at liberty are the number of
                        days between release from incarceration and readmission
                        for someone who was reincarcerated in a given month.
                      </li>
                      <li>
                        An admission to prison counts as a reincarceration if
                        the person has been incarcerated previously in a North
                        Dakota prison.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* #Change in LSI-R scores ==================== */}
        <div className="col-md-6">
          <div className="bd bgc-white p-20">
            <div className="layers">
              <div className="layer w-100 pX-20 pT-20">
                <h6 className="lh-1">
                  LSI-R SCORE CHANGES (AVERAGE)
                  {chartMetricType !== 'counts' && (
                    <span className="pL-10 toggle-alert ti-alert" data-toggle="tooltip" data-placement="bottom" title="This graph is showing average LSI-R score change. It does not support showing this metric as a rate." />
                  )}
                  {chartDistrict !== 'all' && (
                    <span className="pL-10 toggle-alert ti-alert" data-toggle="tooltip" data-placement="bottom" title="Filtering this graph by a specific office requires knowing the officer that was assigned to historical periods of supervision. Because the Docstars data system does not currently keep a full historical record of officer assignments, we cannot track this measurement by office prior to when we first began ingesting data from DOCR." />
                  )}
                  <span className="fa-pull-right">
                    <div className="geo-view-button pR-10">
                      <GeoViewToggle setGeoViewEnabled={setGeoViewEnabledALSI} />
                    </div>
                    <div className="dropdown show export-button">
                      <a className="btn btn-secondary btn-sm dropdown-toggle" href="#" role="button" id="exportDropdownMenuButton-lsirScoreChangeSnapshot" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        Export
                      </a>
                      <div className="dropdown-menu" aria-labelledby="exportDropdownMenuButton-lsirScoreChangeSnapshot">
                        {geoViewEnabledALSI === false && (
                          <a className="dropdown-item" id="downloadChartAsImage-lsirScoreChangeSnapshot" href="javascript:void(0);">Export image</a>
                        )}
                        <a className="dropdown-item" id="downloadChartData-lsirScoreChangeSnapshot" href="javascript:void(0);">Export data</a>
                      </div>
                    </div>
                  </span>
                </h6>
              </div>
              <div className="layer w-100 pX-20 pT-20">
                {geoViewEnabledALSI === false && (
                  <div className="dynamic-chart-header" id="lsirScoreChangeSnapshot-header" />
                )}
              </div>
              <div className="layer w-100 p-20 fs-block">
                {geoViewEnabledALSI === false && (
                  <LsirScoreChangeSnapshot
                    metricPeriodMonths={chartMetricPeriodMonths}
                    supervisionType={chartSupervisionType}
                    district={chartDistrict}
                    lsirScoreChangeByMonth={apiData.average_change_lsir_score_by_month}
                    header="lsirScoreChangeSnapshot-header"
                  />
                )}
                {geoViewEnabledALSI === true && (
                  <GeoViewTimeChart
                    chartId="lsirScoreChangeSnapshot"
                    chartTitle="LSI-R SCORE CHANGES (AVERAGE)"
                    metricType="counts"
                    metricPeriodMonths={chartMetricPeriodMonths}
                    supervisionType={chartSupervisionType}
                    keyedByOffice={true}
                    officeData={apiData.site_offices}
                    dataPointsByOffice={apiData.average_change_lsir_score_by_period}
                    numeratorKeys={['average_change']}
                    denominatorKeys={[]}
                    centerLat={47.3}
                    centerLong={-100.5}
                  />
                )}
              </div>
              <div className="layer bdT p-20 w-100 accordion" id="methodologyLsirScoreChangeSnapshot">
                <div className="mb-0" id="methodologyHeadingLsirScoreChangeSnapshot">
                  <div className="mb-0">
                    <button className="btn btn-link collapsed pL-0" type="button" data-toggle="collapse" data-target="#collapseMethodologyLsirScoreChangeSnapshot" aria-expanded="true" aria-controls="collapseMethodologyLsirScoreChangeSnapshot">
                      <h6 className="lh-1 c-blue-500 mb-0">Methodology</h6>
                    </button>
                  </div>
                </div>
                <div className="collapse" id="collapseMethodologyLsirScoreChangeSnapshot" aria-labelledby="methodologyHeadingLsirScoreChangeSnapshot" data-parent="#methodologyLsirScoreChangeSnapshot">
                  <div>
                    <ul>
                      <li>
                        For all individuals ending supervision in a given month who have at least 3
                        LSI-R assessments (initial assessment, first re-assessment, and terminating
                        assessment), this is the average of the differences between the first
                        reassessment score and the termination assessment score.
                      </li>
                      <li>
                        Individuals are included regardless of termination reason.
                      </li>
                      <li>
                        Individuals are linked to the office of their terminating officer.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </PageTemplate>
  );
};

export default Snapshots;
