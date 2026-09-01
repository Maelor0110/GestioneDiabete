import React, { useState } from 'react';
import { InsulinRegimen, PatientProfile } from '../types';
import { generateCorrectionScale, calculateSpotCorrection } from '../utils/calculator';
import { Calculator, ArrowRight, AlertCircle, ShieldAlert, Sparkles, HelpCircle, Check, Flame } from 'lucide-react';

interface CorrectionScaleViewProps {
  regimen: InsulinRegimen;
  patient: PatientProfile;
}

export const CorrectionScaleView: React.FC<CorrectionScaleViewProps> = ({ regimen, patient }) => {
  const [currentGlucose, setCurrentGlucose] = useState<number>(240);
  const [targetGlucose, setTargetGlucose] = useState<number>(140);
  const [lastBolusHoursAgo, setLastBolusHoursAgo] = useState<number | undefined>(4);

  const isElderlyOrRenal = patient.age >= 75 || patient.egfr < 30;
  const correctionScale = generateCorrectionScale(regimen.isf, isElderlyOrRenal);

  const spotResult = calculateSpotCorrection(
    currentGlucose,
    targetGlucose,
    regimen.isf,
    lastBolusHoursAgo
  );

  return (
    <div className="space-y-6">
      
      {/* 1. INTERACTIVE REAL-TIME BED-SIDE SPOT CORRECTION CALCULATOR */}
      <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-teal-700/50">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-teal-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Calculator className="h-3.5 w-3.5" />
              Calcolatore Correzione Estemporanea al Letto del Paziente
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Calcola la dose correttiva per la glicemia capillare attuale
            </h3>
          </div>

          <div className="text-xs text-teal-300 bg-teal-950/60 px-3 py-1.5 rounded-lg border border-teal-700/60 font-mono">
            ISF Paziente: <strong>1 U = -{regimen.isf} mg/dL</strong>
          </div>
        </div>

        {/* Inputs for Spot calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
          
          <div>
            <label className="block text-xs font-semibold text-teal-200 mb-1">
              Glicemia Capillare Rilevata (mg/dL)
            </label>
            <div className="relative">
              <input
                type="number"
                min="40"
                max="700"
                value={currentGlucose}
                onChange={(e) => setCurrentGlucose(Number(e.target.value) || 0)}
                className="w-full text-base font-bold px-3 py-2.5 rounded-xl bg-slate-950 text-white border border-teal-600 focus:ring-2 focus:ring-teal-400 font-mono"
              />
              <span className="absolute right-3 top-2.5 text-xs text-teal-400 font-semibold">mg/dL</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-teal-200 mb-1">
              Target Glicemico Desiderato
            </label>
            <div className="relative">
              <input
                type="number"
                min="90"
                max="200"
                value={targetGlucose}
                onChange={(e) => setTargetGlucose(Number(e.target.value) || 140)}
                className="w-full text-base font-bold px-3 py-2.5 rounded-xl bg-slate-950 text-white border border-teal-600 focus:ring-2 focus:ring-teal-400 font-mono"
              />
              <span className="absolute right-3 top-2.5 text-xs text-teal-400 font-semibold">mg/dL</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-teal-200 mb-1 flex items-center justify-between">
              <span>Ore dall'Ultimo Bolo Rapido</span>
              <span className="text-[10px] text-teal-400 font-mono">Verifica IOB</span>
            </label>
            <select
              value={lastBolusHoursAgo ?? 4}
              onChange={(e) => setLastBolusHoursAgo(Number(e.target.value))}
              className="w-full text-sm font-medium px-3 py-2.5 rounded-xl bg-slate-950 text-white border border-teal-600 focus:ring-2 focus:ring-teal-400"
            >
              <option value={1}>1 ora fa (Molta insulina ancora attiva!)</option>
              <option value={2}>2 ore fa (Insulina parzialmente attiva)</option>
              <option value={3}>3 ore fa (Coda finale bolo precedente)</option>
              <option value={4}>≥ 4 ore fa (Nessun bolo attivo residuo)</option>
            </select>
          </div>

        </div>

        {/* Spot calculation Output Card */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-teal-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider">
              Dose Correttiva Rapida Consigliata:
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {spotResult.recommendedUnits} Unità
              </span>
              <span className="text-xs text-slate-300 font-medium">
                di {regimen.recommendedBolusType.split(':')[1]?.trim() || 'Analogo Rapido (Aspart/Lispro)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 font-mono">
              {spotResult.explanation}
            </p>
          </div>

          {/* If eating vs fasting note */}
          <div className="bg-teal-900/50 p-3 rounded-lg border border-teal-700/60 text-xs text-teal-200 sm:max-w-xs">
            <strong className="text-white block mb-1">Come somministrare:</strong>
            {currentGlucose >= 70 ? (
              <span>
                • <strong>Al pasto:</strong> Somministrare <strong>{spotResult.recommendedUnits} U</strong> in AGGIUNTA al bolo prandiale previsto.<br/>
                • <strong>A digiuno / lontano dai pasti:</strong> Somministrare solo le <strong>{spotResult.recommendedUnits} U</strong> di correzione.
              </span>
            ) : (
              <span className="text-rose-300 font-bold">Ipoglicemia in atto: NON somministrare insulina!</span>
            )}
          </div>
        </div>

        {/* Insulin-On-Board (IOB) Warning if bolus < 3-4 hours */}
        {spotResult.iobWarning && (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/80 border border-amber-500/80 text-amber-200 text-xs flex items-start gap-2.5">
            <Flame className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block">
                Rischio Insulin Stacking (Accumulo di Insulina Attiva):
              </span>
              {spotResult.iobWarning}
            </div>
          </div>
        )}

      </div>

      {/* 2. CUSTOMIZED SLIDING SCALE CORRECTION TABLE (SCALA DI CORREZIONE PRANDIALE) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-teal-600" />
              Tabella Scala di Correzione Personalizzata (Sliding Scale Ospedaliera)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Protocollo di correzione pre-prandiale basato sull'ISF ({regimen.isf} mg/dL/U). Da allegare alla scheda infermieristica.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200">
            Target Pre-Prandiale: 100 - 140 mg/dL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300">
                <th className="py-3 px-4 rounded-tl-lg">Range Glicemia Capillare</th>
                <th className="py-3 px-4">Dose Correzione Extra</th>
                <th className="py-3 px-4 rounded-tr-lg">Istruzioni Cliniche ed Infermieristiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {correctionScale.map((step, idx) => {
                const isHypo = step.minGlucose === 0;
                const isTarget = step.minGlucose === 70;
                const isVeryHigh = step.minGlucose > 260;

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isHypo
                        ? 'bg-rose-50/90 text-rose-950 font-semibold'
                        : isTarget
                        ? 'bg-emerald-50/60 text-emerald-950'
                        : isVeryHigh
                        ? 'bg-amber-50/70 text-amber-950'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      {step.glucoseRange}
                    </td>
                    <td className="py-3 px-4">
                      {isHypo ? (
                        <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-xs">
                          0 U (BLOCCO)
                        </span>
                      ) : isTarget ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-xs">
                          +0 U (In Target)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-teal-700 text-white font-black font-mono text-sm shadow-xs">
                          +{step.extraUnits} Unità
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {step.actionNote}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Clinical Footnote on Sliding Scale Monotherapy Ban */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 block">
              Nota Clinica Fondamentale (Divieto di Sliding Scale "isolata / pura"):
            </strong>
            Secondo le linee guida ADA e SID-AMD, l'uso della sliding scale come <em>unica terapia</em> (sliding scale monotherapy) è <strong>fortemente sconsigliato</strong> perché agisce in ritardo sull'iperglicemia invece di prevenirla. Le correzioni devono essere SEMPRE integrate in uno schema <strong>Basal-Bolus</strong> o <strong>Basal-Plus</strong> programmato.
          </div>
        </div>

      </div>

    </div>
  );
};
