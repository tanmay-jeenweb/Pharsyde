const SettingModel = require('../models/settingModel');

// =========================================================================
// DEFAULT FALLBACK CONSTANTS
// (Matches Jasmin ERP: APK is placed in public_html/apk/app-release.apk)
// =========================================================================
const HARDCODED_APP_VERSION = '1.0.0';
const HARDCODED_MIN_VERSION = '1.0.0';
const HARDCODED_APK_URL = 'https://pharsyde.jeenhost.in/apk/app-release.apk';
const HARDCODED_FORCE_UPDATE = 'true';
const HARDCODED_RELEASE_NOTES = 'Performance improvements, checkout optimizations, and bug fixes.';

/**
 * Normalizes version strings for consistent comparison (e.g., 'v1.0.4 ' -> '1.0.4').
 */
const normalizeVersion = (v) => {
  if (v === undefined || v === null) return '';
  return String(v).trim().toLowerCase().replace(/^v/, '');
};

/**
 * Compares two dot-separated numeric version strings (e.g. '1.2.0' vs '1.1.9').
 * Returns:
 *   < 0 if v1 < v2
 *   = 0 if v1 === v2
 *   > 0 if v1 > v2
 */
const compareVersions = (v1, v2) => {
  const norm1 = normalizeVersion(v1);
  const norm2 = normalizeVersion(v2);

  if (norm1 === norm2) return 0;

  const parts1 = norm1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = norm2.split('.').map((p) => parseInt(p, 10) || 0);
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }

  return 0;
};

/**
 * Resolves active mobile version configuration settings.
 * Priority: Database (app_settings) -> Environment variables -> Code constants
 */
const getAppVersionConfig = async () => {
  try {
    const [latestDb, minDb, apkUrlDb, forceDb, notesDb] = await Promise.all([
      SettingModel.getValue('mobile_latest_version'),
      SettingModel.getValue('mobile_min_supported_version'),
      SettingModel.getValue('mobile_apk_url'),
      SettingModel.getValue('mobile_force_update'),
      SettingModel.getValue('mobile_release_notes'),
    ]);

    const latestVersion = (latestDb || process.env.LATEST_APP_VERSION || HARDCODED_APP_VERSION).trim();
    const minSupportedVersion = (minDb || process.env.MIN_SUPPORTED_APP_VERSION || HARDCODED_MIN_VERSION).trim();
    const downloadUrl = (apkUrlDb || process.env.APK_DOWNLOAD_URL || HARDCODED_APK_URL).trim();
    const forceUpdateEnabled = (forceDb !== null && forceDb !== undefined ? String(forceDb) : (process.env.MOBILE_FORCE_UPDATE || HARDCODED_FORCE_UPDATE)).toLowerCase() === 'true';
    const releaseNotes = notesDb || HARDCODED_RELEASE_NOTES;

    return {
      latestVersion,
      minSupportedVersion,
      downloadUrl,
      forceUpdateEnabled,
      releaseNotes,
    };
  } catch (err) {
    console.warn('[AppVersion] Could not fetch settings from DB, falling back to defaults:', err.message);
    return {
      latestVersion: (process.env.LATEST_APP_VERSION || HARDCODED_APP_VERSION).trim(),
      minSupportedVersion: (process.env.MIN_SUPPORTED_APP_VERSION || HARDCODED_MIN_VERSION).trim(),
      downloadUrl: (process.env.APK_DOWNLOAD_URL || HARDCODED_APK_URL).trim(),
      forceUpdateEnabled: (process.env.MOBILE_FORCE_UPDATE || HARDCODED_FORCE_UPDATE).toLowerCase() === 'true',
      releaseNotes: HARDCODED_RELEASE_NOTES,
    };
  }
};

/**
 * @route   GET/POST /api/app/check-update or /api/app/version
 * @desc    Check if mobile app requires an update and get active version details
 * @access  Public
 */
const checkAppVersion = async (req, res) => {
  try {
    const config = await getAppVersionConfig();
    const clientVersion = req.body?.version || req.query?.version || req.headers?.['x-app-version'];

    const responseData = {
      success: true,
      latestVersion: config.latestVersion,
      minSupportedVersion: config.minSupportedVersion,
      downloadUrl: config.downloadUrl,
      releaseNotes: config.releaseNotes,
    };

    if (clientVersion !== undefined && clientVersion !== null && String(clientVersion).trim()) {
      const cleanClientVersion = String(clientVersion).trim();
      const isSame = normalizeVersion(cleanClientVersion) === normalizeVersion(config.latestVersion);
      const isOlder = compareVersions(cleanClientVersion, config.latestVersion) < 0;
      const isBelowMin = compareVersions(cleanClientVersion, config.minSupportedVersion) < 0;

      const updateRequired = !isSame;
      // Force update is enforced if client is below min supported version, or if forceUpdate setting is enabled
      const forceUpdate = updateRequired && (isBelowMin || config.forceUpdateEnabled);

      responseData.currentVersion = cleanClientVersion;
      responseData.updateRequired = updateRequired;
      responseData.forceUpdate = forceUpdate;
      responseData.message = isSame
        ? `App is already up to date (v${config.latestVersion}).`
        : forceUpdate
        ? `A mandatory update is required. Please update to version ${config.latestVersion} to continue.`
        : `A new version (${config.latestVersion}) is available.`;
    } else {
      responseData.updateRequired = false;
      responseData.forceUpdate = false;
      responseData.message = `Latest available mobile app version is ${config.latestVersion}.`;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('[AppVersion] Error in checkAppVersion:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error checking app version',
    });
  }
};

/**
 * @route   GET /api/app/download
 * @desc    Direct APK download / redirect endpoint (matches Jasmin ERP)
 *          Redirects straight to public_html/apk/app-release.apk
 * @access  Public
 */
const downloadApk = async (req, res) => {
  try {
    const config = await getAppVersionConfig();
    const clientVersion = req.body?.version || req.query?.version || req.headers?.['x-app-version'];

    // If client specifically sent its version and it already matches, no need to download
    if (clientVersion && normalizeVersion(clientVersion) === normalizeVersion(config.latestVersion)) {
      return res.status(200).json({
        success: true,
        updateRequired: false,
        message: `App is already on the latest version (${config.latestVersion}). No download needed.`,
        latestVersion: config.latestVersion,
        downloadUrl: config.downloadUrl,
      });
    }

    // Redirect directly to the public_html/apk/app-release.apk URL
    return res.redirect(config.downloadUrl);
  } catch (error) {
    console.error('[AppVersion] Error in downloadApk:', error);
    const fallbackUrl = process.env.APK_DOWNLOAD_URL || HARDCODED_APK_URL;
    return res.redirect(fallbackUrl);
  }
};

/**
 * @route   POST/PUT /api/app/version
 * @desc    Update mobile version settings (Office Admin)
 * @access  Office Authenticated
 */
const setAppVersion = async (req, res) => {
  try {
    const {
      version,
      minVersion,
      apkUrl,
      forceUpdate,
      releaseNotes,
    } = req.body;

    if (version && String(version).trim()) {
      await SettingModel.upsert('mobile_latest_version', String(version).trim(), {
        label: 'Latest Mobile App Version',
        category: 'mobile_app',
      });
    }

    if (minVersion && String(minVersion).trim()) {
      await SettingModel.upsert('mobile_min_supported_version', String(minVersion).trim(), {
        label: 'Minimum Supported Mobile Version',
        category: 'mobile_app',
      });
    }

    if (apkUrl && String(apkUrl).trim()) {
      await SettingModel.upsert('mobile_apk_url', String(apkUrl).trim(), {
        label: 'Mobile APK Download URL',
        category: 'mobile_app',
      });
    }

    if (forceUpdate !== undefined && forceUpdate !== null) {
      await SettingModel.upsert('mobile_force_update', String(forceUpdate).toLowerCase() === 'true' ? 'true' : 'false', {
        label: 'Force Mobile App Update',
        category: 'mobile_app',
      });
    }

    if (releaseNotes !== undefined && releaseNotes !== null) {
      await SettingModel.upsert('mobile_release_notes', String(releaseNotes).trim(), {
        label: 'Mobile Release Notes',
        category: 'mobile_app',
      });
    }

    const updatedConfig = await getAppVersionConfig();

    return res.status(200).json({
      success: true,
      message: 'Mobile app version settings updated successfully.',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('[AppVersion] Error updating app version settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update mobile app version settings.',
    });
  }
};

module.exports = {
  HARDCODED_APP_VERSION,
  HARDCODED_APK_URL,
  normalizeVersion,
  compareVersions,
  getAppVersionConfig,
  checkAppVersion,
  downloadApk,
  setAppVersion,
};
