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

import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import toast from "react-hot-toast";

import { palette } from "~design-system";

import { ERROR_TOAST_DURATION } from "../../datastores/constants";
import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { formatDisplayDate } from "../../utils/utils";
import * as Styled from "./ESignatureSection.styles";
import { isSignatureComplete } from "./ReportSignature";
import * as SummaryStyled from "./Summary.styles";

const OFFICER_DEFAULT_TITLE = "Probation & Parole Officer";
const SUPERVISOR_DEFAULT_TITLE = "Unit Supervisor";

const SignedView: React.FC<{
  signature: string;
  title: string;
  lastSignedAt: Date;
  canCompleteSection: boolean;
  onEdit: () => void;
}> = ({ signature, title, lastSignedAt, canCompleteSection, onEdit }) => (
  <>
    <Styled.SignedDisplay>
      <Styled.SignedName>/s/ {signature}</Styled.SignedName>
      <Styled.SignedMeta>{title}</Styled.SignedMeta>
      <Styled.SignedMeta>
        Date: {formatDisplayDate(lastSignedAt)}
      </Styled.SignedMeta>
    </Styled.SignedDisplay>
    {canCompleteSection && (
      <Styled.EditButton onClick={onEdit}>Edit Signature</Styled.EditButton>
    )}
  </>
);

const SignatureForm: React.FC<{
  initialSignature: string;
  initialTitle: string;
  isReportComplete: boolean;
  canCompleteSection: boolean;
  userRole: "Officer" | "Supervisor";
  onSign: (signature: string, title: string) => Promise<void>;
}> = ({
  initialSignature,
  initialTitle,
  isReportComplete,
  canCompleteSection,
  userRole,
  onSign,
}) => {
  const [signature, setSignature] = useState(initialSignature);
  const [title, setTitle] = useState(initialTitle);
  const canSign =
    canCompleteSection &&
    isReportComplete &&
    signature.trim().length > 0 &&
    title.trim().length > 0;

  const handleSign = async () => {
    await onSign(signature.trim(), title.trim());
  };

  return (
    <>
      <Styled.FieldGroup>
        <Styled.FieldLabel
          $active={canCompleteSection}
          htmlFor={`${userRole}-signature`}
        >
          {userRole} Signature
        </Styled.FieldLabel>
        <Styled.SignatureInput
          id={`${userRole.toLowerCase()}-signature`}
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder={canCompleteSection ? "Type your full name" : "—"}
          disabled={!(canCompleteSection && isReportComplete)}
        />
      </Styled.FieldGroup>

      <Styled.FieldGroup>
        <Styled.FieldLabel
          $active={canCompleteSection}
          htmlFor={`${userRole}-title`}
        >
          Title
        </Styled.FieldLabel>
        <Styled.SignatureInput
          id={`${userRole.toLowerCase()}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={canCompleteSection ? "Enter your title" : "—"}
          disabled={!(canCompleteSection && isReportComplete)}
        />
      </Styled.FieldGroup>

      <Styled.SignButton disabled={!canSign} onClick={handleSign}>
        Sign
      </Styled.SignButton>
    </>
  );
};

interface ESignatureSectionProps {
  presenter: SARDetailsPresenter;
  isReportComplete: boolean;
}

export const ESignatureSection: React.FC<ESignatureSectionProps> = observer(
  function ESignatureSection({ presenter, isReportComplete }) {
    const { officerSignatureData, supervisorSignatureData } = presenter;

    // Track only the "user explicitly clicked Edit" override — the base
    // edit-vs-signed display is derived live from MobX observables so it
    // always reflects the current state rather than a stale mount-time snapshot.
    const [isOfficerEditForced, setIsOfficerEditForced] = useState(false);
    const [isSupervisorEditForced, setIsSupervisorEditForced] = useState(false);

    const isOfficerEditing =
      isOfficerEditForced ||
      (!isSignatureComplete(officerSignatureData) &&
        presenter.SARIsAssignedToCurrentUser);

    const isSupervisorEditing =
      isSupervisorEditForced ||
      (!isSignatureComplete(supervisorSignatureData) && presenter.isSupervisor);

    const showSignError = () =>
      toast("Failed to save signature. Please try again.", {
        duration: ERROR_TOAST_DURATION,
        style: { backgroundColor: palette.signal.error },
      });

    // Each handler names the role explicitly so routing never depends on the
    // live presenter value at call time (which can differ from when the form
    // was rendered if observables settle mid-click).
    const handleOfficerSign = async (signature: string, title: string) => {
      try {
        await presenter.signOfficer(signature, title);
        setIsOfficerEditForced(false);
      } catch {
        showSignError();
      }
    };

    const handleSupervisorSign = async (signature: string, title: string) => {
      try {
        await presenter.signSupervisor(signature, title);
        setIsSupervisorEditForced(false);
      } catch {
        showSignError();
      }
    };

    return (
      <SummaryStyled.SignatureSidePanel>
        <SummaryStyled.SectionTitle>Signature</SummaryStyled.SectionTitle>
        <Styled.FormsRow>
          <Styled.SignatureFormWrapper>
            {isSignatureComplete(officerSignatureData) && !isOfficerEditing ? (
              <SignedView
                signature={officerSignatureData.signature}
                title={officerSignatureData.title}
                lastSignedAt={officerSignatureData.lastSignedAt}
                canCompleteSection={presenter.SARIsAssignedToCurrentUser}
                onEdit={() => setIsOfficerEditForced(true)}
              />
            ) : (
              <SignatureForm
                canCompleteSection={presenter.SARIsAssignedToCurrentUser}
                initialSignature={officerSignatureData.signature ?? ""}
                initialTitle={
                  officerSignatureData.title ?? OFFICER_DEFAULT_TITLE
                }
                isReportComplete={isReportComplete}
                userRole="Officer"
                onSign={handleOfficerSign}
              />
            )}
          </Styled.SignatureFormWrapper>

          <Styled.SignatureFormWrapper>
            {isSignatureComplete(supervisorSignatureData) &&
            !isSupervisorEditing ? (
              <SignedView
                signature={supervisorSignatureData.signature}
                title={supervisorSignatureData.title}
                lastSignedAt={supervisorSignatureData.lastSignedAt}
                canCompleteSection={presenter.isSupervisor}
                onEdit={() => setIsSupervisorEditForced(true)}
              />
            ) : (
              <SignatureForm
                canCompleteSection={presenter.isSupervisor}
                initialSignature={supervisorSignatureData.signature ?? ""}
                initialTitle={
                  supervisorSignatureData.title ?? SUPERVISOR_DEFAULT_TITLE
                }
                isReportComplete={isReportComplete}
                userRole="Supervisor"
                onSign={handleSupervisorSign}
              />
            )}
          </Styled.SignatureFormWrapper>
        </Styled.FormsRow>
        {!isReportComplete && (
          <Styled.HelperText>
            Report cannot be signed until all required fields are completed
          </Styled.HelperText>
        )}
      </SummaryStyled.SignatureSidePanel>
    );
  },
);
