import React from 'react';
import {
  PatientProfile,
  DiabetesType,
  ClinicalSetting,
  NutritionType,
  InsulinExperience,
  SteroidDrug,
  HomeMedicationId,
} from '../types';
import {
  User,
  Scale,
  Pill,
  Zap,
  Sparkles,
  Utensils,
  AlertTriangle,
  HeartPulse,
  Calculator,
  RotateCcw,
} from 'lucide-react';
import { NumericInput } from './NumericInput';
import { calculateCKDEPI, calculateCockcroftGault } from '../utils/calculator';

interface PatientFormProps {
  patient: PatientProfile;
  onChange: (updated: PatientProfile) => void;
  onCalculate?: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ patient, onChange, onCalculate }) => {
  const bmi = patient.heightCm > 0 ? (patient.weightKg / Math.pow(patient.heightCm / 100, 2)).toFixed(1) : 'N/D';

  const calculatedCrCl = patient.creatinine
    ? calculateCockcroftGault(patient.creatinine, patient.age, patient.gender, patient.weightKg)
    : undefined;

  const handleFieldChange = (field: keyof PatientProfile, value: any) => {
    const updated: PatientProfile = {
      ...patient,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };

    // Auto-calculate eGFR directly when Creatinine, Age, or Gender change
    if (field === 'creatinine' || field === 'age' || field === 'gender') {
      const creat = field === 'creatinine' ? value : patient.creatinine;
      const ageVal = field === 'age' ? value : patient.age;
      const genderVal = field === 'gender' ? value : patient.gender;

      if (creat && creat > 0 && ageVal > 0) {
        updated.egfr = calculateCKDEPI(creat, ageVal, genderVal);
      }
    }

    onChange(updated);
  };

  const handleRecalculateEgfr = () => {
    if (patient.creatinine && patient.creatinine > 0) {
      const autoEgfr = calculateCKDEPI(patient.creatinine, patient.age, patient.gender);
      handleFieldChange('egfr', autoEgfr);
    }
  };

  const handleNutritionTypeChange = (type: NutritionType) => {
    onChange({
      ...patient,
      nutrition: {
        ...patient.nutrition,
        type,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleNutritionDetailsChange = (field: string, value: any) => {
    onChange({
      ...patient,
      nutrition: {
        ...patient.nutrition,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSteroidChange = (field: string, value: any) => {
    onChange({
      ...patient,
      steroids: {
        ...patient.steroids,
        [field]: value,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const toggleHomeMed = (medId: HomeMedicationId) => {
    const current = patient.homeMedications || [];
    const exists = current.includes(medId);
    const updated = exists ? current.filter((m) => m !== medId) : [...current, medId];
    handleFieldChange('homeMedications', updated);
  };

  const getEgfrBadge = (val: number) => {
    if (val >= 60) return <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">eGFR ≥60 (G1-G2 Normale/Lieve)</span>;
    if (val >= 45) return <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">eGFR 45-59 (G3a Lieve-Mod)</span>;
    if (val >= 30) return <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">eGFR 30-44 (G3b Moderato-Sev)</span>;
    if (val >= 15) return <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold">eGFR 15-29 (G4 Severo)</span>;
    return <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold animate-pulse">eGFR &lt;15 (G5 Terminale / Dialisi)</span>;
  };

  const currentNutrition = patient.nutrition?.type || 'oral_standard';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      
      {/* Header section */}
      <div className="bg-slate-900 text-white p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-teal-400" />
              Parametri Clinici del Paziente Ricoverato
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Inserisci i dati per calibrare lo schema insulinico ospedaliero (orale, NPO, enterale o parenterale) e la riconciliazione farmacologica
            </p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            Algoritmo calibrazione: <span className="text-teal-300 font-medium">Linee Guida ADA / SID-AMD / ESPEN</span>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="p-5 sm:p-6 space-y-6">
        
        {/* ROW 1: Anagrafica, Reparto, Età, Sesso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Identificativo Paziente / Letto
            </label>
            <input
              type="text"
              value={patient.bedOrName}
              onChange={(e) => handleFieldChange('bedOrName', e.target.value)}
              placeholder="es. Letto 14 - Rossi M."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reparto di Degenza
            </label>
            <input
              type="text"
              value={patient.department}
              onChange={(e) => handleFieldChange('department', e.target.value)}
              placeholder="es. Medicina Interna, Chirurgia..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Età (Anni)</span>
              {patient.age >= 75 && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Anziano / Cautela
                </span>
              )}
            </label>
            <NumericInput
              id="input-age"
              value={patient.age}
              onChange={(val) => handleFieldChange('age', val ?? 18)}
              min={18}
              max={110}
              step={1}
              unit="anni"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sesso
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFieldChange('gender', 'M')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  patient.gender === 'M'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Maschio
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange('gender', 'F')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  patient.gender === 'F'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Femmina
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: Peso, Altezza (BMI), Creatinina, eGFR Calcolato */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Scale className="h-3.5 w-3.5 text-teal-600" />
                Peso Corporeo (kg)
              </span>
              <span className="text-[11px] font-bold text-teal-700">{patient.weightKg} kg</span>
            </label>
            <NumericInput
              id="input-weight"
              value={patient.weightKg}
              onChange={(val) => handleFieldChange('weightKg', Math.max(30, val ?? 70))}
              min={30}
              max={250}
              step={1}
              allowDecimals={true}
              unit="kg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Altezza (cm)</span>
              <span className="text-[11px] text-slate-500">BMI: <strong className="text-slate-800">{bmi} kg/m²</strong></span>
            </label>
            <NumericInput
              id="input-height"
              value={patient.heightCm}
              onChange={(val) => handleFieldChange('heightCm', val ?? 170)}
              min={120}
              max={220}
              step={1}
              unit="cm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                Creatinina Sierica
              </span>
              <span className="text-[10px] text-teal-600 font-semibold">Calcola eGFR</span>
            </label>
            <NumericInput
              id="input-creatinine"
              value={patient.creatinine}
              onChange={(val) => handleFieldChange('creatinine', val)}
              min={0.4}
              max={15.0}
              step={0.1}
              allowDecimals={true}
              unit="mg/dL"
              placeholder="es. 1.2"
            />
            <p className="text-[10px] text-slate-500 mt-1">Aggiorna eGFR in tempo reale</p>
          </div>

          <div className="bg-teal-50/40 p-2.5 rounded-xl border border-teal-200/80">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-teal-950 flex items-center gap-1">
                <Calculator className="h-3.5 w-3.5 text-teal-600" />
                <span>eGFR Calcolato</span>
              </label>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100/80 text-teal-800 border border-teal-200">
                CKD-EPI 2021
              </span>
            </div>
            
            <NumericInput
              id="input-egfr"
              value={patient.egfr}
              onChange={(val) => handleFieldChange('egfr', val ?? 60)}
              min={5}
              max={140}
              step={1}
              unit="mL/min"
            />

            <div className="mt-1.5 flex flex-col gap-1">
              <div>{getEgfrBadge(patient.egfr)}</div>
              {calculatedCrCl !== undefined && (
                <div className="text-[10px] text-slate-600 flex items-center justify-between">
                  <span>CrCl Cockcroft-Gault:</span>
                  <span className="font-bold text-slate-800">{calculatedCrCl} mL/min</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: NUTRIZIONE & MODALITÀ DI ALIMENTAZIONE (HIGHLIGHT SECTION) */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-teal-600/30 bg-teal-50/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-teal-200/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                <Utensils className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Regime Nutrizionale & Modalità di Alimentazione
                </h3>
                <p className="text-[11px] text-slate-600">
                  Seleziona come si alimenta il paziente per calcolare lo schema specifico (Pasti per os, Digiuno/NPO, Enterale o Parenterale NPT)
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full border border-teal-200">
              Linee guida ESPEN / ADA Inpatient
            </span>
          </div>

          {/* Grid of nutrition modalities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            {/* 1. Pasti Standard 3/die */}
            <button
              type="button"
              onClick={() => handleNutritionTypeChange('oral_standard')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentNutrition === 'oral_standard'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Pasti Orali Standard (3/die)</div>
              <div className={`text-[11px] mt-1 ${currentNutrition === 'oral_standard' ? 'text-teal-100' : 'text-slate-500'}`}>
                Colazione, Pranzo e Cena regolari per os (Schema 50% Basale + 50% Boli pre-pasto).
              </div>
            </button>

            {/* 2. Orale Ridotta / Inappetente */}
            <button
              type="button"
              onClick={() => handleNutritionTypeChange('oral_poor')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentNutrition === 'oral_poor'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Orale Ridotta / Inappetenza</div>
              <div className={`text-[11px] mt-1 ${currentNutrition === 'oral_poor' ? 'text-teal-100' : 'text-slate-500'}`}>
                Introito variabile: boli rapidi <strong>post-prandiali entro 20 min</strong> su cibo realmente assunto.
              </div>
            </button>

            {/* 3. Digiuno NPO */}
            <button
              type="button"
              onClick={() => handleNutritionTypeChange('npo_fasting')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentNutrition === 'npo_fasting'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Digiuno Assoluto (NPO)</div>
              <div className={`text-[11px] mt-1 ${currentNutrition === 'npo_fasting' ? 'text-teal-100' : 'text-slate-500'}`}>
                Pre-intervento o esami: <strong>solo Basale (0.15-0.2 U/kg)</strong> + correzioni (zero boli fissi).
              </div>
            </button>

            {/* 4. Nutrizione Enterale Continua (h24) */}
            <button
              type="button"
              onClick={() => handleNutritionTypeChange('enteral_continuous')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentNutrition === 'enteral_continuous'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Enterale Continua (h24)</div>
              <div className={`text-[11px] mt-1 ${currentNutrition === 'enteral_continuous' ? 'text-teal-100' : 'text-slate-500'}`}>
                SNG o PEG con pompa: 50% Basale h24 + 50% Insulina Regolare s.c. <strong>ogni 6 ore</strong>.
              </div>
            </button>

            {/* 5. Nutrizione Enterale Ciclica (12-16h) */}
            <button
              type="button"
              onClick={() => handleNutritionTypeChange('enteral_cyclic')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentNutrition === 'enteral_cyclic'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Enterale Ciclica (12-16h)</div>
              <div className={`text-[11px] mt-1 ${currentNutrition === 'enteral_cyclic' ? 'text-teal-100' : 'text-slate-500'}`}>
                Infusione notturna/a fasce: <strong>NPH all'avvio</strong> per coprire il picco + basale residua.
              </div>
            </button>

            {/* 6. Nutrizione Enterale a Boli */}
            <button
              type="button"
              onClick={() => handleNutritionTypeChange('enteral_bolus')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentNutrition === 'enteral_bolus'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Enterale a Boli (PEG)</div>
              <div className={`text-[11px] mt-1 ${currentNutrition === 'enteral_bolus' ? 'text-teal-100' : 'text-slate-500'}`}>
                3-4 somministrazioni/die: Basale h24 + <strong>analogo rapido s.c. ad ogni bolo</strong>.
              </div>
            </button>

            {/* 7. Nutrizione Parenterale Totale Continua (NPT h24) */}
            <button
              type="button"
              onClick={() => handleNutritionTypeChange('parenteral_tpn_continuous')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentNutrition === 'parenteral_tpn_continuous'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Parenterale Totale NPT (h24)</div>
              <div className={`text-[11px] mt-1 ${currentNutrition === 'parenteral_tpn_continuous' ? 'text-teal-100' : 'text-slate-500'}`}>
                Sacca centrale h24: <strong>Insulina Regolare in sacca (0.1 U/g destrosio)</strong> + basale s.c.
              </div>
            </button>

            {/* 8. Nutrizione Parenterale Ciclica */}
            <button
              type="button"
              onClick={() => handleNutritionTypeChange('parenteral_tpn_cyclic')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                currentNutrition === 'parenteral_tpn_cyclic'
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-500/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs">Parenterale Ciclica (12-16h)</div>
              <div className={`text-[11px] mt-1 ${currentNutrition === 'parenteral_tpn_cyclic' ? 'text-teal-100' : 'text-slate-500'}`}>
                Infusione intermittente: insulina regolare in sacca NPT + taper-down ultima ora.
              </div>
            </button>

          </div>

          {/* Sub-parameters for specific nutrition modes */}
          {(currentNutrition === 'parenteral_tpn_continuous' || currentNutrition === 'parenteral_tpn_cyclic') && (
            <div className="p-3.5 rounded-xl bg-white border border-teal-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">
                  Glucosio/Destrosio nella Sacca NPT (Grammi)
                </label>
                <NumericInput
                  id="input-tpn-glucose"
                  value={patient.nutrition?.tpnGlucoseGrams || 200}
                  onChange={(val) => handleNutritionDetailsChange('tpnGlucoseGrams', val ?? 200)}
                  min={50}
                  max={600}
                  step={25}
                  unit="g"
                />
                <span className="text-[10px] text-slate-500">Valore tipico sacca NPT: 150 - 300 g</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">
                  Modalità Somministrazione Insulina NPT
                </label>
                <select
                  value={patient.nutrition?.tpnInsulinInBag !== false ? 'in_bag' : 'subcut'}
                  onChange={(e) => handleNutritionDetailsChange('tpnInsulinInBag', e.target.value === 'in_bag')}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 bg-teal-50/30"
                >
                  <option value="in_bag">Insulina Regolare inserita in Sacca NPT (Consigliato ADA)</option>
                  <option value="subcut">Schema Basale s.c. + Regolare s.c. ogni 6 ore</option>
                </select>
                <span className="text-[10px] text-slate-500">In sacca previene il disaccoppiamento</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">
                  Dose Insulina Iniziale in Sacca
                </label>
                <div className="text-xs font-bold text-teal-800 bg-teal-50 p-2 rounded-xl border border-teal-200">
                  {Math.round((patient.nutrition?.tpnGlucoseGrams || 200) * (patient.steroids?.active ? 0.15 : 0.1))} Unità di Actrapid / Humulin R
                  <div className="text-[10px] font-normal text-slate-600 mt-0.5">
                    ({patient.steroids?.active ? '0.15' : '0.10'} U per grammo di destrosio)
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentNutrition === 'enteral_bolus' && (
            <div className="p-3.5 rounded-xl bg-white border border-teal-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">
                  Numero di Boli Enterali al Giorno (tramite PEG)
                </label>
                <select
                  value={patient.nutrition?.enteralBolusCount || 4}
                  onChange={(e) => handleNutritionDetailsChange('enteralBolusCount', Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 bg-teal-50/30"
                >
                  <option value={3}>3 Boli / Die (es. ore 08:00, 13:00, 19:00)</option>
                  <option value={4}>4 Boli / Die (es. ore 08:00, 12:00, 16:00, 20:00)</option>
                  <option value={5}>5 Boli / Die</option>
                </select>
              </div>
              <div className="text-[11px] text-slate-600 flex items-center">
                Ogni bolo nutrizionale riceverà un bolo di analogo rapido s.c. dedicato, con basale h24 per il mantenimento epatico.
              </div>
            </div>
          )}

        </div>

        {/* ROW 4: Tipo di Diabete, Esperienza Insulinica, Setting Clinico */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo di Diabete
            </label>
            <select
              value={patient.diabetesType}
              onChange={(e) => handleFieldChange('diabetesType', e.target.value as DiabetesType)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="T2D">Diabete Tipo 2 (T2D)</option>
              <option value="T1D">Diabete Tipo 1 (T1D) - Non sospendere mai la basale!</option>
              <option value="STEROID">Diabete Secondario a Steroidi</option>
              <option value="NEW_ONSET">Nuova Diagnosi / Iperglicemia da Stress</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terapia Insulinica Domiciliare
            </label>
            <select
              value={patient.insulinExperience}
              onChange={(e) => handleFieldChange('insulinExperience', e.target.value as InsulinExperience)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="naive">Naïve a Insulina (solo orali/dieta)</option>
              <option value="basal_only">Solo Basale a domicilio (es. Lantus/Tresiba)</option>
              <option value="basal_bolus">Basal-Bolus noto a domicilio</option>
              <option value="mixed">Insulina Premiscelata (es. Novomix/Humalog Mix)</option>
            </select>
            {patient.insulinExperience === 'basal_bolus' && (
              <div className="mt-2">
                <NumericInput
                  id="input-home-tdd"
                  value={patient.homeTDD}
                  onChange={(val) => handleFieldChange('homeTDD', val)}
                  min={4}
                  max={200}
                  step={2}
                  unit="U/die"
                  placeholder="Dose Totale Domiciliare"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Condizione Clinica di Degenza
            </label>
            <select
              value={patient.clinicalSetting}
              onChange={(e) => handleFieldChange('clinicalSetting', e.target.value as ClinicalSetting)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="standard">Standard / Stabile</option>
              <option value="fragile_elderly">Anziano Fragile / Alto rischio ipoglicemia</option>
              <option value="severe_infection">Infezione Acuta Severa / Sepsi (Alta Resistenza)</option>
              <option value="severe_hepatic">Insufficienza Epatica Grave (Child B/C)</option>
              <option value="dialysis">Paziente in Emodialisi / Dialisi Peritoneale</option>
            </select>
          </div>
        </div>

        {/* ROW 5: Terapia Steroidea in Corso */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-900">
                Terapia Steroidea (Glucocorticoidi ad Azione Iperglicemizzante)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={patient.steroids.active}
                onChange={(e) => handleSteroidChange('active', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              <span className="ml-2 text-xs font-medium text-amber-900">
                {patient.steroids.active ? 'Steroidi in Corso' : 'Nessuno steroide'}
              </span>
            </label>
          </div>

          {patient.steroids.active && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/80">
              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  Molecola Steroidea
                </label>
                <select
                  value={patient.steroids.drug}
                  onChange={(e) => handleSteroidChange('drug', e.target.value as SteroidDrug)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-amber-300 bg-white"
                >
                  <option value="desametasone">Desametasone (Decadron/Soldesam)</option>
                  <option value="prednisone">Prednisone (Deltacortene)</option>
                  <option value="metilprednisolone">Metilprednisolone (Urbason/Medrol)</option>
                  <option value="idrocortisone">Idrocortisone (Flebocortid)</option>
                  <option value="altro">Altro steroide</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  Dose Giornaliera Totale (mg/die)
                </label>
                <NumericInput
                  id="input-steroid-dose"
                  value={patient.steroids.doseMg}
                  onChange={(val) => handleSteroidChange('doseMg', val ?? 4)}
                  min={0.5}
                  max={1000}
                  step={0.5}
                  allowDecimals={true}
                  unit="mg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                  Orario Somministrazione
                </label>
                <select
                  value={patient.steroids.frequency}
                  onChange={(e) => handleSteroidChange('frequency', e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-amber-300 bg-white"
                >
                  <option value="mattina">Singola dose al mattino (Ore 08:00)</option>
                  <option value="frazionata">Dosi frazionate (Mattina + Sera)</option>
                  <option value="sera">Singola dose serale</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ROW 6: Glicemia Ammissione & HbA1c */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Glicemia all'Ingresso / Media Recente (mg/dL)</span>
              <span className="text-[11px] font-bold text-teal-700">{patient.admissionGlucose} mg/dL</span>
            </label>
            <NumericInput
              id="input-admission-glucose"
              value={patient.admissionGlucose}
              onChange={(val) => handleFieldChange('admissionGlucose', val ?? 180)}
              min={50}
              max={800}
              step={10}
              unit="mg/dL"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              HbA1c Recente (% se disponibile)
            </label>
            <NumericInput
              id="input-hba1c"
              value={patient.hba1c}
              onChange={(val) => handleFieldChange('hba1c', val)}
              min={4.0}
              max={18.0}
              step={0.1}
              allowDecimals={true}
              unit="%"
              placeholder="es. 8.5"
            />
          </div>
        </div>

        {/* ROW 7: Farmaci Domiciliari Assunti (Checklist di Sospensione) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Pill className="h-4 w-4 text-teal-600" />
            Terapia Antidiabetica Orale / Non-Insulinica Assunta a Domicilio:
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Seleziona i farmaci assunti a casa dal paziente per visualizzare la guida automatica di sospensione/mantenimento in degenza
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            {/* Metformina */}
            <button
              type="button"
              onClick={() => toggleHomeMed('metformina')}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                patient.homeMedications.includes('metformina')
                  ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={patient.homeMedications.includes('metformina')}
                onChange={() => {}}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">Metformina</div>
                <div className="text-[10px] text-slate-500">Glucophage, Metforal</div>
              </div>
            </button>

            {/* SGLT2i */}
            <button
              type="button"
              onClick={() => toggleHomeMed('sglt2i')}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                patient.homeMedications.includes('sglt2i')
                  ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={patient.homeMedications.includes('sglt2i')}
                onChange={() => {}}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">SGLT2-i (Gliflozine)</div>
                <div className="text-[10px] text-slate-500">Forxiga, Jardiance, Steglatro</div>
              </div>
            </button>

            {/* Sulfoniluree */}
            <button
              type="button"
              onClick={() => toggleHomeMed('sulfonilurea')}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                patient.homeMedications.includes('sulfonilurea')
                  ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={patient.homeMedications.includes('sulfonilurea')}
                onChange={() => {}}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">Sulfoniluree</div>
                <div className="text-[10px] text-slate-500">Diamicron, Amaryl, Daonil</div>
              </div>
            </button>

            {/* Repaglinide */}
            <button
              type="button"
              onClick={() => toggleHomeMed('repaglinide')}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                patient.homeMedications.includes('repaglinide')
                  ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={patient.homeMedications.includes('repaglinide')}
                onChange={() => {}}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">Glinidi (Repaglinide)</div>
                <div className="text-[10px] text-slate-500">Novonorm, generici</div>
              </div>
            </button>

            {/* GLP-1 RA / Dual GIP */}
            <button
              type="button"
              onClick={() => toggleHomeMed('glp1_ra')}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                patient.homeMedications.includes('glp1_ra')
                  ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={patient.homeMedications.includes('glp1_ra')}
                onChange={() => {}}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">GLP-1 RA / Dual GIP</div>
                <div className="text-[10px] text-slate-500">Ozempic, Trulicity, Mounjaro</div>
              </div>
            </button>

            {/* DPP4i */}
            <button
              type="button"
              onClick={() => toggleHomeMed('dpp4i')}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                patient.homeMedications.includes('dpp4i')
                  ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={patient.homeMedications.includes('dpp4i')}
                onChange={() => {}}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">DPP-4 Inibitori</div>
                <div className="text-[10px] text-slate-500">Trajenta, Januvia, Galvus</div>
              </div>
            </button>

            {/* Pioglitazone */}
            <button
              type="button"
              onClick={() => toggleHomeMed('pioglitazone')}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                patient.homeMedications.includes('pioglitazone')
                  ? 'bg-rose-50 border-rose-400 ring-1 ring-rose-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={patient.homeMedications.includes('pioglitazone')}
                onChange={() => {}}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">Pioglitazone (TZD)</div>
                <div className="text-[10px] text-slate-500">Actos, generico</div>
              </div>
            </button>

            {/* Acarbosio */}
            <button
              type="button"
              onClick={() => toggleHomeMed('acarbosio')}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                patient.homeMedications.includes('acarbosio')
                  ? 'bg-slate-200 border-slate-400 ring-1 ring-slate-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <input
                type="checkbox"
                checked={patient.homeMedications.includes('acarbosio')}
                onChange={() => {}}
                className="mt-0.5 rounded text-slate-600"
              />
              <div>
                <div className="text-xs font-semibold text-slate-900">Acarbosio</div>
                <div className="text-[10px] text-slate-500">Glucobay</div>
              </div>
            </button>

          </div>
        </div>

        {/* Bottom Form Action Banner with Calculate CTA */}
        {onCalculate && (
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/80 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-4 sm:p-5 rounded-b-2xl">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-800">Parametri aggiornati in tempo reale.</span> Clicca per visualizzare lo schema calcolato, le dosi e la guida di sospensione farmaci.
            </div>
            <button
              type="button"
              onClick={onCalculate}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-sm shadow-teal-700/20 hover:scale-[1.01] cursor-pointer"
            >
              <span>Visualizza Schema Insulinico & Dosi</span>
              <Sparkles className="h-4 w-4 text-teal-200" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
