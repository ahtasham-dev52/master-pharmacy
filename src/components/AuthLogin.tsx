/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePharmacyStore } from '../store';
import { UserRole } from '../types';
import { ShieldCheck, User, Lock, KeyRound } from 'lucide-react';

export default function AuthLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123'); // Demo password
  const [role, setRole] = useState<UserRole>('Owner');
  const [error, setError] = useState('');
  const login = usePharmacyStore(state => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-populate username depending on chosen role if using demo defaults
    let loginUser = username;
    if (username === 'admin' && role === 'Cashier') {
      loginUser = 'cashier1';
    } else if (username === 'admin' && role === 'Inventory Manager') {
      loginUser = 'inv_manager';
    }

    const success = login(loginUser, role);
    if (!success) {
      setError('Invalid credentials or inactive user role.');
    }
  };

  const handleQuickSelect = (selRole: UserRole, selUser: string) => {
    setRole(selRole);
    setUsername(selUser);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="absolute top-4 left-4 flex items-center space-x-2 text-emerald-600">
        <ShieldCheck className="h-5 w-5" />
        <span className="font-mono text-[10px] tracking-wider font-extrabold uppercase">SECURE OFFLINE DESKTOP SHELL</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
            Master Pharmacy
          </h1>
          <p className="text-slate-505 text-xs leading-relaxed">
            Smart Medical Store Billing & Inventory Management
          </p>
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-bold font-mono text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>v1.0.0 (Local Database Connected)</span>
          </div>
        </div>

        {/* Quick Demo Access Roles */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Quick Sign-In (Demo Access)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickSelect('Owner', 'admin')}
              className={`py-2 px-1 text-center rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                role === 'Owner'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Owner (Admin)
            </button>
            <button
              onClick={() => handleQuickSelect('Cashier', 'cashier1')}
              className={`py-2 px-1 text-center rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                role === 'Cashier'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Cashier
            </button>
            <button
              onClick={() => handleQuickSelect('Inventory Manager', 'inv_manager')}
              className={`py-2 px-1 text-center rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                role === 'Inventory Manager'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Inv Manager
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 text-center font-semibold">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Role Indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
            <span className="flex items-center gap-1">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" /> Access Level:
            </span>
            <span className="text-emerald-600 font-extrabold">{role}</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/10 transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            Authenticate Securely
          </button>
        </form>

        <div className="text-center pt-2 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
          Master Pharmacy • Single Branch Mode
        </div>
      </div>
    </div>
  );
}
