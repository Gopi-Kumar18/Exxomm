const mockRequest = (overrides = {}) => ({
  headers: {},
  params: {},
  body: {},
  user: null,
  ...overrides,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

module.exports = { mockRequest, mockResponse };
