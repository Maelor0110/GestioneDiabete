import React, { useState } from 'react';
import { PatientProfile, InsulinRegimen } from '../types';
import { STEROID_EQUIVALENCES, INSULIN_TYPES_KNOWLEDGE } from '../data/medicationKnowledge';
import { Zap, Moon, UtensilsCrossed, Activity, ShieldCheck, CheckCircle, ChevronRight, Info } from 'lucide-react';

interface SteroidAndSpecialRegimesProps {
  patient: PatientProfile;
  regimen: InsulinRegimen;
}

export const SteroidAndSpecialRegimes: React.FC<SteroidAndSpecialRegimesProps> = ({ patient, regimen }) => {
  const [activeTab, setActiveTab] = useState<'steroids' | 'npo' | 'enteral_tpn' | 'insulins'>('steroids');

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      {/* Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            Protocolli Speciali Ospedalieri & Terapia Steroidea
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestione di scenari clinici complessi: iperglicemia da glucocorticoidi, digiuno NPO, nutrizione artificiale e profili delle insuline
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('steroids')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'steroids'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Steroidi / Cortisone
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('npo')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'npo'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Digiuno / NPO
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('enteral_tpn')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'enteral_tpn'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Enterale & Parenterale
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insulins')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'insulins'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tipi di Insulina
          </button>
        </div>
      </div>

      {/* TAB 1: STEROIDS MANAGEMENT */}
      {activeTab === 'steroids' && (
        <div className="space-y-5">
          
          {/* Key Phenomenon Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-sm text-amber-900">
              <Zap className="h-4 w-4 text-amber-600" />
              Fisiopatologia dell'Iperglicemia da Steroidi (Glucocorticoidi):
            </div>
            <p className="leading-relaxed">
              I corticosteroidi (es. <strong>Desametasone, Prednisone, Metilprednisolone</strong>) causano una marcata insulino-resistenza post-prandiale con aumento della gluconeogenesi epatica.
              Se assunti al mattino (ore 08:00), <strong>la glicemia a digiuno al risveglio è spesso NORMALE o solo lievemente aumentata</strong>, mentre compare un'iperglicemia importante <strong>dalle ore 14:00 fino alle 22:00-24:00</strong>.
            </p>
          </div>

          {/* Practical Regimen Strategies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Strategy A: NPH in the morning */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-2">
              <div className="font-bold text-indigo-950 text-sm flex items-center justify-between">
                <span>Strategia A: Insulina NPH al Mattino</span>
                <span className="px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 text-[10px] font-bold">Consigliata</span>
              </div>
              <p className="text-indigo-900 leading-relaxed">
                Somministrare <strong>Insulina NPH (Humulin I / Protaphane)</strong> alle <strong>ore 08:00</strong> in concomitanza con lo steroide.
              </p>
              <div className="p-2.5 rounded-lg bg-white/90 border border-indigo-200 text-indigo-950 font-medium">
                • <strong>Perché funziona:</strong> Il picco di azione della NPH (a 4-8 ore dall'iniezione) coincide esattamente con il picco di iperglicemia steroidea (ore 14:00-18:00), esaurendosi durante la notte per evitare ipoglicemie notturne.
                <br/>• <strong>Dose iniziale:</strong> 0.1 - 0.3 U/kg al mattino in base alla dose di steroide.
              </div>
            </div>

            {/* Strategy B: Basal-Bolus skewed */}
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-2">
              <div className="font-bold text-teal-950 text-sm flex items-center justify-between">
                <span>Strategia B: Basal-Bolus con Boli Rinforzati</span>
                <span className="px-2 py-0.5 rounded bg-teal-200 text-teal-900 text-[10px] font-bold">Alternativa</span>
              </div>
              <p className="text-teal-900 leading-relaxed">
                Mantenere la <strong>Glargina/Degludec</strong> alla sera o al mattino e <strong>potenziare selettivamente i boli di Pranzo e Cena</strong> (+30-50% rispetto alla colazione).
              </p>
              <div className="p-2.5 rounded-lg bg-white/90 border border-teal-200 text-teal-950 font-medium">
                • <strong>Ripartizione:</strong> Colazione 15-20%, Pranzo 40-45%, Cena 40-45%.
                <br/>• <strong>Correzioni:</strong> Monitorare la glicemia prima di pranzo, alle 17:00 e prima di cena, applicando la scala di correzione con analogo rapido.
              </div>
            </div>

          </div>

          {/* Steroid Equivalences Table */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-800 mb-2">
              Tabella di Equivalenza Clinica e Potenza Glucocorticoide:
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Molecola Steroidea</th>
                    <th className="py-2.5 px-3">Dose Equivalente a 5mg Prednisone</th>
                    <th className="py-2.5 px-3">Potenza Relativa</th>
                    <th className="py-2.5 px-3">Emivita Biologica</th>
                    <th className="py-2.5 px-3">Picco Iperglicemizzante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  {STEROID_EQUIVALENCES.map((st, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold">{st.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{st.eq5mgPrednisone} mg</td>
                      <td className="py-2.5 px-3">{st.potencyFactor}x</td>
                      <td className="py-2.5 px-3">{st.halfLife}</td>
                      <td className="py-2.5 px-3 text-slate-600">{st.hyperglycemicPeak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tapering Warning */}
          <div className="p-3 rounded-xl bg-slate-900 text-white text-xs flex items-start gap-2">
            <Info className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-teal-300">Gestione del De-escalation / Tapering dello Steroide:</strong>
              Quando la dose di cortisonico viene ridotta o sospesa, <strong>l'insulino-resistenza scompare rapidamente</strong>. È obbligatorio ridurre contestualmente la dose di insulina (-20-40%) per evitare ipoglicemie severe da rimbalzo.
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: NPO / DIGIUNO PER ESAMI O CHIRURGIA */}
      {activeTab === 'npo' && (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
            <div className="font-bold text-blue-950 text-sm flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-blue-600" />
              Regole d'Oro per il Paziente a Digiuno (NPO - Nil Per Os):
            </div>
            <ul className="space-y-1.5 text-blue-900 font-medium">
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>NON SOSPENDERE MAI L'INSULINA BASALE NEL DIABETE TIPO 1:</strong> Anche a digiuno completo, la basale è indispensabile per bloccare la lipolisi e prevenire la chetoacidosi diabetica.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>RIDUZIONE DELLA BASALE NEL DIABETE TIPO 2:</strong> Somministrare il <strong>70 - 80% della dose basale abituale</strong> (oppure calcolare 0.15 - 0.20 U/kg) la sera prima o il mattino della procedura.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>AZZERARE I BOLI PRANDIALI FISSI:</strong> Non somministrare boli per i pasti saltati.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>MONITORAGGIO & CORREZIONI:</strong> Rilevare glicemia capillare ogni 4-6 ore e correggere con analogo rapido secondo la scala di correzione solo se &gt; 180 mg/dL.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>INFUSIONE GLUCOSATA:</strong> Se il digiuno si prolunga oltre 12 ore, impostare infusione ev di Glucosata 5% o 10% (con K+) a 50-100 mL/ora per mantenere l'apporto glucidico basale (~100-150g glucosio/die).</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">Ripresa dell'Alimentazione Post-Procedura:</h4>
            <p>
              Alla ripresa del primo pasto solido, somministrare il bolo di analogo rapido <strong>a fine pasto</strong> valutando la quantità di carboidrati effettivamente consumata (per evitare ipoglicemie se il paziente ha nausea post-anestesia o vomito).
            </p>
          </div>

        </div>
      )}

      {/* TAB 3: ENTERAL & TPN */}
      {activeTab === 'enteral_tpn' && (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nutrizione Enterale Continua */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">Nutrizione Enterale Continua (h24)</div>
              <p>
                • <strong>Schema Basale:</strong> Somministrare il 50% del TDD come Insulina Basale (Glargina/Degludec ogni 24h o NPH ogni 12h).
                <br/>• <strong>Copertura Nutrizionale:</strong> Il restante 50% viene suddiviso in <strong>Insulina Rapida ogni 6 ore</strong> (es. ore 06 - 12 - 18 - 24) o Insulina Regolare ogni 6h.
                <br/>• <strong>⚠️ EMERGENZA INTERRUZIONE SONDA:</strong> Se la nutrizione enterale si blocca (dislocazione sondino, ristagno gastrico, vomito), avviare IMMEDIATAMENTE infusione ev di <strong>Glucosata 10%</strong> alla stessa velocità (es. 50-75 mL/h) per prevenire ipoglicemie repentine.
              </p>
            </div>

            {/* Nutrizione Parenterale Totale (NPT) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">Nutrizione Parenterale Totale (NPT)</div>
              <p>
                • <strong>Insulina in Sacca NPT:</strong> L'<strong>Insulina Umana Regolare (Actrapid/Humulin R)</strong> può essere aggiunta direttamente nella sacca di NPT.
                <br/>• <strong>Dose Iniziale:</strong> 0.1 Unità di insulina regolare per ogni grammo di destrosio presente nella sacca (es. per 200g di glucosio = 20 U di insulina in sacca).
                <br/>• <strong>Aggiustamento:</strong> Aggiungere il 100% dell'insulina correttiva usata nelle 24h precedenti alla sacca del giorno successivo.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: INSULIN PROFILES COMPARISON */}
      {activeTab === 'insulins' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-800">
            Caratteristiche Farmacocinetiche delle Insuline Utilizzate in Ospedale:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {INSULIN_TYPES_KNOWLEDGE.map((ins, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-teal-900 text-sm">{ins.category}</div>
                <div className="text-slate-800 font-semibold">{ins.molecules}</div>
                <div className="grid grid-cols-3 gap-2 p-2 rounded bg-white border border-slate-200 text-[11px]">
                  <div><span className="text-slate-500 block">Inizio:</span><strong>{ins.onset}</strong></div>
                  <div><span className="text-slate-500 block">Picco:</span><strong>{ins.peak}</strong></div>
                  <div><span className="text-slate-500 block">Durata:</span><strong>{ins.duration}</strong></div>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Indicazione:</strong> {ins.role}
                </div>
                <div className="text-slate-700 bg-teal-50/50 p-2 rounded border border-teal-100 text-[11px]">
                  💡 <strong>Consiglio di reparto:</strong> {ins.clinicalTip}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
