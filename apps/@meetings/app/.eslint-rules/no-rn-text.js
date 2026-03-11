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

module.exports = {
  meta: {
    type: "error",
    docs: {
      description: "Use <Typography> instead of <Text> from react-native",
    },
    messages: {
      noText: "Do not use <Text> from react-native. Use <Typography> instead.",
    },
  },
  create(context) {
    let textImportedFromRN = false;

    return {
      ImportDeclaration(node) {
        if (node.source.value === "react-native") {
          textImportedFromRN = node.specifiers.some(
            (s) => s.type === "ImportSpecifier" && s.imported.name === "Text",
          );
        }
      },
      JSXOpeningElement(node) {
        if (textImportedFromRN && node.name.name === "Text") {
          context.report({ node, messageId: "noText" });
        }
      },
    };
  },
};
