// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import * as React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { useResizeForm } from "./utils";

const FormViewerGrid = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
`;

interface FormViewerProps {
  formRef?: React.MutableRefObject<HTMLDivElement>;
  children: React.ReactNode;
}

export interface FormViewerContextData {
  isDownloading: boolean;
}

export const FormViewerContext = React.createContext<FormViewerContextData>({
  isDownloading: false,
});

const FormViewer: React.FC<FormViewerProps> = ({ formRef, children }) => {
  const backupFormRef =
    React.useRef() as React.MutableRefObject<HTMLDivElement>;
  const internalFormRef = formRef ?? backupFormRef;
  useResizeForm(internalFormRef);
  const { workflowsStore } = useRootStore();
  const { formIsDownloading } = workflowsStore;

  const contextObject = React.useMemo(() => {
    return { isDownloading: formIsDownloading };
  }, [formIsDownloading]);

  return (
    <FormViewerGrid>
      <FormViewerContext.Provider value={contextObject}>
        <div className="WorkflowsFormContainer" ref={internalFormRef}>
          {children}
        </div>
      </FormViewerContext.Provider>
    </FormViewerGrid>
  );
};

export default observer(FormViewer);
