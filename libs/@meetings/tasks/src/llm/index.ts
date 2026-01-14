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

/**
 * Notetaker Pipeline - Module Exports
 *
 * Main entry point for the notetaker pipeline modules.
 */

// Core modules
export * from "~@meetings/tasks/llm/agents";
export * from "~@meetings/tasks/llm/guards";
export * from "~@meetings/tasks/llm/orchestrator";
export * from "~@meetings/tasks/llm/prompts";
export * from "~@meetings/tasks/llm/schemas";

// Re-export main classes for convenience
export { SpecialistCore } from "~@meetings/tasks/llm/agents";
export { ProductionPipeline } from "~@meetings/tasks/llm/orchestrator";
