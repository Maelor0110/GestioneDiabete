import React, { useState } from 'react';
import { InsulinRegimen, DailyGlucoseLog, PatientProfile } from '../types';
import { evaluateDailyTitration } from '../utils/calculator';
import { RefreshCw, AlertTriangle, CheckCircle2, Moon, Sun, Sunrise, Sunset, ShieldAlert, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import { NumericInput } from './NumericInput';

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

  const setScenario = (scenario: 'target' | 'high_fasting' | 'high_lunch' | 'hypo' | 'clear') => {
    if (scenario === 'clear') {
      setLog({
        id: 'today',
        date: new Date().toISOString().split('T')[0],
        fasting: undefined as any,
        preLunch: undefined as any,
        preDinner: undefined as any,
        bedtime: undefined as any,
        night3am: undefined,
        hypoEvents: 0,
      });
      return;
    }

    if (scenario === 'target') {
      setLog({
        id: 'today',
        date: new Date().toISOString().split('T')[0],
        fasting: 125,
        preLunch: 135,
        preDinner: 140,
        bedtime: 130,
        night3am: undefined,
        hypoEvents: 0,
      });
      return;
    }

    if (scenario === 'high_fasting') {
      setLog({
        id: 'today',
        date: new Date().toISOString().split('T')[0],
        fasting: 220,
        preLunch: 140,
        preDinner: 150,
        bedtime: 160,
        night3am: 205,
        hypoEvents: 0,
      });
      return;
    }

    if (scenario === 'high_lunch') {
      setLog({
        id: 'today',
        date: new Date().toISOString().split('T')[0],
        fasting: 130,
        preLunch: 145,
        preDinner: 235,
        bedtime: 155,
        night3am: undefined,
        hypoEvents: 0,
      });
      return;
    }

    if (scenario === 'hypo') {
      setLog({
        id: 'today',
        date: new Date().toISOString().split('T')[0],
        fasting: 58,
        preLunch: 110,
        preDinner: 135,
        bedtime: 120,
        night3am: 52,
        hypoEvents: 1,
      });
      return;
    }
  };

  const getGlucoseStatusTag = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val) || val < 30) {
      return <span className="text-[10px] text-slate-400 font-medium italic">Non inserito</span>;
    }
    if (val < 70) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
          ⚠️ Ipoglicemia (&lt;70)
        </span>
      );
    }
    if (val <= 140) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
          ✓ Target Ottimale (70-140)
        </span>
      );
    }
    if (val <= 180) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
          ✓ Target Degenza (141-180)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
        ▲ Iperglicemia (&gt;180)
      </span>
    );
  };

  const newBasalDose = Math.max(0, regimen.basalDose + recommendation.basalChange);
  const newBreakfast = Math.max(0, regimen.breakfastBolus + recommendation.bolusChanges.breakfast);
  const newLunch = Math.max(0, regimen.lunchBolus + recommendation.bolusChanges.lunch);
  const newDinner = Math.max(0, regimen.dinnerBolus + recommendation.bolusChanges.dinner);
  const newTdd = newBasalDose + newBreakfast + newLunch + newDinner;

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
            Inserisci le glicemie capillari delle ultime 24 ore per calcolare l'adeguamento posologico basale/bolo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Target Ospedaliero: 100 - 180 mg/dL
          </span>
        </div>
      </div>

      {/* Quick Scenario Fill Buttons */}
      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          <span>Esempi Clinici Rapidi di Titolazione:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScenario('target')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
          >
            Tutto a Target (125-140)
          </button>
          <button
            type="button"
            onClick={() => setScenario('high_fasting')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
          >
            Digiuno Alto (220)
          </button>
          <button
            type="button"
            onClick={() => setScenario('high_lunch')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-orange-50 text-orange-800 border border-orange-200 transition-colors cursor-pointer"
          >
            Pre-Cena Alto (235)
          </button>
          <button
            type="button"
            onClick={() => setScenario('hypo')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
          >
            Ipoglicemia Notte (58)
          </button>
          <button
            type="button"
            onClick={() => setScenario('clear')}
            className="p-1 rounded-lg text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Azzera campi"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Inputs: 24h Glycemia Log */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
          <span>1. Rilevazioni Glicemie Capillari Ultime 24 Ore:</span>
          <span className="text-[11px] text-slate-500 font-normal">Valori in mg/dL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Digiuno (Mattino) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Sunrise className="h-3.5 w-3.5 text-amber-500" />
              Digiuno (07:30)
            </label>
            <NumericInput
              id="titration-fasting"
              value={log.fasting}
              onChange={(val) => handleLogChange('fasting', val)}
              min={40}
              max={600}
              step={5}
              unit="mg/dL"
              placeholder="140"
              size="sm"
            />
            <div className="flex flex-col gap-0.5">
              {getGlucoseStatusTag(log.fasting)}
              <span className="text-[10px] text-slate-500">Regola la Basale</span>
            </div>
          </div>

          {/* Pre-Pranzo */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Sun className="h-3.5 w-3.5 text-amber-600" />
              Pre-Pranzo (12:00)
            </label>
            <NumericInput
              id="titration-preLunch"
              value={log.preLunch}
              onChange={(val) => handleLogChange('preLunch', val)}
              min={40}
              max={600}
              step={5}
              unit="mg/dL"
              placeholder="140"
              size="sm"
            />
            <div className="flex flex-col gap-0.5">
              {getGlucoseStatusTag(log.preLunch)}
              <span className="text-[10px] text-slate-500">Riflette Colazione</span>
            </div>
          </div>

          {/* Pre-Cena */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Sunset className="h-3.5 w-3.5 text-orange-500" />
              Pre-Cena (19:00)
            </label>
            <NumericInput
              id="titration-preDinner"
              value={log.preDinner}
              onChange={(val) => handleLogChange('preDinner', val)}
              min={40}
              max={600}
              step={5}
              unit="mg/dL"
              placeholder="140"
              size="sm"
            />
            <div className="flex flex-col gap-0.5">
              {getGlucoseStatusTag(log.preDinner)}
              <span className="text-[10px] text-slate-500">Riflette Pranzo</span>
            </div>
          </div>

          {/* Coricarsi (Bedtime) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-indigo-500" />
              Coricarsi (22:30)
            </label>
            <NumericInput
              id="titration-bedtime"
              value={log.bedtime}
              onChange={(val) => handleLogChange('bedtime', val)}
              min={40}
              max={600}
              step={5}
              unit="mg/dL"
              placeholder="160"
              size="sm"
            />
            <div className="flex flex-col gap-0.5">
              {getGlucoseStatusTag(log.bedtime)}
              <span className="text-[10px] text-slate-500">Riflette Cena</span>
            </div>
          </div>

          {/* Notte 03:00 (Opzionale) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-slate-600" />
              Notte (03:00)
            </label>
            <NumericInput
              id="titration-night3am"
              value={log.night3am}
              onChange={(val) => handleLogChange('night3am', val)}
              min={40}
              max={600}
              step={5}
              unit="mg/dL"
              placeholder="Opzionale"
              size="sm"
            />
            <div className="flex flex-col gap-0.5">
              {getGlucoseStatusTag(log.night3am)}
              <span className="text-[10px] text-slate-500">Alba / Somogyi</span>
            </div>
          </div>

        </div>

        {/* Hypo events selector */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-800">
              Episodi di Ipoglicemia (&lt; 70 mg/dL) o sintomi nelle ultime 24 ore:
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => handleLogChange('hypoEvents', count)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  log.hypoEvents === count
                    ? count > 0
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-teal-700 text-white border-teal-700 shadow-2xs'
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

        {/* Comparison table: Previous vs Proposed Doses */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Bolo Colazione</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {newBreakfast} <span className="text-xs font-normal text-slate-500">U</span>
            </div>
            <div className="text-[11px] font-semibold mt-1">
              {recommendation.bolusChanges.breakfast !== 0 ? (
                <span className={recommendation.bolusChanges.breakfast > 0 ? 'text-amber-700' : 'text-rose-700'}>
                  {regimen.breakfastBolus} U → {recommendation.bolusChanges.breakfast > 0 ? `+${recommendation.bolusChanges.breakfast}` : recommendation.bolusChanges.breakfast} U
                </span>
              ) : (
                <span className="text-slate-500">Invariato ({regimen.breakfastBolus} U)</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Bolo Pranzo</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {newLunch} <span className="text-xs font-normal text-slate-500">U</span>
            </div>
            <div className="text-[11px] font-semibold mt-1">
              {recommendation.bolusChanges.lunch !== 0 ? (
                <span className={recommendation.bolusChanges.lunch > 0 ? 'text-amber-700' : 'text-rose-700'}>
                  {regimen.lunchBolus} U → {recommendation.bolusChanges.lunch > 0 ? `+${recommendation.bolusChanges.lunch}` : recommendation.bolusChanges.lunch} U
                </span>
              ) : (
                <span className="text-slate-500">Invariato ({regimen.lunchBolus} U)</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-500">Bolo Cena</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-1">
              {newDinner} <span className="text-xs font-normal text-slate-500">U</span>
            </div>
            <div className="text-[11px] font-semibold mt-1">
              {recommendation.bolusChanges.dinner !== 0 ? (
                <span className={recommendation.bolusChanges.dinner > 0 ? 'text-amber-700' : 'text-rose-700'}>
                  {regimen.dinnerBolus} U → {recommendation.bolusChanges.dinner > 0 ? `+${recommendation.bolusChanges.dinner}` : recommendation.bolusChanges.dinner} U
                </span>
              ) : (
                <span className="text-slate-500">Invariato ({regimen.dinnerBolus} U)</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border-2 border-teal-400 bg-teal-50/70 text-center">
            <div className="text-[10px] uppercase font-bold text-teal-900">Insulina Basale</div>
            <div className="text-xl font-black text-teal-950 font-mono mt-1">
              {newBasalDose} <span className="text-xs font-normal text-teal-800">U</span>
            </div>
            <div className="text-[11px] font-semibold mt-1">
              {recommendation.basalChange !== 0 ? (
                <span className={recommendation.basalChange > 0 ? 'text-amber-800 font-bold' : 'text-rose-800 font-bold'}>
                  {regimen.basalDose} U → {recommendation.basalChange > 0 ? `+${recommendation.basalChange}` : recommendation.basalChange} U
                </span>
              ) : (
                <span className="text-teal-800">Invariata ({regimen.basalDose} U)</span>
              )}
            </div>
          </div>

        </div>

        {/* TDD Summary */}
        <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Dose Totale Giornaliera (TDD):</span>
            <span className="font-mono font-bold text-teal-300 text-sm">
              {regimen.tdd} U/die
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono font-bold text-emerald-400 text-sm">
              Nuovo TDD {newTdd} U/die
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Nuova ripartizione: {newBasalDose} U Basale ({Math.round((newBasalDose / (newTdd || 1)) * 100)}%) + {newBreakfast + newLunch + newDinner} U Boli
          </div>
        </div>

      </div>

    </div>
  );
};

