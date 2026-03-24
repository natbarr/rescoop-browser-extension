global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
  commands: {
    onCommand: { addListener: jest.fn() },
  },
  runtime: {
    onStartup: { addListener: jest.fn() },
    onInstalled: { addListener: jest.fn() },
  },
};
