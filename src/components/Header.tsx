import React from 'react';
import { PatientProfile } from '../types';
import { 
  Activity, 
  ShieldAlert, 
  Printer, 
  BookOpen, 
  FileDown,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  activePatient: PatientProfile;
  onOpenHypoModal: () => void;
  onOpenGuidelinesModal: () => void;
  onOpenPrintModal: () => void;
  onResetPatient?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePatient,
  onOpenHypoModal,
  onOpenGuidelinesModal,
  onOpenPrintModal,
  onResetPatient,
}) => {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Navbar */}
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20 shrink-0">
              <Activity className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  GlucoHospital
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 tracking-wide">
                  Basal-Bolus Inpatient
                </span>
              </div>
              <p className="text-xs text-teal-300 font-semibold mt-0.5 flex items-center gap-1.5">
                <span>Creato dal Dott. Maestri Lorenzo</span>
                <span className="text-slate-500 hidden md:inline">•</span>
                <span className="text-slate-400 font-normal hidden md:inline">Protocolli Clinici Ospedalieri ADA / SID-AMD / ESPEN</span>
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Hypoglycemia Emergency Protocol Button */}
            <button
              id="btn-hypo-protocol"
              type="button"
              onClick={onOpenHypoModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-all border border-rose-500 hover:scale-[1.02] cursor-pointer"
              title="Protocollo Ospedaliero di Gestione Ipoglicemie (Regola del 15)"
            >
              <ShieldAlert className="h-4 w-4 animate-pulse" />
              <span className="hidden sm:inline">Protocollo</span> Ipoglicemia
            </button>

            {/* Word Export & Copy Prescription Sheet */}
            <button
              id="btn-print-sheet"
              type="button"
              onClick={onOpenPrintModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white border border-teal-500 shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
              title="Esporta Documento Word (.doc) su 2 Pagine o Copia per Cartella Elettronica"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Esporta Word / Copia</span>
            </button>

            {/* Reset / New Patient if callback provided */}
            {onResetPatient && (
              <button
                id="btn-reset-patient"
                type="button"
                onClick={onResetPatient}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                title="Nuovo Paziente / Ripristina valori predefiniti"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            )}

            {/* Evidence Guidelines Reference */}
            <button
              id="btn-guidelines"
              type="button"
              onClick={onOpenGuidelinesModal}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="Linee Guida e Riferimenti Farmacologici"
            >
              <BookOpen className="h-4 w-4" />
            </button>

          </div>
        </div>

        {/* Sub-Header: Active Patient Glance Bar */}
        <div className="py-1.5 px-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400 shrink-0">Paziente in esame:</span>
            <span className="font-semibold text-teal-300 flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="truncate">{activePatient.bedOrName || 'Paziente in Reparto'}</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                ({activePatient.department || 'Degenza Ordinaria'})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
            <span>Target Ospedaliero: <strong className="text-slate-200 font-mono">100 - 180 mg/dL</strong></span>
            <span className="hidden sm:inline">• Linee Guida: <strong className="text-slate-200">ADA 2024 / SID-AMD</strong></span>
          </div>
        </div>

      </div>
    </header>
  );
};
