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

import "../assets/styles/index.scss";
import "./PageTemplate.scss";

interface PageTemplateProps {
  children: React.ReactNode;
  filters?: React.ReactNode;
  leftPanel?: React.ReactNode;
  mobileNavigation?: React.ReactNode;
}

function PageTemplate({
  children,
  filters = null,
  leftPanel = null,
  mobileNavigation = null,
}: PageTemplateProps) {
  return (
    <div className="PageTemplate">
      {mobileNavigation}
      {leftPanel && <div className="PageTemplate__left-panel">{leftPanel}</div>}
      <main className="PageTemplate__body">
        {filters}
        <div className="row gap-20 pos-r">
          <div className="PageTemplate__content">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default PageTemplate;
