import React from 'react';

type BadgeVariant = 'pass' | 'fail' | 'pending' | 'active' | 'draft' | 'closed' | 'shortlisted' | 'scheduled' | 'inprogress' | 'warning';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}

const variantMap: Record<BadgeVariant, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  pass: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success', defaultLabel: 'Pass' },
  fail: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger', defaultLabel: 'Fail' },
  pending: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning', defaultLabel: 'Pending' },
  active: { bg: 'bg-info/10', text: 'text-info', dot: 'bg-info', defaultLabel: 'Active' },
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground', defaultLabel: 'Draft' },
  closed: { bg: 'bg-secondary', text: 'text-secondary-foreground', dot: 'bg-secondary-foreground', defaultLabel: 'Closed' },
  shortlisted: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary', defaultLabel: 'Shortlisted' },
  scheduled: { bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent', defaultLabel: 'Scheduled' },
  inprogress: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning', defaultLabel: 'In Progress' },
  warning: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger', defaultLabel: 'Warning' },
};

export default function StatusBadge({ variant, label, size = 'md' }: StatusBadgeProps) {
  const styles = variantMap[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-500 rounded-full ${styles.bg} ${styles.text} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
      {label ?? styles.defaultLabel}
    </span>
  );
}