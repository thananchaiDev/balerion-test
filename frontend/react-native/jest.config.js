module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/__mocks__/styleMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@shopify/flash-list|react-native-safe-area-context|react-native-screens|react-native-svg|lucide-react-native)/)',
  ],
};
