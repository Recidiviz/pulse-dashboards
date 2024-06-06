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

import { Icon } from "@recidiviz/design-system";
import { FC } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components/macro";

import { Modal } from "../Modal/Modal";
import { useModal } from "../Modal/useModal";
import { clickableText } from "../styles/clickableText";
import { ImagePreview } from "./ImagePreview";

// this is a span so it can be used in runing test or in a block on its own
const ModalTrigger = styled.span.attrs({ role: "button", tabIndex: 0 })`
  ${clickableText}
`;

const InlineIcon = styled(Icon).attrs({ size: 12, kind: "Open" })`
  display: inline-block;
  margin-left: 0.6em;
`;

export const FormPreview: FC<{
  icon?: boolean;
  linkText?: string;
}> = ({ icon, linkText }) => {
  const { showModal, modalProps } = useModal();
  const { opportunityUrl } = useParams();
  return (
    <>
      <ModalTrigger
        onClick={showModal}
        onKeyDown={(e) => {
          switch (e.key) {
            case "Enter":
            case " ":
              e.preventDefault();
              e.stopPropagation();
              showModal();
              break;
          }
        }}
      >
        {linkText}
        {icon && <InlineIcon />}
      </ModalTrigger>
      <Modal {...modalProps}>
        <ImagePreview opportunityUrl={opportunityUrl} />
      </Modal>
    </>
  );
};
