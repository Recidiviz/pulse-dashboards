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

import { flowResult, makeAutoObservable } from "mobx";

import {
  Hydratable,
  HydratesFromSource,
  HydrationState,
} from "~hydration-utils";

import { SAR } from "../api";
import { GenderToDisplayName } from "../components/CaseDetails/constants";
import { SentencingStore } from "../datastores/SentencingStore";

export class SARDetailsPresenter implements Hydratable {
  private hydrator: HydratesFromSource;

  sarData?: SAR;

  constructor(
    public readonly sentencingStore: SentencingStore,
    public sarId: string,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        () => {
          if (this.sentencingStore.staffStore.staffInfo === undefined)
            throw new Error("Failed to load staff details");
        },
        () => {
          if (this.sarData === undefined)
            throw new Error("Failed to load SAR details");
        },
      ],
      populate: async () => {
        if (!this.sentencingStore.staffStore.staffInfo) {
          await flowResult(this.sentencingStore.staffStore.loadStaffInfo());
        }
        const data = await flowResult(
          this.sentencingStore.apiClient.getSARDetails(this.sarId),
        );
        this.sarData = data;
      },
    });
  }

  get hydrationState(): HydrationState {
    return this.hydrator.hydrationState;
  }

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get staffPseudoId(): string | undefined {
    return this.sentencingStore.staffPseudoId;
  }

  get SARAttributes() {
    if (!this.sarData) return {};

    return {
      client: this.sarData.client,
      externalId: this.sarData.client?.externalId,
      age: this.sarData.age,
      charges: this.sarData.charges,
      dueDate: this.sarData.dueDate,
    };
  }

  /** Formatted gender for display */
  get formattedGender(): string | undefined {
    const gender = this.sarData?.client?.gender;
    return gender ? GenderToDisplayName[gender] : undefined;
  }

  /** Extract offense names from charges */
  get offenseNames(): string[] {
    if (!this.sarData?.charges || !Array.isArray(this.sarData.charges)) {
      return [];
    }
    return this.sarData.charges.map((charge) => charge.offense).filter(Boolean);
  }
}
