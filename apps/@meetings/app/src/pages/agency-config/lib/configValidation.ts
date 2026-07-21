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

import { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { isNode, LineCounter, parseDocument } from "yaml";

import {
  AgencyConfigFileSchema,
  BaseConfigFileSchema,
} from "~@meetings/config";

export type ConfigSchema =
  | typeof AgencyConfigFileSchema
  | typeof BaseConfigFileSchema;

export const MARKER_OWNER = "zod-schema";

// A field path like ["meetingTypes", 0, "type"] -> `meetingTypes[0].type`.
export const pathToString = (path: (string | number)[]): string =>
  path.reduce<string>((acc, segment) => {
    if (typeof segment === "number") {
      return `${acc}[${segment}]`;
    }
    return acc ? `${acc}.${segment}` : segment;
  }, "");

// Walks up from the issue path to the nearest node that exists in the
// document. A missing field has nothing to underline, so we fall back to
// a single character at the start of the nearest present ancestor.
export const findRange = (
  doc: ReturnType<typeof parseDocument>,
  path: (string | number)[],
): [number, number] | null => {
  for (let i = path.length; i >= 0; i -= 1) {
    const node = doc.getIn(path.slice(0, i), true);
    if (isNode(node) && node.range) {
      return i === path.length
        ? [node.range[0], node.range[1]]
        : [node.range[0], node.range[0] + 1];
    }
  }
  return null;
};

// Validate YAML text against the Zod schema directly, producing Monaco
// markers. This runs entirely on the main thread (no monaco-yaml/worker),
// since Expo's Metro bundler can't build the separate worker chunk that
// monaco-yaml's schema validation depends on.
export const computeMarkers = (
  monaco: Monaco,
  text: string,
  schema: ConfigSchema,
  minVersion: number | null,
): editor.IMarkerData[] => {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter });

  const toMarker = (
    [start, end]: [number, number],
    message: string,
  ): editor.IMarkerData => {
    const from = lineCounter.linePos(start);
    const to = lineCounter.linePos(end);
    return {
      severity: monaco.MarkerSeverity.Error,
      message,
      startLineNumber: from.line,
      startColumn: from.col,
      endLineNumber: to.line,
      endColumn: to.col,
    };
  };

  if (doc.errors.length > 0) {
    return doc.errors.map((err) =>
      toMarker([err.pos[0], err.pos[1] ?? err.pos[0] + 1], err.message),
    );
  }

  const result = schema.safeParse(doc.toJS());
  if (!result.success) {
    return result.error.issues.map((issue) => {
      const field = pathToString(issue.path) || "(root)";
      const message =
        issue.code === "invalid_type" && issue.received === "undefined"
          ? `Missing required field "${field}"`
          : `"${field}": ${issue.message}`;
      return toMarker(findRange(doc, issue.path) ?? [0, text.length], message);
    });
  }

  if (minVersion !== null && result.data.version <= minVersion) {
    return [
      toMarker(
        findRange(doc, ["version"]) ?? [0, text.length],
        `Version must be increased from ${minVersion} before saving (currently ${result.data.version})`,
      ),
    ];
  }

  return [];
};

export const parseVersion = (
  yamlText: string,
  schema: ConfigSchema,
): number | null => {
  const doc = parseDocument(yamlText);
  if (doc.errors.length > 0) {
    return null;
  }
  const result = schema.safeParse(doc.toJS());
  return result.success ? result.data.version : null;
};
