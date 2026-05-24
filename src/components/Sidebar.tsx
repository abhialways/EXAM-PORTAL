'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, BarChart3, Settings, BookOpen, ClipboardList, LogOut, Calendar, Download } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  role: 'admin' | 'hr' | 'candidate';
}

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin-dashboard' },
  { label: 'Exam Management', icon: BookOpen, href: '/exam-question-bank-management' },
  { label: 'Results & Reports', icon: BarChart3, href: '/results-reports' },
  { label: 'Schedules', icon: Calendar, href: '/admin-dashboard' },
  { label: 'Settings', icon: Settings, href: '/admin-dashboard' },
];

const hrNav = [
  { label: 'HR Dashboard', icon: LayoutDashboard, href: '/hr-dashboard' },
  { label: 'Candidate Results', icon: ClipboardList, href: '/results-reports' },
  { label: 'Shortlisted', icon: Users, href: '/hr-dashboard' },
  { label: 'Export Reports', icon: Download, href: '/results-reports' },
];

const candidateNav = [
  { label: 'My Exam', icon: FileText, href: '/candidate-exam-interface' },
  { label: 'My Results', icon: BarChart3, href: '/results-reports' },
];

export default function Sidebar({ collapsed, mobileOpen, onMobileClose, role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'admin' ? adminNav : role === 'hr' ? hrNav : candidateNav;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 sidebar-transition overflow-hidden flex-shrink-0 ${
          collapsed ? 'w-14' : 'w-56'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2 px-4 py-4 border-b border-gray-200 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">EP</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm text-gray-800">ExamPortal</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={`nav-${item.label}`}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium' :'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-200 p-2">
          {!collapsed && (
            <div className="px-2 py-2 mb-1">
              <p className="text-xs font-medium text-gray-800 truncate">
                {role === 'admin' ? 'Admin User' : role === 'hr' ? 'HR Manager' : 'Candidate'}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">{role}</p>
            </div>
          )}
          <Link
            href="/"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={15} />
            {!collapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">EP</span>
            </div>
            <span className="font-semibold text-sm text-gray-800">ExamPortal</span>
          </div>
          <button onClick={onMobileClose} className="p-1 text-gray-500 hover:text-gray-800">✕</button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={`mobile-nav-${item.label}`}>
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-gray-200 p-2">
          <Link
            href="/"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}