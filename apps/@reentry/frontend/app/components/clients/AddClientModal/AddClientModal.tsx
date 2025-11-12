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

import { X } from "lucide-react";
import type React from "react";
import Modal from "react-modal";

import { DAYS, getYearOptions, MONTHS } from "./dateOptions";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { LoadingSpinner } from "./LoadingSpinner";
import { US_STATES } from "./stateOptions";
import { useClientForm } from "./useClientForm";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddClientFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface AddClientFormData {
  given_names: string;
  surname: string;
  birthdate: string; // YYYY-MM-DD format
  state_code: string;
}

const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    day,
    setDay,
    month,
    setMonth,
    year,
    setYear,
    state,
    setState,
    error,
    handleSubmit,
    handleClose,
  } = useClientForm({ onSubmit, onClose });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="outline-none"
      overlayClassName="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      ariaHideApp={false}
    >
      <div className="w-full max-w-[500px] bg-white rounded-xl shadow-[0px_8px_56px_0px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_0px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_0px_rgba(43,84,105,0.10)] inline-flex flex-col justify-start items-end overflow-hidden">
        {/* Header */}
        <div className="self-stretch px-4 py-3 border-b border-[#2b5469]/20 flex justify-between items-center">
          <div className="text-[#002321] text-base font-medium font-['Public_Sans'] leading-tight">
            Add New Client
          </div>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={handleClose}
            aria-label="Close modal"
            type="button"
            disabled={isLoading}
          >
            <X size={14} className="text-[#004D48]" />
          </button>
        </div>

        {/* Body */}
        <div className="self-stretch p-4 flex flex-col gap-4">
          {error && (
            <div className="text-red-700 text-sm font-medium p-2 rounded bg-red-50">
              {error}
            </div>
          )}

          {/* Name fields */}
          <div className="flex space-x-3">
            <FormInput
              id="first-name-input"
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              placeholder="First name"
              required
              disabled={isLoading}
            />
            <FormInput
              id="last-name-input"
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              placeholder="Last name"
              required
              disabled={isLoading}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left">
              Date of Birth *
            </label>
            <div className="flex space-x-3">
              <div className="w-1/4">
                <FormSelect
                  id="month-input"
                  value={month}
                  onChange={setMonth}
                  placeholder="MM"
                  disabled={isLoading}
                  options={MONTHS.map((m) => ({
                    value: m.value,
                    label: `${m.value} - ${m.label}`,
                  }))}
                />
              </div>
              <div className="w-1/4">
                <FormSelect
                  id="day-input"
                  value={day}
                  onChange={setDay}
                  placeholder="DD"
                  disabled={isLoading}
                  options={DAYS.map((d) => ({ value: d, label: d }))}
                />
              </div>
              <div className="w-2/4">
                <FormSelect
                  id="year-input"
                  value={year}
                  onChange={setYear}
                  placeholder="YYYY"
                  disabled={isLoading}
                  options={getYearOptions().map((y) => ({
                    value: y,
                    label: y,
                  }))}
                />
              </div>
            </div>
          </div>

          {/* State */}
          <div className="w-full">
            <label
              htmlFor="state-input"
              className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
            >
              State *
            </label>
            <FormSelect
              id="state-input"
              value={state}
              onChange={setState}
              placeholder="Select a state"
              disabled={isLoading}
              options={US_STATES.map((s) => ({
                value: s.code,
                label: `${s.name} (${s.code})`,
              }))}
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 mt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-full py-2 w-full disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="hover:bg-gray-950 text-white rounded-full py-2 w-full disabled:opacity-50 bg-[#003331]"
            >
              {isLoading ? <LoadingSpinner /> : "Add Client"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddClientModal;
