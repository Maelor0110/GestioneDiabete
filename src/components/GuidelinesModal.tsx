import React from 'react';
import { BookOpen, X, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface GuidelinesModalProps {
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Linee Guida & Formule di Riferimento Clinico
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 leading-relaxed">
          
          {/* Target Glycemic Inpatient standards */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 border-b pb-1">
              1. Target Glicemici Ospedalieri (ADA Standards of Care in Hospital 2024):
            </h4>
            <ul className="space-y-1.5 pl-4 list-disc text-slate-700">
              <li>
                <strong>Target Generale per la maggior parte dei ricoverati non critici:</strong> <strong>140 - 180 mg/dL</strong> (7.8 - 10.0 mmol/L).
              </li>
              <li>
                <strong>Target più stringente (pazienti selezionati, giovani o cardiochirurgia):</strong> 110 - 140 mg/dL (se ottenibile senza rischio di ipoglicemie).
              </li>
              <li>
                <strong>Target più permissivo (anziani fragili, aspettativa di vita limitata, demenza grave):</strong> 180 - 220 mg/dL con obiettivo primario l'evitamento tassativo delle ipoglicemie e dei sintomi iperglicemici acuti.
              </li>
            </ul>
          </div>

          {/* Formulas summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 border-b pb-1">
              2. Formule Matematiche di Calcolo Insulinico:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-teal-800">Fabbisogno Totale (TDD)</div>
                <div className="font-mono font-bold text-slate-900 mt-1">Peso (kg) × Fattore (U/kg)</div>
                <div className="text-[11px] text-slate-500 mt-1">Fattore: 0.2 - 0.6 U/kg in base a eGFR, età, infezione e steroidi.</div>
              </div>

              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
                <div className="font-bold text-teal-900">Fattore di Sensibilità (ISF)</div>
                <div className="font-mono font-bold text-slate-900 mt-1">1800 / TDD</div>
                <div className="text-[11px] text-teal-800 mt-1">Indica quanti mg/dL abbassa 1 Unità di analogo rapido (Regola del 1800).</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900">Rapporto Insulina/Carb (ICR)</div>
                <div className="font-mono font-bold text-slate-900 mt-1">500 / TDD</div>
                <div className="text-[11px] text-slate-500 mt-1">Grammi di carboidrati coperti da 1 Unità di rapida (Regola del 500).</div>
              </div>
            </div>
          </div>

          {/* Sospensione farmaci orali */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 border-b pb-1">
              3. Principali Motivi di Sospensione dei Farmaci Orali in Ospedale:
            </h4>
            <div className="space-y-2 text-slate-700">
              <p>
                • <strong>SGLT2-inibitori:</strong> Rischio di chetoacidosi euglicemica durante digiuno/stress acuto. Sospendere subito.
              </p>
              <p>
                • <strong>Metformina:</strong> Rischio di acidosi lattica in caso di eGFR &lt; 30, shock, ipossia, sepsi o esami con mezzo di contrasto iodato.
              </p>
              <p>
                • <strong>Sulfoniluree:</strong> Rischio di ipoglicemia prolungata per apporto calorico imprevedibile.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
