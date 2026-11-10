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

import React from "react";

import { ConfirmationModal } from "~@idaho-th/client/components/ConfirmationModal";
import { BodyS1, palette, spacing } from "~@idaho-th/client/styles";

interface AcceptAsHomePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  secondaryBtnText?: string;
}

export const AcceptAsHomePlanModal: React.FC<AcceptAsHomePlanModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  secondaryBtnText = "Cancel",
}) => {
  const subheading = (
    <>
      <BodyS1 $color={palette.foreground.secondary}>
        This will close the application for all other providers. If plans
        change, you can always duplicate this case to send new applications.
      </BodyS1>
      <BodyS1
        $color={palette.foreground.secondary}
        style={{ marginTop: spacing[3] }}
      >
        Providers typically don't hold a bed until funding comes through, so
        setting a home plan won’t lock anything in prematurely.
      </BodyS1>
    </>
  );

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      heading="Set as Home Plan?"
      subheading={subheading}
      primaryBtnText="Set as Home Plan"
      secondaryBtnText={secondaryBtnText}
      isLoading={isLoading}
    />
  );
};
