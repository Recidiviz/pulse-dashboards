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

import { Button, Icon, Modal, palette } from "@recidiviz/design-system";
import { useEffect, useState } from "react";
import styled from "styled-components/macro";

import {
  PartiallyTypedRootStore,
  useRootStore,
} from "../../components/StoreProvider";

const ModalControls = styled.div`
  padding: 0;
  text-align: right;
`;

const Wrapper = styled.div`
  padding: 0;
`;

function ImpersonationErrorModal({ error }: { error?: Error }): JSX.Element {
  // TODO(#5636) Eliminate PartiallyTypedRootStore
  const { userStore } = useRootStore() as PartiallyTypedRootStore;
  const [modalIsOpen, setModalIsOpen] = useState(!!error);

  useEffect(() => {
    setModalIsOpen(!!error);
  }, [error]);

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={() => setModalIsOpen(false)}
      onAfterClose={() => {
        userStore.setImpersonationError(undefined);
      }}
      closeTimeoutMS={1000}
    >
      <Wrapper className="ImpersonationErrorModal">
        <ModalControls>
          <Button
            className="ImpersonationErrorModal__close"
            kind="link"
            onClick={() => {
              setModalIsOpen(false);
            }}
          >
            <Icon kind="Close" size="14" color={palette.pine2} />
          </Button>
        </ModalControls>
        <div>
          There was an error impersonating this user, please try again with a
          different email and state code:
        </div>
        <div>{error?.message}</div>
      </Wrapper>
    </Modal>
  );
}

export default ImpersonationErrorModal;
