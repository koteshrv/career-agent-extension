import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Logo } from './Logo';
import { IconButton } from './ui';
import { openPlatformUrl } from '../lib/api';
import { ExtensionSettings } from '../types';

export const Header: React.FC<{ settings: ExtensionSettings; onOpenSettings: () => void }> = ({ settings, onOpenSettings }) => {
  const hasKey = Boolean(settings.aiApiKey.trim());
  const model = settings.aiModel.replace(/^gemini-/, 'Gemini ').replace(/^gpt-/, 'GPT-').replace(/^claude-/, 'Claude ').replace(/-\d{8}$/, '').replace(/-/g, ' ');
  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-3.5">
      <Logo />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenSettings}
          title={hasKey ? `AI answers use ${settings.aiModel}` : 'Add an AI key to draft answers'}
          className={`inline-flex h-7 max-w-[150px] items-center gap-1.5 rounded-sm border px-2 text-[11px] font-medium cursor-pointer ${hasKey ? 'border-border bg-card text-foreground hover:bg-muted' : 'border-primary/40 bg-accent text-accent-foreground'}`}
        >
          <span aria-hidden="true" className={`size-1.5 rounded-full ${hasKey ? 'bg-status-interviewing' : 'bg-primary'}`} />
          <span className="truncate">{hasKey ? model : 'Add AI key'}</span>
        </button>
        <IconButton label="Open the dashboard" onClick={() => openPlatformUrl('/')}>
          <ExternalLink />
        </IconButton>
      </div>
    </header>
  );
};
