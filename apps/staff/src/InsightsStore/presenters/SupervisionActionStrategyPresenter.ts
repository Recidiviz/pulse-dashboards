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

import { flowResult, makeAutoObservable } from "mobx";

import { ActionStrategyCopy, ActionStrategyType } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";

export class SupervisionActionStrategyPresenter implements Hydratable {
  constructor(
    private supervisionStore: InsightsSupervisionStore,
    public pseudoId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [this.expectActionStrategiesPopulated],
      populate: async () => {
        await Promise.all([
          flowResult(this.supervisionStore.populateActionStrategies()),
        ]);
      },
    });
  }

  private hydrator: HydratesFromSource;

  private expectActionStrategiesPopulated() {
    if (!this.supervisionStore.actionStrategies)
      throw new Error("Failed to populate action strategies");
  }

  /**
   * Initiates hydration for all data needed within this presenter class
   */
  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  // ==============================
  // Action Strategies
  // ==============================

  /**
   * Passthrough to supervisionStore.
   * Provides the Action Strategy copy with prompt and body text
   * @returns an ActionStrategyCopy object
   */
  get surfacedActionStrategy(): ActionStrategyCopy[string] | undefined {
    return this.supervisionStore.getActionStrategyCopy(this.pseudoId);
  }

  /**
   * Passthrough to supervisionStore.
   * Provides prompt and body text for all Action Strategies
   * @returns an ActionStrategyCopy object
   */
  get allActionStrategies(): ActionStrategyCopy {
    return this.supervisionStore.allActionStrategies;
  }

  get isInsightsLanternState(): boolean {
    return this.supervisionStore.isInsightsLanternState;
  }

  /**
   * Gets Action Strategy name from value
   * @returns a string corresponding to one of ActionStrategyType
   */
  getActionStrategyNameByValue(
    value: ActionStrategyCopy[string] | undefined,
  ): ActionStrategyType | undefined {
    if (!value) return undefined;

    const { allActionStrategies } = this.supervisionStore;

    const entry = Object.entries(allActionStrategies).find(([_, val]) => {
      return JSON.stringify(val) === JSON.stringify(value);
    });

    return entry ? (entry[0] as ActionStrategyType) : undefined;
  }

  /**
   * Passthrough to supervisionStore.
   * Sends analytics event when the popup is viewed
   */
  trackActionStrategyPopupViewed(): void {
    this.supervisionStore.trackActionStrategyPopupViewed({
      pseudoId: this.pseudoId,
    });
  }

  /**
   * Passthrough to supervisionStore.
   * Sends analytics event when the popup is viewed
   */
  trackActionStrategyPopupViewedFromList(
    actionStrategy: ActionStrategyType | undefined,
  ): void {
    if (!actionStrategy) return;

    this.supervisionStore.trackActionStrategyPopupViewedFromList({
      actionStrategy,
    });
  }

  /**
   * Passthrough to supervisionStore.
   * Sends analytics event when the popup is viewed
   */
  trackActionStrategyListViewed(): void {
    this.supervisionStore.trackActionStrategyListViewed();
  }
}
