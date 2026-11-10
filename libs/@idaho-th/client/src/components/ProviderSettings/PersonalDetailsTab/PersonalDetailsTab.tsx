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

import React, { useState } from "react";

import { ProviderDetails } from "../../../hooks/housingApplication";
import { useUpdateProviderProfile } from "../../../hooks/providerSettings";
import {
  EditableFieldKey,
  FALLBACK_VALUE,
  FieldRow,
  FieldStyled,
} from "../FieldRow";
import { SettingsSection } from "../SettingsSection";

type PersonalFieldKey = Extract<
  EditableFieldKey,
  "contactName" | "contactPhone"
>;

export interface PersonalDetailsTabProps {
  provider: ProviderDetails;
}

/**
 * The person half of settings. These write the caller's own user record, so
 * they are identical in every organization they manage.
 */
export const PersonalDetailsTab: React.FC<PersonalDetailsTabProps> = ({
  provider,
}) => {
  const [editingField, setEditingField] = useState<PersonalFieldKey | null>(
    null,
  );
  const updateProfile = useUpdateProviderProfile();

  const handleSave = (fieldKey: PersonalFieldKey, newValue: string) => {
    setEditingField(null);
    updateProfile.mutate({ [fieldKey]: newValue });
  };

  const isSaving = (fieldKey: PersonalFieldKey) =>
    updateProfile.isPending &&
    Object.prototype.hasOwnProperty.call(
      updateProfile.variables ?? {},
      fieldKey,
    );

  const editableFieldProps = (fieldKey: PersonalFieldKey, value: string) => ({
    fieldKey,
    value,
    editable: true,
    isEditing: editingField === fieldKey,
    isSaving: isSaving(fieldKey),
    onStartEdit: () => setEditingField(fieldKey),
    onCancelEdit: () => setEditingField(null),
    onSave: (newValue: string) => handleSave(fieldKey, newValue),
  });

  return (
    <SettingsSection title="Personal details">
      <FieldStyled.FieldList>
        <FieldRow
          label="Name"
          {...editableFieldProps("contactName", provider.contactName ?? "")}
        />
        <FieldStyled.Divider />
        <FieldStyled.FieldGroup>
          <FieldStyled.FieldLabel>Email</FieldStyled.FieldLabel>
          <FieldStyled.FieldValue>
            {provider.contactEmail || FALLBACK_VALUE}
          </FieldStyled.FieldValue>
        </FieldStyled.FieldGroup>
        <FieldStyled.Divider />
        <FieldRow
          label="Phone"
          {...editableFieldProps("contactPhone", provider.contactPhone ?? "")}
        />
      </FieldStyled.FieldList>
    </SettingsSection>
  );
};
