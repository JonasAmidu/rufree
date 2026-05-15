const nativeAnimatedHelper =
  [
    'react-native/Libraries/Animated/NativeAnimatedHelper',
    'react-native/src/private/animated/NativeAnimatedHelper'
  ].find((moduleName) => {
    try {
      require.resolve(moduleName);
      return true;
    } catch {
      return false;
    }
  });

if (nativeAnimatedHelper) {
  jest.mock(nativeAnimatedHelper);
}

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
