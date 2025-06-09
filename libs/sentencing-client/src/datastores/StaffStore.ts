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

import { captureException } from "@sentry/react";
import { keyBy } from "lodash";
import { makeAutoObservable } from "mobx";
import toast from "react-hot-toast";

import { palette } from "~design-system";
import { FlowMethod } from "~hydration-utils";
import { PSIStore } from "~sentencing-client";

import { APIClient, Staff, StaffCase, Supervisor } from "../api/APIClient";
import { ERROR_TOAST_DURATION } from "./constants";

type CaseBriefsById = {
  [key: string]: StaffCase;
};

export class StaffStore {
  staffInfo?: Staff;

  supervisorInfo?: Supervisor;

  caseBriefsById?: CaseBriefsById;

  constructor(public readonly psiStore: PSIStore) {
    makeAutoObservable(this);
  }

  get isSupervisor(): boolean {
    return this.psiStore.isSupervisor;
  }

  /** This is a MobX flow method and should be called with mobx.flowResult */
  *loadStaffInfo(): FlowMethod<APIClient["getStaffInfo"], void> {
    try {
      this.staffInfo = yield this.psiStore.apiClient.getStaffInfo();
      this.caseBriefsById = keyBy(this.staffInfo.cases, "id");
    } catch (error) {
      captureException(new Error("Error while loading staff info"), {
        extra: {
          message: `loadStaffInfo error: ${error}`,
          staffId: this.psiStore.staffPseudoId,
        },
      });
      toast(
        "Something went wrong loading your cases. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }

  /** This is a MobX flow method and should be called with mobx.flowResult */
  *loadSupervisorInfo(): FlowMethod<APIClient["getSupervisorInfo"], void> {
    try {
      this.supervisorInfo = yield this.psiStore.apiClient.getSupervisorInfo();
    } catch (error) {
      captureException(new Error("Error while loading supervisor info"), {
        extra: {
          message: `loadSupervisorInfo error: ${error}`,
          staffId: this.psiStore.staffPseudoId,
        },
      });
      toast(
        "Something went wrong loading your dashboard. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }
}
