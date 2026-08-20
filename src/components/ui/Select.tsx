import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
    const selectId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-xs">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'block w-full appearance-none rounded-lg border text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 transition duration-150',
              'py-2 pl-3 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              error ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : 'border-slate-300 dark:border-slate-700',
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 dark:text-slate-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
