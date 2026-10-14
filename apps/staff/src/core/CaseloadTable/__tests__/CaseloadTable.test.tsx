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

import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
  BrowserRouter,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import useIsMobile from "../../../hooks/useIsMobile";
import { CaseloadTable } from "../CaseloadTable";

vi.mock("../../../hooks/useIsMobile");

type Row = {
  id: string;
  name: string;
  profileUrl: string;
};

const COLUMNS: ColumnDef<Row>[] = [
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
  },
  {
    id: "id",
    header: "ID",
    accessorKey: "id",
  },
];

const ROWS: Row[] = [
  { id: "a", name: "Alice", profileUrl: "/profile/a" },
  { id: "b", name: "Bob", profileUrl: "/profile/b" },
];

type ExtraProps = {
  rowLinkUrl?: (row: Row) => string;
  onRowClick?: (row: Row) => void;
};

function renderTable(props: ExtraProps) {
  return render(
    <BrowserRouter>
      <CaseloadTable<Row> data={ROWS} columns={COLUMNS} {...props} />
    </BrowserRouter>,
  );
}

beforeEach(() => {
  vi.mocked(useIsMobile).mockReturnValue({ isMobile: false, isTablet: false });
});

describe("CaseloadTable rowLinkUrl prop", () => {
  it("renders each row's cells wrapped in an <a href> when rowLinkUrl is provided", () => {
    renderTable({
      rowLinkUrl: (row: Row) => row.profileUrl,
    });

    const anchors = screen.getAllByRole("link");
    expect(anchors).toHaveLength(2);
    expect(anchors[0]).toHaveAttribute("href", "/profile/a");
    expect(anchors[1]).toHaveAttribute("href", "/profile/b");
    // The row's cell content lives inside the anchor.
    expect(within(anchors[0]).getByText("Alice")).toBeInTheDocument();
  });

  it("does not render anchors when rowLinkUrl is omitted", () => {
    renderTable({});

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("still fires onRowClick when rowLinkUrl is omitted (back-compat)", async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    renderTable({ onRowClick: handleRowClick });

    // Click the first body cell.
    await user.click(screen.getByText("Alice"));
    expect(handleRowClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("renders both anchors and supports onRowClick alongside rowLinkUrl", async () => {
    const user = userEvent.setup();
    const handleRowClick = vi.fn();

    renderTable({
      rowLinkUrl: (row: Row) => row.profileUrl,
      onRowClick: handleRowClick,
    });

    expect(screen.getAllByRole("link")).toHaveLength(2);
    await user.click(screen.getByText("Alice"));
    // The click bubbles up to the <tr>'s onClick, so the callback still fires.
    expect(handleRowClick).toHaveBeenCalled();
  });
});

describe("CaseloadTable row links are tenant-aware and stamp previousPage", () => {
  function LocationStateProbe() {
    const location = useLocation();
    const state = location.state as { previousPage?: string } | null;
    return <div data-testid="prev">{state?.previousPage ?? "none"}</div>;
  }

  it("appends the current tenantId to the row href and records previousPage on navigation", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/start?tenantId=US_MO"]}>
        <Routes>
          <Route
            path="/start"
            element={
              <CaseloadTable<Row>
                data={ROWS}
                columns={COLUMNS}
                rowLinkUrl={(row) => row.profileUrl}
              />
            }
          />
          <Route path="/profile/:id" element={<LocationStateProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    // The shared `Link` inside CaseloadTable appends tenantId to the href...
    expect(screen.getAllByRole("link")[0]).toHaveAttribute(
      "href",
      "/profile/a?tenantId=US_MO",
    );
    // ...and stamps the originating URL as `previousPage` for the destination.
    await user.click(screen.getByText("Alice"));
    expect(screen.getByTestId("prev")).toHaveTextContent(
      "/start?tenantId=US_MO",
    );
  });
});

describe("CaseloadTable pagination prop", () => {
  // Twelve rows in reverse name order, so a correct sort has to look past
  // the first page to find "Person 01".
  const MANY_ROWS: Row[] = Array.from({ length: 12 }, (_, index) => {
    const number = String(12 - index).padStart(2, "0");
    return { id: number, name: `Person ${number}`, profileUrl: "" };
  });

  /** Holds the page state, as a real caller does, and shows the page index. */
  function PagedTable({ data }: { data: Row[] }) {
    const [pagination, setPagination] = useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
    return (
      <BrowserRouter>
        <CaseloadTable<Row>
          data={data}
          columns={COLUMNS}
          initialState={{ sorting: [{ id: "name", desc: false }] }}
          pagination={{ state: pagination, onChange: setPagination }}
        />
        <button onClick={() => setPagination((p) => ({ ...p, pageIndex: 1 }))}>
          Page 2
        </button>
        <output>page index {pagination.pageIndex}</output>
      </BrowserRouter>
    );
  }

  const bodyRowCount = () => screen.getAllByRole("row").length - 1;

  it("sorts every row before splitting them into pages", () => {
    render(<PagedTable data={MANY_ROWS} />);

    expect(bodyRowCount()).toBe(10);
    expect(screen.getByText("Person 01")).toBeInTheDocument();
    expect(screen.queryByText("Person 11")).not.toBeInTheDocument();
  });

  it("goes back to the first page when the data changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PagedTable data={MANY_ROWS} />);
    await user.click(screen.getByText("Page 2"));
    expect(screen.getByText("Person 11")).toBeInTheDocument();

    rerender(<PagedTable data={MANY_ROWS.slice(1)} />);

    // The table queues its page reset, so it lands after this render.
    expect(await screen.findByText("page index 0")).toBeInTheDocument();
    expect(screen.getByText("Person 01")).toBeInTheDocument();
  });
});
