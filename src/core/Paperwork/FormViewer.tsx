// Copyright (C) 2022 Recidiviz, Inc.
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
import { useEffect } from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../WorkflowsStore";
import { useResizeForm } from "./utils";

const FormViewerGrid = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
`;

interface FormViewerProps {
  fileName: string;
  formDownloader: (
    fileName: string,
    client: Client,
    formContents: HTMLElement
  ) => Promise<void>;
  children: React.ReactNode;
}

export interface FormViewerContextData {
  isPrinting: boolean;
}

export const FormViewerContext = React.createContext<FormViewerContextData>({
  isPrinting: false,
});

const FormViewer: React.FC<FormViewerProps> = ({
  fileName,
  formDownloader,
  children,
}) => {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;
  useResizeForm(formRef);
  const { workflowsStore } = useRootStore();
  const { selectedClient: client, formIsPrinting } = workflowsStore;

  // Generate the form and save it once the print styles have been rendered
  useEffect(() => {
    async function download() {
      if (formIsPrinting && formRef.current && client) {
        await formDownloader(fileName, client, formRef.current);
        workflowsStore.formIsPrinting = false;
      }
    }

    download();
  }, [
    formRef,
    formIsPrinting,
    formDownloader,
    fileName,
    client,
    workflowsStore,
  ]);

  const contextObject = React.useMemo(() => {
    return { isPrinting: formIsPrinting };
  }, [formIsPrinting]);

  return (
    <FormViewerGrid>
      <FormViewerContext.Provider value={contextObject}>
        <div ref={formRef}>{children}</div>
      </FormViewerContext.Provider>
    </FormViewerGrid>
  );
};

export default observer(FormViewer);
