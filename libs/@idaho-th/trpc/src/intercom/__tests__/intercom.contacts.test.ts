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

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  INTERCOM_ERROR_CODE,
  INTERCOM_ERROR_MESSAGE,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import { upsertContact } from "~@idaho-th/trpc/intercom/intercom.contacts";
import { IntercomApiError } from "~@idaho-th/trpc/intercom/intercom.http";

const CONTACT = { email: "a@b.com", externalId: "provider:p1", name: "A" };

function fakeFetch(
  handler: (method: string, path: string) => { status: number; body: unknown },
) {
  const calls: Array<{ method: string; path: string }> = [];
  const fetchFn = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const path = new URL(url).pathname;
    calls.push({ method, path });
    const { status, body } = handler(method, path);
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  return { calls, options: { token: "t", fetchFn: fetchFn as never } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("upsertContact", () => {
  it("writes straight to a known contact id without searching", async () => {
    const { calls, options } = fakeFetch(() => ({
      status: 200,
      body: { id: "ic-1", email: CONTACT.email },
    }));

    const result = await upsertContact(CONTACT, options, "ic-1");

    expect(result).toEqual({ status: "updated", contactId: "ic-1" });
    expect(calls).toEqual([{ method: "PUT", path: "/contacts/ic-1" }]);
  });

  it("creates without searching when no id is known", async () => {
    const { calls, options } = fakeFetch(() => ({
      status: 200,
      body: { id: "ic-2", email: CONTACT.email },
    }));

    const result = await upsertContact(CONTACT, options);

    expect(result).toEqual({ status: "created", contactId: "ic-2" });
    expect(calls).toEqual([{ method: "POST", path: "/contacts" }]);
  });

  it("adopts an archived pre-external_id contact without rewriting it", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              {
                message:
                  "An archived contact matching those details already exists with id=c0ffee00c0ffee00c0ffee00",
              },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      return {
        status: 200,
        body: {
          id: "c0ffee00c0ffee00c0ffee00",
          email: "a@b.com",
          archived: true,
        },
      };
    });

    const result = await upsertContact(CONTACT, options);

    expect(result).toEqual({
      status: "updated",
      contactId: "c0ffee00c0ffee00c0ffee00",
    });
    // Read before restore: the unarchive only follows a successful attribution.
    expect(calls).toEqual([
      { method: "POST", path: "/contacts" },
      { method: "POST", path: "/contacts/search" },
      { method: "GET", path: "/contacts/c0ffee00c0ffee00c0ffee00" },
      {
        method: "POST",
        path: "/contacts/c0ffee00c0ffee00c0ffee00/unarchive",
      },
    ]);
    // Adopted, not overwritten: no PUT anywhere in the exchange.
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
  });

  it("adopts across a case difference in the stored address", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              { message: "already exists with id=cafe01cafe01cafe01cafe01" },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      // Intercom returns the address in whatever case it was stored in; our input
      // is normalized. A raw comparison would refuse this legitimate adoption.
      return {
        status: 200,
        body: { id: "cafe01cafe01cafe01cafe01", email: "A@B.CoM" },
      };
    });

    await expect(upsertContact(CONTACT, options)).resolves.toEqual({
      status: "updated",
      contactId: "cafe01cafe01cafe01cafe01",
    });
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
  });

  it("refuses to adopt an external_id-less contact holding a different address", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              { message: "already exists with id=dead01dead01dead01dead01" },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      // Attributable to nobody, and not the address we intend to mail. Adopting
      // it would point every future send for this provider at someone else.
      return {
        status: 200,
        body: { id: "dead01dead01dead01dead01", email: "someone-else@b.com" },
      };
    });

    await expect(upsertContact(CONTACT, options)).rejects.toMatchObject({
      code: INTERCOM_ERROR_CODE.CONTACT_EMAIL_MISMATCH,
      retryable: false,
    });
    // Refused without writing: no PUT, and the id is never adopted.
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
  });

  it("refuses to adopt a contact with no address at all", async () => {
    const { options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              { message: "already exists with id=beef01beef01beef01beef01" },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      return { status: 200, body: { id: "beef01beef01beef01beef01" } };
    });

    await expect(upsertContact(CONTACT, options)).rejects.toMatchObject({
      code: INTERCOM_ERROR_CODE.CONTACT_EMAIL_MISMATCH,
    });
  });

  it("re-archives a restored contact whose address turns out to be someone else's", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              {
                message:
                  "An archived contact matching those details already exists with id=f00d01f00d01f00d01f00d01",
              },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      if (path.endsWith("/unarchive")) return { status: 200, body: {} };
      if (path.endsWith("/archive")) return { status: 200, body: {} };
      // Only readable once restored, and then it is not ours to mail.
      if (method === "GET") {
        return calls.some((c) => c.path.endsWith("/unarchive"))
          ? {
              status: 200,
              body: { id: "f00d01f00d01f00d01f00d01", email: "other@b.com" },
            }
          : { status: 404, body: {} };
      }
      return { status: 200, body: {} };
    });

    await expect(upsertContact(CONTACT, options)).rejects.toMatchObject({
      code: INTERCOM_ERROR_CODE.CONTACT_EMAIL_MISMATCH,
    });
    // The one state change it could not avoid is reverted.
    expect(calls.map((c) => c.path)).toContain(
      "/contacts/f00d01f00d01f00d01f00d01/archive",
    );
  });

  it("refuses to write to a contact whose external_id is another identity's", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              {
                message:
                  "A contact matching those details already exists with id=deadbeefdeadbeefdeadbeef",
              },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      return {
        status: 200,
        body: {
          id: "deadbeefdeadbeefdeadbeef",
          external_id: "staff:cm-9",
          email: CONTACT.email,
        },
      };
    });

    await expect(upsertContact(CONTACT, options)).rejects.toMatchObject({
      code: INTERCOM_ERROR_CODE.CONTACT_OWNED_BY_ANOTHER_IDENTITY,
      retryable: false,
    });
    // The case manager's contact is read and then left exactly as it was.
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
    expect(calls.some((c) => c.path.endsWith("/unarchive"))).toBe(false);
  });

  it("re-archives a restored contact it turns out not to own", async () => {
    const conflictId = "deadbeefdeadbeefdeadbeef";
    let restored = false;
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              {
                message: `An archived contact matching those details already exists with id=${conflictId}`,
              },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      if (path === `/contacts/${conflictId}/unarchive`) {
        restored = true;
        return { status: 200, body: { id: conflictId } };
      }
      if (path === `/contacts/${conflictId}/archive`) {
        restored = false;
        return { status: 200, body: { id: conflictId } };
      }
      // Archived contacts are not served, so ownership is only readable once
      // the contact has been restored.
      if (!restored) {
        return { status: 404, body: { errors: [{ message: "not_found" }] } };
      }
      return {
        status: 200,
        body: {
          id: conflictId,
          external_id: "staff:cm-9",
          email: CONTACT.email,
        },
      };
    });

    await expect(upsertContact(CONTACT, options)).rejects.toMatchObject({
      code: INTERCOM_ERROR_CODE.CONTACT_OWNED_BY_ANOTHER_IDENTITY,
      retryable: false,
    });
    // Restored only to read it, then put back: the workspace ends as it began.
    expect(calls.map((c) => c.path)).toEqual([
      "/contacts",
      "/contacts/search",
      `/contacts/${conflictId}`,
      `/contacts/${conflictId}/unarchive`,
      `/contacts/${conflictId}`,
      `/contacts/${conflictId}/archive`,
    ]);
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
    expect(restored).toBe(false);
  });

  it("pushes DB values when the named contact carries our own external_id", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              {
                message:
                  "A contact matching those details already exists with id=1c9f00dbeef1",
              },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      return {
        status: 200,
        body: {
          id: "1c9f00dbeef1",
          external_id: CONTACT.externalId,
          email: "old@b.com",
        },
      };
    });

    const result = await upsertContact(CONTACT, options);

    expect(result).toEqual({ status: "updated", contactId: "1c9f00dbeef1" });
    // Ours, so the stale email is repaired from the database.
    expect(calls).toContainEqual({
      method: "PUT",
      path: "/contacts/1c9f00dbeef1",
    });
  });

  it("surfaces the original 409 when the named contact cannot be read back", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              {
                message:
                  "A contact matching those details already exists with id=vanished",
              },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      return { status: 404, body: { errors: [{ message: "not_found" }] } };
    });

    await expect(upsertContact(CONTACT, options)).rejects.toMatchObject({
      status: 409,
      code: INTERCOM_ERROR_CODE.CONFLICT,
    });
    expect(calls.some((c) => c.method === "PUT")).toBe(false);
  });

  it("reports a terminal cause when the conflicting contact cannot be restored", async () => {
    const { options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return {
          status: 409,
          body: {
            errors: [
              {
                message:
                  "An archived contact matching those details already exists with id=c0ffee00c0ffee00c0ffee00",
              },
            ],
          },
        };
      }
      if (path === "/contacts/search") return { status: 200, body: {} };
      // Intercom will not serve a contact awaiting permanent deletion, so the
      // restore attempt is the only thing that can report why.
      if (!path.endsWith("/unarchive")) {
        return { status: 404, body: { errors: [{ message: "not_found" }] } };
      }
      return {
        status: 400,
        body: {
          errors: [
            {
              message:
                "User has been marked for permanent deletion and is not restorable.",
            },
          ],
        },
      };
    });

    await expect(upsertContact(CONTACT, options)).rejects.toMatchObject({
      message:
        INTERCOM_ERROR_MESSAGE[INTERCOM_ERROR_CODE.CONTACT_PENDING_DELETION],
      code: INTERCOM_ERROR_CODE.CONTACT_PENDING_DELETION,
      retryable: false,
    });
  });

  it("falls back to search when the 409 names no contact id", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "POST" && path === "/contacts") {
        return { status: 409, body: { errors: [{ message: "exists" }] } };
      }
      if (path === "/contacts/search") {
        return { status: 200, body: { data: [{ id: "ic-3" }] } };
      }
      return { status: 200, body: { id: "ic-3" } };
    });

    const result = await upsertContact(CONTACT, options);

    expect(result).toEqual({ status: "updated", contactId: "ic-3" });
    expect(calls.map((c) => c.path)).toEqual([
      "/contacts",
      "/contacts/search",
      "/contacts/ic-3",
    ]);
  });

  it("recovers by creating when the stored id is stale (404)", async () => {
    const { calls, options } = fakeFetch((method, path) => {
      if (method === "PUT" && path === "/contacts/gone") {
        return { status: 404, body: { errors: [{ message: "not_found" }] } };
      }
      return { status: 200, body: { id: "ic-4" } };
    });

    const result = await upsertContact(CONTACT, options, "gone");

    expect(result).toEqual({ status: "created", contactId: "ic-4" });
    expect(calls.map((c) => c.path)).toEqual(["/contacts/gone", "/contacts"]);
  });

  it("propagates a non-404 failure on the known-id write", async () => {
    const { calls, options } = fakeFetch(() => ({
      status: 403,
      body: { errors: [{ message: "forbidden" }] },
    }));

    await expect(
      upsertContact(CONTACT, options, "ic-5"),
    ).rejects.toBeInstanceOf(IntercomApiError);
    // Must not silently fall through to creating a duplicate contact.
    expect(calls).toEqual([{ method: "PUT", path: "/contacts/ic-5" }]);
  });
});
