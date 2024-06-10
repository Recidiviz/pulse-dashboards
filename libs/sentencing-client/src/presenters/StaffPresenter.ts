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

import _ from "lodash";
import { flowResult, makeAutoObservable } from "mobx";
import moment from "moment";

import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { Case, Client } from "../api";
import { HeaderCell } from "../components/Dashboard/CaseListTable";
import { CaseStatus } from "../components/Dashboard/constants";
import { StaffStore } from "../datastores/StaffStore";

export class StaffPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  constructor(public readonly staffStore: StaffStore) {
    makeAutoObservable(this);
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.staffStore.staffInfo === undefined)
            throw new Error("Failed to load staff info");
        },
      ],
      populate: async () => {
        await flowResult(this.staffStore.loadStaffInfo());
      },
    });
  }

  get staffPseudoId() {
    return this.staffStore.psiStore.staffPseudoId;
  }

  get staffInfo() {
    return this.staffStore.staffInfo;
  }

  get listOfCaseBriefs(): (Case & { Client: Client })[] | undefined {
    return !this.staffInfo
      ? undefined
      : [...this.staffInfo.Cases].sort((a, b) => {
          if (a.Client && b.Client) {
            return a.Client.fullName.localeCompare(b.Client.fullName);
          }
          return 0;
        });
  }

  get caseBriefsTableRows() {
    const normalizeRowValue = (caseBrief: Case, key: string, value: string) => {
      if (key === "status") {
        return CaseStatus[value as keyof typeof CaseStatus];
      }
      if (key === "dueDate") {
        return moment(caseBrief.dueDate).format("MM/DD/YYYY");
      }
      return value;
    };

    const headerRow: HeaderCell[] = [
      {
        key: "Client.fullName",
        name: "Name",
      },
      {
        key: "reportType",
        name: "Report Type",
      },
      {
        key: "primaryCharge",
        name: "Offense",
      },
      {
        key: "status",
        name: "Status",
      },
      {
        key: "dueDate",
        name: "Due Date",
      },
      {
        key: "emptyCell",
        name: "",
      },
    ];

    const rows =
      this.listOfCaseBriefs?.map((caseBrief) => {
        const caseId = caseBrief.id;
        const row = headerRow
          .filter((cell) => cell.key !== "emptyCell")
          .map(({ key }) => {
            const value = _.get(caseBrief, key.split("."));
            return {
              key,
              caseId,
              value: normalizeRowValue(caseBrief, key, value),
            };
          });
        return { caseId, row };
      }) ?? [];

    return { headerRow, rows };
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }
}
