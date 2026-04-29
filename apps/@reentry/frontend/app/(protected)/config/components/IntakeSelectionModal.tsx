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

import { useEffect, useState } from "react";

import { BACKEND_URL } from "~@reentry/frontend/constants";
import { useAuth } from "~@reentry/frontend/lib/auth/authContext";

import { configHeaders } from "../utils/configFetch";

interface IntakeGroup {
  name: string;
  intake_ids: string[];
}

interface TemplateIntake {
  trigger_id: string;
  intake_id: string;
  label: string;
  persona_name: string | null;
}

interface IntakeOptions {
  groups: IntakeGroup[];
  templates: TemplateIntake[];
}

interface IntakeSelectionModalProps {
  configId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (intakeIds: string[]) => void;
}

export const IntakeSelectionModal = ({
  configId,
  isOpen,
  onClose,
  onConfirm,
}: IntakeSelectionModalProps) => {
  const auth = useAuth();
  const [options, setOptions] = useState<IntakeOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customIds, setCustomIds] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(new Set());
    setOptions(null);
    setError(null);
    setCustomIds([]);
    setCustomInput("");

    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const token = await auth.getAccessToken();
        const res = await fetch(
          `${BACKEND_URL}/config-management/outputs/${configId}/eval/intake-options`,
          { headers: configHeaders(token) },
        );
        if (!res.ok) throw new Error("Failed to load intake options");
        const data: IntakeOptions = await res.json();
        setOptions(data);
      } catch {
        setError("Failed to load intake options. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [isOpen, configId, auth]);

  if (!isOpen) return null;

  const toggleGroup = (group: IntakeGroup) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = group.intake_ids.every((id) => next.has(id));
      if (allSelected) {
        group.intake_ids.forEach((id) => next.delete(id));
      } else {
        group.intake_ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleTemplate = (intakeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(intakeId)) {
        next.delete(intakeId);
      } else {
        next.add(intakeId);
      }
      return next;
    });
  };

  const isGroupSelected = (group: IntakeGroup) =>
    group.intake_ids.every((id) => selectedIds.has(id));

  const isGroupPartial = (group: IntakeGroup) =>
    group.intake_ids.some((id) => selectedIds.has(id)) &&
    !isGroupSelected(group);

  const addCustomId = () => {
    const id = customInput.trim();
    if (!id || customIds.includes(id)) return;
    setCustomIds((prev) => [...prev, id]);
    setSelectedIds((prev) => new Set(prev).add(id));
    setCustomInput("");
  };

  const handleConfirm = () => {
    onConfirm([...selectedIds]);
  };

  const hasOptions =
    options && (options.groups.length > 0 || options.templates.length > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Intakes for Eval
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          Choose which intakes to evaluate. Groups and templates may overlap;
          duplicate IDs will be deduplicated automatically.
        </p>

        <div className="overflow-y-auto flex-1 min-h-0">
          {isLoading && (
            <p className="text-gray-500 text-sm py-4 text-center">
              Loading options...
            </p>
          )}
          {error && (
            <p className="text-red-600 text-sm py-4 text-center">{error}</p>
          )}
          {!isLoading && !error && !hasOptions && (
            <p className="text-gray-500 text-sm py-4 text-center">
              No intake options available for this environment.
            </p>
          )}
          {!isLoading && !error && options && options.groups.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Intake Groups
              </h4>
              {options.groups.map((group) => (
                <label
                  key={group.name}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isGroupSelected(group)}
                    ref={(el) => {
                      if (el) el.indeterminate = isGroupPartial(group);
                    }}
                    onChange={() => toggleGroup(group)}
                    className="h-4 w-4 rounded border-gray-300 text-[#003331] focus:ring-[#003331]"
                  />
                  <span className="text-sm text-gray-800 flex-1">
                    {group.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {group.intake_ids.length} intake
                    {group.intake_ids.length !== 1 ? "s" : ""}
                  </span>
                </label>
              ))}
            </div>
          )}
          {!isLoading && !error && options && options.templates.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Template Intakes
              </h4>
              {options.templates.map((tmpl) => (
                <label
                  key={tmpl.trigger_id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(tmpl.intake_id)}
                    onChange={() => toggleTemplate(tmpl.intake_id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#003331] focus:ring-[#003331]"
                  />
                  <span className="text-sm text-gray-800">{tmpl.label}</span>
                </label>
              ))}
            </div>
          )}
          {!isLoading && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Custom Intake ID
              </h4>
              {customIds.map((id) => (
                <label
                  key={id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(id)}
                    onChange={() => toggleTemplate(id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#003331] focus:ring-[#003331]"
                  />
                  <span className="text-sm text-gray-800 font-mono">{id}</span>
                </label>
              ))}
              <div className="flex gap-2 mt-1 px-3">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomId()}
                  placeholder="Enter intake ID..."
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#003331]"
                />
                <button
                  onClick={addCustomId}
                  disabled={!customInput.trim()}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {selectedIds.size} intake{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 bg-[#003331] text-white rounded-full hover:bg-gray-950 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Run Eval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
