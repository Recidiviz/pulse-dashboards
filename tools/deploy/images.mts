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

/* eslint-disable no-await-in-loop */

import dedent from "dedent";
import inquirer from "inquirer";
import { $ } from "zx";

import { getImageRef } from "../get-image-ref.mts";
import { owner, repo } from "./config.mts";
import { services } from "./services/index.mts";
import type { ReleasePlan, SelectedServices } from "./types.mts";

/**
 * Verify the Docker images for the selected backend services exist in Artifact Registry
 * before deploying (the images are built in GitHub Actions). If any are missing, the user
 * can retry the check, build them locally, or exit. Loops until every image is found.
 */
export async function verifyDockerImages(
  plan: ReleasePlan,
  selected: SelectedServices,
): Promise<void> {
  const { env: deployEnv, currentRevision } = plan;

  // Verify Docker images are available before deploying
  // Images are built in GitHub Actions, so we need to ensure they exist
  const imageProjects = Object.entries(services)
    .filter(([key]) => selected.has(key))
    .flatMap(([, svc]) => svc.requiredImages?.(deployEnv) ?? []);

  if (imageProjects.length === 0) {
    return;
  }

  console.log("\nVerifying Docker images are available...");

  const requiredImages = await Promise.all(imageProjects.map(getImageRef));

  // Check for images with retry prompt
  let imagesToCheck = requiredImages;

  while (imagesToCheck.length > 0) {
    const missingImages: string[] = [];

    // Check each image we haven't yet found
    for (const image of imagesToCheck) {
      try {
        const result =
          await $`gcloud artifacts docker images list ${image} --quiet --include-tags --filter=tags:${currentRevision} --format=json`;
        const images = JSON.parse(result.stdout);
        if (images.length > 0) {
          console.log(`Found ${image}:${currentRevision}`);
        } else {
          throw new Error("Image not found");
        }
      } catch (e) {
        console.error(`Image not found: ${image}:${currentRevision}`, e);
        missingImages.push(image);
      }
    }

    imagesToCheck = missingImages;

    // If any images are missing, ask user what to do
    if (missingImages.length > 0) {
      console.error(
        dedent`
          \n⚠️  Some Docker images are not available:
          ${missingImages.map((img) => `   - ${img}:${currentRevision}`).join("\n")}

          The images may still be building or the build may have failed.
          Check the GitHub Actions workflow: https://github.com/${owner}/${repo}/actions/workflows/build-images.yml
        `,
      );

      const { action } = (await inquirer.prompt({
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Retry checking for the missing images", value: "retry" },
          { name: "Build all images manually", value: "build" },
          { name: "Exit deployment", value: "exit" },
        ],
        default: "retry",
      })) as { action: "retry" | "build" | "exit" };

      if (action === "exit") {
        console.log("Deployment cancelled.");
        process.exit(1);
      }

      if (action === "build") {
        console.log("Building Docker images manually...");
        for (const project of imageProjects) {
          console.log(`Building ${project}...`);
          await $`COMMIT_SHA=${currentRevision} nx container ${project} -c ${deployEnv}`.pipe(
            process.stdout,
          );
        }
      } else {
        console.log("Retrying image checks...");
      }
    }
  }

  console.log("✅ All required Docker images verified");
}
