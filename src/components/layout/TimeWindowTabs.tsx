import { TIME_WINDOWS } from '../../config/timeWindows';
import type { TimeWindow } from '../../types/market';

interface TimeWindowTabsProps {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
}

export function TimeWindowTabs({ value, onChange }: TimeWindowTabsProps) {
  return (
    <div role="tablist" aria-label="Time window" className="tabs">
      {TIME_WINDOWS.map((w) => (
        <button
          key={w.id}
          type="button"
          role="tab"
          aria-selected={value === w.id}
          className={value === w.id ? 'tab tab--active' : 'tab'}
          onClick={() => onChange(w.id)}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
