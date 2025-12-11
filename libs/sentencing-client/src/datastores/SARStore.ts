// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { makeAutoObservable } from "mobx";
import toast from "react-hot-toast";

import { palette } from "~design-system";
import { FlowMethod } from "~hydration-utils";

import { APIClient, SAR } from "../api/APIClient";
import { titleCase } from "../utils/utils";
import { ERROR_TOAST_DURATION } from "./constants";
import { SentencingStore } from "./SentencingStore";
import { SARAttributes } from "./types";

export class SARStore {
  SARDetailsById: { [id: string]: SAR };

  activeSARId?: string;

  constructor(public readonly sentencingStore: SentencingStore) {
    makeAutoObservable(this);
    this.SARDetailsById = {};
    this.activeSARId = undefined;
  }

  get stateCode() {
    return this.sentencingStore.stateCode;
  }

  get SARAttributes(): SARAttributes {
    if (!this.activeSARId) return {};
    const currentSAR = this.SARDetailsById[this.activeSARId];
    if (currentSAR.client?.fullName) {
      currentSAR.client.fullName = titleCase(currentSAR.client?.fullName);
    }

    const SARAttributes: SARAttributes = {
      client: currentSAR.client,
      externalId: currentSAR.client?.externalId,
      age: currentSAR.age,
      clientGender: currentSAR.client?.gender,
      charges: currentSAR.charges,
      dueDate: currentSAR.dueDate,
    };

    return SARAttributes;
  }

  setActiveSARId(sarId: string) {
    this.activeSARId = sarId;
  }

  /** This is a MobX flow method and should be called with mobx.flowResult */
  *loadSARDetails(
    id: string,
  ): FlowMethod<APIClient["getSARDetails"], void> {
    try {
      const SARDetails = yield this.sentencingStore.apiClient.getSARDetails(id);
      this.SARDetailsById = {
        ...this.SARDetailsById,
        [id]: SARDetails,
      };
    } catch (error) {
      captureException(new Error("Error while loading SAR details"), {
        extra: {
          message: `loadSARDetails error: ${error}`,
          id,
          staffId: this.sentencingStore.staffPseudoId,
        },
      });
      toast(
        "Something went wrong loading the SAR details. Please try again or contact us for support.",
        {
          duration: ERROR_TOAST_DURATION,
          style: { backgroundColor: palette.signal.error },
        },
      );
    }
  }
}
