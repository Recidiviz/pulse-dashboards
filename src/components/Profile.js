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

import StateSelector from "./StateSelector";
import { useRootStore } from "./StoreProvider";

const Profile = () => {
  const { push } = useHistory();

  const { tenantStore, userStore } = useRootStore();
  const { user, logout } = userStore;
  const [selectedState, setSelectedState] = useState();

  const onChangeTenant = (option) => setSelectedState(option.value);

  const onClickTenant = () => {
    if (selectedState) {
      tenantStore.setCurrentTenantId(selectedState);
    }
    push({ pathname: "/" });
  };

  const onClickLogout = () => logout({ returnTo: window.location.origin });

  return (
    <div className="main-content bgc-grey-100">
      <div id="mainContent">
        <Container className="mb-5">
          <Row className="align-items-center profile-header mb-5 text-center text-md-left">
            <Col md={2}>
              <img
                src={user.picture}
                alt="Profile"
                className="rounded-circle img-fluid profile-picture mb-3 mb-md-0"
              />
            </Col>
            <Col md>
              <h2>{user.name}</h2>
              <p className="lead text-muted">{user.email}</p>
              <p className="lead text-muted">{userStore.stateName}</p>
              {userStore.availableStateCodes.length > 1 && (
                <div style={{ maxWidth: "33%" }}>
                  <p className="Profile__prompt lead text-muted">
                    Current view state:
                  </p>
                  <StateSelector onChange={onChangeTenant} />
                  <Button
                    className="Profile__submit mt-3"
                    variant="dark"
                    onClick={onClickTenant}
                  >
                    View dashboard
                  </Button>
                </div>
              )}
              <Button
                className="Profile__submit mt-3"
                variant="dark"
                onClick={onClickLogout}
              >
                Logout
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default observer(Profile);
