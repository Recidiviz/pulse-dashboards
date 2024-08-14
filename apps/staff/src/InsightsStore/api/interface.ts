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
// =============================================================================

import { ActionStrategy } from "../models/ActionStrategy";
import { ClientEvent } from "../models/ClientEvent";
import { ClientInfo } from "../models/ClientInfo";
import { InsightsConfig } from "../models/InsightsConfig";
import { MetricBenchmark } from "../models/MetricBenchmark";
import {
  ExcludedSupervisionOfficer,
  SupervisionOfficer,
} from "../models/SupervisionOfficer";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { UserInfo } from "../models/UserInfo";

export type PatchUserInfoProps = { hasSeenOnboarding: boolean };
export interface InsightsAPI {
  init(): Promise<InsightsConfig>;
  actionStrategies(supervisorPseudoId: string): Promise<ActionStrategy>;
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
  excludedOfficersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<ExcludedSupervisionOfficer>>;
  supervisionOfficer(officerPseudoId: string): Promise<SupervisionOfficer>;
  supervisionOfficerMetricEvents(
    officerPseudoId: string,
    metricId: string,
  ): Promise<Array<SupervisionOfficerMetricEvent>>;
  clientInfo(clientPseudoId: string): Promise<ClientInfo>;
  clientEvents(
    clientPseudoId: string,
    endDate: Date,
  ): Promise<Array<ClientEvent>>;
}
