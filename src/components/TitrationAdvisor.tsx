import React, { useState } from 'react';
import { InsulinRegimen, DailyGlucoseLog, PatientProfile } from '../types';
import { evaluateDailyTitration } from '../utils/calculator';
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle2, Moon, Sun, Sunrise, Sunset, ShieldAlert } from 'lucide-react';

interface TitrationAdvisorProps {
  regimen: InsulinRegimen;
  patient: PatientProfile;
}

export const TitrationAdvisor: React.FC<TitrationAdvisorProps> = ({ regimen, patient }) => {
  const [log, setLog] = useState<DailyGlucoseLog>({
    id: 'today',
    date: new Date().toISOString().split('T')[0],
    fasting: 195,
    preLunch: 165,
    preDinner: 210,
    bedtime: 175,
    night3am: undefined,
    hypoEvents: 0,
    notes: '',
  });

  const recommendation = evaluateDailyTitration(regimen, log);

  const handleLogChange = (field: keyof DailyGlucoseLog, val: any) => {
    setLog((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const newBasalDose = regimen.basalDose + recommendation.basalChange;
  const newBreakfast = regimen.breakfastBolus + recommendation.bolusChanges.breakfast;
  const newLunch = regimen.lunchBolus + recommendation.bolusChanges.lunch;
  const newDinner = regimen.dinnerBolus + recommendation.bolusChanges.dinner;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <RefreshCw className="h-5 w-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Titolazione Giornaliera dello Schema (Giro Visite Mattutino)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inserisci le glicemie capillari delle ultime 24 ore per calcolare l'aggiustamento posologico raccomandato
          </p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
          Target Degenza: 100 - 180 mg/dL
        </span>
      </div>

      {/* Inputs: 24h Glycemia Log */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          1. Rilevazioni Glicemie Capillari Ultime 24 Ore:
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Digiuno (Mattino) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Sunrise className="h-3.5 w-3.5 text-amber-500" />
              Digiuno (07:30)
            </label>
            <div className="relative">
              <input
                type="number"
                value={log.fasting || ''}
                onChange={(e) => handleLogChange('fasting', Number(e.target.value))}
                placeholder="mg/dL"
                className="w-full text-sm font-bold font-mono px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Regola la Basale</div>
          </div>

          {/* Pre-Pranzo */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Sun className="h-3.5 w-3.5 text-amber-600" />
              Pre-Pranzo (12:00)
            </label>
            <div className="relative">
              <input
                type="number"
                value={log.preLunch || ''}
                onChange={(e) => handleLogChange('preLunch', Number(e.target.value))}
                placeholder="mg/dL"
                className="w-full text-sm font-bold font-mono px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Riflette Colazione</div>
          </div>

          {/* Pre-Cena */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Sunset className="h-3.5 w-3.5 text-orange-500" />
              Pre-Cena (19:00)
            </label>
            <div className="relative">
              <input
                type="number"
                value={log.preDinner || ''}
                onChange={(e) => handleLogChange('preDinner', Number(e.target.value))}
                placeholder="mg/dL"
                className="w-full text-sm font-bold font-mono px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Riflette Pranzo</div>
          </div>

          {/* Coricarsi (Bedtime) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-indigo-500" />
              Coricarsi (22:30)
            </label>
            <div className="relative">
              <input
                type="number"
                value={log.bedtime || ''}
                onChange={(e) => handleLogChange('bedtime', Number(e.target.value))}
                placeholder="mg/dL"
                className="w-full text-sm font-bold font-mono px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Riflette Cena</div>
          </div>

          {/* Notte 03:00 (Opzionale) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-slate-600" />
              Notte (03:00)
            </label>
            <div className="relative">
              <input
                type="number"
                value={log.night3am ?? ''}
                onChange={(e) => handleLogChange('night3am', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Opzionale"
                className="w-full text-sm font-bold font-mono px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Rileva Somogyi / Ipoglicemia</div>
          </div>

        </div>

        {/* Hypo events selector */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-800">
              Episodi di Ipoglicemia (&lt; 70 mg/dL) nelle ultime 24 ore:
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => handleLogChange('hypoEvents', count)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                  log.hypoEvents === count
                    ? count > 0
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-teal-700 text-white border-teal-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {count === 0 ? 'Nessuna (0)' : `${count} evento${count > 1 ? 'i' : ''}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Recommendation Results */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          2. Proposta di Aggiustamento Posologico per Oggi:
        </div>

        <div
          className={`p-4 rounded-xl border ${
            recommendation.urgency === 'warning'
              ? 'bg-rose-50 border-rose-300'
              : recommendation.basalChange !== 0 || Object.values(recommendation.bolusChanges).some((v) => v !== 0)
              ? 'bg-amber-50 border-amber-300'
              : 'bg-emerald-50 border-emerald-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {recommendation.urgency === 'warning' ? (
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold text-slate-900 mb-1">
                {recommendation.urgency === 'warning' ? 'INTERVENTO DI SICUREZZA IPOGLICEMIA:' : 'INDICAZIONE CLINICA:'}
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {recommendation.overallAdvice}
              </p>
            </div>
          </div>
        </div>

        {/* New proposed doses table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Nuova Colazione</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {newBreakfast} <span className="text-xs font-normal text-slate-500">U</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {recommendation.bolusChanges.breakfast !== 0 ? (
                <span className={recommendation.bolusChanges.breakfast > 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {recommendation.bolusChanges.breakfast > 0 ? `+${recommendation.bolusChanges.breakfast}` : recommendation.bolusChanges.breakfast} U
                </span>
              ) : (
                'Invariato'
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Nuovo Pranzo</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {newLunch} <span className="text-xs font-normal text-slate-500">U</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {recommendation.bolusChanges.lunch !== 0 ? (
                <span className={recommendation.bolusChanges.lunch > 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {recommendation.bolusChanges.lunch > 0 ? `+${recommendation.bolusChanges.lunch}` : recommendation.bolusChanges.lunch} U
                </span>
              ) : (
                'Invariato'
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Nuova Cena</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {newDinner} <span className="text-xs font-normal text-slate-500">U</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {recommendation.bolusChanges.dinner !== 0 ? (
                <span className={recommendation.bolusChanges.dinner > 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {recommendation.bolusChanges.dinner > 0 ? `+${recommendation.bolusChanges.dinner}` : recommendation.bolusChanges.dinner} U
                </span>
              ) : (
                'Invariato'
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/70 text-center">
            <div className="text-[10px] uppercase font-bold text-indigo-900">Nuova Basale</div>
            <div className="text-xl font-black text-indigo-950 font-mono mt-1">
              {newBasalDose} <span className="text-xs font-normal text-indigo-800">U</span>
            </div>
            <div className="text-[10px] text-indigo-900">
              {recommendation.basalChange !== 0 ? (
                <span className={recommendation.basalChange > 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {recommendation.basalChange > 0 ? `+${recommendation.basalChange}` : recommendation.basalChange} U
                </span>
              ) : (
                'Invariata'
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
