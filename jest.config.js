// Schedule previews use local time; keep DST cases independent of the host.
process.env.TZ = 'Europe/London';

module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
};
