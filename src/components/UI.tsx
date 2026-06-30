/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Card
export function Card({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div 
      id={id}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

// StatCard
export function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  badgeText, 
  badgeType = 'info',
  className = '',
  id
}: { 
  title: string; 
  value: string | number; 
  subtext?: string; 
  icon?: React.ComponentType<{ className?: string }>; 
  badgeText?: string; 
  badgeType?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  id?: string;
}) {
  const badgeColors = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  return (
    <Card id={id} className={`flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(subtext || badgeText) && (
        <div className="mt-4 flex items-center gap-2">
          {badgeText && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${badgeColors[badgeType]}`}>
              {badgeText}
            </span>
          )}
          {subtext && <span className="text-[11px] text-slate-500 font-medium">{subtext}</span>}
        </div>
      )}
    </Card>
  );
}

// PageHeader
export function PageHeader({ 
  title, 
  description, 
  actions,
  id
}: { 
  title: string; 
  description?: string; 
  actions?: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// DataTable
export function DataTable({ 
  headers, 
  children, 
  emptyMessage = "No records found.",
  id
}: { 
  headers: string[]; 
  children: React.ReactNode; 
  emptyMessage?: string;
  id?: string;
}) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              {headers.map((header, idx) => (
                <th key={idx} className="p-3.5 uppercase tracking-wider text-[10px]">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// SearchInput
export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Search database...",
  id
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
  id?: string;
}) {
  return (
    <div id={id} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

// FilterBar
export function FilterBar({ 
  children, 
  className = '',
  id
}: { 
  children: React.ReactNode; 
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {children}
    </div>
  );
}

// FormInput
export function FormInput({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder,
  required = false,
  min,
  max,
  disabled = false,
  className = '',
  id
}: { 
  label: string; 
  type?: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  required?: boolean;
  min?: number | string;
  max?: number | string;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`space-y-1.5 w-full ${className}`}>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-sans"
      />
    </div>
  );
}

// SelectInput
export function SelectInput({ 
  label, 
  value, 
  onChange, 
  options,
  required = false,
  disabled = false,
  className = '',
  id
}: { 
  label: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; 
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`space-y-1.5 w-full ${className}`}>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-sans cursor-pointer"
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Buttons
export function PrimaryButton({ 
  children, 
  onClick, 
  type = "button", 
  disabled = false,
  className = '',
  id
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/10 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ 
  children, 
  onClick, 
  type = "button", 
  disabled = false,
  className = '',
  id
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 ${className}`}
    >
      {children}
    </button>
  );
}

export function DangerButton({ 
  children, 
  onClick, 
  type = "button", 
  disabled = false,
  className = '',
  id
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 ${className}`}
    >
      {children}
    </button>
  );
}

// ConfirmationModal / ResponsiveModal
export function ResponsiveModal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = 'max-w-lg',
  id
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  maxWidth?: string;
  id?: string;
}) {
  if (!isOpen) return null;

  return (
    <div id={id} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className={`bg-white rounded-2xl border border-slate-200 w-full ${maxWidth} max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-all text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-600">
          {children}
        </div>
      </div>
    </div>
  );
}

// AlertBadge
export function AlertBadge({ 
  type, 
  children,
  id
}: { 
  type: 'success' | 'warning' | 'danger' | 'info'; 
  children: React.ReactNode;
  id?: string;
}) {
  const styles = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    danger: 'bg-rose-50 border-rose-100 text-rose-700',
    info: 'bg-sky-50 border-sky-100 text-sky-700',
  };

  return (
    <span id={id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${styles[type]}`}>
      {type === 'success' && <CheckCircle className="h-3 w-3" />}
      {type === 'warning' && <AlertCircle className="h-3 w-3" />}
      {type === 'danger' && <AlertCircle className="h-3 w-3" />}
      {type === 'info' && <Info className="h-3 w-3" />}
      {children}
    </span>
  );
}

// StatusBadge
export function StatusBadge({ 
  active, 
  labelActive = "Active", 
  labelInactive = "Inactive",
  id
}: { 
  active: boolean; 
  labelActive?: string; 
  labelInactive?: string;
  id?: string;
}) {
  return (
    <span 
      id={id}
      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
        active 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
          : 'bg-slate-100 text-slate-400 border-slate-200'
      }`}
    >
      {active ? labelActive : labelInactive}
    </span>
  );
}

// EmptyState
export function EmptyState({ 
  title = "No matches found", 
  description = "Refine your filters, search term, or seed sample medicines.", 
  action,
  id
}: { 
  title?: string; 
  description?: string; 
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 max-w-md mx-auto my-6 space-y-3">
      <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
        <Info className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">{title}</h4>
        <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

// LoadingState
export function LoadingState({ message = "Retrieving records...", id }: { message?: string; id?: string }) {
  return (
    <div id={id} className="flex flex-col items-center justify-center py-12 space-y-3">
      <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      <p className="text-xs text-slate-500 font-medium">{message}</p>
    </div>
  );
}
