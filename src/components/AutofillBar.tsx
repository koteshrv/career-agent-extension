import React from 'react';
import { Zap, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { ATSType } from '../types';

interface AutofillBarProps {
  atsType: ATSType;
  onAutofill: () => void;
  isAutofilling: boolean;
  statusMessage: string | null;
  statusType: 'success' | 'error' | 'idle';
  isSupportedATS: boolean;
}

export const AutofillBar: React.FC<AutofillBarProps> = ({
  atsType,
  onAutofill,
  isAutofilling,
  statusMessage,
  statusType,
  isSupportedATS,
}) => {
  return (
    <div className="space-y-2">
      <button
        onClick={onAutofill}
        disabled={isAutofilling || !isSupportedATS}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs transition-all shadow-xs cursor-pointer ${
          isSupportedATS
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground active:scale-[0.98]'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        {isAutofilling ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
            <span>Autofilling Form Fields...</span>
          </>
        ) : (
          <>
            <Zap className={`w-4 h-4 ${isSupportedATS ? 'text-primary-foreground fill-primary-foreground' : 'text-muted-foreground'}`} />
            <span>
              {isSupportedATS
                ? `1-Click Autofill Form (${atsType.toUpperCase()})`
                : 'Autofill Form (ATS Not Detected)'}
            </span>
          </>
        )}
      </button>

      {/* Status Toast / Inline Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all animate-in fade-in slide-in-from-top-1 ${
            statusType === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {statusType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
