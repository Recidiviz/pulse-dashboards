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

import {
  FixtureFactoryConfig,
  FixtureFactoryConfigOutput,
} from "../FixtureFactoryConfig/FixtureFactoryConfig";

/**
 * A map of factories that can be used to generate and keep track of fixtures.
 */
export class FixtureFactoryMap<
  K extends FixtureFactoryConfig = FixtureFactoryConfig,
  V extends FixtureFactoryConfigOutput<K>[] = FixtureFactoryConfigOutput<K>[],
> extends Map<K, V> {
  /**
   * Initializes a list of fixtures for the given configuration.
   *
   */
  private initFixturesForConfig(
    config: K,
    // NOTE: Used to check the output of the fixtures at different points.
    count?: number,
    ...factoryArgs: unknown[]
  ) {
    const c = count ?? config.defaultCount;
    const factory =
      config.factory instanceof Function
        ? config.factory(...(factoryArgs ?? []))
        : config.factory;
    const fixtures = factory.buildList(c);

    this.set(
      config,
      ("schema" in config
        ? fixtures.map((f) => config.schema.parse(f))
        : fixtures) as unknown as V,
    );
  }

  // TODO (6312): Add this override so you don't have to assign the time
  // override get<Config extends FixtureFactoryConfig>(
  //   key: Config,
  //   count?: number,
  //   ...factoryArgs: unknown[]
  // ): FixtureFactoryConfigOutput<Config>[];
  /**
   * Returns a list of already generated fixtures for the given configuration.
   * If the fixtures have not been generated yet, they will be generated with
   * default setting and parameters unless they are provided.
   */
  override get<FixtureType>(
    key: K,
    count?: number,
    ...factoryArgs: unknown[]
  ): FixtureType;
  override get(key: K, count?: number, ...factoryArgs: unknown[]): V {
    const fixtures = super.get(key);
    if (fixtures !== undefined && count === undefined) return fixtures;
    this.initFixturesForConfig(key, count, ...factoryArgs);
    return super.get(key) as V;
  }
}
