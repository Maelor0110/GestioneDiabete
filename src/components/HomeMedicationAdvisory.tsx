import React, { useState } from 'react';
import { HomeMedicationId, PatientProfile } from '../types';
import { MEDICATION_GUIDELINES } from '../data/medicationKnowledge';
import { AlertOctagon, AlertTriangle, CheckCircle, ShieldAlert, Pill, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface HomeMedicationAdvisoryProps {
  patient: PatientProfile;
}

export const HomeMedicationAdvisory: React.FC<HomeMedicationAdvisoryProps> = ({ patient }) => {
  const [showAllDrugs, setShowAllDrugs] = useState(false);
  const selectedMedIds = patient.homeMedications || [];

  const selectedMedications = selectedMedIds.map((id) => MEDICATION_GUIDELINES[id]).filter(Boolean);
  const allMedications = Object.values(MEDICATION_GUIDELINES);

  const displayedList = showAllDrugs
    ? allMedications
    : selectedMedications.length > 0
    ? selectedMedications
    : allMedications;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SOSPENDERE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-bold shadow-xs">
            <AlertOctagon className="h-3.5 w-3.5" />
            SOSPENDERE
          </span>
        );
      case 'SOSPENDERE_CONDIZIONATO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-bold shadow-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            SOSPENDERE IN ACUTO
          </span>
        );
      case 'MANTENIBILE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-xs">
            <CheckCircle className="h-3.5 w-3.5" />
            MANTENIBILE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-600 text-white text-xs font-bold">
            MONITORARE
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Guida alla Sospensione Terapie Domiciliari in Ospedale
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verifica quali farmaci antidiabetici orali/non-insulinici devono essere sospesi all'ammissione e il loro razionale clinico
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAllDrugs(!showAllDrugs)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <BookOpen className="h-3.5 w-3.5 text-teal-600" />
          {showAllDrugs ? 'Mostra solo farmaci del paziente' : 'Consulta Prontuario Completo'}
        </button>
      </div>

      {/* Overview Status if no drugs selected */}
      {selectedMedIds.length === 0 && !showAllDrugs && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <Pill className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-800">
            Nessun farmaco orale domiciliare selezionato nella scheda
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Se il paziente assumeva farmaci antidiabetici a casa, spuntali nella scheda clinica sopra oppure clicca "Consulta Prontuario Completo" qui sopra.
          </p>
        </div>
      )}

      {/* Medication Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedList.map((med) => {
          const isSelected = selectedMedIds.includes(med.id);
          const isDanger = med.severity === 'danger';
          const isWarning = med.severity === 'warning';
          const isSuccess = med.severity === 'success';

          return (
            <div
              key={med.id}
              className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
                isSelected
                  ? isDanger
                    ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                    : isWarning
                    ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                    : 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div>
                {/* Card Title & Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">{med.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-white uppercase tracking-wider">
                          In Terapia
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Es: <span className="font-medium text-slate-700">{med.commercialExamples}</span>
                    </div>
                  </div>

                  <div>{getActionBadge(med.action)}</div>
                </div>

                {/* Rationale */}
                <div className="mt-3 text-xs space-y-2">
                  <div className="p-2.5 rounded-lg bg-white/90 border border-slate-200/80">
                    <span className="font-bold text-slate-800 block mb-0.5">
                      Razionale Clinico di Sospensione / Rischio Ospedaliero:
                    </span>
                    <span className="text-slate-700 leading-relaxed">{med.clinicalRationale}</span>
                  </div>

                  {/* Resumption */}
                  <div className="text-[11px] text-slate-600">
                    <strong className="text-slate-800">Criteri di Ripresa / Gestione:</strong>{' '}
                    {med.resumptionCriteria}
                  </div>
                </div>
              </div>

              {/* Special warning for Metformin with eGFR */}
              {med.id === 'metformina' && patient.egfr < 30 && (
                <div className="mt-3 p-2 rounded bg-rose-100 border border-rose-300 text-rose-900 text-[11px] font-bold">
                  ⚠️ Alert Paziente: eGFR attuale ({patient.egfr} mL/min) &lt; 30 mL/min: Metformina TASSATIVAMENTE CONTROINDICATA per rischio acidosi lattica fatale.
                </div>
              )}

              {/* Special warning for SGLT2i with acute illness */}
              {med.id === 'sglt2i' && (
                <div className="mt-3 p-2 rounded bg-rose-100 border border-rose-300 text-rose-900 text-[11px] font-medium">
                  ⚠️ Alert Chetoacidosi da Gliflozine: Sospendere immediatamente. Dosare chetonemia/chetonuria in presenza di malessere, nausea o tachipnea. Eseguire sempre EGA (emogasanalisi) in presenza di glicemie &gt; 400 mg/dL o sospetta acidosi metabolica.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary recommendation box */}
      <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-1.5">
        <div className="font-bold text-teal-300 uppercase tracking-wide flex items-center gap-1.5">
          <Pill className="h-4 w-4" />
          Consenso Ospedaliero ADA / SID-AMD:
        </div>
        <p className="text-slate-300 leading-relaxed">
          In tutti i pazienti ospedalizzati per patologia acuta, chirurgia o instabilità clinica, il trattamento di scelta raccomandato è la <strong>terapia insulinica Basal-Bolus</strong> (oppure Basal-Plus con DPP-4i in forme stabili). La sospensione precoce dei farmaci orali a rischio azzera le complicanze iatrogene (ipoglicemie prolungate da sulfoniluree, chetoacidosi euglicemica da SGLT2i, acidosi lattica da metformina).
        </p>
      </div>

    </div>
  );
};
