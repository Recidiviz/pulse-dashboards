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

import React from "react";

export interface TimelineItem {
  time: string;
  description: string;
  isCurrent: boolean;
  isCompleted: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
}

const TimelineIndicator: React.FC<{ isCurrent: boolean }> = ({ isCurrent }) => {
  const outerColor = isCurrent ? "bg-cyan-900/20" : "bg-cyan-900/20";
  const innerColor = isCurrent ? "bg-cyan-900/50" : "bg-cyan-900/50";

  return (
    <div className="inline-flex items-center justify-center gap-2">
      <div className={`w-3 h-3 rounded-full ${outerColor}`} />
      <div className={`w-1.5 h-1.5 rounded-full ml-[-17.5px] ${innerColor}`} />
    </div>
  );
};

const TimelineConnector: React.FC = () => (
  <div className="h-4 inline-flex justify-start items-start">
    <div className="w-1.5 h-1.5 bg-white" />
    <div className="w-4 h-0 origin-top-left rotate-90 outline outline-[0.50px] outline-offset-[-0.25px] outline-cyan-900/60"></div>
  </div>
);

const TimelineEntry: React.FC<{ item: TimelineItem }> = ({ item }) => {
  const textColor = item.isCurrent
    ? "text-[#00665F]"
    : "text-[rgba(43,84,105,0.8)]";

  return (
    <div className="self-stretch inline-flex justify-start items-center gap-2">
      <TimelineIndicator isCurrent={item.isCurrent} />
      <div
        className={`justify-start ${textColor} text-xs font-medium font-['Public_Sans'] leading-4`}
      >
        {item.description}
      </div>
    </div>
  );
};

const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <div className="self-stretch relative">
      <div className="inline-flex flex-col justify-start items-start gap-px">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <TimelineEntry item={item} />
            {index < items.length - 1 && <TimelineConnector />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
