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

import React, { useState } from "react";

import { useProviderDetails } from "../../hooks/housingApplication";
import { fontWeights, Heading5, palette } from "../../styles";
import BuildingIcon from "../assets/building-icon.svg?react";
import InformationCircleIcon from "../assets/information-circle.svg?react";
import LocationPinIcon from "../assets/locationPin.svg?react";
import UserIcon from "../assets/user-icon.svg?react";
import XIcon from "../assets/x.svg?react";
import { Spinner } from "../common/LoadingSpinner";
import { Modal } from "../Modal/Modal";
import { ActiveProviderSettingsTab } from "./ActiveProviderSettingsTab";
import {
  FEEDBACK_EMAIL,
  PROVIDER_SETTINGS_GROUP_LABEL,
  PROVIDER_SETTINGS_TAB,
  ProviderSettingsTab,
} from "./constants";
import * as Styled from "./ProviderSettingsModal.styles";

export interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabDescriptor = {
  id: ProviderSettingsTab;
  label: string;
  Icon: React.FC;
};

/**
 * Grouped by who owns the fields. Organization settings reach only the
 * organization the portal is acting as; personal details follow the person
 * into every organization they manage.
 */
const TAB_GROUPS: { label: string; tabs: TabDescriptor[] }[] = [
  {
    label: PROVIDER_SETTINGS_GROUP_LABEL.HOUSING_PROVIDER,
    tabs: [
      {
        id: PROVIDER_SETTINGS_TAB.HOUSING_PROVIDER,
        label: "Provider settings",
        Icon: BuildingIcon,
      },
      {
        id: PROVIDER_SETTINGS_TAB.LOCATIONS,
        label: "Locations",
        Icon: LocationPinIcon,
      },
    ],
  },
  {
    label: PROVIDER_SETTINGS_GROUP_LABEL.PERSONAL,
    tabs: [
      {
        id: PROVIDER_SETTINGS_TAB.PERSONAL,
        label: "Personal details",
        Icon: UserIcon,
      },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap((group) => group.tabs);

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<ProviderSettingsTab>(
    PROVIDER_SETTINGS_TAB.HOUSING_PROVIDER,
  );
  const { data, isLoading, isError } = useProviderDetails(isOpen);

  const activeTabLabel = ALL_TABS.find((tab) => tab.id === activeTab)?.label;

  return (
    <Modal
      isOpen={isOpen}
      hideModal={onClose}
      width="60rem"
      maxWidth="60rem"
      height="41.25rem"
      padding="0"
    >
      <Styled.ModalRoot>
        <Styled.Sidebar>
          <Styled.SidebarHeader>
            <Heading5 $color={palette.foreground.primary}>Settings</Heading5>
          </Styled.SidebarHeader>
          <Styled.SidebarBody>
            <Styled.MenuList>
              {TAB_GROUPS.map((group) => (
                <Styled.MenuGroup
                  key={group.label}
                  role="group"
                  aria-label={group.label}
                >
                  <Styled.MenuGroupLabel>{group.label}</Styled.MenuGroupLabel>
                  {group.tabs.map(({ id, label, Icon }) => (
                    <Styled.MenuItem
                      key={id}
                      type="button"
                      $active={activeTab === id}
                      onClick={() => setActiveTab(id)}
                    >
                      <Styled.MenuIcon $active={activeTab === id}>
                        <Icon />
                      </Styled.MenuIcon>
                      <Styled.MenuLabel
                        $fontWeight={
                          activeTab === id
                            ? fontWeights.medium
                            : fontWeights.regular
                        }
                      >
                        {label}
                      </Styled.MenuLabel>
                    </Styled.MenuItem>
                  ))}
                </Styled.MenuGroup>
              ))}
            </Styled.MenuList>
          </Styled.SidebarBody>
        </Styled.Sidebar>

        <Styled.RightSide>
          <Styled.ModalHeader>
            <Heading5 $color={palette.foreground.primary}>
              {activeTabLabel}
            </Heading5>
            <Styled.CloseButton
              type="button"
              aria-label="Close modal"
              onClick={onClose}
            >
              <XIcon />
            </Styled.CloseButton>
          </Styled.ModalHeader>

          <Styled.RightContent>
            <Styled.ScrollArea>
              {isLoading && (
                <Styled.StatusContainer>
                  <Spinner />
                </Styled.StatusContainer>
              )}

              {isError && !isLoading && (
                <Styled.StatusContainer>
                  <Styled.ErrorText>
                    Something went wrong. Please refresh the page.
                  </Styled.ErrorText>
                </Styled.StatusContainer>
              )}

              {!isLoading && !isError && data && (
                <ActiveProviderSettingsTab
                  activeTab={activeTab}
                  provider={data}
                />
              )}
            </Styled.ScrollArea>

            <Styled.FooterMessage>
              <Styled.InfoIcon aria-hidden="true">
                <InformationCircleIcon />
              </Styled.InfoIcon>
              <Styled.FooterText>
                To add or remove locations, or make other changes, contact us at{" "}
                <Styled.FooterLink href={`mailto:${FEEDBACK_EMAIL}`}>
                  {FEEDBACK_EMAIL}
                </Styled.FooterLink>
              </Styled.FooterText>
            </Styled.FooterMessage>
          </Styled.RightContent>
        </Styled.RightSide>
      </Styled.ModalRoot>
    </Modal>
  );
};
