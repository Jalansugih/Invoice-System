import React from 'react';
import { useTheme, Theme } from '../../lib/theme';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'segmented' | 'cards';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className,
}) => {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    const options: { value: Theme; label: string; icon: React.FC<{ className?: string }> }[] = [
      { value: 'light', label: 'Terang', icon: Sun },
      { value: 'dark', label: 'Gelap', icon: Moon },
      { value: 'system', label: 'Sistem', icon: Laptop },
    ];

    return (
      <div
        className={cn(
          'inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
          className
        )}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              id={`theme-btn-${opt.value}`}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'cards') {
    const options: {
      value: Theme;
      title: string;
      description: string;
      icon: React.FC<{ className?: string }>;
      previewBg: string;
      previewBorder: string;
    }[] = [
      {
        value: 'light',
        title: 'Light Mode (Terang)',
        description: 'Tampilan bersih, cerah, dan kontras tinggi untuk siang hari.',
        icon: Sun,
        previewBg: 'bg-white',
        previewBorder: 'border-slate-200',
      },
      {
        value: 'dark',
        title: 'Dark Mode (Mode Gelap)',
        description: 'Mengurangi kelelahan mata (*eye strain*) untuk power users saat bekerja lembur.',
        icon: Moon,
        previewBg: 'bg-slate-950 text-white',
        previewBorder: 'border-slate-800',
      },
      {
        value: 'system',
        title: 'Auto System Sync',
        description: 'Mengikuti pengaturan tema gelap/terang pada sistem operasi perangkat Anda.',
        icon: Laptop,
        previewBg: 'bg-gradient-to-r from-white via-slate-200 to-slate-950',
        previewBorder: 'border-slate-300 dark:border-slate-700',
      },
    ];

    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <div
              key={opt.value}
              id={`theme-card-${opt.value}`}
              onClick={() => setTheme(opt.value)}
              className={cn(
                'relative p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between',
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              )}
            >
              {/* Top preview illustration */}
              <div
                className={cn(
                  'h-16 w-full rounded-lg border mb-3 flex items-center justify-center relative overflow-hidden',
                  opt.previewBg,
                  opt.previewBorder
                )}
              >
                <Icon
                  className={cn(
                    'w-6 h-6 transition-transform duration-300',
                    isSelected ? 'scale-110 text-blue-600 dark:text-blue-400' : 'text-slate-500'
                  )}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {opt.title}
                  </h4>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {opt.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default: Icon button (Moon/Sun toggle)
  return (
    <button
      id="btn-theme-toggle"
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0 cursor-pointer',
        className
      )}
      title={
        effectiveTheme === 'dark'
          ? 'Switch to Light Mode (Mode Terang)'
          : 'Switch to Dark Mode (Mode Gelap / Eye Strain Relief)'
      }
      aria-label="Toggle dark mode"
    >
      {effectiveTheme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};
