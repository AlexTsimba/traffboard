vi.mock("../auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: "user-1", email: "test@example.com", role: "user" }),
  auditLog: vi.fn(),
}));

const updateMock = vi.fn();
const findUniqueMock = vi.fn();
vi.mock("../prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

import { authenticator } from "otplib";
import { describe, it, expect, vi, beforeEach } from "vitest";

import * as twoFactor from "../two-factor";

describe("2FA Critical Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws on invalid 2FA code", async () => {
    findUniqueMock
      .mockResolvedValueOnce({ totpSecret: null, email: "test@example.com" })
      .mockResolvedValueOnce({ totpSecret: null });
    vi.spyOn(authenticator, "check").mockReturnValueOnce(false);

    await expect(twoFactor.enable2FA("SECRET", "badcode")).rejects.toThrow("Invalid verification code");
    expect(updateMock).not.toHaveBeenCalled();
  });
});
