jest.mock("../../backend/models/User");

const request = require("supertest");
const app = require("../../backend/app");
const User = require("../../backend/models/User");
const { newToken } = require("../../backend/utils/utility.function");

describe("POST /api/user/signup", () => {
  afterEach(() => jest.clearAllMocks());

  it("creates a new account and responds with 201", async () => {
    User.create.mockResolvedValue({});

    const res = await request(app)
      .post("/api/user/signup")
      .send({ email: "a@a.com", password: "plain-password" });

    expect(res.status).toBe(201);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@a.com" }),
    );
    expect(User.create.mock.calls[0][0].password).not.toBe("plain-password");
  });

  it("responds with 400 when the email is already registered", async () => {
    User.create.mockRejectedValue({ code: 11000 });

    const res = await request(app)
      .post("/api/user/signup")
      .send({ email: "a@a.com", password: "plain-password" });

    expect(res.status).toBe(400);
    expect(res.text).toBe("Email already in use");
  });
});

describe("POST /api/user/signin", () => {
  afterEach(() => jest.clearAllMocks());

  it("responds with 400 when the user does not exist", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/user/signin")
      .send({ email: "nobody@a.com", password: "x" });

    expect(res.status).toBe(400);
    expect(res.text).toBe("You have to Sign up first !");
  });

  it("responds with 400 when the password is wrong", async () => {
    const bcrypt = require("bcryptjs");
    User.findOne.mockResolvedValue({
      _id: "user-1",
      password: bcrypt.hashSync("correct-password", 8),
    });

    const res = await request(app)
      .post("/api/user/signin")
      .send({ email: "a@a.com", password: "wrong-password" });

    expect(res.status).toBe(400);
    expect(res.text).toBe("InValid password !");
  });

  it("responds with a valid token when the credentials are correct", async () => {
    const bcrypt = require("bcryptjs");
    const user = {
      _id: "user-1",
      email: "a@a.com",
      password: bcrypt.hashSync("correct-password", 8),
    };
    User.findOne.mockResolvedValue(user);

    const res = await request(app)
      .post("/api/user/signin")
      .send({ email: "a@a.com", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.token).toBe("string");
  });
});

describe("GET /api/user/me", () => {
  afterEach(() => jest.clearAllMocks());

  it("responds with user null when no token is provided", async () => {
    const res = await request(app).get("/api/user/me");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it("responds with the authenticated user when a valid token is provided", async () => {
    const user = { _id: "user-1", email: "a@a.com" };
    User.findById.mockResolvedValue(user);
    const token = newToken({ _id: "user-1" });

    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${token}`);

    expect(User.findById).toHaveBeenCalledWith("user-1", { password: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user });
  });

  it("responds with user null when the token is invalid", async () => {
    const res = await request(app)
      .get("/api/user/me")
      .set("Authorization", "Bearer not-a-real-token");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });
});
