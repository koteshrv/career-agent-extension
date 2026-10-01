import React from 'react';
import { Briefcase, KanbanSquare, User, Settings } from 'lucide-react';
import { ExtensionView } from '../types';

const TABS: Array<{ view: ExtensionView; label: string; icon: React.FC<{ className?: string }> }> = [
  { view: 'job', label: 'This job', icon: Briefcase },
  { view: 'pipeline', label: 'Pipeline', icon: KanbanSquare },
  { view: 'profile', label: 'Profile', icon: User },
  { view: 'settings', label: 'Settings', icon: Settings },
];

export const BottomTabs: React.FC<{ view: ExtensionView; onChange: (v: ExtensionView) => void; pipelineCount?: number }> = ({ view, onChange, pipelineCount }) => (
  <nav aria-label="Sections" className="sticky bottom-0 z-40 grid shrink-0 grid-cols-4 border-t border-border bg-card">
    {TABS.map((t) => {
      const active = t.view === view;
      return (
        <button
          key={t.view}
          type="button"
          onClick={() => onChange(t.view)}
          aria-current={active ? 'page' : undefined}
          className={`relative flex h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <t.icon className="size-[18px]" />
          {t.label}
          {t.view === 'pipeline' && pipelineCount ? (
            <span className="absolute right-[calc(50%-22px)] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground" aria-hidden="true">
              {pipelineCount}
            </span>
          ) : null}
        </button>
      );
    })}
  </nav>
);
