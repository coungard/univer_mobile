module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['react-native-gesture-handler/jestSetup'],
  // These ship untranspiled ESM in node_modules; the RN preset only transforms
  // react-native/@react-native itself by default, so third-party RN libs must be added here too.
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      [
        '@react-native',
        'react-native',
        '@react-navigation',
        'react-native-gesture-handler',
        'react-native-screens',
        'react-native-safe-area-context',
        'react-native-paper',
        'react-native-vector-icons',
        'react-native-app-auth',
        'react-native-base64',
        'react-native-keychain',
      ].join('|') +
      ')/)',
  ],
};
