/**
 * Regression: pages that assign state to the whole parsed response body used to
 * crash on a fail-closed endpoint.
 *
 * The stub routers answer `503 { success:false, data:null }`. `response.json()`
 * resolves to that envelope object, which is truthy, so `setX(body)` stored a
 * non-array. The next `x.map`/`x.filter` threw and the generic error boundary
 * rendered "حدث خطأ غير متوقع". `payloadList`/`payloadObject` must return an
 * empty/neutral shape for a failed call and never fabricate content.
 */
import { payloadList, payloadObject } from "../../client/lib/apiPayload";

function res(status: number): Response {
  return { ok: status >= 200 && status < 300, status } as Response;
}

const envelope = {
  success: false,
  code: "PREDICTIVE_MODELS_NOT_VALIDATED",
  data: null,
};

describe("payloadList", () => {
  test("returns [] for a fail-closed envelope (would otherwise crash .map)", () => {
    expect(payloadList(res(503), envelope)).toEqual([]);
  });

  test("returns [] when a 200 body is an object, not an array", () => {
    expect(payloadList(res(200), { data: null })).toEqual([]);
  });

  test("unwraps a successful enveloped list", () => {
    expect(payloadList(res(200), { success: true, data: [{ id: 1 }] })).toEqual([
      { id: 1 },
    ]);
  });

  test("returns a bare array body as-is", () => {
    expect(payloadList(res(200), [1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe("payloadObject", () => {
  test("returns null for a fail-closed envelope", () => {
    expect(payloadObject(res(503), envelope)).toBeNull();
  });

  test("returns null when a 200 envelope reports failure", () => {
    expect(payloadObject(res(200), { success: false, data: { a: 1 } })).toBeNull();
  });

  test("unwraps a successful enveloped object", () => {
    expect(payloadObject(res(200), { success: true, data: { a: 1 } })).toEqual({
      a: 1,
    });
  });

  test("passes through a non-enveloped object", () => {
    expect(payloadObject(res(200), { a: 1 })).toEqual({ a: 1 });
  });
});
