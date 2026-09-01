import React from 'react';
import { InsulinRegimen, PatientProfile } from '../types';
import {
  Syringe,
  Clock,
  Zap,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingDown,
  ShieldAlert,
  Droplet,
  HeartPulse,
} from 'lucide-react';

interface RegimenDisplayProps {
  regimen: InsulinRegimen;
  patient: PatientProfile;
}

export const RegimenDisplay: React.FC<RegimenDisplayProps> = ({ regimen, patient }) => {
  const isNutritionArtificial =
    patient.nutrition?.type &&
    patient.nutrition.type !== 'oral_standard';

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Total TDD & Primary Scheme Breakdown */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <Syringe className="h-3.5 w-3.5" />
              Schema Basal-Bolus Ospedaliero Calcolato
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Fabbisogno Totale: <span className="text-teal-400 font-mono">{regimen.tdd} Unità/die</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Calcolato su peso ({patient.weightKg} kg) con fattore personalizzato di{' '}
              <strong className="text-teal-300 font-mono">{regimen.factorUsed} U/kg/die</strong> in base a età, funzione renale (eGFR {patient.egfr}), steroide e modalità nutrizionale.
            </p>
          </div>

          {/* Quick Metrics Badge Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            {/* Basal Box */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Insulina Basale</div>
              <div className="text-2xl font-black text-indigo-300 font-mono mt-0.5">
                {regimen.basalDose} <span className="text-xs font-normal text-slate-400">U ({regimen.basalPercentage}%)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">1 volta/die (o s.c. residua)</div>
            </div>

            {/* Total Boluses / Nutritional Coverage Box */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-center">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">
                {patient.nutrition?.type?.startsWith('parenteral') ? 'Insulina in Sacca' : 'Quota Nutrizionale / Boli'}
              </div>
              <div className="text-2xl font-black text-emerald-300 font-mono mt-0.5">
                {regimen.bolusTotalDose} <span className="text-xs font-normal text-slate-400">U ({100 - regimen.basalPercentage}%)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {patient.nutrition?.type === 'npo_fasting'
                  ? 'Zero boli a digiuno'
                  : patient.nutrition?.type?.startsWith('parenteral')
                  ? 'In sacca NPT'
                  : patient.nutrition?.type === 'enteral_continuous'
                  ? 'Frazionata ogni 6h'
                  : 'Divisi ai pasti/boli'}
              </div>
            </div>

            {/* Target Glycemia Box */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Target Ospedaliero</div>
              <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
                100-180 <span className="text-xs font-normal text-slate-400">mg/dL</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Pre-pasto 100-140</div>
            </div>

          </div>
        </div>
      </div>

      {/* SPECIAL NUTRITIONAL PROTOCOL (IF ENTERAL, PARENTERAL, NPO OR POOR ORAL) */}
      {regimen.nutritionProtocol && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            <span>{regimen.nutritionProtocol.title}</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {regimen.nutritionProtocol.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <strong className="text-rose-700 block font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Regola di Sicurezza Vitale:
              </strong>
              <span className="text-slate-700 leading-relaxed block">
                {regimen.nutritionProtocol.safetyRule}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-1">
              <strong className="text-teal-800 block font-bold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-teal-600" />
                Monitoraggio & Titolazione:
              </strong>
              <span className="text-slate-700 leading-relaxed block">
                {regimen.nutritionProtocol.monitoring}
                <br />
                <span className="text-slate-500 text-[11px] mt-1 block">
                  {regimen.nutritionProtocol.titrationRule}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HIGHLIGHT BOX: QUANTO ABBASSA LA GLICEMIA 1 UNITÀ DI INSULINA (ISF & ICR) */}
      <div className="bg-teal-950 text-teal-50 rounded-2xl p-5 sm:p-6 border-2 border-teal-500/40 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/30">
                <TrendingDown className="h-5 w-5" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Fattore di Sensibilità Insulinica (ISF / Regola del 1800)
              </h3>
            </div>
            <p className="text-xs text-teal-200/90 max-w-xl">
              Indica di quanti mg/dL scende la glicemia per ogni singola unità di insulina rapida somministrata. Fondamentale per calcolare le dosi correttive su stick.
            </p>
          </div>

          {/* Big Sensibility Highlight */}
          <div className="flex items-center gap-4 bg-teal-900/80 px-4 py-3 rounded-xl border border-teal-500/50">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
                1 Unità di Analogo Rapido abbassa:
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-center justify-center gap-1">
                <span>~{regimen.isf}</span>
                <span className="text-sm font-semibold text-teal-300">mg/dL</span>
              </div>
            </div>

            <div className="h-10 w-px bg-teal-700 hidden sm:block"></div>

            <div className="text-center hidden sm:block">
              <div className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
                Rapporto Insulina/Carboidrati (ICR):
              </div>
              <div className="text-xl font-bold text-white font-mono">
                1 U / {regimen.icr} g <span className="text-xs font-normal text-teal-300">CHO</span>
              </div>
              <div className="text-[9px] text-teal-300/80">Regola del 500</div>
            </div>
          </div>

        </div>

        {/* Formula breakdown footer */}
        <div className="mt-4 pt-3 border-t border-teal-800/80 flex flex-wrap items-center justify-between text-xs text-teal-300/90 gap-2">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-teal-400" />
            <span>
              Formula applicata: <strong>ISF = 1800 / TDD ({regimen.tdd} U) = {regimen.isf} mg/dL</strong>
              {regimen.isfRegular !== regimen.isf && ` (se Insulina Umana Regolare: 1500 / ${regimen.tdd} = ${regimen.isfRegular} mg/dL)`}
            </span>
          </div>
          <span className="text-[11px] text-teal-400 font-mono">Sensibilità: {regimen.isf >= 50 ? 'Alta / Prudenza' : regimen.isf <= 25 ? 'Bassa (Insulino-resistente)' : 'Standard'}</span>
        </div>
      </div>

      {/* DETAILED DAILY TIMELINE / INJECTION SCHEDULE - VERTICAL LAYOUT */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                <Clock className="h-5 w-5 text-teal-600" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Programma Orario Somministrazioni (Sequenza Cronologica Verticale)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Schema operativo orario, vie di somministrazione (s.c. o in sacca NPT) e dosaggi esatti per il personale infermieristico
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
              {regimen.scheduledDoses.length} Somministrazioni Giornaliere
            </span>
          </div>
        </div>

        {/* Vertical Timeline List */}
        <div className="space-y-4 relative before:absolute before:inset-0 before:left-5 sm:before:left-6 before:w-0.5 before:bg-slate-200 before:pointer-events-none">
          {regimen.scheduledDoses.map((doseItem, idx) => {
            const isBasal = doseItem.label.toLowerCase().includes('basale');
            const isInBag = doseItem.route.includes('sacca');
            const isNight = doseItem.time.includes('22:00') || doseItem.time.includes('21:00') || doseItem.time.includes('23:00') || doseItem.time.includes('24:00');

            return (
              <div
                key={idx}
                className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ml-0 sm:ml-2 ${
                  isBasal
                    ? 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-300 shadow-xs'
                    : isInBag
                    ? 'border-teal-200 bg-teal-50/40 hover:border-teal-300 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs'
                }`}
              >
                {/* Left Side: Time Node + Label & Drug Info */}
                <div className="flex items-start gap-4">
                  {/* Time Circle Node */}
                  <div
                    className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-mono font-bold shadow-xs border ${
                      isBasal
                        ? 'bg-indigo-600 text-white border-indigo-700'
                        : isInBag
                        ? 'bg-teal-600 text-white border-teal-700'
                        : 'bg-slate-800 text-white border-slate-900'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5 opacity-80 mb-0.5" />
                    <span className="text-[10px] sm:text-xs leading-none">
                      {doseItem.time.split(' ')[0]}
                    </span>
                  </div>

                  {/* Dose Title & Clinical Specifications */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {doseItem.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isBasal
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : isInBag
                            ? 'bg-teal-100 text-teal-900 border border-teal-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {doseItem.route}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {doseItem.time}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Syringe className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span>{doseItem.drugType}</span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 mt-2 leading-relaxed">
                      <strong className="text-slate-800">Istruzioni Reparto: </strong>
                      {doseItem.instructions}
                    </div>
                  </div>
                </div>

                {/* Right Side: Big Clear Dose Callout */}
                <div
                  className={`flex md:flex-col items-center justify-between md:justify-center p-3 sm:p-4 rounded-xl border min-w-[140px] shrink-0 text-right md:text-center ${
                    isBasal
                      ? 'bg-indigo-50 border-indigo-200'
                      : isInBag
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    {isBasal ? 'Dose Basale' : isInBag ? 'In Sacca NPT' : 'Dose Bolo'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {doseItem.dose} <span className="text-sm font-bold text-teal-700">Unità</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {isBasal
                      ? `${regimen.basalPercentage}% del TDD`
                      : isInBag
                      ? `${Math.round((doseItem.dose / regimen.tdd) * 100)}% del fabbisogno`
                      : `+ Scala correzione`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clinical Rationale & Safety Alerts */}
        <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Rationale items */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              Razionale di Calcolo del Fabbisogno:
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5">
              {regimen.rationale.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Safety Alerts */}
          {regimen.alerts.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Alert di Sicurezza e Monitoraggio Reparto:
              </div>
              <ul className="text-xs text-amber-800 space-y-1.5">
                {regimen.alerts.map((alert, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
