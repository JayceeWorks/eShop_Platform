// Extends app.json. Plain-HTTP API access is allowed only in builds that set
// ALLOW_HTTP_API=true (the "preview" profile in eas.json), so the test APK can reach
// the API on this PC over Wi-Fi. Production builds stay HTTPS-only.
const allowHttpApi = process.env.ALLOW_HTTP_API === 'true';

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['expo-build-properties', { android: { usesCleartextTraffic: allowHttpApi } }],
  ],
});
