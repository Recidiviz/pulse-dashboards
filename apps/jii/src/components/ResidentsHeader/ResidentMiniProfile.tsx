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

import { ProfileField } from "../../configs/types";
import { CopyWrapper } from "../CopyWrapper/CopyWrapper";
import { Modal } from "../Modal/Modal";
import { useModal } from "../Modal/useModal";
import { ResidentMiniProfilePresenter } from "./ResidentMiniProfilePresenter";

const ProfileWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
  justify-content: space-between;
`;

const Name = styled.div`
  ${typography.Sans16}

  color: ${palette.pine1};
`;

const Fields = styled.dl`
  ${typography.Sans14}

  display: flex;
  flex-wrap: wrap;
  gap: ${rem(spacing.md)};
  margin: 0;

  & > div {
    display: flex;
    flex: 0 0 auto;
    gap: ${rem(spacing.sm)};
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

function FieldValue({ field }: { field: ProfileField }) {
  const { showModal, modalProps } = useModal();

  if (!field.moreInfo) return field.value;

  return (
    <>
      <Button
        kind="link"
        onClick={() => {
          showModal();
        }}
      >
        {field.value}
        <Icon
          size={12}
          kind={"Info"}
          style={{
            opacity: 0.5,
            marginLeft: rem(spacing.xs),
          }}
        />
      </Button>
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
      <Name>{presenter.name}</Name>
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
