jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

const originalConsoleError = console.error;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const [firstArg] = args;

    if (
      typeof firstArg === 'string' &&
      firstArg.includes('not wrapped in act')
    ) {
      return;
    }

    originalConsoleError(...args);
  });
});

afterAll(() => {
  console.error.mockRestore();
});
