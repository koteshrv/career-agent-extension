import React from 'react';
import { Zap, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { ATSType } from '../types';

interface AutofillBarProps {
  atsType: ATSType;
  onAutofill: () => void;
  isAutofilling: boolean;
  statusMessage: string | null;
  statusType: 'success' | 'error' | 'idle';
  isSupportedATS?: boolean;
}

export const AutofillBar: React.FC<AutofillBarProps> = ({
  atsType,
  onAutofill,
  isAutofilling,
  statusMessage,
  statusType,
}) => {
  const isDedicated = ['greenhouse', 'lever', 'ashby'].includes(atsType);
  const badgeLabel = isDedicated ? ` (${atsType.toUpperCase()})` : '';

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onAutofill}
        disabled={isAutofilling}
        className="w-full h-9 flex items-center justify-center gap-2 px-4 rounded-lg font-semibold text-xs text-primary-foreground bg-primary hover:bg-primary/90 shadow-2xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 select-none"
      >
        {isAutofilling ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
            <span>Autofilling Form Fields...</span>
          </>
        ) : (
          <>
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>1-Click Autofill Form{badgeLabel}</span>
          </>
        )}
      </button>

      {/* Status Toast / Inline Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all animate-in fade-in slide-in-from-top-1 ${
            statusType === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {statusType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span className="font-medium leading-tight">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
