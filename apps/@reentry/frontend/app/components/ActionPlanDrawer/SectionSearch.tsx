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

import { default as SearchIcon } from "@mui/icons-material/Search";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import GithubSlugger from "github-slugger";
import { useEffect, useState } from "react";
interface Header {
  class: string;
  text: string;
  active: boolean;
  link: string;
}

// @ts-expect-error : Use ES2018 regex
const regXHeader = /(?<flag>#{1,6})\s+(?<text>.+)/g;

const headerClass = {
  h1: "text-[18px]",
  h2: "text-[18px] ml-5",
  h3: "text-[18px] ml-8",
  h4: "text-[18px]",
  h5: "text-[18px]",
  h6: "text-[18px]",
};

const getHeaders = (mardownText: string): Header[] => {
  const slugger = new GithubSlugger();
  return Array.from(mardownText.matchAll(regXHeader)).map(({ groups }) => {
    const flag = groups?.["flag"] || "";
    const text = groups?.["text"] || "";
    return {
      class: headerClass[`h${flag.length}`],
      text,
      active: false,
      link: slugger.slug(text),
    };
  });
};

const SectionDisplay = ({
  header,
  onClick,
}: {
  header: Header;
  onClick: (index: Header) => void;
}) => {
  return (
    <li className="mt-[10px]">
      <span
        onClick={() => onClick(header)}
        className={`text-[#7c7c7c] hover:text-black cursor-pointer ${header.class} ${header.active && "text-black"}`}
      >
        {header.text}
      </span>
    </li>
  );
};

const SectionSearch = ({ markDownPlan }: { markDownPlan: string }) => {
  const [headers, setHeaders] = useState<Header[]>([]);
  const [matchHeaders, setMatchHeaders] = useState<Header[]>([]);
  const stringHeaders = JSON.stringify(headers);
  useEffect(() => {
    setHeaders(getHeaders(markDownPlan));
  }, [markDownPlan]);

  useEffect(() => {
    setMatchHeaders(headers);
  }, [stringHeaders, headers]);

  const navigateToSection = (header: Header) => {
    const newHeaders = [
      ...headers.map((newHeader) => {
        newHeader.active = newHeader.link === header.link;
        return newHeader;
      }),
    ];
    const section = document.querySelector(`#${header.link}`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setHeaders(newHeaders);
  };

  return (
    <div className="flex flex-col justify-row p-5">
      <div className="w-full flex justify-center">
        <TextField
          id="outlined-start-adornment"
          sx={{ m: 1, width: "25ch", borderRadius: "20px" }}
          placeholder="Type to search"
          className="rounded"
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              setMatchHeaders(headers);
            } else {
              setMatchHeaders([
                ...headers.filter((header) =>
                  header.text.toLowerCase().includes(value.toLocaleLowerCase()),
                ),
              ]);
            }
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    edge="end"
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </div>
      <div>
        <ul className="list-none">
          {matchHeaders?.map((header, _idx) => (
            <SectionDisplay
              key={`section-select-${_idx}-g`}
              header={header}
              onClick={navigateToSection}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SectionSearch;
