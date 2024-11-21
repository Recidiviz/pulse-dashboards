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

import { createContext, ReactNode, useContext, useState } from "react";

import { ActionStrategyCopy } from "~datatypes";

type OpenModalArgs = {
  showActionStrategyList: boolean;
};

type InsightsActionStrategyModalContextType = {
  isModalOpen: boolean;
  openModal: ({ showActionStrategyList }: OpenModalArgs) => void;
  closeModal: () => void;
  showList: boolean;
  toggleShowList: () => void;
  selectedActionStrategy: ActionStrategyCopy[string] | undefined;
  selectActionStrategy: (item: ActionStrategyCopy[string] | undefined) => void;
  viewedFromList: boolean;
};

const InsightsActionStrategyModalContext = createContext<
  InsightsActionStrategyModalContextType | undefined
>(undefined);

export const InsightsActionStrategyModalProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showList, setShowList] = useState<boolean>(false);
  const [selectedActionStrategy, setSelectedActionStrategy] = useState<
    ActionStrategyCopy[string] | undefined
  >(undefined);
  const [viewedFromList, setViewedFromList] = useState<boolean>(false);

  const openModal = ({ showActionStrategyList }: OpenModalArgs) => {
    if (showActionStrategyList) {
      setShowList(true);
      setViewedFromList(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowList(false);
    setSelectedActionStrategy(undefined);
    setViewedFromList(false);
  };

  const toggleShowList = () => {
    setShowList(!showList);
    setViewedFromList(true);
  };

  const selectActionStrategy = (
    item: ActionStrategyCopy[string] | undefined,
  ) => {
    setSelectedActionStrategy(item);
    setShowList(false);
  };

  return (
    <InsightsActionStrategyModalContext.Provider
      value={{
        isModalOpen,
        openModal,
        closeModal,
        showList,
        toggleShowList,
        selectedActionStrategy,
        selectActionStrategy,
        viewedFromList,
      }}
    >
      {children}
    </InsightsActionStrategyModalContext.Provider>
  );
};

export const useInsightsActionStrategyModal =
  (): InsightsActionStrategyModalContextType => {
    const context = useContext(InsightsActionStrategyModalContext);
    if (!context) {
      throw new Error(
        "useInsightsActionStrategyModal must be used within a InsightsActionStrategyModalProvider",
      );
    }
    return context;
  };
