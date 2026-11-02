import React, { useState, useEffect } from 'react';
import jwLogo from '../assets/jwLogo.jpeg';

export default function Footer() {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [deviceId, setDeviceId] = useState(() => {
        let id = localStorage.getItem('deviceId');
        if (!id) {
            id = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            localStorage.setItem('deviceId', id);
        }
        return id;
    });
    const [user, setUser] = useState(null);
    const [loginTime] = useState(() => {
        let time = sessionStorage.getItem("loginTime");
        if (!time) {
            time = new Date().toLocaleTimeString();
            sessionStorage.setItem("loginTime", time);
        }
        return time;
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user') || localStorage.getItem('office_user');
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {}
        }

        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <footer className="bg-white border-t border-slate-200 mt-auto flex flex-col print:hidden font-sans">
            {user && (
                <div className="bg-slate-50 border-b border-slate-200 py-1 text-[10px] text-slate-500 uppercase tracking-wider">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center gap-4">
                        <span>User: <strong className="text-slate-700">{user.name || user.username || "Operator"}</strong></span>
                        <span>Login: <strong className="text-slate-700">{loginTime}</strong></span>
                        <span>Time: <strong className="text-slate-700">{currentTime}</strong></span>
                        <span>Device ID: <strong className="text-slate-700 font-mono">{deviceId}</strong></span>
                    </div>
                </div>
            )}
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Powered by</span>
                        <img 
                            src={jwLogo} 
                            alt="Jeenweb" 
                            className="h-9 w-auto rounded-sm cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => window.open("https://www.jeenweb.com", "_blank")} 
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
                        <span>
                            Helpline: <a href="tel:9824466017" className="hover:text-emerald-700 transition-colors">9824466017</a>
                        </span>
                        <span>
                            Email: <a href="mailto:info@jeenweb.com" className="hover:text-emerald-700 transition-colors">info@jeenweb.com</a>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

