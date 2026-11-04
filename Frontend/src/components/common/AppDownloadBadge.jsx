import React, { useId } from 'react';

const DEFAULT_VERSION = "01.00.00";
const DEFAULT_DOWNLOAD_URL = "";

/**
 * AppDownloadBadge component for Pharsyde Customer Home & Navigation
 */
export default function AppDownloadBadge({
  downloadUrl = DEFAULT_DOWNLOAD_URL,
  version = DEFAULT_VERSION,
  showVersion = true,
  variant = "light",
  className = ""
}) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const formattedVersion = version.startsWith("v") ? version : `v${version}`;

  const isDark = variant === "dark";

  const containerClasses = isDark
    ? "bg-slate-900/90 hover:bg-slate-800 border-slate-700/70 hover:border-[#8EF705]/60 text-white shadow-md hover:shadow-lg hover:shadow-[#8EF705]/10"
    : "bg-white hover:bg-slate-50 border-slate-300/80 hover:border-slate-400 text-slate-800 shadow-xs hover:shadow-md";

  const subtitleClasses = isDark ? "text-slate-400" : "text-slate-500";
  const titleClasses = isDark ? "text-white group-hover:text-[#8EF705]" : "text-slate-900 group-hover:text-slate-950";
  const dividerClasses = isDark ? "border-slate-800" : "border-slate-200";

  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      download
      title={`Download Android App (${formattedVersion})`}
      className={`group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer select-none ${containerClasses} ${className}`}
    >
      {/* Google Play Store SVG Icon */}
      <svg viewBox="0 0 512 512" className="w-5 h-5 flex-shrink-0 drop-shadow-xs" aria-hidden="true">
        <defs>
          <linearGradient id={`gplay-blue-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0077FF" />
          </linearGradient>
          <linearGradient id={`gplay-green-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F076" />
            <stop offset="100%" stopColor="#00A843" />
          </linearGradient>
          <linearGradient id={`gplay-yellow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE000" />
            <stop offset="100%" stopColor="#FF9900" />
          </linearGradient>
          <linearGradient id={`gplay-red-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3A44" />
            <stop offset="100%" stopColor="#C9182B" />
          </linearGradient>
        </defs>
        <path
          d="M32.5 7.6c-4.3 4.5-6.8 11.6-6.8 20.6v455.6c0 9 2.5 16.1 6.8 20.6l2.4 2.2 255.4-255.4v-6L34.9 5.4l-2.4 2.2z"
          fill={`url(#gplay-blue-${id})`}
        />
        <path
          d="M376.7 174.6L74.8 2.3C57.4-7.6 41.9-6.4 32.5 3.6L290.3 261l86.4-86.4z"
          fill={`url(#gplay-green-${id})`}
        />
        <path
          d="M376.7 337.4L290.3 251 32.5 508.8c9.4 10 24.9 11.2 42.3 1.3l301.9-172.7z"
          fill={`url(#gplay-red-${id})`}
        />
        <path
          d="M374.8 338.4l-84.5-84.5v-6l84.5-84.5 1.9 1.1 100.2 56.9c28.6 16.2 28.6 42.8 0 59.1l-100.2 56.9-1.9 1z"
          fill={`url(#gplay-yellow-${id})`}
        />
      </svg>

      {/* Text Content */}
      <div className="flex flex-col text-left leading-tight">
        <span className={`text-[8px] uppercase tracking-wider font-semibold transition-colors ${subtitleClasses}`}>
          GET IT ON
        </span>
        <span className={`text-xs font-bold tracking-tight transition-colors ${titleClasses}`}>
          Google Play
        </span>
      </div>

      {/* APK indicator */}
      <span className={`ml-0.5 pl-2 border-l ${dividerClasses} text-[10px] font-medium flex items-center gap-1 text-[#468202] group-hover:text-[#2d5601]`}>
        <span className="font-bold">APK</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </span>

      {/* Version badge */}
      {showVersion && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold border tracking-tight bg-slate-100 border-slate-200 text-slate-700">
          {formattedVersion}
        </span>
      )}
    </a>
  );
}