const User = require("../../../backend/models/User");

describe("User model", () => {
  it("fails validation when required fields are missing", () => {
    const user = new User({});
    const err = user.validateSync();

    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  it("passes validation when all required fields are present", () => {
    const user = new User({
      email: "jane@example.com",
      password: "hashed-password",
      fullName: "Jane Doe",
    });

    expect(user.validateSync()).toBeUndefined();
  });

  it("does not require fullName", () => {
    const user = new User({
      email: "jane@example.com",
      password: "hashed-password",
    });

    expect(user.validateSync()).toBeUndefined();
  });
});
