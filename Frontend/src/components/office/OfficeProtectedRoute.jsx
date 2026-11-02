import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';

export default function OfficeProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('office_token');

  if (!token) {
    return <Navigate to="/office/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}
