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

import { US_ID } from "../../RootStore/TenantStore/pathwaysTenants";
import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";
import PrisonPopulationOverTimeMetric from "../models/PrisonPopulationOverTimeMetric";
import PrisonPopulationPersonLevelMetric from "../models/PrisonPopulationPersonLevelMetric";
import PrisonPopulationSnapshotMetric from "../models/PrisonPopulationSnapshotMetric";
import SupervisionPopulationOverTimeMetric from "../models/SupervisionPopulationOverTimeMetric";
import SupervisionPopulationSnapshotMetric from "../models/SupervisionPopulationSnapshotMetric";
import {
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

  constructor({ rootStore }: { rootStore: CoreStore }) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  get practices(): VitalsMetrics {
    return new VitalsMetrics({
      tenantId: this.rootStore.currentTenantId,
      sourceEndpoint: "vitals",
    });
  }

  get current(): any {
    const { page, section } = this.rootStore;

    if (!Object.keys(PATHWAYS_PAGES).includes(page)) return undefined;

    const map = {
      [PATHWAYS_PAGES.libertyToPrison]: {
        [PATHWAYS_SECTIONS.countOverTime]: this
          .libertyToPrisonPopulationOverTime,
        [PATHWAYS_SECTIONS.countByLocation]: this
          .libertyToPrisonPopulationByDistrict,
      },
      [PATHWAYS_PAGES.prison]: {
        [PATHWAYS_SECTIONS.countOverTime]:
          this.rootStore.currentTenantId === US_ID
            ? this.projectedPrisonPopulationOverTime
            : this.prisonPopulationOverTime,
        [PATHWAYS_SECTIONS.countByLocation]: this.prisonFacilityPopulation,
        [PATHWAYS_SECTIONS.personLevelDetail]: this.prisonPopulationPersonLevel,
      },
      [PATHWAYS_PAGES.prisonToSupervision]: {
        [PATHWAYS_SECTIONS.countOverTime]: this
          .prisonToSupervisionPopulationOverTime,
        [PATHWAYS_SECTIONS.countByAgeGroup]: this
          .prisonToSupervisionPopulationByAge,
        [PATHWAYS_SECTIONS.countByLocation]: this
          .prisonToSupervisionPopulationByFacility,
        [PATHWAYS_SECTIONS.personLevelDetail]: this
          .prisonToSupervisionPopulationPersonLevel,
      },
      [PATHWAYS_PAGES.supervision]: {
        [PATHWAYS_SECTIONS.countOverTime]:
          this.rootStore.currentTenantId === US_ID
            ? this.projectedSupervisionPopulationOverTime
            : this.supervisionPopulationOverTime,
        [PATHWAYS_SECTIONS.countByLocation]: this
          .supervisionPopulationByDistrict,
        [PATHWAYS_SECTIONS.countBySupervisionLevel]: this
          .supervisionPopulationBySupervisionLevel,
      },
      [PATHWAYS_PAGES.supervisionToPrison]: {
        [PATHWAYS_SECTIONS.countOverTime]: this.supervisionToPrisonOverTime,
        [PATHWAYS_SECTIONS.countByLocation]: this
          .supervisionToPrisonPopulationByDistrict,
        [PATHWAYS_SECTIONS.countByMostSevereViolation]: this
          .supervisionToPrisonPopulationByMostSevereViolation,
        [PATHWAYS_SECTIONS.countByNumberOfViolations]: this
          .supervisionToPrisonPopulationByNumberOfViolations,
        [PATHWAYS_SECTIONS.countByLengthOfStay]: this
          .supervisionToPrisonPopulationByLengthOfStay,
        [PATHWAYS_SECTIONS.countBySupervisionLevel]: this
          .supervisionToPrisonPopulationBySupervisionLevel,
      },
      [PATHWAYS_PAGES.supervisionToLiberty]: {
        [PATHWAYS_SECTIONS.countOverTime]: this.supervisionToLibertyOverTime,
      },
    };
    // @ts-ignore
    return map[page][section];
  }

  // Admissions from liberty to prison are counted by district and not by facility,
  // so this will be a SupervisionPopulationOverTimeMetric
  get libertyToPrisonPopulationOverTime(): SupervisionPopulationOverTimeMetric {
    return new SupervisionPopulationOverTimeMetric({
      id: "libertyToPrisonPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_count_by_month",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .libertyToPrisonPopulationOverTime,
    });
  }

  // Admissions from liberty to prison are counted by district and not by facility,
  // so this will be a SupervisionPopulationSnapshotMetric
  get libertyToPrisonPopulationByDistrict(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "libertyToPrisonPopulationByDistrict",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "district",
      filters: this.rootStore.filtersStore.enabledFilters
        .libertyToPrisonPopulationByDistrict,
    });
  }

  get prisonPopulationPersonLevel(): PrisonPopulationPersonLevelMetric {
    return new PrisonPopulationPersonLevelMetric({
      id: "prisonPopulationPersonLevel",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_population_snapshot_person_level",
      rootStore: this.rootStore,
      dataTransformer: createPrisonPopulationPersonLevelList,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonPopulationPersonLevel,
    });
  }

  get prisonPopulationOverTime(): PrisonPopulationOverTimeMetric {
    return new PrisonPopulationOverTimeMetric({
      id: "prisonPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_population_time_series",
      rootStore: this.rootStore,
      dataTransformer: createPrisonPopulationTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonPopulationOverTime,
    });
  }

  get supervisionPopulationOverTime(): SupervisionPopulationOverTimeMetric {
    return new SupervisionPopulationOverTimeMetric({
      id: "supervisionPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_time_series",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionPopulationOverTime,
    });
  }

  get supervisionPopulationByDistrict(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionPopulationByDistrict",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "district",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionPopulationByDistrict,
    });
  }

  get supervisionPopulationBySupervisionLevel(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionPopulationBySupervisionLevel",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "supervisionLevel",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionPopulationBySupervisionLevel,
    });
  }

  get prisonFacilityPopulation(): PrisonPopulationSnapshotMetric {
    return new PrisonPopulationSnapshotMetric({
      id: "prisonFacilityPopulation",
      tenantId: this.rootStore.currentTenantId,
      accessor: "facility",
      sourceFilename: "prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonFacilityPopulation,
    });
  }

  get supervisionToPrisonPopulationByDistrict(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByDistrict",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      dataTransformer: createSupervisionPopulationSnapshot,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByDistrict,
    });
  }

  get supervisionToPrisonPopulationByMostSevereViolation(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByMostSevereViolation",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "mostSevereViolation",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByMostSevereViolation,
    });
  }

  get supervisionToPrisonPopulationByNumberOfViolations(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByNumberOfViolations",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "numberOfViolations",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByNumberOfViolations,
    });
  }

  get supervisionToPrisonPopulationByLengthOfStay(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByLengthOfStay",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "lengthOfStay",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByLengthOfStay,
    });
  }

  get supervisionToPrisonPopulationBySupervisionLevel(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationBySupervisionLevel",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "supervisionLevel",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationBySupervisionLevel,
    });
  }

  get projectedPrisonPopulationOverTime(): PopulationProjectionOverTimeMetric {
    return new PopulationProjectionOverTimeMetric({
      id: "projectedPrisonPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      compartment: "INCARCERATION",
      sourceFilename: "prison_population_projection_time_series",
      rootStore: this.rootStore,
      dataTransformer: createProjectionTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .projectedPrisonPopulationOverTime,
    });
  }

  get projectedSupervisionPopulationOverTime(): PopulationProjectionOverTimeMetric {
    return new PopulationProjectionOverTimeMetric({
      id: "projectedSupervisionPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      compartment: "SUPERVISION",
      sourceFilename: "supervision_population_projection_time_series",
      rootStore: this.rootStore,
      dataTransformer: createProjectionTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .projectedSupervisionPopulationOverTime,
    });
  }

  get prisonToSupervisionPopulationOverTime(): PrisonPopulationOverTimeMetric {
    return new PrisonPopulationOverTimeMetric({
      id: "prisonToSupervisionPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_count_by_month",
      rootStore: this.rootStore,
      dataTransformer: createPrisonPopulationTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonToSupervisionPopulationOverTime,
    });
  }

  get prisonToSupervisionPopulationByAge(): PrisonPopulationSnapshotMetric {
    return new PrisonPopulationSnapshotMetric({
      id: "prisonToSupervisionPopulationByAge",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      accessor: "ageGroup",
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonToSupervisionPopulationByAge,
    });
  }

  get prisonToSupervisionPopulationByFacility(): PrisonPopulationSnapshotMetric {
    return new PrisonPopulationSnapshotMetric({
      id: "prisonToSupervisionPopulationByFacility",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      accessor: "facility",
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonToSupervisionPopulationByFacility,
    });
  }

  get prisonToSupervisionPopulationPersonLevel(): PrisonPopulationPersonLevelMetric {
    return new PrisonPopulationPersonLevelMetric({
      id: "prisonToSupervisionPopulationPersonLevel",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_population_snapshot_person_level",
      rootStore: this.rootStore,
      dataTransformer: createPrisonPopulationPersonLevelList,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonToSupervisionPopulationPersonLevel,
    });
  }

  get supervisionToPrisonOverTime(): SupervisionPopulationOverTimeMetric {
    return new SupervisionPopulationOverTimeMetric({
      id: "supervisionToPrisonOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_count_by_month",
      rootStore: this.rootStore,
      dataTransformer: (data) => createSupervisionPopulationTimeSeries(data),
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonOverTime,
    });
  }

  get supervisionToLibertyOverTime(): SupervisionPopulationOverTimeMetric {
    return new SupervisionPopulationOverTimeMetric({
      id: "supervisionToLibertyOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_count_by_month",
      rootStore: this.rootStore,
      dataTransformer: (data) => createSupervisionPopulationTimeSeries(data),
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToLibertyOverTime,
    });
  }
}
