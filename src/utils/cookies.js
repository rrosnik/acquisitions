export const cookies = {
  getoptions: () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    samesite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  }),
  set: (res, name, value, options = {}) => {
    res.cookie(name, value, {
      ...cookies.getoptions(),
      ...options,
    });
  },
  clear: (res, name, options = {}) => {
    res.clearCookie(name, {
      ...cookies.getoptions(),
      ...options,
    });
  },
  get: (req, name) => {
    return req.cookie[name];
  },
};
