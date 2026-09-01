import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, HeartPulse, X, Droplet, ArrowRight } from 'lucide-react';

interface HypoglycemiaProtocolModalProps {
  onClose: () => void;
}

export const HypoglycemiaProtocolModal: React.FC<HypoglycemiaProtocolModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-800 text-white">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Protocollo Ospedaliero di Gestione dell'Ipoglicemia
              </h3>
              <p className="text-xs text-rose-100">
                Linee Guida di Emergenza per Glicemia &lt; 70 mg/dL (Livello 1, 2 e 3)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-rose-200 hover:text-white rounded-lg hover:bg-rose-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          
          {/* Classification Banner */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Livello 1 (Lieve)</div>
              <div className="text-sm font-black text-amber-900 font-mono mt-0.5">54 - 69 mg/dL</div>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200">
              <div className="text-[10px] font-bold text-orange-800 uppercase">Livello 2 (Moderata)</div>
              <div className="text-sm font-black text-orange-900 font-mono mt-0.5">&lt; 54 mg/dL</div>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
              <div className="text-[10px] font-bold text-rose-800 uppercase">Livello 3 (Grave)</div>
              <div className="text-sm font-black text-rose-900 font-mono mt-0.5">Sintomi SNC / Coma</div>
            </div>
          </div>

          {/* SCENARIO A: PAZIENTE COSCIENTE IN GRADO DI DEGLUTIRE (REGOLA DEL 15) */}
          <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/50 space-y-3">
            <div className="font-bold text-amber-950 text-sm flex items-center gap-2">
              <Droplet className="h-4 w-4 text-amber-600" />
              Scenario A: Paziente Cosciente (Regola del 15)
            </div>

            <ol className="space-y-2 text-slate-700 font-medium pl-4 list-decimal">
              <li>
                <strong>Somministrare 15 grammi di carboidrati semplici ad assorbimento rapido:</strong>
                <ul className="pl-4 mt-1 space-y-0.5 text-slate-600 list-disc">
                  <li>3 bustine di zucchero sciolte in mezzo bicchiere d'acqua, oppure</li>
                  <li>150 mL di succo di frutta o bevanda zuccherata (non dietetica), oppure</li>
                  <li>3-4 caramelle di zucchero.</li>
                </ul>
              </li>
              <li>
                <strong>Attendere 15 minuti a riposo e ricontrollare la glicemia capillare.</strong>
              </li>
              <li>
                <strong>Se la glicemia è ancora &lt; 70 mg/dL:</strong> Ripetere altri 15g di carboidrati semplici e ricontrollare dopo 15 minuti.
              </li>
              <li>
                <strong>Una volta rientrati &gt; 70 mg/dL:</strong> Se il pasto successivo dista più di 1 ora, far consumare uno snack con carboidrati complessi (es. 2-3 fette biscottate o crackers) o anticipare il pasto.
              </li>
            </ol>
          </div>

          {/* SCENARIO B: PAZIENTE INCOSCIENTE, DISFAGICO O NPO (EMERGENZA ENDOVENOSA) */}
          <div className="p-4 rounded-xl border-2 border-rose-400 bg-rose-50/60 space-y-3">
            <div className="font-bold text-rose-950 text-sm flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-rose-600" />
              Scenario B: Paziente Incosciente, Disfagico o NPO (Via Endovenosa)
            </div>

            <div className="space-y-2 text-slate-800 font-medium">
              <div className="p-2.5 rounded-lg bg-white border border-rose-200">
                <strong className="text-rose-900 block mb-1">Se accesso venoso disponibile (Prima scelta):</strong>
                • <strong>Glucosata al 33%:</strong> Somministrare <strong>20 - 30 mL ev in bolo rapido</strong> (1-2 fiale), oppure<br/>
                • <strong>Glucosata al 10%:</strong> <strong>100 - 150 mL ev in 10-15 minuti</strong>.<br/>
                • Successivamente mantenere infusione continua di Glucosata 5% o 10% a 50-100 mL/h se persistente tendenza al calo.
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-rose-200">
                <strong className="text-rose-900 block mb-1">Se NON c'è accesso venoso immediato:</strong>
                • <strong>Glucagone 1 mg i.m. o s.c.</strong> (fiala con siringa preriempita GlucaGen HypoKit), oppure<br/>
                • <strong>Glucagone spray nasale (Baqsimi 3 mg)</strong> in una narice.
              </div>
            </div>
          </div>

          {/* ACTION FOR NEXT DAY */}
          <div className="p-3 rounded-xl bg-slate-900 text-white space-y-1">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Regola di Revisione Posologica di Reparto:
            </div>
            <p className="text-slate-300">
              Dopo qualsiasi episodio di ipoglicemia (&lt; 70 mg/dL), <strong>la dose di insulina responsabile (basale se notturna/digiuno, o bolo prandiale se post-prandiale) DEVE ESSERE RIDOTTA DEL 20%</strong> per i giorni successivi.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
          >
            Ho Compreso / Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
