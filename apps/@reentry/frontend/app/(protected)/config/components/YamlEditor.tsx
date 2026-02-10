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

"use client";

/* eslint-disable simple-import-sort/imports -- Prism core must load before language components */
import Prism from "prismjs";
import "prismjs/components/prism-yaml";
/* eslint-enable simple-import-sort/imports */

import { useState } from "react";
import Editor from "react-simple-code-editor";

import { CheckIcon } from "~@reentry/frontend/components/icons/CheckIcon";
import { CopyIcon } from "~@reentry/frontend/components/icons/CopyIcon";

import "./YamlEditor.css";

interface YamlEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

// Custom highlight function for YAML
const highlightYaml = (code: string): string => {
  return Prism.highlight(code, Prism.languages["yaml"], "yaml");
};

export const YamlEditor = ({
  value,
  onChange,
  readOnly = false,
  height = "400px",
}: YamlEditorProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      <div
        className={`border rounded-lg overflow-hidden ${
          readOnly ? "bg-gray-50" : "bg-white"
        } focus-within:ring-2 focus-within:ring-blue-500`}
      >
        <Editor
          value={value}
          onValueChange={(code) => onChange?.(code)}
          highlight={highlightYaml}
          padding={16}
          readOnly={readOnly}
          className="yaml-editor"
          textareaClassName={readOnly ? "cursor-default" : ""}
          style={{
            fontFamily: '"Fira Code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight: height,
            outline: "none",
          }}
        />
      </div>
      {/* Top-right buttons container */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded transition-colors ${
            copied
              ? "bg-green-100 text-green-600"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800"
          }`}
          title={copied ? "Copied!" : "Copy to clipboard"}
          type="button"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        {readOnly && (
          <div className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
            Read-only
          </div>
        )}
      </div>
    </div>
  );
};

export default YamlEditor;
