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

import React from "react";
import { Container } from "reactstrap";

import PageTemplate from "../PageTemplate";
import { mainBlocks } from "./constant/mainBlocks";
import MethodologyBlock from "./MethodologyBlock";

const Methodology: React.FC = () => (
  <PageTemplate>
    <div className="Methodology">
      <Container className="col-md-9 col-12">
        <h1 className="Methodology__main-title">Projections</h1>
        <h2 className="Methodology__main-description">
          The case-level population projection model is designed to simulate the
          state criminal justice system in order to forecast incarcerated and
          supervised populations. The model is an agent-based stock and flow
          simulation that uses patterns in the historical data and sentencing
          information to calculate how people flow through the criminal justice
          system. The case-level data enables increased granularity for the
          underlying populations which makes the model adaptive and accurate. It
          also allows enforcement of individuals’ sentence lengths, such that
          the behaviors of all people already in the justice system at the run
          date of the model are projected true to reality. Furthermore, the
          model enables historical, current, and future state analyses of where
          population changes are stemming from and the cycles for distinct
          population groups. The model stays up to date and can be run as
          frequently as data is received from the DOC.
        </h2>
        <div className=" Methodology__toc col-md-5 col-12">
          <h5 className="Methodology__toc--header">CONTENTS</h5>
          <div className="d-flex flex-column">
            {mainBlocks.map((contentBlock) => (
              <a
                className="Methodology__toc--link"
                key={`link${contentBlock.label}`}
                href={`#${contentBlock.label
                  .replace(/:|\s/g, "-")
                  .toLowerCase()}`}
              >
                {contentBlock.label}
              </a>
            ))}
          </div>
        </div>
        <div>
          {mainBlocks.map((contentBlock) => (
            <MethodologyBlock
              target={contentBlock.label.replace(/:|\s/g, "-").toLowerCase()}
              key={`title${contentBlock.label}`}
              contentBlock={contentBlock}
            />
          ))}
        </div>
      </Container>
    </div>
  </PageTemplate>
);

export default Methodology;
