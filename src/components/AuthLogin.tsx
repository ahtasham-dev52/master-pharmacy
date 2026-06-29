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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4">
      <div className="absolute top-4 left-4 flex items-center space-x-2 text-emerald-400">
        <ShieldCheck className="h-6 w-6" />
        <span className="font-mono text-sm tracking-wider font-semibold">SECURE OFFLINE DESKTOP SHELL</span>
      </div>

      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 p-8 space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="h-9 w-9 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Master Pharmacy
          </h1>
          <p className="text-slate-400 text-sm">
            Smart Medical Store Billing & Inventory Management
          </p>
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-700/50 text-xs font-mono text-slate-300 border border-slate-600/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>v1.0.0 (Local Database Connection: Active)</span>
          </div>
        </div>

        {/* Quick Demo Access Roles */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/40 space-y-2.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Quick Sign-In (Demo Access)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickSelect('Owner', 'admin')}
              className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                role === 'Owner'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              Owner (Admin)
            </button>
            <button
              onClick={() => handleQuickSelect('Cashier', 'cashier1')}
              className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                role === 'Cashier'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              Cashier
            </button>
            <button
              onClick={() => handleQuickSelect('Inventory Manager', 'inv_manager')}
              className={`py-2 px-1 text-center rounded-lg border text-xs font-medium transition-all ${
                role === 'Inventory Manager'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              Inv Manager
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 block">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Role Hidden Input or Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <KeyRound className="h-3.5 w-3.5 text-slate-500" /> Access Level:
            </span>
            <span className="text-emerald-400 font-bold">{role}</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 transition-all text-sm uppercase tracking-wide cursor-pointer"
          >
            Authenticate Securely
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500 font-mono">
          Master Pharmacy • Single Branch Mode • Offline Enabled
        </div>
      </div>
    </div>
  );
}
