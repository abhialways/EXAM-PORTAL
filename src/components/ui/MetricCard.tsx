import React from 'react';
import { LucideIcon } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'default' | 'hero';
}

export default function MetricCard({ title, value, subtitle, icon: Icon, variant = 'default', size = 'default' }: MetricCardProps) {
  return (
    <div className="bg-white rounded border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className={`font-semibold tabular-nums ${size === 'hero' ? 'text-3xl' : 'text-xl'} text-gray-900`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
}