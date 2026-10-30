jest.mock("../../../backend/models/User");
jest.mock("../../../backend/utils/utility.function");

const User = require("../../../backend/models/User");
const { verifyToken } = require("../../../backend/utils/utility.function");
const {
  sendResponseError,
  verifyUser,
} = require("../../../backend/middleware/middleware");
const { mockRequest, mockResponse } = require("../../helpers/mockExpress");

describe("sendResponseError", () => {
  it("sends the given status code and message", () => {
    const res = mockResponse();

    sendResponseError(404, "Not found", res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Not found");
  });

  it("defaults to 400 and a generic message when nothing is given", () => {
    const res = mockResponse();

    sendResponseError(undefined, undefined, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid input !!");
  });

  it("defaults only the status code when a message is given", () => {
    const res = mockResponse();

    sendResponseError(undefined, "custom message", res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("custom message");
  });
});

describe("verifyUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets req.user to null and continues when there is no Authorization header", async () => {
    const req = mockRequest({ headers: {} });
    const res = mockResponse();
    const next = jest.fn();

    await verifyUser(req, res, next);

    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("sets req.user to null when the Authorization header is not a Bearer token", async () => {
    const req = mockRequest({ headers: { authorization: "Basic abc123" } });
    const res = mockResponse();
    const next = jest.fn();

    await verifyUser(req, res, next);

    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("attaches the user to req when the token is valid", async () => {
    const fakeUser = { _id: "user-1", email: "a@a.com" };
    verifyToken.mockResolvedValue({ id: "user-1" });
    User.findById.mockResolvedValue(fakeUser);

    const req = mockRequest({ headers: { authorization: "Bearer good-token" } });
    const res = mockResponse();
    const next = jest.fn();

    await verifyUser(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith("good-token");
    expect(User.findById).toHaveBeenCalledWith("user-1", { password: 0 });
    expect(req.user).toEqual(fakeUser);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("sets req.user to null and continues when the token is invalid", async () => {
    verifyToken.mockRejectedValue(new Error("jwt malformed"));

    const req = mockRequest({ headers: { authorization: "Bearer bad-token" } });
    const res = mockResponse();
    const next = jest.fn();

    await verifyUser(req, res, next);

    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
