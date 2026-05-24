'use client';
import React from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
  onCollapseToggle: () => void;
  sidebarCollapsed: boolean;
  role: 'admin' | 'hr' | 'candidate';
}

export default function Topbar({ onMenuClick, onCollapseToggle, sidebarCollapsed, role }: TopbarProps) {
  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Desktop collapse */}
      <button
        onClick={onCollapseToggle}
        className="hidden lg:flex p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      <div className="flex-1" />

      {/* Role label */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-600 text-xs font-semibold">
            {role === 'admin' ? 'AD' : role === 'hr' ? 'HR' : 'C'}
          </span>
        </div>
        <span className="hidden sm:block text-sm text-gray-700 capitalize">{role}</span>
      </div>
    </header>
  );
}