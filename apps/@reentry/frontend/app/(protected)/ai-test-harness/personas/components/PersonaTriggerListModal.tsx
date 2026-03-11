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

import { CircularProgress } from "@mui/material";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bookmark,
  ExternalLink,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "react-modal";

import { $api } from "~@reentry/frontend/api";

// Fetches and renders a client's full name, notifying the parent when resolved
// so the parent can use the name for search/sort without re-fetching.
const ClientNameCell = ({
  clientPseudoId,
  onResolved,
}: {
  clientPseudoId: string;
  onResolved: (id: string, name: string) => void;
}) => {
  const { data: clientData, isLoading } = $api.useQuery(
    "get",
    "/clients/{client_pseudo_id}",
    { params: { path: { client_pseudo_id: clientPseudoId } } },
  );

  useEffect(() => {
    const record = clientData;
    if (record) {
      const name = [record.full_name.given_names, record.full_name.surname]
        .filter(Boolean)
        .join(" ");
      onResolved(clientPseudoId, name);
    }
  }, [clientData, clientPseudoId, onResolved]);

  if (isLoading) return <span className="text-gray-400 text-xs">Loading…</span>;

  const record = clientData;
  if (!record) return <span className="text-gray-400 text-xs">—</span>;

  const name = [record.full_name.given_names, record.full_name.surname]
    .filter(Boolean)
    .join(" ");

  return <span className="text-gray-700 text-xs">{name || "—"}</span>;
};

interface PersonaTriggerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaId: string;
  personaName: string;
}

type SortField = "date" | "client";
type SortDir = "asc" | "desc";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  not_started: "bg-gray-100 text-gray-800",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const SortIndicator = ({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) => {
  if (field !== sortField)
    return <ArrowUpDown size={11} className="text-gray-400" />;
  return sortDir === "asc" ? (
    <ArrowUp size={11} className="text-[#003331]" />
  ) : (
    <ArrowDown size={11} className="text-[#003331]" />
  );
};

export const PersonaTriggerListModal = ({
  isOpen,
  onClose,
  personaId,
  personaName,
}: PersonaTriggerListModalProps) => {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // Map of client_pseudo_id → resolved full name, populated as rows fetch.
  const [clientNames, setClientNames] = useState<Record<string, string>>({});

  const { data: triggers, isLoading } = $api.useQuery(
    "get",
    "/ai-personas/{persona_id}/triggers",
    { params: { path: { persona_id: personaId } } },
    { enabled: isOpen && !!personaId },
  );

  // Reset state when modal closes so it's fresh next time.
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSortField("date");
      setSortDir("desc");
      setClientNames({});
    }
  }, [isOpen]);

  const handleNameResolved = useCallback((id: string, name: string) => {
    setClientNames((prev) =>
      prev[id] === name ? prev : { ...prev, [id]: name },
    );
  }, []);

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const processedTriggers = useMemo(() => {
    if (!triggers) return [];

    const q = search.trim().toLowerCase();
    const filtered = q
      ? triggers.filter((t) =>
          (clientNames[t.client_pseudo_id ?? ""] ?? "")
            .toLowerCase()
            .includes(q),
        )
      : triggers;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        const nameA = clientNames[a.client_pseudo_id ?? ""] ?? "";
        const nameB = clientNames[b.client_pseudo_id ?? ""] ?? "";
        cmp = nameA.localeCompare(nameB);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [triggers, search, sortField, sortDir, clientNames]);

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <CircularProgress size={32} />
        </div>
      );
    }
    if (!triggers || triggers.length === 0) {
      return (
        <div className="text-center text-gray-500 py-12 text-sm">
          No triggers found for this persona.
        </div>
      );
    }
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200">
        {/* Sticky header */}
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[150px]" />
            <col className="w-[120px]" />
            <col className="w-[100px]" />
            <col className="w-[60px]" />
            <col />
            <col className="w-[90px]" />
            <col className="w-[60px]" />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-3 py-2.5">
                <button
                  onClick={() => handleSortClick("date")}
                  className="inline-flex items-center gap-1 hover:text-gray-700"
                >
                  Date
                  <SortIndicator
                    field="date"
                    sortField={sortField}
                    sortDir={sortDir}
                  />
                </button>
              </th>
              <th className="px-3 py-2.5">
                <button
                  onClick={() => handleSortClick("client")}
                  className="inline-flex items-center gap-1 hover:text-gray-700"
                >
                  Client
                  <SortIndicator
                    field="client"
                    sortField={sortField}
                    sortDir={sortDir}
                  />
                </button>
              </th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">%</th>
              <th className="px-3 py-2.5">Config</th>
              <th className="px-3 py-2.5">Flags</th>
              <th className="px-3 py-2.5">Actions</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable body — shows ~5 rows */}
        <div className="overflow-y-auto max-h-[260px]">
          {processedTriggers.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No triggers match your search.
            </div>
          ) : (
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[150px]" />
                <col className="w-[120px]" />
                <col className="w-[100px]" />
                <col className="w-[60px]" />
                <col />
                <col className="w-[90px]" />
                <col className="w-[60px]" />
              </colgroup>
              <tbody className="divide-y divide-gray-100">
                {processedTriggers.map((trigger) => {
                  const statusKey = trigger.status.toLowerCase();
                  const statusStyle =
                    STATUS_STYLES[statusKey] ?? STATUS_STYLES["not_started"];

                  return (
                    <tr key={trigger.trigger_id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-gray-700 text-xs whitespace-nowrap">
                        {formatDate(trigger.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        {trigger.client_pseudo_id ? (
                          <ClientNameCell
                            clientPseudoId={trigger.client_pseudo_id}
                            onResolved={handleNameResolved}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/ai-test-harness/status/${trigger.trigger_id}`}
                          onClick={onClose}
                          className={`px-2 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${statusStyle}`}
                        >
                          {trigger.status}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-xs">
                        {trigger.progress}%
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 truncate">
                        {trigger.assessment_config_code ?? (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          {trigger.is_template && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                              <Bookmark size={10} className="fill-amber-600" />
                              Template
                            </span>
                          )}
                          {trigger.from_template && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              From template
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/ai-test-harness/status/${trigger.trigger_id}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          View
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="outline-none w-full max-w-3xl mx-auto"
      overlayClassName="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
      ariaHideApp={false}
    >
      <div className="w-full bg-white rounded-xl shadow-[0px_8px_56px_0px_rgba(43,84,105,0.12)] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2b5469]/20 flex justify-between items-center">
          <div className="flex flex-col">
            <div className="text-[#002321] text-base font-medium">
              Intake Triggers
            </div>
            <div className="text-gray-500 text-sm">{personaName}</div>
          </div>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={14} className="text-[#004D48]" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <input
            type="text"
            placeholder="Search by client name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#003331] placeholder-gray-400"
          />
        </div>

        {/* Table */}
        <div className="px-4 pb-0">{renderTableContent()}</div>

        {/* Footer */}
        {triggers && triggers.length > 0 && (
          <div className="px-4 py-2.5 text-xs text-gray-400">
            {processedTriggers.length} of {triggers.length} trigger
            {triggers.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PersonaTriggerListModal;
