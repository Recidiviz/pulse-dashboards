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

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import Modal from "react-modal";

import { $api } from "~@reentry/frontend/api";
import { FormInput } from "~@reentry/frontend/components/clients/AddClientModal/FormInput";
import { LoadingSpinner } from "~@reentry/frontend/components/clients/AddClientModal/LoadingSpinner";
import { showErrorToast, showSuccessToast } from "~@reentry/frontend-shared";

interface PersonaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  personaId?: string | null;
}

interface FormTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  disabled?: boolean;
}

const FormTextarea = ({
  id,
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  rows = 3,
  disabled = false,
}: FormTextareaProps) => {
  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block font-public font-medium text-[16px] tracking-[-0.02em] text-[#012322] mb-1 text-left"
      >
        {label} {required && "*"}
      </label>
      <textarea
        id={id}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 text-start resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        disabled={disabled}
      />
    </div>
  );
};

export const PersonaFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  personaId,
}: PersonaFormModalProps) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [background, setBackground] = useState("");
  const [challenges, setChallenges] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!personaId;

  // Fetch existing persona if editing
  const { data: existingPersona, isLoading: isLoadingPersona } = $api.useQuery(
    "get",
    "/ai-personas/{persona_id}",
    {
      params: { path: { persona_id: personaId ?? "" } },
    },
    {
      enabled: isEditMode,
    },
  );

  // Populate form when editing
  useEffect(() => {
    if (existingPersona) {
      setName(existingPersona.name);
      setAge(String(existingPersona.age));
      setBackground(existingPersona.background);
      setChallenges(existingPersona.challenges);
      setCommunicationStyle(existingPersona.communication_style);
    }
  }, [existingPersona]);

  const createMutation = $api.useMutation("post", "/ai-personas");
  const updateMutation = $api.useMutation("put", "/ai-personas/{persona_id}");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name || !age || !background || !challenges || !communicationStyle) {
      setError("All fields are required");
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError("Age must be a valid number between 1 and 120");
      return;
    }

    try {
      const requestData = {
        name,
        age: ageNum,
        background,
        challenges,
        communication_style: communicationStyle,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({
          params: { path: { persona_id: personaId } },
          body: requestData,
        });
        showSuccessToast("Persona updated successfully");
      } else {
        await createMutation.mutateAsync({
          body: requestData,
        });
        showSuccessToast("Persona created successfully");
      }

      // Reset form
      setName("");
      setAge("");
      setBackground("");
      setChallenges("");
      setCommunicationStyle("");
      onSuccess();
    } catch {
      showErrorToast(
        isEditMode ? "Failed to update persona" : "Failed to create persona",
      );
    }
  };

  const handleClose = () => {
    setName("");
    setAge("");
    setBackground("");
    setChallenges("");
    setCommunicationStyle("");
    setError(null);
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="outline-none mx-4 md:mx-0"
      overlayClassName="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      ariaHideApp={false}
    >
      <div className="w-full max-w-[700px] bg-white rounded-xl shadow-[0px_8px_56px_0px_rgba(43,84,105,0.12)] shadow-[0px_4px_8px_0px_rgba(43,84,105,0.06)] shadow-[0px_0px_1px_0px_rgba(43,84,105,0.10)] inline-flex flex-col justify-start items-end overflow-hidden">
        {/* Header */}
        <div className="self-stretch px-4 py-3 border-b border-[#2b5469]/20 flex justify-between items-center">
          <div className="text-[#002321] text-base font-medium font-['Public_Sans'] leading-tight">
            {isEditMode ? "Edit AI Persona" : "Add New AI Persona"}
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

          {isLoadingPersona ? (
            <div className="text-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex space-x-3">
                <FormInput
                  id="name"
                  label="Name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g., Sarah Martinez"
                  required
                  disabled={isLoading}
                />

                <FormInput
                  id="age"
                  label="Age"
                  value={age}
                  onChange={setAge}
                  placeholder="e.g., 32"
                  required
                  type="number"
                  disabled={isLoading}
                />
              </div>

              <FormTextarea
                id="background"
                label="Background"
                value={background}
                onChange={setBackground}
                placeholder="Describe the persona's background, history, and context..."
                required
                rows={3}
                disabled={isLoading}
              />

              <FormTextarea
                id="challenges"
                label="Challenges"
                value={challenges}
                onChange={setChallenges}
                placeholder="What challenges or obstacles does this persona face?"
                required
                rows={3}
                disabled={isLoading}
              />

              <FormTextarea
                id="communication_style"
                label="Communication Style"
                value={communicationStyle}
                onChange={setCommunicationStyle}
                placeholder="Describe how this persona communicates (e.g., Direct and concise, Thoughtful and reflective)..."
                required
                rows={2}
                disabled={isLoading}
              />

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
                  type="submit"
                  disabled={isLoading}
                  className="hover:bg-gray-950 text-white rounded-full py-2 w-full disabled:opacity-50 bg-[#003331]"
                >
                  {isLoading && <LoadingSpinner />}
                  {!isLoading &&
                    (isEditMode ? "Update Persona" : "Add Persona")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PersonaFormModal;
