const request = require("supertest");
const app = require("../../backend/app");

describe("GET /", () => {
  it("responds with a running status message", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "API running..." });
  });
});
