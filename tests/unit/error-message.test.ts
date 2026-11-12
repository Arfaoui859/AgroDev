/**
 * The login/signup catch blocks read `error.message.includes(...)`. When the
 * rejection is not an `Error` with a string message that secondary call throws
 * a TypeError inside the catch, unmounts the page and shows the generic
 * "حدث خطأ غير متوقع" boundary. These helpers must never throw.
 */
import {
  errorMessageText,
  errorMessageIncludes,
} from "../../client/lib/errorMessage";

describe("errorMessageText", () => {
  test("returns the message of an Error", () => {
    expect(errorMessageText(new Error("boom"))).toBe("boom");
  });

  test("returns a bare string unchanged", () => {
    expect(errorMessageText("Invalid login credentials")).toBe("Invalid login credentials");
  });

  test("returns a Supabase-style object message", () => {
    expect(errorMessageText({ message: "Email not confirmed", code: "400" })).toBe(
      "Email not confirmed",
    );
  });

  test.each([undefined, null, 0, {}, { message: undefined }, { message: 42 }])(
    "returns an empty string for %p",
    (value) => {
      expect(errorMessageText(value)).toBe("");
    },
  );
});

describe("errorMessageIncludes", () => {
  test("matches case-insensitively", () => {
    expect(errorMessageIncludes(new Error("Invalid Login Credentials"), "invalid login credentials")).toBe(true);
  });

  test("does not throw on a malformed error (the regression)", () => {
    expect(() => errorMessageIncludes(undefined, "already registered")).not.toThrow();
    expect(errorMessageIncludes(undefined, "already registered")).toBe(false);
    expect(errorMessageIncludes({}, "already registered")).toBe(false);
  });

  test("matches a bare-string rejection", () => {
    expect(errorMessageIncludes("Email not confirmed", "email not confirmed")).toBe(true);
  });
});
