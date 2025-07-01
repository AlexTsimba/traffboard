/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock API handler function
function conversionsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Mock data
    const conversions = [
      { id: "1", title: "Landing Page A", value: 1500, date: "2024-01-15" },
      { id: "2", title: "Campaign B", value: 2300, date: "2024-01-16" },
    ];

    res.status(200).json({ conversions });
    return;
  }

  if (req.method === "POST") {
    const { title, value } = req.body;

    if (!title || !value) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const newConversion = {
      id: Date.now().toString(),
      title,
      value: Number(value),
      date: new Date().toISOString().split("T")[0],
    };

    res.status(201).json({ conversion: newConversion });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}

describe("/api/conversions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns list of conversions", () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
    });

    conversionsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const data = JSON.parse(res._getData() as string) as {
      conversions: { id: string; title: string; value: number }[];
    };
    expect(data.conversions).toHaveLength(2);
    expect(data.conversions[0]).toMatchObject({
      id: "1",
      title: "Landing Page A",
      value: 1500,
    });
  });

  it("POST creates new conversion with valid data", () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        title: "New Campaign",
        value: 1800,
      },
    });

    conversionsHandler(req, res);

    expect(res._getStatusCode()).toBe(201);

    const data = JSON.parse(res._getData() as string) as {
      conversion: { id: string; title: string; value: number; date: string };
    };
    expect(data.conversion).toMatchObject({
      title: "New Campaign",
      value: 1800,
    });
    expect(data.conversion.id).toBeDefined();
    expect(data.conversion.date).toBeDefined();
  });

  it("POST returns 400 with missing fields", () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        title: "Incomplete Data",
        // missing value
      },
    });

    conversionsHandler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const data = JSON.parse(res._getData() as string) as { error: string };
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 405 for unsupported methods", () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "DELETE",
    });

    conversionsHandler(req, res);

    expect(res._getStatusCode()).toBe(405);

    const data = JSON.parse(res._getData() as string) as { error: string };
    expect(data.error).toBe("Method not allowed");
  });
});
