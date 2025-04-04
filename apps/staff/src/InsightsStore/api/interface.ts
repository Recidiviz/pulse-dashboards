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

import { z } from "zod";

import {
  ACTION_STRATEGY_TYPE,
  ActionStrategy,
  ClientEvent,
  ClientInfo,
  InsightsConfig,
  MetricBenchmark,
  RosterChangeRequest,
  RosterChangeRequestResponse,
  SupervisionOfficer,
  SupervisionOfficerMetricEvent,
  SupervisionOfficerOutcomes,
  SupervisionOfficerSupervisor,
  SupervisionVitalsMetric,
  UserInfo,
} from "~datatypes";

export type PatchUserInfoProps = { hasSeenOnboarding: boolean };
export type ActionStrategySurfacedEvent = {
  userPseudonymizedId: string;
  officerPseudonymizedId?: string;
  actionStrategy: z.infer<typeof ACTION_STRATEGY_TYPE>;
  timestamp?: Date;
};
export interface InsightsAPI {
  init(): Promise<InsightsConfig>;
  actionStrategies(supervisorPseudoId: string): Promise<ActionStrategy>;
  patchActionStrategies(
    props: ActionStrategySurfacedEvent,
  ): Promise<ActionStrategySurfacedEvent>;
  userInfo(userPseudoId: string): Promise<UserInfo>;
  patchUserInfo(
    userPseudoId: string,
    props: PatchUserInfoProps,
  ): Promise<UserInfo>;
  metricBenchmarks(): Promise<Array<MetricBenchmark>>;
  supervisionOfficerSupervisors(): Promise<Array<SupervisionOfficerSupervisor>>;
  officersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficer>>;
  outcomesForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficerOutcomes>>;
  allSupervisionOfficers(): Promise<Array<SupervisionOfficer>>;
  submitRosterChangeRequestIntercomTicket(
    supervisorPseudoId: string,
    props: RosterChangeRequest,
  ): Promise<RosterChangeRequestResponse>;
  supervisionOfficer(officerPseudoId: string): Promise<SupervisionOfficer>;
  outcomesForOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficerOutcomes>;
  supervisionOfficerMetricEvents(
    officerPseudoId: string,
    metricId: string,
  ): Promise<Array<SupervisionOfficerMetricEvent>>;
  clientInfo(clientPseudoId: string): Promise<ClientInfo>;
  clientEvents(
    clientPseudoId: string,
    endDate: Date,
  ): Promise<Array<ClientEvent>>;
  vitalsForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionVitalsMetric>>;
  vitalsForOfficer(
    officerPseudoId: string,
  ): Promise<Array<SupervisionVitalsMetric>>;
  downloadStateConfiguration(stateCode: string): Promise<InsightsConfig>;
}
