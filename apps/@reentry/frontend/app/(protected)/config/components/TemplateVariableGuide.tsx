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

"use client";

import { useState } from "react";

import { $api } from "~@reentry/frontend/api";

interface TemplateVariableGuideProps {
  outputType: "action_plan" | "intake_summary";
}

export const TemplateVariableGuide = ({
  outputType,
}: TemplateVariableGuideProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: schema, isLoading } = $api.useQuery(
    "get",
    "/config-management/outputs/template-schema",
    {
      params: {
        query: {
          output_type: outputType,
        },
      },
    },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading template variable information...
        </div>
      </div>
    );
  }

  if (!schema) {
    return null;
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-sm font-medium text-gray-900">
            Template Variable Reference
          </h3>
          <span className="text-xs text-gray-500">
            ({schema.fields.length} template fields)
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4">
            Use <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{`{variable}`}</code>{" "}
            syntax in your templates. Variables marked with{" "}
            <span className="text-red-600 font-bold">*</span> are required.
          </p>

          <div className="space-y-4">
            {schema.fields.map((field) => (
              <div
                key={field.field_name}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-mono font-medium text-gray-900">
                      prompts.{field.field_name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {field.description}
                    </p>
                  </div>
                </div>

                {field.available_variables.length > 0 ? (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {field.available_variables.map((variable) => {
                        const isRequired =
                          field.required_variables.includes(variable);
                        return (
                          <button
                            key={variable}
                            onClick={() => {
                              navigator.clipboard.writeText(`{${variable}}`);
                            }}
                            className={`px-2 py-1 rounded text-xs font-mono transition-all hover:scale-105 ${
                              isRequired
                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                            }`}
                            title={`Click to copy. ${isRequired ? "Required" : "Optional"}`}
                            type="button"
                          >
                            {`{${variable}}`}
                            {isRequired && (
                              <span className="text-red-600 font-bold ml-1">
                                *
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic mt-2">
                    No template variables for this field
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
