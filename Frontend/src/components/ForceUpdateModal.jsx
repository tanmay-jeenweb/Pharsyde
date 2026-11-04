import React from 'react';
import { Download, AlertTriangle, ArrowRight, Sparkles, ShieldAlert } from 'lucide-react';

/**
 * ForceUpdateModal
 * 
 * An un-dismissible (or soft prompt) modal that informs mobile / client users
 * when a new application version is required or available.
 * 
 * @param {Object} props
 * @param {Object} props.updateData - Version check response data
 * @param {string} props.updateData.latestVersion
 * @param {string} props.updateData.currentVersion
 * @param {string} props.updateData.downloadUrl
 * @param {boolean} props.updateData.forceUpdate
 * @param {string} [props.updateData.releaseNotes]
 * @param {Function} [props.onDismiss] - Handler when update is optional and user chooses later
 */
export default function ForceUpdateModal({ updateData, onDismiss }) {
  if (!updateData || !updateData.updateRequired) {
    return null;
  }

  const {
    latestVersion = '1.0.0',
    currentVersion = '1.0.0',
    downloadUrl = '/download/apk',
    forceUpdate = true,
    releaseNotes = '',
  } = updateData;

  const handleUpdateClick = () => {
    // Open APK download URL in browser / system download manager
    window.location.href = downloadUrl || '/download/apk';
  };

  return (
    <div
      className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Art & Icon */}
        <div className={`p-6 text-center border-b relative ${
          forceUpdate
            ? 'bg-gradient-to-b from-purple-50 via-purple-100/40 to-white border-purple-100'
            : 'bg-gradient-to-b from-blue-50 via-slate-50 to-white border-slate-100'
        }`}>
          {/* Animated Update Icon Badge */}
          <div className="relative mx-auto w-16 h-16 mb-3">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              forceUpdate ? 'bg-purple-600 text-white shadow-purple-600/30' : 'bg-slate-900 text-white shadow-slate-900/30'
            }`}>
              {forceUpdate ? (
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              ) : (
                <Download className="w-8 h-8" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {forceUpdate ? 'Update Required' : 'New Version Available'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {forceUpdate
              ? 'To continue using Pharsyde, please update to the latest version now.'
              : 'A new update is available with performance improvements and fixes.'}
          </p>

          {/* Version Transition Chip */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-xs">
            <span className="text-slate-400">v{currentVersion}</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-purple-700 font-extrabold">v{latestVersion}</span>
          </div>
        </div>

        {/* Release Notes Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              What's New in v{latestVersion}
            </span>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-h-36 overflow-y-auto text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line scrollbar-thin">
              {releaseNotes || 'Performance improvements, checkout optimizations, and critical bug fixes.'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleUpdateClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-purple-700 hover:bg-purple-800 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-purple-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Update Now (Download APK)</span>
            </button>

            {!forceUpdate && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Remind Me Later
              </button>
            )}
          </div>

          {forceUpdate && (
            <p className="text-[11px] text-center text-slate-400 font-medium">
              You must install this update to continue using the app.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

