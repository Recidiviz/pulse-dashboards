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

import {
  Button,
  Icon,
  palette,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FC } from "react";
import styled from "styled-components/macro";

import { ProfileField } from "../../../configs/types";
import { CopyWrapper } from "../../CopyWrapper/CopyWrapper";
import { Modal } from "../../Modal/Modal";
import { useModal } from "../../Modal/useModal";
import { ResidentMiniProfilePresenter } from "./ResidentMiniProfilePresenter";

const ProfileWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.sm)};
  justify-content: space-between;
`;

const Fields = styled.dl`
  ${typography.Sans14}

  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
  margin: 0;
  max-width: 100%;

  & > div {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    gap: ${rem(spacing.sm)};
    margin: 0.15em 0;
    max-width: 100%;
  }

  & dt {
    color: ${palette.slate80};
    margin: 0;

    &:after {
      content: ":";
    }
  }

  & dd {
    color: ${palette.pine4};
    margin: 0;
  }
`;

const FieldValueButton = styled(Button).attrs({ kind: "link" })`
  ${typography.Sans14};
`;

function FieldValue({ field }: { field: ProfileField }) {
  const { showModal, modalProps } = useModal();

  if (!field.moreInfo) return field.value;

  return (
    <>
      <FieldValueButton
        onClick={() => {
          showModal();
        }}
      >
        {field.value}{" "}
        <Icon
          size={12}
          kind={"Info"}
          style={{
            opacity: 0.5,
          }}
          aria-label="More information"
          role="img"
        />
      </FieldValueButton>
      <Modal {...modalProps}>
        <CopyWrapper>{field.moreInfo}</CopyWrapper>
      </Modal>
    </>
  );
}

export const ResidentMiniProfile: FC<{
  presenter: ResidentMiniProfilePresenter;
}> = observer(function ResidentMiniProfile({ presenter }) {
  return (
    <ProfileWrapper>
      <Fields>
        {presenter.profileFields.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>
              <FieldValue field={f} />
            </dd>
          </div>
        ))}
      </Fields>
    </ProfileWrapper>
  );
});
