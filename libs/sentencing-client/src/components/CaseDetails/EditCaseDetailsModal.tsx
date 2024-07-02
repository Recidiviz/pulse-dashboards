// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { Modal } from "../Modal/Modal";
import * as Styled from "./CaseDetails.styles";
import { CaseDetailsForm } from "./Form/CaseDetailsForm";
import { FormField } from "./Form/Elements/FormField";

const EditCaseDetailsModal = ({
  firstName,
  form,
  isOpen,
  hideModal,
}: {
  firstName?: string;
  form: CaseDetailsForm;
  isOpen: boolean;
  hideModal: () => void;
}) => {
  return (
    <Modal isOpen={isOpen} hideModal={hideModal}>
      <Styled.ModalHeader>Edit Case Details</Styled.ModalHeader>
      <Styled.ModalDescription>
        We will use this data to generate opportunities for {firstName}. If you
        don&apos;t have this information yet, you can add it in later.
      </Styled.ModalDescription>

      {/* Form */}
      {form.contentList.map((element) => {
        const showNestedFields = Array.isArray(element.value)
          ? element.value.includes(element.showNestedValueMatch ?? "")
          : element.value === element.showNestedValueMatch;
        return (
          <Styled.InputWrapper key={element.key}>
            <FormField element={element} form={form} />

            {element.nested &&
              showNestedFields &&
              element.nested.map((nestedElement) => (
                <Styled.NestedWrapper key={nestedElement.key}>
                  <FormField
                    element={nestedElement}
                    form={form}
                    parentKey={element.key}
                  />
                </Styled.NestedWrapper>
              ))}
          </Styled.InputWrapper>
        );
      })}

      <Styled.ActionButtonWrapper>
        <Styled.ActionButton kind="link" onClick={hideModal}>
          Cancel
        </Styled.ActionButton>
        <Styled.ActionButton>Save</Styled.ActionButton>
      </Styled.ActionButtonWrapper>
    </Modal>
  );
};

export default observer(EditCaseDetailsModal);
