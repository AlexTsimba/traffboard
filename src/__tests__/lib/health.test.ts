/* eslint-disable unicorn/no-thenable */
import type { PrismaPromise } from "@prisma/client";
import { describe, it, expect, vi, afterEach } from "vitest";

import { checkDatabaseHealth } from "@/lib/health";
import { prisma } from "@/lib/prisma";

describe("checkDatabaseHealth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns healthy if query is fast", async () => {
    vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce(1);
    const result = await checkDatabaseHealth();
    expect(result.status).toBe("healthy");
    expect(typeof result.latency).toBe("number");
  });

  it("returns unhealthy if query throws", async () => {
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("fail"));
    const result = await checkDatabaseHealth();
    expect(result.status).toBe("unhealthy");
    expect(result.error).toMatch(/fail/);
  });

  it("returns unhealthy if query is too slow", async () => {
    const slowPromise = new Promise<number>((res) =>
      setTimeout(() => {
        res(1);
      }, 3500),
    );
    // Best practice: duck-typed PrismaPromise
    const slowPrismaPromise = {
      then: (...args: Parameters<Promise<number>["then"]>) => slowPromise.then(...args),
      catch: (...args: Parameters<Promise<number>["catch"]>) => slowPromise.catch(...args),
      finally: (...args: Parameters<Promise<number>["finally"]>) => slowPromise.finally(...args),
    };
    Object.defineProperty(slowPrismaPromise, Symbol.toStringTag, { value: "PrismaPromise" });
    vi.spyOn(prisma, "$queryRaw").mockImplementationOnce(() => slowPrismaPromise as PrismaPromise<number>);
    const result = await checkDatabaseHealth();
    expect(result.status).toBe("unhealthy");
    expect(result.error).toMatch(/High latency/);
  });
});
