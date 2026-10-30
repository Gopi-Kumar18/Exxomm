jest.mock("bcryptjs");
jest.mock("../../../backend/models/User");
jest.mock("../../../backend/utils/utility.function");

const bcrypt = require("bcryptjs");
const User = require("../../../backend/models/User");
const { checkPassword, newToken } = require("../../../backend/utils/utility.function");
const {
  signUpUser,
  signInUser,
  getUser,
} = require("../../../backend/controller/user.controller");
const { mockRequest, mockResponse } = require("../../helpers/mockExpress");

describe("signUpUser", () => {
  afterEach(() => jest.clearAllMocks());

  it("creates the user with a hashed password and responds with 201", async () => {
    bcrypt.hash.mockResolvedValue("hashed-password");
    User.create.mockResolvedValue({});

    const req = mockRequest({
      body: { email: "a@a.com", password: "plain-password" },
    });
    const res = mockResponse();

    await signUpUser(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("plain-password", 8);
    expect(User.create).toHaveBeenCalledWith({
      email: "a@a.com",
      password: "hashed-password",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith("Sucessfully account opened ");
  });

  it("responds with 400 when the email is already registered", async () => {
    bcrypt.hash.mockResolvedValue("hashed-password");
    User.create.mockRejectedValue({ code: 11000 });

    const req = mockRequest({
      body: { email: "a@a.com", password: "plain-password" },
    });
    const res = mockResponse();

    await signUpUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Email already in use");
  });

  it("responds with 500 on an unexpected database error", async () => {
    bcrypt.hash.mockResolvedValue("hashed-password");
    User.create.mockRejectedValue(new Error("db down"));

    const req = mockRequest({
      body: { email: "a@a.com", password: "plain-password" },
    });
    const res = mockResponse();

    await signUpUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Something wrong please try again");
  });
});

describe("signInUser", () => {
  afterEach(() => jest.clearAllMocks());

  it("responds with 400 when the user does not exist", async () => {
    User.findOne.mockResolvedValue(null);

    const req = mockRequest({ body: { email: "a@a.com", password: "x" } });
    const res = mockResponse();

    await signInUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("You have to Sign up first !");
  });

  it("responds with 400 when the password is wrong", async () => {
    User.findOne.mockResolvedValue({ password: "hashed-password" });
    checkPassword.mockResolvedValue(false);

    const req = mockRequest({ body: { email: "a@a.com", password: "wrong" } });
    const res = mockResponse();

    await signInUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("InValid password !");
  });

  it("responds with a token when the credentials are correct", async () => {
    const user = { _id: "user-1", password: "hashed-password" };
    User.findOne.mockResolvedValue(user);
    checkPassword.mockResolvedValue(true);
    newToken.mockReturnValue("signed-jwt-token");

    const req = mockRequest({
      body: { email: "a@a.com", password: "correct" },
    });
    const res = mockResponse();

    await signInUser(req, res);

    expect(newToken).toHaveBeenCalledWith(user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      status: "ok",
      token: "signed-jwt-token",
    });
  });

  it("responds with 500 on an unexpected database error", async () => {
    User.findOne.mockRejectedValue(new Error("db down"));

    const req = mockRequest({ body: { email: "a@a.com", password: "x" } });
    const res = mockResponse();

    await signInUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("getUser", () => {
  it("responds with the user attached to the request", async () => {
    const req = mockRequest({ user: { _id: "user-1", email: "a@a.com" } });
    const res = mockResponse();

    await getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ user: req.user });
  });
});
