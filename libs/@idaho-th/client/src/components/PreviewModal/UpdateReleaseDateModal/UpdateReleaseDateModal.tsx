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

import { format, isValid, parse } from "date-fns";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { toCalendarDate } from "~@idaho-th/client/utils/date";
import {
  earliestAllowedReleaseDay,
  RELEASE_DATE_IN_PAST_ERROR,
} from "~@idaho-th/shared";

import { useUpdateHousingApplication } from "../../../hooks/housingApplication";
import { Heading5, palette } from "../../../styles";
import InfoIcon from "../../assets/information-circle.svg?react";
import XIcon from "../../assets/x.svg?react";
import { ActionButton } from "../../common/buttons";
import { DatePickerInput } from "../../common/inputs/DatePickerInput";
import { Tooltip } from "../../common/Tooltip";
import { Modal } from "../../Modal/Modal";
import * as Styled from "./UpdateReleaseDateModal.styles";
import {
  RELEASE_DATE_IN_PAST,
  validateReleaseDate,
} from "./UpdateReleaseDateModal.validation";

const DATE_HINT_ID = "update-release-date-hint";
export const RELEASE_DATE_GUIDANCE =
  "If you don't know the exact date, pick the 1st of the month. You can update this later.";

interface UpdateReleaseDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  currentDate?: Date | string | null;
  prefillDate?: boolean;
}

const toMmDdYyyy = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    const calendarDate = toCalendarDate(value);
    return calendarDate ? format(calendarDate, "MM/dd/yyyy") : null;
  }
  return value;
};

const toIsoDate = (mmDdYyyy: string): string => {
  const parsed = parse(mmDdYyyy, "MM/dd/yyyy", new Date());
  return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : mmDdYyyy;
};

export const UpdateReleaseDateModal: React.FC<UpdateReleaseDateModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  currentDate,
  prefillDate = true,
}) => {
  const { mutate: updateHousingApplication, isPending: isLoading } =
    useUpdateHousingApplication();

  const currentDateFormatted = toMmDdYyyy(currentDate);
  const initialDate = prefillDate ? currentDateFormatted : null;
  const [newDate, setNewDate] = useState<string | null>(initialDate);
  const [wasRejectedByServer, setWasRejectedByServer] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewDate(initialDate);
      setWasRejectedByServer(false);
      setHasAttemptedSubmit(false);
    }
  }, [isOpen, initialDate]);

  const hasValue = Boolean(newDate);

  // Derived on every render rather than at module scope, so a tab left open
  // overnight stops offering a day the server would now refuse.
  const earliestSelectableDate = parse(
    earliestAllowedReleaseDay(),
    "yyyy-MM-dd",
    new Date(),
  );

  const hasDateChanged = newDate !== currentDateFormatted;
  // Only a date the case manager actually entered is judged; an application
  // that already holds a past release date opens without complaint.
  const dateValidation = validateReleaseDate(newDate, hasDateChanged);
  // The rules are only reported once Submit is pressed — a date is judged when
  // the case manager says it is finished, never halfway through typing it.
  const showHint =
    (hasAttemptedSubmit && !dateValidation.isValid) || wasRejectedByServer;
  const hintCopy = dateValidation.reason ?? RELEASE_DATE_IN_PAST;

  const handleDateChange = (value: string | null) => {
    setNewDate(value);
    setWasRejectedByServer(false);
    setHasAttemptedSubmit(false);
  };

  const handleSubmit = () => {
    if (!newDate || !hasValue || isLoading) return;
    setHasAttemptedSubmit(true);
    if (!dateValidation.isValid) return;
    if (!hasDateChanged) {
      onClose();
      return;
    }
    if (!applicationId) {
      toast.error("No active application found.");
      return;
    }
    updateHousingApplication(
      {
        id: applicationId,
        data: { expectedReleaseDate: toIsoDate(newDate) },
      },
      {
        onSuccess: () => {
          onClose();
          toast.success("Release date updated.");
        },
        onError: (error) => {
          if (error.message === RELEASE_DATE_IN_PAST_ERROR) {
            setWasRejectedByServer(true);
            return;
          }
          toast.error("Failed to update release date.");
        },
      },
    );
  };

  const handleClose = () => {
    setNewDate(currentDateFormatted);
    setWasRejectedByServer(false);
    setHasAttemptedSubmit(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      hideModal={handleClose}
      width="32.5rem"
      maxWidth="32.5rem"
      padding="0"
    >
      <Styled.ModalRoot>
        <Styled.ModalHeader>
          <Styled.HeaderTextGroup>
            <Heading5 $color={palette.foreground.primary}>
              Update release date
            </Heading5>
          </Styled.HeaderTextGroup>

          <Styled.CloseButton
            type="button"
            aria-label="Close modal"
            onClick={handleClose}
          >
            <XIcon />
          </Styled.CloseButton>
        </Styled.ModalHeader>

        <Styled.ModalBody>
          <Styled.InputGroup>
            <Styled.LabelRow>
              <Styled.Label>Release date</Styled.Label>
              <Tooltip content={RELEASE_DATE_GUIDANCE}>
                <Styled.IconBox>
                  <InfoIcon />
                </Styled.IconBox>
              </Tooltip>
            </Styled.LabelRow>
            <DatePickerInput
              aria-label="Release date"
              aria-describedby={showHint ? DATE_HINT_ID : undefined}
              value={newDate}
              onChange={handleDateChange}
              disabled={isLoading}
              hasError={showHint}
              minDate={earliestSelectableDate}
            />
            {showHint && (
              <Styled.PastDateHint id={DATE_HINT_ID}>
                {hintCopy}
              </Styled.PastDateHint>
            )}
          </Styled.InputGroup>
        </Styled.ModalBody>

        <Styled.ModalFooter>
          <Styled.FooterSpacer aria-hidden />
          <ActionButton
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </ActionButton>
          <ActionButton
            variant="primary"
            isLoading={isLoading}
            disabled={!hasValue || isLoading || !applicationId}
            onClick={handleSubmit}
          >
            Update
          </ActionButton>
        </Styled.ModalFooter>
      </Styled.ModalRoot>
    </Modal>
  );
};
