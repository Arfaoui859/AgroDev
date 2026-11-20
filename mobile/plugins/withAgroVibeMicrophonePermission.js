const { withAndroidManifest } = require("@expo/config-plugins");

const MICROPHONE_PERMISSION = "android.permission.RECORD_AUDIO";
const AUDIO_SETTINGS_PERMISSION = "android.permission.MODIFY_AUDIO_SETTINGS";

module.exports = function withAgroVibeMicrophonePermission(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    const permissions = manifest["uses-permission"] ?? [];
    const names = new Set(
      permissions.map((entry) => entry?.$?.["android:name"]).filter(Boolean),
    );

    for (const permission of [MICROPHONE_PERMISSION, AUDIO_SETTINGS_PERMISSION]) {
      if (!names.has(permission)) {
        permissions.push({ $: { "android:name": permission } });
      }
    }

    manifest["uses-permission"] = permissions;
    return modConfig;
  });
};
