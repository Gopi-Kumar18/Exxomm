const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  checkPassword,
  newToken,
  verifyToken,
} = require("../../../backend/utils/utility.function");

describe("checkPassword", () => {
  it("resolves true when the password matches the hash", async () => {
    const hash = await bcrypt.hash("correct-password", 4);
    await expect(checkPassword("correct-password", hash)).resolves.toBe(
      true,
    );
  });

  it("resolves false when the password does not match the hash", async () => {
    const hash = await bcrypt.hash("correct-password", 4);
    await expect(checkPassword("wrong-password", hash)).resolves.toBe(false);
  });
});

describe("newToken", () => {
  it("signs a JWT containing the user id", () => {
    const token = newToken({ _id: "user-id-123" });
    const payload = jwt.decode(token);

    expect(typeof token).toBe("string");
    expect(payload.id).toBe("user-id-123");
    expect(payload.exp).toBeDefined();
  });

  it("signs the token with the configured JWT secret", () => {
    const token = newToken({ _id: "user-id-123" });

    expect(() =>
      jwt.verify(token, process.env.JWT_SECRET),
    ).not.toThrow();
  });
});

describe("verifyToken", () => {
  it("rejects when no token is provided", async () => {
    await expect(verifyToken(undefined)).rejects.toThrow(
      "No token provided",
    );
  });

  it("resolves with the payload for a valid token", async () => {
    const token = newToken({ _id: "user-id-456" });
    const payload = await verifyToken(token);

    expect(payload.id).toBe("user-id-456");
  });

  it("rejects for a token signed with a different secret", async () => {
    const tamperedToken = jwt.sign({ id: "user-id-456" }, "wrong-secret");

    await expect(verifyToken(tamperedToken)).rejects.toBeDefined();
  });

  it("rejects for a malformed token string", async () => {
    await expect(verifyToken("not-a-real-token")).rejects.toBeDefined();
  });
});
