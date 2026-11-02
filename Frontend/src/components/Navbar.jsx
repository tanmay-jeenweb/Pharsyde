import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logoImage from "../assets/image.webp";

export default function Navbar({ title = "ERP Admin" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("office_user") || localStorage.getItem("user") || "{}");
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [masterSearch, setMasterSearch] = useState("");
    const [orgLogo] = useState(logoImage);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (isOpen && !e.target.closest("#custom-nav-dropdown")) {
                setIsOpen(false);
            }
            if (isProfileOpen && !e.target.closest("#profile-dropdown")) {
                setIsProfileOpen(false);
            }
            if (isReportsOpen && !e.target.closest("#reports-dropdown")) {
                setIsReportsOpen(false);
            }
        };
        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [isOpen, isProfileOpen, isReportsOpen]);

    const closeAllDropdowns = () => {
        setIsOpen(false);
        setIsProfileOpen(false);
        setIsReportsOpen(false);
        setMasterSearch("");
    };

    const toggleMasters = () => {
        const nextState = !isOpen;
        closeAllDropdowns();
        setIsOpen(nextState);
        setMasterSearch("");
    };

    const toggleProfile = () => {
        const nextState = !isProfileOpen;
        closeAllDropdowns();
        setIsProfileOpen(nextState);
    };

    const toggleReports = () => {
        const nextState = !isReportsOpen;
        closeAllDropdowns();
        setIsReportsOpen(nextState);
    };

    const handleLogout = () => {
        localStorage.removeItem("office_token");
        localStorage.removeItem("office_user");
        localStorage.removeItem("office_permissions");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("loginTime");
        navigate("/office/login");
    };

    // Masters available in the office portal
    const allMasters = [
        {
            name: "Order Master",
            path: "/office/orders",
            masterKey: "order_master",
            icon: "fa-solid fa-receipt",
            color: "bg-purple-50 text-purple-700 border border-purple-100/50",
            activeColor: "bg-purple-100 text-purple-800",
            desc: "Storefront customer sales orders & TechPOS purchase orders"
        },
        {
            name: "User Master",
            path: "/office/user-master",
            masterKey: "user_master",
            icon: "fa-solid fa-users",
            color: "bg-emerald-50 text-emerald-700 border border-emerald-100/50",
            activeColor: "bg-emerald-100 text-emerald-800",
            desc: "Manage operator accounts, access rights and statuses"
        },
        {
            name: "User Type Master",
            path: "/office/user-type-master",
            masterKey: "user_type_master",
            icon: "fa-solid fa-shield-halved",
            color: "bg-teal-50 text-teal-700 border border-teal-100/50",
            activeColor: "bg-teal-100 text-teal-800",
            desc: "Define roles and master CRUD permission matrices"
        },
        {
            name: "Product Master",
            path: "/office/product-master",
            masterKey: "product_master",
            icon: "fa-solid fa-boxes-stacked",
            color: "bg-emerald-50 text-emerald-700 border border-emerald-100/50",
            activeColor: "bg-emerald-100 text-emerald-800",
            desc: "Product catalog, SKU, pricing & stock management"
        },
        {
            name: "Product Image Master",
            path: "/office/product-image-master",
            masterKey: "product_image_master",
            icon: "fa-solid fa-images",
            color: "bg-teal-50 text-teal-700 border border-teal-100/50",
            activeColor: "bg-teal-100 text-teal-800",
            desc: "TechPOS image repository and synchronization"
        }
    ];

    const filteredMasters = allMasters.filter(m =>
        m.name.toLowerCase().includes(masterSearch.trim().toLowerCase())
    );

    const reportsLinks = [
        {
            name: "Activity Report",
            path: "/office/activity-report",
            icon: "fa-solid fa-list-check",
            desc: "Audit logs, user actions & JSON diffs"
        }
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-slate-200 flex flex-col font-sans">
            {/* Top First Row */}
            <div className="relative z-50 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img 
                        src={orgLogo} 
                        alt="Logo" 
                        className="h-10 w-auto object-contain cursor-pointer" 
                        onClick={() => navigate("/office/dashboard")}
                    />
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    {/* Live Storefront Link */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-[#047857] hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        title="View Public Store"
                    >
                        <i className="fa-solid fa-store text-xs"></i>
                        <span>Live Store</span>
                    </a>

                    {/* Notification Icon */}
                    <button 
                        className="text-slate-500 hover:text-emerald-700 transition-colors relative cursor-pointer" 
                        title="Notifications"
                        onClick={() => navigate("/office/activity-report")}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                        </svg>
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative" id="profile-dropdown">
                        <button
                            onClick={toggleProfile}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-200 cursor-pointer focus:outline-none"
                            title="User menu"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-[#064e3b] flex items-center justify-center font-bold text-sm shadow-sm">
                                {user.name ? user.name[0].toUpperCase() : (user.username ? user.username[0].toUpperCase() : "A")}
                            </div>
                            <span className="hidden sm:inline text-sm font-semibold text-slate-700">
                                {user.name || user.username || "Administrator"}
                            </span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="px-4 py-2.5 border-b border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                                    <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user.name || "Administrator"}</p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{user.email || "admin@pharsyde.com"}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-[#064e3b]">
                                        {user.user_type || user.role || "Admin"}
                                    </span>
                                </div>

                                <div className="px-1.5 py-1">
                                    <button
                                        onClick={() => {
                                            navigate("/office/dashboard");
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all duration-150 cursor-pointer text-left"
                                    >
                                        <i className="fa-solid fa-gauge-high text-slate-400 text-xs"></i>
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate("/office/activity-report");
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all duration-150 cursor-pointer text-left"
                                    >
                                        <i className="fa-solid fa-list-check text-slate-400 text-xs"></i>
                                        Activity Log
                                    </button>
                                </div>

                                <div className="border-t border-slate-100 my-1"></div>

                                <div className="px-1.5 py-1">
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-semibold transition-all duration-150 cursor-pointer text-left"
                                    >
                                        <i className="fa-solid fa-right-from-bracket text-red-500 text-xs"></i>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Second Row: ERP Green Banner Menu */}
            <div className="bg-[#064e3b] border-t border-slate-200 w-full px-0 py-0">
                <div
                    className="flex flex-wrap items-center w-full relative z-40"
                    id="custom-nav-dropdown"
                >
                    {/* Dashboard Button */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                closeAllDropdowns();
                                navigate("/office/dashboard");
                            }}
                            className={`w-44 sm:w-52 md:w-56 flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm border-r border-white/10 hover:bg-white/10 focus:outline-none transition-all duration-200 font-semibold text-white cursor-pointer whitespace-nowrap ${
                                location.pathname === "/office/dashboard" ? "bg-white/15" : "bg-transparent"
                            }`}
                        >
                            <i className="fa-solid fa-gauge-high text-xs"></i>
                            <span>Dashboard</span>
                        </button>
                    </div>

                    {/* Masters Dropdown Button */}
                    <div className="relative">
                        <button
                            onClick={toggleMasters}
                            className={`w-44 sm:w-52 md:w-56 flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm border-r border-white/10 hover:bg-white/10 focus:outline-none transition-all duration-200 font-semibold text-white cursor-pointer whitespace-nowrap ${
                                isOpen || ["/office/user-master", "/office/user-type-master", "/office/product-master", "/office/product-image-master"].includes(location.pathname)
                                    ? "bg-white/15"
                                    : "bg-transparent"
                            }`}
                        >
                            <i className="fa-solid fa-database text-xs"></i>
                            <span>Masters</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className={`w-3.5 h-3.5 text-emerald-200 transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {/* Masters Mega-Dropdown Popup (ERP format) */}
                        {isOpen && (
                            <div className="absolute left-0 top-full mt-1.5 w-[760px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 origin-top animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                                {/* Search & Count Header */}
                                <div className="mb-3 pb-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                                    <div className="relative flex-1">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={masterSearch}
                                            onChange={(e) => setMasterSearch(e.target.value)}
                                            placeholder="Search masters (e.g. User, Product, Image...)"
                                            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#047857] focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 placeholder-slate-400"
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                        {masterSearch && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setMasterSearch(""); }}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                                title="Clear search"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold text-[#064e3b] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0">
                                        {filteredMasters.length} {filteredMasters.length === 1 ? 'Master' : 'Masters'}
                                    </span>
                                </div>

                                {/* Masters Grid Cards (ERP Format) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {filteredMasters.map((m, idx) => {
                                        const isActive = location.pathname === m.path;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    navigate(m.path);
                                                    setIsOpen(false);
                                                    setMasterSearch("");
                                                }}
                                                className={`relative group flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer text-left border ${
                                                    isActive
                                                        ? "bg-emerald-50/80 text-[#064e3b] font-semibold border-emerald-300 shadow-xs"
                                                        : "border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-slate-700"
                                                }`}
                                            >
                                                <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shrink-0 ${
                                                    isActive ? "bg-emerald-200 text-[#064e3b]" : "bg-emerald-100 text-[#047857] group-hover:scale-105"
                                                }`}>
                                                    <i className={`${m.icon} text-sm`}></i>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold leading-snug ${
                                                        isActive ? "text-[#064e3b]" : "text-slate-900 group-hover:text-[#047857]"
                                                    }`}>
                                                        {m.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-1">
                                                        {m.desc}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reports Dropdown Button */}
                    <div className="relative" id="reports-dropdown">
                        <button
                            onClick={toggleReports}
                            className={`w-44 sm:w-52 md:w-56 flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm border-r border-white/10 hover:bg-white/10 focus:outline-none transition-all duration-200 font-semibold text-white cursor-pointer whitespace-nowrap ${
                                isReportsOpen || location.pathname === "/office/activity-report"
                                    ? "bg-white/15"
                                    : "bg-transparent"
                            }`}
                        >
                            <i className="fa-solid fa-chart-line text-xs"></i>
                            <span>Reports</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className={`w-3.5 h-3.5 text-emerald-200 transition-transform duration-200 ${isReportsOpen ? "rotate-180 text-white" : ""}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {isReportsOpen && (
                            <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 origin-top animate-in fade-in slide-in-from-top-2 duration-150">
                                {reportsLinks.map((r, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            navigate(r.path);
                                            setIsReportsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                                            location.pathname === r.path
                                                ? "bg-emerald-50 text-[#064e3b]"
                                                : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#047857] flex items-center justify-center shrink-0">
                                            <i className={`${r.icon} text-xs`}></i>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{r.name}</div>
                                            <div className="text-[11px] text-slate-400 font-normal">{r.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
}

