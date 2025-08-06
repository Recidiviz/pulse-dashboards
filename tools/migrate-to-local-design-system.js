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

/*
 * Run via
 * npx jscodeshift -t tools/migrate-to-local-design-system.js --parser=tsx
 *   \ --componentName TargetComponent TARGET_FILES
 *
 * After running the codemod, some of the imports may not be in the order the
 * linter expects. You can run `nx lint PROJECT_NAME --fix` to automatically
 * reorder the imports.
 *
 * Written with the assistance of o3 and Claude Sonnet 4
 */

// Note: To run this on all files in a project,
// replace TARGET_FILES with **/*.ts{,x}

export default function transformer(file, api, options) {
  // This codemod migrates imports from @recidiviz/design-system to ~design-system

  const { componentName } = options;
  if (!componentName) {
    throw new Error(
      "You must provide a component name to migrate. Use the --componentName option.",
    );
  }

  const j = api.jscodeshift;
  const root = j(file.source);

  // Check if ~design-system import already exists
  const existingDesignSystemImport = root.find(j.ImportDeclaration, {
    source: { value: "~design-system" },
  });

  root
    .find(j.ImportDeclaration, {
      source: { value: "@recidiviz/design-system" },
    })
    .forEach((path) => {
      const { specifiers } = path.node;
      const hasImport = specifiers.some(
        (s) =>
          s.type === "ImportSpecifier" && s.imported.name === componentName,
      );
      if (!hasImport) return;

      // remove import from the original import
      const remaining = specifiers.filter(
        (s) => !(s.imported && s.imported.name === componentName),
      );

      // Add to existing ~design-system import if it exists
      if (existingDesignSystemImport.length > 0) {
        const existingImport = existingDesignSystemImport.at(0);
        const existingSpecifiers = existingImport.get().node.specifiers;
        const alreadyImported = existingSpecifiers.some(
          (s) =>
            s.type === "ImportSpecifier" && s.imported.name === componentName,
        );
        // ensure we don't add the same import twice
        if (!alreadyImported) {
          existingSpecifiers.push(
            j.importSpecifier(j.identifier(componentName)),
          );
        }
        if (remaining.length) {
          // if there are remaining imports from @recidiviz/design-system,
          // update the import statement to only include the remaining imports
          path.node.specifiers = remaining;
        } else {
          // if there are no remaining imports from @recidiviz/design-system,
          // remove the import statement entirely
          j(path).remove();
        }
      } else {
        // if there is no existing ~design-system import, we need to create one

        // if there are remaining import statements from @recidiviz/design-system,
        // we need to create a new import statement from ~design-system
        if (remaining.length) {
          j(path).insertAfter(
            j.importDeclaration(
              [j.importSpecifier(j.identifier(componentName))],
              j.stringLiteral("~design-system"),
            ),
          );
        } else {
          // if there are no remaining import statements, we can replace the
          // entire import statement with ~design-system
          path.node.source.value = "~design-system";
        }
      }
    });

  return root.toSource();
}
