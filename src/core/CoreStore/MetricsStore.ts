// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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

import LibertyPopulationOverTimeMetric from "../models/LibertyPopulationOverTimeMetric";
import LibertyPopulationSnapshotMetric from "../models/LibertyPopulationSnapshotMetric";
import OverTimeMetric from "../models/OverTimeMetric";
import PathwaysMetric from "../models/PathwaysMetric";
import PathwaysNewBackendMetric from "../models/PathwaysNewBackendMetric";
import PersonLevelMetric from "../models/PersonLevelMetric";
import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";
import PrisonPopulationOverTimeMetric from "../models/PrisonPopulationOverTimeMetric";
import PrisonPopulationPersonLevelMetric from "../models/PrisonPopulationPersonLevelMetric";
import PrisonPopulationSnapshotMetric from "../models/PrisonPopulationSnapshotMetric";
import SnapshotMetric from "../models/SnapshotMetric";
import SupervisionPopulationOverTimeMetric from "../models/SupervisionPopulationOverTimeMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import {
  createLibertyPopulationSnapshot,
  createLibertyPopulationTimeSeries,
  createPrisonPopulationPersonLevelList,
  createPrisonPopulationSnapshot,
  createPrisonPopulationTimeSeries,
  createProjectionTimeSeries,
  createSupervisionPopulationSnapshot,
  createSupervisionPopulationTimeSeries,
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
  get libertyToPrisonPopulationOverTime():
    | LibertyPopulationOverTimeMetric
    | OverTimeMetric {
    const id = "libertyToPrisonPopulationOverTime";
    const newBackendMetric = new OverTimeMetric({
      id,
      endpoint: "LibertyToPrisonTransitionsOverTime",
      rootStore: this.rootStore,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new LibertyPopulationOverTimeMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_count_by_month",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationTimeSeries,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .libertyToPrisonPopulationOverTime,
      newBackendMetric,
    });
  }

  get libertyToPrisonPopulationByDistrict():
    | LibertyPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "libertyToPrisonPopulationByDistrict";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "judicialDistrict",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new LibertyPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "judicialDistrict",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .libertyToPrisonPopulationByDistrict,
      rotateLabels: true,
      isGeographic: true,
      newBackendMetric,
    });
  }

  get libertyToPrisonPopulationByRace():
    | LibertyPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "libertyToPrisonPopulationByRace";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new LibertyPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "race",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .libertyToPrisonPopulationByRace,
      rotateLabels: true,
      newBackendMetric,
    });
  }

  get libertyToPrisonPopulationByAgeGroup():
    | LibertyPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "libertyToPrisonPopulationByAgeGroup";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new LibertyPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .libertyToPrisonPopulationByAgeGroup,
      newBackendMetric,
    });
  }

  get libertyToPrisonPopulationByGender():
    | LibertyPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "libertyToPrisonPopulationByGender";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "gender",
      enableMetricModeToggle: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new LibertyPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "gender",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .libertyToPrisonPopulationByGender,
      newBackendMetric,
    });
  }

  get libertyToPrisonPopulationByPriorLengthOfIncarceration():
    | LibertyPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "libertyToPrisonPopulationByPriorLengthOfIncarceration";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "LibertyToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "priorLengthOfIncarceration",
      accessorIsNotFilterType: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new LibertyPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "priorLengthOfIncarceration",
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .libertyToPrisonPopulationByPriorLengthOfIncarceration,
      accessorIsNotFilterType: true,
      newBackendMetric,
    });
  }

  // PRISON
  get prisonPopulationOverTime():
    | PrisonPopulationOverTimeMetric
    | OverTimeMetric {
    const id = "prisonPopulationOverTime";
    const newBackendMetric = new OverTimeMetric({
      id,
      endpoint: "PrisonPopulationOverTime",
      rootStore: this.rootStore,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationOverTimeMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_population_time_series",
      rootStore: this.rootStore,
      dataTransformer: createPrisonPopulationTimeSeries,
      filters:
        this.rootStore.filtersStore.enabledFilters.prisonPopulationOverTime,
      newBackendMetric,
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

  get prisonFacilityPopulation():
    | PrisonPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "prisonFacilityPopulation";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "PrisonPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "facility",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      accessor: "facility",
      sourceFilename: "prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      filters:
        this.rootStore.filtersStore.enabledFilters.prisonFacilityPopulation,
      rotateLabels: true,
      isGeographic: true,
      newBackendMetric,
    });
  }

  get prisonPopulationByRace():
    | PrisonPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "prisonPopulationByRace";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "PrisonPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      accessor: "race",
      sourceFilename: "prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      filters:
        this.rootStore.filtersStore.enabledFilters.prisonPopulationByRace,
      rotateLabels: true,
      newBackendMetric,
    });
  }

  get prisonPopulationPersonLevel():
    | PrisonPopulationPersonLevelMetric
    | PersonLevelMetric {
    const id = "prisonPopulationPersonLevel";
    const newBackendMetric = new PersonLevelMetric({
      id,
      endpoint: "PrisonPopulationPersonLevel",
      rootStore: this.rootStore,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationPersonLevelMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_population_snapshot_person_level",
      rootStore: this.rootStore,
      dataTransformer: createPrisonPopulationPersonLevelList,
      filters:
        this.rootStore.filtersStore.enabledFilters.prisonPopulationPersonLevel,
      newBackendMetric,
    });
  }

  // PRISON TO SUPERVISION
  get prisonToSupervisionPopulationOverTime():
    | PrisonPopulationOverTimeMetric
    | OverTimeMetric {
    const id = "prisonToSupervisionPopulationOverTime";
    const newBackendMetric = new OverTimeMetric({
      id,
      endpoint: "PrisonToSupervisionTransitionsOverTime",
      rootStore: this.rootStore,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationOverTimeMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_count_by_month",
      rootStore: this.rootStore,
      dataTransformer: createPrisonPopulationTimeSeries,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .prisonToSupervisionPopulationOverTime,
      newBackendMetric,
    });
  }

  get prisonToSupervisionPopulationByAge():
    | PrisonPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "prisonToSupervisionPopulationByAge";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "PrisonToSupervisionTransitionsCount",
      rootStore: this.rootStore,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      accessor: "ageGroup",
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .prisonToSupervisionPopulationByAge,
      newBackendMetric,
    });
  }

  get prisonToSupervisionPopulationByFacility():
    | PrisonPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "prisonToSupervisionPopulationByFacility";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "PrisonToSupervisionTransitionsCount",
      rootStore: this.rootStore,
      accessor: "facility",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      accessor: "facility",
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .prisonToSupervisionPopulationByFacility,
      rotateLabels: true,
      isGeographic: true,
      newBackendMetric,
    });
  }

  get prisonToSupervisionPopulationByRace():
    | PrisonPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "prisonToSupervisionPopulationByRace";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "PrisonToSupervisionTransitionsCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      accessor: "race",
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .prisonToSupervisionPopulationByRace,
      rotateLabels: true,
      newBackendMetric,
    });
  }

  get prisonToSupervisionPopulationPersonLevel():
    | PrisonPopulationPersonLevelMetric
    | PersonLevelMetric {
    const id = "prisonToSupervisionPopulationPersonLevel";
    const newBackendMetric = new PersonLevelMetric({
      id,
      endpoint: "PrisonToSupervisionTransitionsPersonLevel",
      rootStore: this.rootStore,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new PrisonPopulationPersonLevelMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_population_snapshot_person_level",
      rootStore: this.rootStore,
      hasTimePeriodDimension: true,
      dataTransformer: createPrisonPopulationPersonLevelList,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .prisonToSupervisionPopulationPersonLevel,
      newBackendMetric,
    });
  }

  // SUPERVISION
  get supervisionPopulationOverTime():
    | SupervisionPopulationOverTimeMetric
    | OverTimeMetric {
    const id = "supervisionPopulationOverTime";
    const newBackendMetric = new OverTimeMetric({
      id,
      endpoint: "SupervisionPopulationOverTime",
      rootStore: this.rootStore,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationOverTimeMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_time_series",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionPopulationOverTime,
      newBackendMetric,
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

  get supervisionPopulationByDistrict():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionPopulationByDistrict";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "district",
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionPopulationByDistrict,
      rotateLabels: true,
      isGeographic: true,
      newBackendMetric,
    });
  }

  get supervisionPopulationByRace():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionPopulationByRace";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "race",
      filters:
        this.rootStore.filtersStore.enabledFilters.supervisionPopulationByRace,
      rotateLabels: true,
      newBackendMetric,
    });
  }

  get supervisionPopulationBySupervisionLevel():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionPopulationBySupervisionLevel";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionPopulationByDimensionCount",
      rootStore: this.rootStore,
      accessor: "supervisionLevel",
      rotateLabels: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "supervisionLevel",
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionPopulationBySupervisionLevel,
      rotateLabels: true,
      newBackendMetric,
    });
  }

  // SUPERVISION TO PRISON
  get supervisionToPrisonOverTime():
    | SupervisionPopulationOverTimeMetric
    | OverTimeMetric {
    const id = "supervisionToPrisonOverTime";
    const newBackendMetric = new OverTimeMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsOverTime",
      rootStore: this.rootStore,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationOverTimeMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_count_by_month",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters:
        this.rootStore.filtersStore.enabledFilters.supervisionToPrisonOverTime,
      newBackendMetric,
    });
  }

  get supervisionToPrisonPopulationByDistrict():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToPrisonPopulationByDistrict";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      dataTransformer: createSupervisionPopulationSnapshot,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToPrisonPopulationByDistrict,
      rotateLabels: true,
      isGeographic: true,
      newBackendMetric,
    });
  }

  get supervisionToPrisonPopulationByMostSevereViolation():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToPrisonPopulationByMostSevereViolation";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "mostSevereViolation",
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "mostSevereViolation",
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToPrisonPopulationByMostSevereViolation,
      newBackendMetric,
    });
  }

  get supervisionToPrisonPopulationByNumberOfViolations():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToPrisonPopulationByNumberOfViolations";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "numberOfViolations",
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "numberOfViolations",
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToPrisonPopulationByNumberOfViolations,
      newBackendMetric,
    });
  }

  get supervisionToPrisonPopulationByLengthOfStay():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToPrisonPopulationByLengthOfStay";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "lengthOfStay",
      accessorIsNotFilterType: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "lengthOfStay",
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToPrisonPopulationByLengthOfStay,
      accessorIsNotFilterType: true,
      newBackendMetric,
    });
  }

  get supervisionToPrisonPopulationBySupervisionLevel():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToPrisonPopulationBySupervisionLevel";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "supervisionLevel",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "supervisionLevel",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToPrisonPopulationBySupervisionLevel,
      rotateLabels: true,
      newBackendMetric,
    });
  }

  get supervisionToPrisonPopulationByGender():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToPrisonPopulationByGender";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "gender",
      enableMetricModeToggle: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "gender",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToPrisonPopulationByGender,
      newBackendMetric,
    });
  }

  get supervisionToPrisonPopulationByRace():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToPrisonPopulationByRace";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToPrisonTransitionsCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "race",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToPrisonPopulationByRace,
      rotateLabels: true,
      newBackendMetric,
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
  get supervisionToLibertyOverTime():
    | SupervisionPopulationOverTimeMetric
    | OverTimeMetric {
    const id = "supervisionToLibertyOverTime";
    const newBackendMetric = new OverTimeMetric({
      id,
      endpoint: "SupervisionToLibertyTransitionsOverTime",
      rootStore: this.rootStore,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationOverTimeMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_count_by_month",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters:
        this.rootStore.filtersStore.enabledFilters.supervisionToLibertyOverTime,
      newBackendMetric,
    });
  }

  get supervisionToLibertyPopulationByLengthOfStay():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToLibertyPopulationByLengthOfStay";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "lengthOfStay",
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "lengthOfStay",
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToLibertyPopulationByLengthOfStay,
      newBackendMetric,
    });
  }

  get supervisionToLibertyPopulationByRace():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToLibertyPopulationByRace";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "race",
      enableMetricModeToggle: true,
      rotateLabels: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "race",
      hasTimePeriodDimension: true,
      enableMetricModeToggle: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToLibertyPopulationByRace,
      rotateLabels: true,
      newBackendMetric,
    });
  }

  get supervisionToLibertyPopulationByLocation():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToLibertyPopulationByLocation";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      rotateLabels: true,
      isGeographic: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "district",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToLibertyPopulationByLocation,
      rotateLabels: true,
      isGeographic: true,
      newBackendMetric,
    });
  }

  get supervisionToLibertyPopulationByGender():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToLibertyPopulationByGender";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "gender",
      enableMetricModeToggle: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "gender",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToLibertyPopulationByGender,
      newBackendMetric,
    });
  }

  get supervisionToLibertyPopulationByAgeGroup():
    | SupervisionPopulationSnapshotMetric
    | SnapshotMetric {
    const id = "supervisionToLibertyPopulationByAgeGroup";
    const newBackendMetric = new SnapshotMetric({
      id,
      endpoint: "SupervisionToLibertyTransitionsCount",
      rootStore: this.rootStore,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
    });
    if (PathwaysMetric.backendForMetric(id) === "NEW") {
      return newBackendMetric;
    }
    return new SupervisionPopulationSnapshotMetric({
      id,
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters:
        this.rootStore.filtersStore.enabledFilters
          .supervisionToLibertyPopulationByAgeGroup,
      newBackendMetric,
    });
  }
}
