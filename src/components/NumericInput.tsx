import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface NumericInputProps {
  id?: string;
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  className?: string;
  allowDecimals?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const NumericInput: React.FC<NumericInputProps> = ({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  placeholder = '',
  className = '',
  allowDecimals = false,
  disabled = false,
  size = 'md',
}) => {
  const [internalText, setInternalText] = React.useState<string>(
    value !== undefined && value !== null ? String(value) : ''
  );

  // Sync internal state when external value changes
  React.useEffect(() => {
    const currentNum = internalText === '' ? undefined : Number(internalText);
    if (value !== currentNum) {
      setInternalText(value !== undefined && value !== null ? String(value) : '');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.replace(',', '.');
    setInternalText(text);

    if (text === '' || text === '-') {
      onChange(undefined);
      return;
    }

    const parsed = Number(text);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (internalText === '' || internalText === '-') {
      if (min !== undefined && min > 0) {
        // keep empty if user cleared it, or optional
      }
      return;
    }

    let num = Number(internalText);
    if (isNaN(num)) {
      setInternalText(value !== undefined && value !== null ? String(value) : '');
      return;
    }

    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;

    if (allowDecimals) {
      num = Math.round(num * 10) / 10;
    } else {
      num = Math.round(num);
    }

    setInternalText(String(num));
    onChange(num);
  };

  const handleIncrement = () => {
    const current = (value !== undefined && value !== null && !isNaN(value)) ? value : (min ?? 0);
    let next = current + step;
    if (max !== undefined && next > max) next = max;
    if (allowDecimals) next = Math.round(next * 10) / 10;
    setInternalText(String(next));
    onChange(next);
  };

  const handleDecrement = () => {
    const current = (value !== undefined && value !== null && !isNaN(value)) ? value : (min ?? 0);
    let next = current - step;
    if (min !== undefined && next < min) next = min;
    if (allowDecimals) next = Math.round(next * 10) / 10;
    setInternalText(String(next));
    onChange(next);
  };

  const handleSelectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const sizeClasses = {
    sm: 'py-1 px-2 text-xs',
    md: 'py-2 px-3 text-sm',
    lg: 'py-2.5 px-3.5 text-base font-bold',
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="relative flex items-stretch rounded-xl border border-slate-300 bg-white shadow-2xs transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 hover:border-slate-400">
        {/* Quick Decrement Button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && value !== undefined && value <= min)}
          className="flex items-center justify-center px-2.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50/50 disabled:opacity-30 disabled:hover:bg-transparent rounded-l-xl transition-colors border-r border-slate-100 cursor-pointer active:bg-teal-100"
          title="Diminuisci"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        {/* Input element with select-on-focus */}
        <input
          id={id}
          type="text"
          inputMode={allowDecimals ? 'decimal' : 'numeric'}
          value={internalText}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleSelectOnFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-transparent text-slate-900 font-semibold font-mono text-center focus:outline-hidden ${sizeClasses[size]}`}
        />

        {/* Unit label if present */}
        {unit && (
          <span className="flex items-center px-2 text-xs font-semibold text-slate-400 select-none border-l border-slate-100 bg-slate-50/60">
            {unit}
          </span>
        )}

        {/* Quick Increment Button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value !== undefined && value >= max)}
          className="flex items-center justify-center px-2.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50/50 disabled:opacity-30 disabled:hover:bg-transparent rounded-r-xl transition-colors border-l border-slate-100 cursor-pointer active:bg-teal-100"
          title="Aumenta"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
