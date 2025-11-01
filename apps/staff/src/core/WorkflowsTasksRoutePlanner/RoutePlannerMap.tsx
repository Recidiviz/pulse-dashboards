// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Sans14, Sans24, TooltipTrigger } from "@recidiviz/design-system";
import * as Sentry from "@sentry/react";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import toast from "react-hot-toast";
import styled from "styled-components/macro";

import { Button, palette, spacing } from "~design-system";

import CopyIcon from "../../assets/static/images/copy.svg?react";
import Star from "../../assets/static/images/grayStar.svg?react";
import SendIcon from "../../assets/static/images/sendIcon.svg?react";
import { Client } from "../../WorkflowsStore";
import { Divider } from "../WorkflowsJusticeInvolvedPersonProfile/styles";
import { RoutePlannerPresenter } from "./RoutePlannerPresenter";

const MapContainer = styled.div`
  width: 100%;
  height: 100%;

  /* Center the directions box within the map frame */
  display: flex;
  justify-content: start;
`;

const MapFrame = styled.iframe`
  width: 100%;
  height: 100%;
`;

const RouteDescriptionBox = styled.div`
  min-width: 0;
  width: ${rem(400)};
  border-radius: ${rem(8)};
  padding: ${rem(16)};

  background-color: ${palette.marble1};
  border: 1px solid ${palette.slate20};
  box-shadow: 0 ${rem(4)} ${rem(16)} 0 ${palette.slate20};

  position: absolute;
  margin-top: ${rem(10)};
  margin-left: ${rem(10)};
`;

const RouteDescriptionControls = styled.div`
  display: flex;
  margin-bottom: ${rem(14)};
`;

const CopyButton = styled.div`
  height: ${rem(30)};
  width: ${rem(20)};

  display: flex;
  justify-content: center;
  align-items: center;

  margin-left: auto;
  margin-right: ${rem(spacing.sm)};

  &:hover {
    background: ${palette.slate05};
    cursor: pointer;
  }
  &:active {
    background: ${palette.slate20};
    cursor: pointer;
  }
`;

const EmailButtonText = styled.span`
  margin-left: ${rem(spacing.sm)};
`;

const RouteDescriptionText = styled(Sans24)`
  color: ${palette.pine4};
`;

const RouteInfo = styled(Sans14)`
  max-height: ${rem(150)};
  overflow-y: auto;
`;

const AddressRowContainer = styled.div`
  display: flex;
  gap: ${rem(spacing.md)};
`;

const AddressNumber = styled.div`
  width: ${rem(20)};
  height: ${rem(20)};
  border-radius: ${rem(4)};
  flex: none;

  background-color: ${palette.slate10};
  color: ${palette.pine4};

  display: flex;
  align-items: center;
  justify-content: center;
`;

const AddressText = styled.span`
  color: ${palette.pine1};
`;

const AddressLabel = styled.span`
  color: ${palette.slate85};
`;

const AddressDivider = styled(Divider)`
  margin: ${rem(10)} 0;
`;

type AddressRowProps =
  | {
      address: string;
      label: string;
      index: number;
      displayStar: false;
    }
  | {
      address: string;
      label: string;
      index?: never;
      displayStar: true;
    };

const AddressRow = function AddressRow({
  address,
  label,
  index,
  displayStar = false,
}: AddressRowProps) {
  return (
    <AddressRowContainer>
      <AddressNumber>{displayStar ? <Star /> : index}</AddressNumber>
      <AddressText>
        {address} <AddressLabel>({label})</AddressLabel>
      </AddressText>
    </AddressRowContainer>
  );
};

const RoutePlannerDescription = observer(function RoutePlannerDescription({
  presenter,
}: {
  presenter: RoutePlannerPresenter;
}) {
  if (presenter.clientsPresenter.selectedClients.length === 0) return null;

  const onClickCopyLink = async () => {
    const { mapDirectionsUrl } = presenter;
    await navigator.clipboard.writeText(mapDirectionsUrl);
    toast("Link copied to clipboard", {
      position: "bottom-left",
      duration: 5000,
    });
  };

  const onClickEmailLink = async () => {
    try {
      await presenter.sendDirectionsEmail();
      toast(`Email sent to ${presenter.userEmailAddress}`, {
        position: "bottom-left",
        duration: 5000,
      });
    } catch (e) {
      toast.error("We couldn't send your email. Please try again.");
      Sentry.captureException(e);
    }
  };

  return (
    <RouteDescriptionBox>
      <RouteDescriptionControls>
        <RouteDescriptionText>Your trip</RouteDescriptionText>

        <CopyButton onClick={onClickCopyLink}>
          <TooltipTrigger contents={"Copy link to clipboard"}>
            <CopyIcon />
          </TooltipTrigger>
        </CopyButton>

        <Button shape={"block"} onClick={onClickEmailLink}>
          <SendIcon />
          <EmailButtonText>Email link to self</EmailButtonText>
        </Button>
      </RouteDescriptionControls>

      <RouteInfo>
        <AddressRow
          address={presenter.startingAddress}
          label={"Your office"}
          displayStar={true}
        />
        <AddressDivider />

        {presenter.clientsPresenter.selectedClients.map((client, i) => {
          const { formattedAddress, displayPreferredName } = client as Client;
          if (!formattedAddress) return null;
          return (
            // TODO(#9712) Remove this cast
            <React.Fragment key={client.pseudonymizedId}>
              <AddressRow
                address={formattedAddress}
                label={displayPreferredName}
                index={i + 1}
                displayStar={false}
              />
              <AddressDivider />
            </React.Fragment>
          );
        })}
      </RouteInfo>
    </RouteDescriptionBox>
  );
});

export const RoutePlannerMap = observer(function RoutePlannerMap({
  presenter,
}: {
  presenter: RoutePlannerPresenter;
}) {
  return (
    <MapContainer>
      <RoutePlannerDescription presenter={presenter} />
      <MapFrame title="Map" src={presenter.mapIframeUrl} />
    </MapContainer>
  );
});
