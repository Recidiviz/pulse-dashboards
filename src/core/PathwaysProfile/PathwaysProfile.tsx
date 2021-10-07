// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { useHistory } from "react-router-dom";
import { Button, Col, Container, Row } from "reactstrap";

import StateSelector from "../../components/StateSelector";
import { useRootStore } from "../../components/StoreProvider";
import MobileNavigation from "../MobileNavigation";
import PageTemplate from "../PageTemplate";

type StateSelectOption = {
  label: string;
  value: any;
};

const PathwaysProfile = () => {
  const { push } = useHistory();
  const { tenantStore, userStore } = useRootStore();
  const { user } = userStore;
  const [selectedState, setSelectedState] = useState();

  const handleOnChange = (option: StateSelectOption) => {
    setSelectedState(option.value);
  };
  const handleOnClick = () => {
    if (selectedState) {
      tenantStore.setCurrentTenantId(selectedState);
    }
    push({ pathname: "/" });
  };
  return (
    <PageTemplate mobileNavigation={<MobileNavigation title="Profile" />}>
      <Container className="mb-5">
        <Row className="align-items-center profile-header mb-5 text-center text-md-left">
          <Col md={2}>
            <img
              src={user.picture}
              alt="PathwaysProfile"
              className="rounded-circle img-fluid profile-picture mb-3 mb-md-0"
            />
          </Col>
          <Col md>
            <h2>{user.name}</h2>
            <p className="lead text-muted">{user.email}</p>
            <p className="lead text-muted">{userStore.stateName}</p>
            {userStore.availableStateCodes.length > 1 && (
              <div style={{ maxWidth: "33%" }}>
                <p className="PathwaysProfile__prompt lead text-muted">
                  Current view state:
                </p>
                <StateSelector onChange={handleOnChange} />
                <Button
                  className="PathwaysProfile__submit mt-3"
                  variant="dark"
                  onClick={handleOnClick}
                >
                  View dashboard
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </PageTemplate>
  );
};

export default observer(PathwaysProfile);
