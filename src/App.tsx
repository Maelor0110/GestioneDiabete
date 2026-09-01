import React, { useState, useMemo } from 'react';
import { PatientProfile, InsulinRegimen } from './types';
import { calculateInsulinRegimen } from './utils/calculator';
import { Header } from './components/Header';
import { PatientForm } from './components/PatientForm';
import { RegimenDisplay } from './components/RegimenDisplay';
import { HomeMedicationAdvisory } from './components/HomeMedicationAdvisory';
import { CorrectionScaleView } from './components/CorrectionScaleView';
import { TitrationAdvisor } from './components/TitrationAdvisor';
import { SteroidAndSpecialRegimes } from './components/SteroidAndSpecialRegimes';
import { PrintableOrderSheet } from './components/PrintableOrderSheet';
import { HypoglycemiaProtocolModal } from './components/HypoglycemiaProtocolModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { 
  Activity,
  Syringe, 
  ShieldAlert, 
  Calculator, 
  RefreshCw, 
  Zap, 
  FileText, 
  Printer, 
  FileDown, 
  RotateCcw,
  Sparkles,
  CheckCircle
} from 'lucide-react';

const DEFAULT_PATIENT: PatientProfile = {
  id: 'pt-current',
  bedOrName: 'Mario Rossi (Letto 14 - Medicina)',
  department: 'Medicina Interna',
  age: 68,
  gender: 'M',
  weightKg: 78,
  heightCm: 172,
  diabetesType: 'T2D',
  insulinExperience: 'naive',
  homeTDD: 0,
  egfr: 52,
  creatinine: 1.35,
  clinicalSetting: 'standard',
  nutrition: {
    type: 'oral_standard',
    tpnGlucoseGrams: 200,
    tpnInsulinInBag: true,
    enteralBolusCount: 4,
  },
  steroids: {
    active: false,
    drug: 'desametasone',
    doseMg: 8,
    frequency: 'mattina',
  },
  admissionGlucose: 235,
  hba1c: 8.6,
  homeMedications: ['metformina', 'sglt2i', 'sulfonilurea'],
  notes: 'Paziente diabetico tipo 2 ricoverato per polmonite comunitaria.',
  updatedAt: new Date().toISOString(),
};

export default function App() {
  // Direct single-patient state (no persistent multi-patient degenti list)
  const [patient, setPatient] = useState<PatientProfile>(DEFAULT_PATIENT);

  // Active view tab inside the results / management section
  const [activeTab, setActiveTab] = useState<'regimen' | 'withdrawal' | 'correction' | 'titration' | 'steroids'>('regimen');

  // Modals state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHypoModal, setShowHypoModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Reset patient to default / clear
  const handleResetPatient = () => {
    setPatient({
      ...DEFAULT_PATIENT,
      bedOrName: 'Nuovo Paziente (Letto ___)',
      department: 'Degenza Ordinaria',
      age: 65,
      weightKg: 75,
      heightCm: 170,
      egfr: 65,
      creatinine: 1.1,
      admissionGlucose: 220,
      hba1c: 8.0,
      homeMedications: ['metformina'],
      updatedAt: new Date().toISOString(),
    });
  };

  // Calculate Insulin Regimen automatically in real-time
  const calculatedRegimen: InsulinRegimen = useMemo(() => {
    return calculateInsulinRegimen(patient);
  }, [patient]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      
      {/* 1. Global Navigation Header */}
      <Header
        activePatient={patient}
        onOpenHypoModal={() => setShowHypoModal(true)}
        onOpenGuidelinesModal={() => setShowGuidelinesModal(true)}
        onOpenPrintModal={() => setShowPrintModal(true)}
        onResetPatient={handleResetPatient}
      />

      {/* 2. Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        
        {/* Grand Hero Title Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-800 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
                <Activity className="h-3.5 w-3.5" />
                Guida Terapeutica Ospedaliera
              </div>

              {/* Big Grand Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Gestione & Prescrizione Insulinica Ospedaliera
              </h1>

              {/* Doctor Subtitle */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-base sm:text-xl font-extrabold text-teal-400">
                  Creato dal Dott. Maestri Lorenzo
                </span>
                <span className="hidden sm:inline text-slate-500">•</span>
                <span className="text-xs sm:text-sm text-slate-300 font-medium">
                  Supporto Decisionale Basal-Bolus, Nutrizione Clinica & Riconciliazione Farmacologica
                </span>
              </div>
            </div>

            {/* Evidence badge & Quick print CTA */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0">
              <div className="text-right">
                <span className="inline-block text-[11px] font-semibold text-teal-200 bg-slate-800/90 border border-teal-500/30 px-3 py-1 rounded-lg">
                  Linee Guida: ADA • SID-AMD • ESPEN
                </span>
              </div>
              <button
                type="button"
                id="btn-hero-print"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-teal-900/40 cursor-pointer hover:scale-[1.02]"
              >
                <FileDown className="h-4 w-4" />
                <span>Esporta in Word / Copia</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Summary Bar for current patient */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              {patient.bedOrName ? patient.bedOrName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {patient.bedOrName || 'Paziente in Esame'}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {patient.department || 'Degenza Ordinaria'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient.age} anni ({patient.gender}) • Peso {patient.weightKg} kg • eGFR: {patient.egfr} mL/min • {patient.diabetesType} • Glicemia Ingresso: {patient.admissionGlucose} mg/dL
              </p>
            </div>
          </div>

          {/* Quick Key Metrics Pill & Print CTA */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">TDD Calcolato: </span>
              <strong className="text-teal-700 font-mono text-sm">{calculatedRegimen.tdd} U/die</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs">
              <span className="text-teal-800">1 U abbassa: </span>
              <strong className="text-teal-900 font-mono text-sm">~{calculatedRegimen.isf} mg/dL</strong>
            </div>

            <button
              type="button"
              id="btn-main-print-word"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
            >
              <FileDown className="h-4 w-4" />
              <span>Esporta Word / Copia</span>
            </button>
          </div>
        </div>

        {/* Section 1: Patient Admission & Clinical Profile Form */}
        <section id="patient-form-section">
          <PatientForm
            patient={patient}
            onChange={(updated) => setPatient(updated)}
            onCalculate={() => {
              const el = document.getElementById('regimen-results-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </section>

        {/* Section 2: Clinical Workspace / Results & Tabs */}
        <section id="regimen-results-section" className="space-y-6 scroll-mt-20">
          
          {/* Navigation Bar for Regimen Modules */}
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
            
            <div className="flex flex-wrap gap-1">
              
              {/* Tab 1: Regimen */}
              <button
                type="button"
                onClick={() => setActiveTab('regimen')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'regimen'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Syringe className="h-4 w-4" />
                <span>Schema Basal-Bolus & Sensibilità</span>
              </button>

              {/* Tab 2: Withdrawal / Sospensione farmaci */}
              <button
                type="button"
                onClick={() => setActiveTab('withdrawal')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                  activeTab === 'withdrawal'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Terapie Domiciliari da Togliere</span>
                {(patient.homeMedications?.length || 0) > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'withdrawal' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {patient.homeMedications?.length}
                  </span>
                )}
              </button>

              {/* Tab 3: Corrections & Spot Calculator */}
              <button
                type="button"
                onClick={() => setActiveTab('correction')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'correction'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calculator className="h-4 w-4" />
                <span>Correzioni & Sliding Scale</span>
              </button>

              {/* Tab 4: Daily Titration */}
              <button
                type="button"
                onClick={() => setActiveTab('titration')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'titration'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Titolazione Giro Visite</span>
              </button>

              {/* Tab 5: Steroids & Special Protocols */}
              <button
                type="button"
                onClick={() => setActiveTab('steroids')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'steroids'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>Steroidi, Digiuno & Speciali</span>
                {patient.steroids?.active && (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
                )}
              </button>

            </div>

            {/* Quick Export / Print Button in Tabs Header */}
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all ml-auto cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-teal-400" />
              <span>Scheda Terapia (PDF / Word)</span>
            </button>

          </div>

          {/* Active Tab View Rendering */}
          <div className="animate-in fade-in duration-200">
            {activeTab === 'regimen' && (
              <RegimenDisplay regimen={calculatedRegimen} patient={patient} />
            )}

            {activeTab === 'withdrawal' && (
              <HomeMedicationAdvisory patient={patient} />
            )}

            {activeTab === 'correction' && (
              <CorrectionScaleView regimen={calculatedRegimen} patient={patient} />
            )}

            {activeTab === 'titration' && (
              <TitrationAdvisor regimen={calculatedRegimen} patient={patient} />
            )}

            {activeTab === 'steroids' && (
              <SteroidAndSpecialRegimes patient={patient} regimen={calculatedRegimen} />
            )}
          </div>

        </section>

      </main>

      {/* 3. Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-slate-200">GlucoHospital</span> • Gestione & Prescrizione Insulinica Ospedaliera
              <div className="text-[11px] text-teal-300 font-medium mt-0.5">
                Creato dal Dott. Maestri Lorenzo • Algoritmi conformi alle Linee Guida ADA, SID-AMD ed ESPEN.
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => setShowGuidelinesModal(true)}
                className="hover:text-teal-400 transition-colors cursor-pointer"
              >
                Linee Guida
              </button>
              <button
                onClick={() => setShowHypoModal(true)}
                className="hover:text-rose-400 transition-colors cursor-pointer"
              >
                Protocollo Ipoglicemie
              </button>
              <button
                onClick={() => setShowPrintModal(true)}
                className="hover:text-teal-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Printer className="h-3 w-3 text-teal-400" />
                Stampa Scheda PDF / Word
              </button>
            </div>
          </div>

          {/* Legal Disclaimer / Clausola di Esonero di Responsabilità */}
          <div className="pt-4 border-t border-slate-800/80 text-[10px] sm:text-[11px] leading-relaxed text-slate-400 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
            <span className="font-bold text-slate-300 uppercase tracking-wider block mb-1">
              ⚠️ Clausola di Esonero di Responsabilità & Avvertenza Medico-Legale (Disclaimer):
            </span>
            La presente applicazione costituisce esclusivamente uno strumento informatico di supporto decisionale e orientamento orientato alle linee guida scientifiche (ADA / SID-AMD / ESPEN). Non costituisce né sostituisce in alcun modo la valutazione clinica autonoma, la diagnosi, la prescrizione o la responsabilità professionale del medico curante o del personale sanitario. Il medico prescrittore rimane l'unico ed esclusivo responsabile della verifica dell'appropriatezza dei dosaggi, delle indicazioni, delle controindicazioni, del monitoraggio e dell'adattamento dello schema terapeutico alle specifiche condizioni cliniche individuali di ciascun paziente. L'autore (Dott. Maestri Lorenzo) declina ogni responsabilità diretta o indiretta per eventuali errori, omissioni, reazioni avverse, ipo/iperglicemie o esiti clinici sfavorevoli derivanti dall'utilizzo o dall'interpretazione dei calcoli generati da questo software.
          </div>
        </div>
      </footer>

      {/* 4. Modals */}
      {showPrintModal && (
        <PrintableOrderSheet
          patient={patient}
          regimen={calculatedRegimen}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showHypoModal && (
        <HypoglycemiaProtocolModal
          onClose={() => setShowHypoModal(false)}
        />
      )}

      {showGuidelinesModal && (
        <GuidelinesModal
          onClose={() => setShowGuidelinesModal(false)}
        />
      )}

    </div>
  );
}
