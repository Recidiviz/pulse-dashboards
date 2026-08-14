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

export interface ConfigIdentity {
  name?: string;
  stateCode?: string;
}

// Validate YAML text against the Zod schema directly, producing Monaco
// markers. This runs entirely on the main thread (no monaco-yaml/worker),
// since Expo's Metro bundler can't build the separate worker chunk that
// monaco-yaml's schema validation depends on.
export const computeMarkers = (
  monaco: Monaco,
  text: string,
  schema: ConfigSchema,
  minVersion: number | null,
  originalIdentity: ConfigIdentity | null = null,
): editor.IMarkerData[] => {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter });

  const toMarker = (
    [start, end]: [number, number],
    message: string,
    severity: editor.IMarkerData["severity"] = monaco.MarkerSeverity.Error,
  ): editor.IMarkerData => {
    const from = lineCounter.linePos(start);
    const to = lineCounter.linePos(end);
    return {
      severity,
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

  const parsedJs = doc.toJS();
  const result = schema.safeParse(parsedJs);
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

  const parsedConfig = result.data;
  const markers: editor.IMarkerData[] = [];

  // Fields the schema doesn't recognize are silently stripped at runtime
  // (the schema is not strict so loading configs saved under an older
  // version don't break if a field is removed) — surfaced here as a warning
  // rather than a blocking error, alterting to it being ignored later.
  const strictResult = schema.strict().safeParse(parsedJs);
  if (!strictResult.success) {
    const unrecognized = strictResult.error.issues.find(
      (issue) => issue.code === "unrecognized_keys",
    );
    if (unrecognized && "keys" in unrecognized) {
      for (const key of unrecognized.keys) {
        markers.push(
          toMarker(
            findRange(doc, [key]) ?? [0, text.length],
            `Unrecognized field "${key}" — this will be ignored`,
            monaco.MarkerSeverity.Warning,
          ),
        );
      }
    }
  }

  if (minVersion !== null && parsedConfig.version <= minVersion) {
    markers.push(
      toMarker(
        findRange(doc, ["version"]) ?? [0, text.length],
        `Version must be increased from ${minVersion} before saving (currently ${parsedConfig.version})`,
      ),
    );
  }

  // Warns when name field changes and blocks when stateCode differs from the
  // original — automating a check a PR review would've previously caught, without
  // gatekeeping the save, same as the old YAML-review process never did either.
  if (originalIdentity) {
    if (
      originalIdentity.name !== undefined &&
      "name" in parsedConfig &&
      parsedConfig.name !== originalIdentity.name
    ) {
      markers.push(
        toMarker(
          findRange(doc, ["name"]) ?? [0, text.length],
          `"name" changed from "${originalIdentity.name}" — double check this config is for the right agency`,
          monaco.MarkerSeverity.Warning,
        ),
      );
    }
    if (
      originalIdentity.stateCode !== undefined &&
      "stateCode" in parsedConfig &&
      parsedConfig.stateCode !== originalIdentity.stateCode
    ) {
      markers.push(
        toMarker(
          findRange(doc, ["stateCode"]) ?? [0, text.length],
          `"stateCode" cannot be changed from "${originalIdentity.stateCode}"`,
          monaco.MarkerSeverity.Error,
        ),
      );
    }
  }

  return markers;
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

export const parseIdentity = (
  yamlText: string,
  schema: ConfigSchema,
): ConfigIdentity | null => {
  const doc = parseDocument(yamlText);
  if (doc.errors.length > 0) {
    return null;
  }
  const result = schema.safeParse(doc.toJS());
  if (!result.success) {
    return null;
  }
  const data = result.data as { name?: unknown; stateCode?: unknown };
  if (typeof data.name !== "string" || typeof data.stateCode !== "string") {
    return null;
  }
  return { name: data.name, stateCode: data.stateCode };
};
