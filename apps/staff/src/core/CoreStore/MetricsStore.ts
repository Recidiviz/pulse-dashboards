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

import { makeAutoObservable } from "mobx";

import OverTimeMetric from "../models/OverTimeMetric";
import PathwaysMetric from "../models/PathwaysMetric";
import PathwaysNewBackendMetric from "../models/PathwaysNewBackendMetric";
import PersonLevelMetric from "../models/PersonLevelMetric";
import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";
import SnapshotMetric from "../models/SnapshotMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import {
  createProjectionTimeSeries,
  createSupervisionPopulationSnapshot,
} from "../models/utils";
import VitalsMetrics from "../models/VitalsMetrics";
import { PATHWAYS_PAGES, PATHWAYS_SECTIONS } from "../views";
import type CoreStore from ".";

export default class MetricsStore {
  protected readonly rootStore;

  protected map?: Record<
    string,
    Record<string, PathwaysMetric<any> | PathwaysNewBackendMetric<any>>
  >;

  constructor({ rootStore }: { rootStore: CoreStore }) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  get vitals(): VitalsMetrics {
    return new VitalsMetrics({
      tenantId: this.rootStore.currentTenantId,
      sourceEndpoint: "vitals",
    });
  }

  get current(): any {
    const { page, section } = this.rootStore;

    if (!Object.keys(PATHWAYS_PAGES).includes(page)) return undefined;

    if (!this.map) {
      this.map = {
        [PATHWAYS_PAGES.libertyToPrison]: {
          [PATHWAYS_SECTIONS.countOverTime]:
            this.libertyToPrisonPopulationOverTime,
          [PATHWAYS_SECTIONS.countByLocation]:
            this.libertyToPrisonPopulationByDistrict,
          [PATHWAYS_SECTIONS.countByPriorLengthOfIncarceration]:
            this.libertyToPrisonPopulationByPriorLengthOfIncarceration,
          [PATHWAYS_SECTIONS.countByGender]:
            this.libertyToPrisonPopulationByGender,
          [PATHWAYS_SECTIONS.countByAgeGroup]:
            this.libertyToPrisonPopulationByAgeGroup,
          [PATHWAYS_SECTIONS.countByRace]: this.libertyToPrisonPopulationByRace,
        },
        [PATHWAYS_PAGES.prison]: {
          [PATHWAYS_SECTIONS.projectedCountOverTime]:
            this.projectedPrisonPopulationOverTime,
          [PATHWAYS_SECTIONS.countOverTime]: this.prisonPopulationOverTime,
          [PATHWAYS_SECTIONS.countByLocation]: this.prisonFacilityPopulation,
          [PATHWAYS_SECTIONS.countByRace]: this.prisonPopulationByRace,
          [PATHWAYS_SECTIONS.personLevelDetail]:
            this.prisonPopulationPersonLevel,
        },
        [PATHWAYS_PAGES.prisonToSupervision]: {
          [PATHWAYS_SECTIONS.countOverTime]:
            this.prisonToSupervisionPopulationOverTime,
          [PATHWAYS_SECTIONS.countByAgeGroup]:
            this.prisonToSupervisionPopulationByAge,
          [PATHWAYS_SECTIONS.countByLocation]:
            this.prisonToSupervisionPopulationByFacility,
          [PATHWAYS_SECTIONS.countByRace]:
            this.prisonToSupervisionPopulationByRace,
          [PATHWAYS_SECTIONS.personLevelDetail]:
            this.prisonToSupervisionPopulationPersonLevel,
        },
        [PATHWAYS_PAGES.supervision]: {
          [PATHWAYS_SECTIONS.projectedCountOverTime]:
            this.projectedSupervisionPopulationOverTime,
          [PATHWAYS_SECTIONS.countOverTime]: this.supervisionPopulationOverTime,
          [PATHWAYS_SECTIONS.countByLocation]:
            this.supervisionPopulationByDistrict,
          [PATHWAYS_SECTIONS.countByRace]: this.supervisionPopulationByRace,
          [PATHWAYS_SECTIONS.countBySupervisionLevel]:
            this.supervisionPopulationBySupervisionLevel,
        },
        [PATHWAYS_PAGES.supervisionToPrison]: {
          [PATHWAYS_SECTIONS.countOverTime]: this.supervisionToPrisonOverTime,
          [PATHWAYS_SECTIONS.countByLocation]:
            this.supervisionToPrisonPopulationByDistrict,
          [PATHWAYS_SECTIONS.countByMostSevereViolation]:
            this.supervisionToPrisonPopulationByMostSevereViolation,
          [PATHWAYS_SECTIONS.countByNumberOfViolations]:
            this.supervisionToPrisonPopulationByNumberOfViolations,
          [PATHWAYS_SECTIONS.countByLengthOfStay]:
            this.supervisionToPrisonPopulationByLengthOfStay,
          [PATHWAYS_SECTIONS.countBySupervisionLevel]:
            this.supervisionToPrisonPopulationBySupervisionLevel,
          [PATHWAYS_SECTIONS.countByRace]:
            this.supervisionToPrisonPopulationByRace,
          [PATHWAYS_SECTIONS.countByGender]:
            this.supervisionToPrisonPopulationByGender,
          [PATHWAYS_SECTIONS.countByOfficer]:
            this.supervisionToPrisonPopulationByOfficer,
        },
        [PATHWAYS_PAGES.supervisionToLiberty]: {
          [PATHWAYS_SECTIONS.countOverTime]: this.supervisionToLibertyOverTime,
          [PATHWAYS_SECTIONS.countByLengthOfStay]:
            this.supervisionToLibertyPopulationByLengthOfStay,
          [PATHWAYS_SECTIONS.countByLocation]:
            this.supervisionToLibertyPopulationByLocation,
          [PATHWAYS_SECTIONS.countByGender]:
            this.supervisionToLibertyPopulationByGender,
          [PATHWAYS_SECTIONS.countByAgeGroup]:
            this.supervisionToLibertyPopulationByAgeGroup,
          [PATHWAYS_SECTIONS.countByRace]:
            this.supervisionToLibertyPopulationByRace,
        },
      };
    }

    return this.map[page][section];
  }

  // LIBERTY TO PRISON
  get libertyToPrisonPopulationOverTime(): OverTimeMetric {
    return new OverTimeMetric({
      id: "libertyToPrisonPopulationOverTime",
      endpoint: "LibertyToPrisonTransitionsOverTime",
      rootStore: this.rootStore,
    });
  }

  get libertyToPrisonPopulationByDistrict(): SnapshotMetric {
    return new SnapshotMetric({
      id: "libertyToPrisonPopulationByDistrict",
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "judicialDistrict",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get libertyToPrisonPopulationByRace(): SnapshotMetric {
    return new SnapshotMetric({
      id: "libertyToPrisonPopulationByRace",
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get libertyToPrisonPopulationByAgeGroup(): SnapshotMetric {
    return new SnapshotMetric({
      id: "libertyToPrisonPopulationByAgeGroup",
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
    });
  }

  get libertyToPrisonPopulationByGender(): SnapshotMetric {
    return new SnapshotMetric({
      id: "libertyToPrisonPopulationByGender",
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "gender",
      enableMetricModeToggle: true,
    });
  }

  get libertyToPrisonPopulationByPriorLengthOfIncarceration(): SnapshotMetric {
    return new SnapshotMetric({
      id: "libertyToPrisonPopulationByPriorLengthOfIncarceration",
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "priorLengthOfIncarceration",
      accessorIsNotFilterType: true,
    });
  }

  // PRISON
  get prisonPopulationOverTime(): OverTimeMetric {
    return new OverTimeMetric({
      id: "prisonPopulationOverTime",
      endpoint: "PrisonPopulationOverTime",
      rootStore: this.rootStore,
    });
  }

  get projectedPrisonPopulationOverTime(): PopulationProjectionOverTimeMetric {
    // TODO(#1838): New metric type for projections
    return new PopulationProjectionOverTimeMetric({
      id: "projectedPrisonPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      compartment: "INCARCERATION",
      sourceFilename: "prison_population_projection_time_series",
      rootStore: this.rootStore,
      dataTransformer: createProjectionTimeSeries,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .projectedPrisonPopulationOverTime,
    });
  }

  get prisonFacilityPopulation(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonFacilityPopulation",
      endpoint: "PrisonPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "facility",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get prisonPopulationByRace(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonPopulationByRace",
      endpoint: "PrisonPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get prisonPopulationPersonLevel(): PersonLevelMetric {
    return new PersonLevelMetric({
      id: "prisonPopulationPersonLevel",
      endpoint: "PrisonPopulationPersonLevel",
      rootStore: this.rootStore,
    });
  }

  // PRISON TO SUPERVISION
  get prisonToSupervisionPopulationOverTime(): OverTimeMetric {
    return new OverTimeMetric({
      id: "prisonToSupervisionPopulationOverTime",
      endpoint: "PrisonToSupervisionTransitionsOverTime",
      rootStore: this.rootStore,
    });
  }

  get prisonToSupervisionPopulationByAge(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonToSupervisionPopulationByAge",
      endpoint: "PrisonToSupervisionTransitionsCount",
      rootStore: this.rootStore,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
    });
  }

  get prisonToSupervisionPopulationByFacility(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonToSupervisionPopulationByFacility",
      endpoint: "PrisonToSupervisionTransitionsCount",
      rootStore: this.rootStore,
      accessor: "facility",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get prisonToSupervisionPopulationByRace(): SnapshotMetric {
    return new SnapshotMetric({
      id: "prisonToSupervisionPopulationByRace",
      endpoint: "PrisonToSupervisionTransitionsCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get prisonToSupervisionPopulationPersonLevel(): PersonLevelMetric {
    return new PersonLevelMetric({
      id: "prisonToSupervisionPopulationPersonLevel",
      endpoint: "PrisonToSupervisionTransitionsPersonLevel",
      rootStore: this.rootStore,
    });
  }

  // SUPERVISION
  get supervisionPopulationOverTime(): OverTimeMetric {
    return new OverTimeMetric({
      id: "supervisionPopulationOverTime",
      endpoint: "SupervisionPopulationOverTime",
      rootStore: this.rootStore,
    });
  }

  get projectedSupervisionPopulationOverTime(): PopulationProjectionOverTimeMetric {
    // TODO(#1838): New metric type for projections
    return new PopulationProjectionOverTimeMetric({
      id: "projectedSupervisionPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      compartment: "SUPERVISION",
      sourceFilename: "supervision_population_projection_time_series",
      rootStore: this.rootStore,
      dataTransformer: createProjectionTimeSeries,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .projectedSupervisionPopulationOverTime,
    });
  }

  get supervisionPopulationByDistrict(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionPopulationByDistrict",
      endpoint: "SupervisionPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get supervisionPopulationByRace(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionPopulationByRace",
      endpoint: "SupervisionPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get supervisionPopulationBySupervisionLevel(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionPopulationBySupervisionLevel",
      endpoint: "SupervisionPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "supervisionLevel",
      rotateLabels: true,
    });
  }

  // SUPERVISION TO PRISON
  get supervisionToPrisonOverTime(): OverTimeMetric {
    return new OverTimeMetric({
      id: "supervisionToPrisonOverTime",
      endpoint: "SupervisionToPrisonTransitionsOverTime",
      rootStore: this.rootStore,
    });
  }

  get supervisionToPrisonPopulationByDistrict(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToPrisonPopulationByDistrict",
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get supervisionToPrisonPopulationByMostSevereViolation(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToPrisonPopulationByMostSevereViolation",
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "mostSevereViolation",
    });
  }

  get supervisionToPrisonPopulationByNumberOfViolations(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToPrisonPopulationByNumberOfViolations",
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "numberOfViolations",
    });
  }

  get supervisionToPrisonPopulationByLengthOfStay(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToPrisonPopulationByLengthOfStay",
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "lengthOfStay",
      accessorIsNotFilterType: true,
    });
  }

  get supervisionToPrisonPopulationBySupervisionLevel(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToPrisonPopulationBySupervisionLevel",
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "supervisionLevel",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get supervisionToPrisonPopulationByGender(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToPrisonPopulationByGender",
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "gender",
      enableMetricModeToggle: true,
    });
  }

  get supervisionToPrisonPopulationByRace(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToPrisonPopulationByRace",
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get supervisionToPrisonPopulationByOfficer():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToPrisonPopulationByOfficer";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "officerName",
      enableMetricModeToggle: true,
      isHorizontal: true,
      accessorIsNotFilterType: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_officer",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "officerName",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      isHorizontal: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToPrisonPopulationByOfficer,
      accessorIsNotFilterType: true,
      newBackendMetric,
    });
  }

  // SUPERVISION TO LIBERTY
  get supervisionToLibertyOverTime(): OverTimeMetric {
    return new OverTimeMetric({
      id: "supervisionToLibertyOverTime",
      endpoint: "SupervisionToLibertyTransitionsOverTime",
      rootStore: this.rootStore,
    });
  }

  get supervisionToLibertyPopulationByLengthOfStay(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToLibertyPopulationByLengthOfStay",
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "lengthOfStay",
    });
  }

  get supervisionToLibertyPopulationByRace(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToLibertyPopulationByRace",
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
  }

  get supervisionToLibertyPopulationByLocation(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToLibertyPopulationByLocation",
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get supervisionToLibertyPopulationByGender(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToLibertyPopulationByGender",
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "gender",
      enableMetricModeToggle: true,
    });
  }

  get supervisionToLibertyPopulationByAgeGroup(): SnapshotMetric {
    return new SnapshotMetric({
      id: "supervisionToLibertyPopulationByAgeGroup",
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
    });
  }
}
