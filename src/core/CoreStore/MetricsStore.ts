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
import PopulationProjectionOverTimeMetric from "../models/PopulationProjectionOverTimeMetric";
import PrisonPopulationOverTimeMetric from "../models/PrisonPopulationOverTimeMetric";
import PrisonPopulationPersonLevelMetric from "../models/PrisonPopulationPersonLevelMetric";
import PrisonPopulationSnapshotMetric from "../models/PrisonPopulationSnapshotMetric";
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
        [PATHWAYS_SECTIONS.countByPriorLengthOfIncarceration]: this
          .libertyToPrisonPopulationByPriorLengthOfIncarceration,
        [PATHWAYS_SECTIONS.countByGender]: this
          .libertyToPrisonPopulationByGender,
        [PATHWAYS_SECTIONS.countByAgeGroup]: this
          .libertyToPrisonPopulationByAgeGroup,
        [PATHWAYS_SECTIONS.countByRace]: this.libertyToPrisonPopulationByRace,
      },
      [PATHWAYS_PAGES.prison]: {
        [PATHWAYS_SECTIONS.projectedCountOverTime]: this
          .projectedPrisonPopulationOverTime,
        [PATHWAYS_SECTIONS.countOverTime]: this.prisonPopulationOverTime,
        [PATHWAYS_SECTIONS.countByLocation]: this.prisonFacilityPopulation,
        [PATHWAYS_SECTIONS.countByRace]: this.prisonPopulationByRace,
        [PATHWAYS_SECTIONS.personLevelDetail]: this.prisonPopulationPersonLevel,
      },
      [PATHWAYS_PAGES.prisonToSupervision]: {
        [PATHWAYS_SECTIONS.countOverTime]: this
          .prisonToSupervisionPopulationOverTime,
        [PATHWAYS_SECTIONS.countByAgeGroup]: this
          .prisonToSupervisionPopulationByAge,
        [PATHWAYS_SECTIONS.countByLocation]: this
          .prisonToSupervisionPopulationByFacility,
        [PATHWAYS_SECTIONS.countByRace]: this
          .prisonToSupervisionPopulationByRace,
        [PATHWAYS_SECTIONS.personLevelDetail]: this
          .prisonToSupervisionPopulationPersonLevel,
      },
      [PATHWAYS_PAGES.supervision]: {
        [PATHWAYS_SECTIONS.projectedCountOverTime]: this
          .projectedSupervisionPopulationOverTime,
        [PATHWAYS_SECTIONS.countOverTime]: this.supervisionPopulationOverTime,
        [PATHWAYS_SECTIONS.countByLocation]: this
          .supervisionPopulationByDistrict,
        [PATHWAYS_SECTIONS.countByRace]: this.supervisionPopulationByRace,
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
        [PATHWAYS_SECTIONS.countByRace]: this
          .supervisionToPrisonPopulationByRace,
        [PATHWAYS_SECTIONS.countByGender]: this
          .supervisionToPrisonPopulationByGender,
        [PATHWAYS_SECTIONS.countByOfficer]: this
          .supervisionToPrisonPopulationByOfficer,
      },
      [PATHWAYS_PAGES.supervisionToLiberty]: {
        [PATHWAYS_SECTIONS.countOverTime]: this.supervisionToLibertyOverTime,
        [PATHWAYS_SECTIONS.countByLengthOfStay]: this
          .supervisionToLibertyPopulationByLengthOfStay,
        [PATHWAYS_SECTIONS.countByLocation]: this
          .supervisionToLibertyPopulationByLocation,
        [PATHWAYS_SECTIONS.countByGender]: this
          .supervisionToLibertyPopulationByGender,
        [PATHWAYS_SECTIONS.countByAgeGroup]: this
          .supervisionToLibertyPopulationByAgeGroup,
        [PATHWAYS_SECTIONS.countByRace]: this
          .supervisionToLibertyPopulationByRace,
      },
    };
    // @ts-ignore
    return map[page][section];
  }

  // LIBERTY TO PRISON
  get libertyToPrisonPopulationOverTime(): LibertyPopulationOverTimeMetric {
    return new LibertyPopulationOverTimeMetric({
      id: "libertyToPrisonPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_count_by_month",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .libertyToPrisonPopulationOverTime,
    });
  }

  get libertyToPrisonPopulationByDistrict(): LibertyPopulationSnapshotMetric {
    return new LibertyPopulationSnapshotMetric({
      id: "libertyToPrisonPopulationByDistrict",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "judicialDistrict",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .libertyToPrisonPopulationByDistrict,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get libertyToPrisonPopulationByRace(): LibertyPopulationSnapshotMetric {
    return new LibertyPopulationSnapshotMetric({
      id: "libertyToPrisonPopulationByRace",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "race",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .libertyToPrisonPopulationByRace,
      rotateLabels: true,
    });
  }

  get libertyToPrisonPopulationByAgeGroup(): LibertyPopulationSnapshotMetric {
    return new LibertyPopulationSnapshotMetric({
      id: "libertyToPrisonPopulationByAgeGroup",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .libertyToPrisonPopulationByAgeGroup,
    });
  }

  get libertyToPrisonPopulationByGender(): LibertyPopulationSnapshotMetric {
    return new LibertyPopulationSnapshotMetric({
      id: "libertyToPrisonPopulationByGender",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "gender",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .libertyToPrisonPopulationByGender,
    });
  }

  get libertyToPrisonPopulationByPriorLengthOfIncarceration(): LibertyPopulationSnapshotMetric {
    return new LibertyPopulationSnapshotMetric({
      id: "libertyToPrisonPopulationByPriorLengthOfIncarceration",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "liberty_to_prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      dataTransformer: createLibertyPopulationSnapshot,
      accessor: "priorLengthOfIncarceration",
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .libertyToPrisonPopulationByPriorLengthOfIncarceration,
      accessorIsNotFilterType: true,
    });
  }

  // PRISON
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
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get prisonPopulationByRace(): PrisonPopulationSnapshotMetric {
    return new PrisonPopulationSnapshotMetric({
      id: "prisonPopulationByRace",
      tenantId: this.rootStore.currentTenantId,
      accessor: "race",
      sourceFilename: "prison_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonPopulationByRace,
      rotateLabels: true,
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

  // PRISON TO SUPERVISION
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
      hasTimePeriodDimension: true,
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
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonToSupervisionPopulationByFacility,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get prisonToSupervisionPopulationByRace(): PrisonPopulationSnapshotMetric {
    return new PrisonPopulationSnapshotMetric({
      id: "prisonToSupervisionPopulationByRace",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_population_snapshot_by_dimension",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createPrisonPopulationSnapshot,
      accessor: "race",
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonToSupervisionPopulationByRace,
      rotateLabels: true,
    });
  }

  get prisonToSupervisionPopulationPersonLevel(): PrisonPopulationPersonLevelMetric {
    return new PrisonPopulationPersonLevelMetric({
      id: "prisonToSupervisionPopulationPersonLevel",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "prison_to_supervision_population_snapshot_person_level",
      rootStore: this.rootStore,
      hasTimePeriodDimension: true,
      dataTransformer: createPrisonPopulationPersonLevelList,
      filters: this.rootStore.filtersStore.enabledFilters
        .prisonToSupervisionPopulationPersonLevel,
    });
  }

  // SUPERVISION
  get supervisionPopulationOverTime(): SupervisionPopulationOverTimeMetric {
    return new SupervisionPopulationOverTimeMetric({
      id: "supervisionPopulationOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_time_series",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionPopulationOverTime,
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

  get supervisionPopulationByDistrict(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionPopulationByDistrict",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "district",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionPopulationByDistrict,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get supervisionPopulationByRace(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionPopulationByRace",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      enableMetricModeToggle: true,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "race",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionPopulationByRace,
      rotateLabels: true,
    });
  }

  get supervisionPopulationBySupervisionLevel(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionPopulationBySupervisionLevel",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "supervisionLevel",
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionPopulationBySupervisionLevel,
      rotateLabels: true,
    });
  }

  // SUPERVISION TO PRISON
  get supervisionToPrisonOverTime(): SupervisionPopulationOverTimeMetric {
    return new SupervisionPopulationOverTimeMetric({
      id: "supervisionToPrisonOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_count_by_month",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonOverTime,
    });
  }

  get supervisionToPrisonPopulationByDistrict(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByDistrict",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      accessor: "district",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      dataTransformer: createSupervisionPopulationSnapshot,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByDistrict,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get supervisionToPrisonPopulationByMostSevereViolation(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByMostSevereViolation",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "mostSevereViolation",
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByMostSevereViolation,
    });
  }

  get supervisionToPrisonPopulationByNumberOfViolations(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByNumberOfViolations",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "numberOfViolations",
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByNumberOfViolations,
    });
  }

  get supervisionToPrisonPopulationByLengthOfStay(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByLengthOfStay",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "lengthOfStay",
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByLengthOfStay,
      accessorIsNotFilterType: true,
    });
  }

  get supervisionToPrisonPopulationBySupervisionLevel(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationBySupervisionLevel",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "supervisionLevel",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationBySupervisionLevel,
      rotateLabels: true,
    });
  }

  get supervisionToPrisonPopulationByGender(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByGender",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "gender",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByGender,
    });
  }

  get supervisionToPrisonPopulationByRace(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByRace",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "race",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByRace,
      rotateLabels: true,
    });
  }

  get supervisionToPrisonPopulationByOfficer(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToPrisonPopulationByOfficer",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_prison_population_snapshot_by_officer",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "officerName",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      isHorizontal: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToPrisonPopulationByOfficer,
      accessorIsNotFilterType: true,
    });
  }

  // SUPERVISION TO LIBERTY
  get supervisionToLibertyOverTime(): SupervisionPopulationOverTimeMetric {
    return new SupervisionPopulationOverTimeMetric({
      id: "supervisionToLibertyOverTime",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_count_by_month",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationTimeSeries,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToLibertyOverTime,
    });
  }

  get supervisionToLibertyPopulationByLengthOfStay(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToLibertyPopulationByLengthOfStay",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "lengthOfStay",
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToLibertyPopulationByLengthOfStay,
    });
  }

  get supervisionToLibertyPopulationByRace(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToLibertyPopulationByRace",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "race",
      hasTimePeriodDimension: true,
      enableMetricModeToggle: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToLibertyPopulationByRace,
      rotateLabels: true,
    });
  }

  get supervisionToLibertyPopulationByLocation(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToLibertyPopulationByLocation",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "district",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToLibertyPopulationByLocation,
      rotateLabels: true,
      isGeographic: true,
    });
  }

  get supervisionToLibertyPopulationByGender(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToLibertyPopulationByGender",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "gender",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToLibertyPopulationByGender,
    });
  }

  get supervisionToLibertyPopulationByAgeGroup(): SupervisionPopulationSnapshotMetric {
    return new SupervisionPopulationSnapshotMetric({
      id: "supervisionToLibertyPopulationByAgeGroup",
      tenantId: this.rootStore.currentTenantId,
      sourceFilename: "supervision_to_liberty_population_snapshot_by_dimension",
      compartment: "SUPERVISION",
      rootStore: this.rootStore,
      dataTransformer: createSupervisionPopulationSnapshot,
      accessor: "ageGroup",
      enableMetricModeToggle: true,
      hasTimePeriodDimension: true,
      filters: this.rootStore.filtersStore.enabledFilters
        .supervisionToLibertyPopulationByAgeGroup,
    });
  }
}
