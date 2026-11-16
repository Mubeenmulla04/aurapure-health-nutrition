import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  customCrumbs?: Crumb[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ customCrumbs }) => {
  const location = useLocation();

  const crumbs: Crumb[] = customCrumbs || (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const list: Crumb[] = [{ label: 'Dashboard', path: '/dashboard' }];

    let acc = '';
    parts.forEach((part, idx) => {
      acc += `/${part}`;
      if (part === 'dashboard' && idx === 0) return;

      const formatted = part
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      list.push({ label: formatted, path: idx === parts.length - 1 ? undefined : acc });
    });

    return list;
  })();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
      <Link to="/dashboard" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5 text-slate-400" />
      </Link>

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;

        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            {crumb.path && !isLast ? (
              <Link to={crumb.path} className="hover:text-indigo-600 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800">{crumb.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
