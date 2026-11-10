// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { $, chalk } from "zx";

/**
 * How many versions with no traffic to keep per service, so a bad deploy can be
 * rolled back by moving traffic to the previous version.
 */
export const VERSIONS_TO_KEEP = 2;

/** One row of `gcloud app versions list --format=json`, trimmed to the fields we read. */
export interface GaeVersion {
  id: string;
  traffic_split: number;
  version: { createTime: string };
}

/**
 * Returns the ids of the versions to delete: every version with no traffic except the
 * newest keep of them. Versions that serve any traffic are never returned.
 */
export function versionsToDelete(
  versions: GaeVersion[],
  keep: number = VERSIONS_TO_KEEP,
): string[] {
  return versions
    .filter((v) => !v.traffic_split)
    .sort((a, b) => b.version.createTime.localeCompare(a.version.createTime))
    .slice(keep)
    .map((v) => v.id);
}

/**
 * Deletes old App Engine versions of a service that no longer get traffic, keeping
 * the newest few for rollback.
 *
 * gcloud's --stop-previous-version does not stop versions that use automatic scaling,
 * so an old version with min_instances keeps an idle instance running until it is
 * deleted. A failure here only logs a warning, because the new version is already live
 * and the retry loop around deploy would otherwise redeploy it.
 */
export async function deleteOldGaeVersions(
  project: string,
  service: string,
): Promise<void> {
  try {
    const listed =
      await $`gcloud app versions list --project=${project} --service=${service} --format=json`.quiet();
    const toDelete = versionsToDelete(JSON.parse(listed.stdout));
    if (toDelete.length === 0) {
      console.log(`No old ${service} versions to delete in ${project}.`);
      return;
    }
    console.log(
      `Deleting ${toDelete.length} old ${service} version(s) in ${project}: ${toDelete.join(", ")}`,
    );
    await $`gcloud app versions delete ${toDelete} --project=${project} --service=${service} --quiet`.pipe(
      process.stdout,
    );
  } catch (e) {
    console.warn(
      chalk.yellow(
        `Could not delete old ${service} versions in ${project}; delete them by hand. ${e}`,
      ),
    );
  }
}
