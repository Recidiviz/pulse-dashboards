/* eslint-disable class-methods-use-this */
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

import { differenceInDays, subDays } from "date-fns";

import type { InsightsStore } from "../InsightsStore";
import { ClientEvent } from "../models/ClientEvent";
import { ClientInfo } from "../models/ClientInfo";
import { MetricBenchmark } from "../models/MetricBenchmark";
import { LATEST_END_DATE } from "../models/offlineFixtures/constants";
import { leadershipUserInfoFixture } from "../models/offlineFixtures/UserInfoFixture";
import { SupervisionOfficer } from "../models/SupervisionOfficer";
import { SupervisionOfficerMetricEvent } from "../models/SupervisionOfficerMetricEvent";
import { SupervisionOfficerSupervisor } from "../models/SupervisionOfficerSupervisor";
import { UserInfo } from "../models/UserInfo";
import { InsightsAPI, PatchUserInfoProps } from "./interface";

export class InsightsOfflineAPIClient implements InsightsAPI {
  private pseudoIdToEditableUserInfo: Map<
    string,
    { metadata: PatchUserInfoProps }
  > = new Map();

  // eslint-disable-next-line no-useless-constructor
  constructor(public readonly insightsStore: InsightsStore) {}

  async init() {
    const config = (
      await import("../models/offlineFixtures/InsightsConfigFixture")
    ).InsightsConfigFixture;

    return config;
  }

  async userInfo(userPseudoId: string): Promise<UserInfo> {
    const { supervisionOfficerSupervisorsFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerSupervisor"
    );
    const matchingSupervisor = supervisionOfficerSupervisorsFixture.find(
      (supervisor) => supervisor.pseudonymizedId === userPseudoId,
    );

    if (matchingSupervisor) {
      return {
        role: "supervision_officer_supervisor",
        entity: matchingSupervisor,
        ...(this.pseudoIdToEditableUserInfo.get(userPseudoId) ?? {
          metadata: {
            hasSeenOnboarding: false,
          },
        }),
      };
    }

    return {
      ...leadershipUserInfoFixture,
      ...(this.pseudoIdToEditableUserInfo.get(userPseudoId) ?? {
        metadata: {
          hasSeenOnboarding: false,
        },
      }),
    };
  }

  async patchUserInfo(
    userPseudoId: string,
    props: PatchUserInfoProps,
  ): Promise<UserInfo> {
    this.pseudoIdToEditableUserInfo.set(userPseudoId, { metadata: props });
    return this.userInfo(userPseudoId);
  }

  async metricBenchmarks(): Promise<MetricBenchmark[]> {
    const { metricBenchmarksFixture } = await import(
      "../models/offlineFixtures/MetricBenchmarkFixture"
    );
    return metricBenchmarksFixture;
  }

  async supervisionOfficerSupervisors(): Promise<
    SupervisionOfficerSupervisor[]
  > {
    const { supervisionOfficerSupervisorsFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerSupervisor"
    );
    return supervisionOfficerSupervisorsFixture;
  }

  async officersForSupervisor(
    supervisorPseudoId: string,
  ): Promise<Array<SupervisionOfficer>> {
    const { supervisionOfficerFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerFixture"
    );

    return supervisionOfficerFixture.filter(
      (o) => `hashed-${o.supervisorExternalId}` === supervisorPseudoId,
    );
  }

  async supervisionOfficer(
    officerPseudoId: string,
  ): Promise<SupervisionOfficer> {
    const { supervisionOfficerFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerFixture"
    );

    const officerFixture = supervisionOfficerFixture.find(
      (o) => o.pseudonymizedId === officerPseudoId,
    );

    if (!officerFixture)
      throw new Error(`Officer ${officerPseudoId} not present in fixture data`);

    return officerFixture;
  }

  async supervisionOfficerMetricEvents(
    officerPseudoId: string,
    metricId: string,
  ): Promise<SupervisionOfficerMetricEvent[]> {
    const { supervisionOfficerMetricEventFixture } = await import(
      "../models/offlineFixtures/SupervisionOfficerMetricEventFixture"
    );
    return supervisionOfficerMetricEventFixture.filter(
      (e) => e.metricId === metricId,
    );
  }

  async clientInfo(clientPseudoId: string): Promise<ClientInfo> {
    const { clientInfoFixture } = await import(
      "../models/offlineFixtures/ClientInfoFixture"
    );

    const clientInfo = clientInfoFixture[clientPseudoId];

    if (!clientInfo) {
      throw new Error(`Client ${clientPseudoId} not present in fixture data`);
    }

    return clientInfo;
  }

  async clientEvents(
    clientPseudoId: string,
    endDate: Date,
  ): Promise<Array<ClientEvent>> {
    const { clientEventFixture } = await import(
      "../models/offlineFixtures/ClientEventFixture"
    );

    // adjust fixture dates relative to the input
    const dateOffsetInDays = differenceInDays(LATEST_END_DATE, endDate);

    return clientEventFixture.map((event) => ({
      ...event,
      eventDate: subDays(event.eventDate, dateOffsetInDays),
    }));
  }
}
