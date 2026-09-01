import React, { useState } from 'react';
import { PatientProfile, InsulinRegimen } from '../types';
import { generateCorrectionScale } from '../utils/calculator';
import { MEDICATION_GUIDELINES } from '../data/medicationKnowledge';
import { 
  Printer, 
  Copy, 
  Check, 
  X, 
  FileText, 
  FileDown
} from 'lucide-react';

interface PrintableOrderSheetProps {
  patient: PatientProfile;
  regimen: InsulinRegimen;
  onClose: () => void;
}

export const PrintableOrderSheet: React.FC<PrintableOrderSheetProps> = ({ patient, regimen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [wordExported, setWordExported] = useState(false);
  const isElderlyOrRenal = patient.age >= 75 || patient.egfr < 30;
  const correctionScale = generateCorrectionScale(regimen.isf, isElderlyOrRenal);

  const suspendedMeds = (patient.homeMedications || [])
    .map((id) => MEDICATION_GUIDELINES[id])
    .filter(Boolean);

  const bmi = patient.heightCm > 0 ? (patient.weightKg / Math.pow(patient.heightCm / 100, 2)).toFixed(1) : 'N/D';
  const currentDateFormatted = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const generateRawTextForEMR = () => {
    const dosesText = regimen.scheduledDoses
      .map((d) => `  * ${d.time} [${d.route}]: ${d.label} -> ${d.dose} U di ${d.drugType}\n    Istruzioni: ${d.instructions}`)
      .join('\n');

    return `=== PRESCRIZIONE SCHEMA INSULINICO OSPEDALIERO ===
Creato dal Dott. Maestri Lorenzo • Protocolli ADA / SID-AMD / ESPEN
Paziente: ${patient.bedOrName || 'Non specificato'} | Reparto: ${patient.department || 'Degenza'}
Età: ${patient.age} anni | Sesso: ${patient.gender} | Peso: ${patient.weightKg} kg (BMI: ${bmi}) | eGFR: ${patient.egfr} mL/min | Creatinina: ${patient.creatinine ?? 'N/D'} mg/dL
Regime Nutrizionale: ${regimen.nutritionProtocol ? regimen.nutritionProtocol.title : 'Pasti Orali Standard'}
Diagnosi: ${patient.diabetesType} | Glicemia Ammissione: ${patient.admissionGlucose} mg/dL | HbA1c: ${patient.hba1c ? `${patient.hba1c}%` : 'N/D'}
Data Prescrizione: ${currentDateFormatted}

1. SCHEMA INSULINICO VERTICALE (Fabbisogno Totale TDD: ${regimen.tdd} U/die - ${regimen.factorUsed} U/kg/die):
${dosesText}

${regimen.nutritionProtocol ? `PROTOCOLLO SICUREZZA NUTRIZIONE:
${regimen.nutritionProtocol.safetyRule}
Monitoraggio: ${regimen.nutritionProtocol.monitoring}
` : ''}
2. FATTORE DI SENSIBILITÀ & SCALA CORREZIONI PRE-PRANDIALI:
- ISF: 1 U di analogo rapido abbassa la glicemia di ~${regimen.isf} mg/dL (Target: 100-140 mg/dL).
- Scala Correzioni su Stick:
  * < 70 mg/dL: Sospendere bolo, applicare protocollo ipoglicemie (15g zuccheri / Glucosata ev).
  * 70 - 140 mg/dL: Solo dose prevista (+0 U).
  * 141 - 180 mg/dL: ${isElderlyOrRenal ? '+0 U (target permissivo anziano/IRC)' : '+1 U'}.
  * 181 - 220 mg/dL: +2 U.
  * 221 - 260 mg/dL: +3 U.
  * 261 - 320 mg/dL: +3 U.
  * 321 - 400 mg/dL: +4 U (avvisare medico di reparto, verificare chetoni).
  * > 400 mg/dL: +5 U e ALLERTA MEDICA: Eseguire EGA per escludere chetoacidosi/iperosmolarità, chetonemia, elettroliti e idratazione ev NaCl 0.9%.

3. TERAPIE ORALI DOMICILIARI SOSPESE IN RICOVERO:
${suspendedMeds.length > 0
  ? suspendedMeds.map((m) => `- ${m.name} (${m.action}): ${m.clinicalRationale}`).join('\n')
  : '- Nessun farmaco orale da sospendere indicato.'}

Firma del Medico Prescrittore: ________________________ (Data: ${currentDateFormatted})`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateRawTextForEMR());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generazione Word pulita, semplificata ed essenziale
  const handleExportWord = () => {
    const scheduledDosesRowsHtml = regimen.scheduledDoses.map((d) => {
      const isBasal = d.label.toLowerCase().includes('basale');
      const bg = isBasal ? '#f0f9ff' : '#ffffff';

      return `
        <tr style="background-color: ${bg};">
          <td style="padding: 6px 8px; border: 1px solid #999; font-weight: bold; text-align: center;">${d.time}</td>
          <td style="padding: 6px 8px; border: 1px solid #999; font-weight: bold;">${d.label}</td>
          <td style="padding: 6px 8px; border: 1px solid #999; text-align: center; font-weight: bold; font-size: 13pt; color: #004d40;">${d.dose} U</td>
          <td style="padding: 6px 8px; border: 1px solid #999;">${d.drugType} <span style="color: #666; font-size: 9pt;">(${d.route})</span></td>
          <td style="padding: 6px 8px; border: 1px solid #999; font-size: 9.5pt;">${d.instructions}</td>
        </tr>
      `;
    }).join('');

    const correctionRowsHtml = correctionScale.map((step) => {
      const isHypo = step.minGlucose === 0;
      const isHigh = step.minGlucose > 320;
      const bgCol = isHigh ? '#fffbeb' : isHypo ? '#fef2f2' : '#ffffff';
      const textColor = isHigh ? '#b91c1c' : isHypo ? '#991b1b' : '#111827';
      return `
        <tr style="background-color: ${bgCol};">
          <td style="padding: 5px 8px; border: 1px solid #999; font-weight: bold; text-align: center; color: ${textColor};">${step.glucoseRange}</td>
          <td style="padding: 5px 8px; border: 1px solid #999; font-weight: bold; text-align: center; font-size: 11pt; color: ${textColor};">
            ${isHypo ? '0 U (SOSPENDI)' : `+${step.extraUnits} U`}
          </td>
          <td style="padding: 5px 8px; border: 1px solid #999; font-size: 9pt; color: #374151;">${step.actionNote}</td>
        </tr>
      `;
    }).join('');

    const suspendedMedsHtml = suspendedMeds.length > 0
      ? `<table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
          <tr style="background-color: #fee2e2;">
            <th style="border: 1px solid #999; padding: 5px 8px; text-align: left; font-size: 9.5pt; width: 35%;">Farmaco Domiciliare</th>
            <th style="border: 1px solid #999; padding: 5px 8px; text-align: left; font-size: 9.5pt; width: 65%;">Motivazione Clinica Sospensione</th>
          </tr>
          ${suspendedMeds.map(m => `
            <tr>
              <td style="border: 1px solid #999; padding: 5px 8px; font-weight: bold; font-size: 9.5pt; color: #991b1b;">
                ${m.name} (${m.commercialExamples})
              </td>
              <td style="border: 1px solid #999; padding: 5px 8px; font-size: 9pt; color: #374151;">
                ${m.clinicalRationale}
              </td>
            </tr>
          `).join('')}
        </table>`
      : `<p style="font-size: 9.5pt; color: #555555; margin: 4px 0;">Nessun farmaco orale da sospendere indicato.</p>`;

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Prescrizione Schema Insulinico - ${patient.bedOrName || 'Paziente'}</title>
        <style>
          @page { size: A4 portrait; margin: 1.5cm; }
          body { font-family: Arial, Calibri, sans-serif; font-size: 10pt; line-height: 1.35; color: #111827; }
          h1 { color: #004d40; font-size: 15pt; margin: 0 0 2px 0; text-transform: uppercase; }
          .header-table { width: 100%; border: none; margin-bottom: 10px; border-bottom: 2px solid #004d40; padding-bottom: 6px; }
          .section-title { font-size: 11pt; font-weight: bold; color: #004d40; background-color: #e0f2f1; padding: 4px 8px; margin-top: 12px; margin-bottom: 6px; border-left: 4px solid #004d40; }
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          table.data-table th { background-color: #f3f4f6; border: 1px solid #999; padding: 5px 8px; font-size: 9.5pt; text-align: left; }
          table.data-table td { border: 1px solid #999; padding: 5px 8px; font-size: 9.5pt; }
          .alert-box { background-color: #fffbeb; border: 1px solid #f59e0b; padding: 7px 10px; font-size: 9pt; margin-top: 8px; }
          .signature-box { margin-top: 18px; width: 100%; }
          .disclaimer { font-size: 7.5pt; color: #666; margin-top: 12px; border-top: 1px solid #ccc; padding-top: 5px; line-height: 1.2; }
        </style>
      </head>
      <body>
        
        <!-- INTESTAZIONE -->
        <table class="header-table">
          <tr>
            <td style="border:none; padding:0;">
              <h1>SCHEDA PRESCRIZIONE INSULINICA OSPEDALIERA</h1>
              <div style="font-size: 9pt; color: #00695c; font-weight: bold;">Creato dal Dott. Maestri Lorenzo • Protocolli ADA / SID-AMD / ESPEN</div>
            </td>
            <td style="border:none; padding:0; text-align:right; font-size: 9pt; color: #4b5563;">
              Data: <strong>${currentDateFormatted}</strong><br>
              Reparto: <strong>${patient.department || 'Degenza'}</strong>
            </td>
          </tr>
        </table>

        <!-- DATI PAZIENTE -->
        <div class="section-title">1. DATI PAZIENTE & PARAMETRI CLINICI</div>
        <table class="data-table">
          <tr>
            <td style="width: 25%; background-color: #f9fafb;"><strong>Paziente / Letto:</strong></td>
            <td style="width: 25%; font-weight: bold;">${patient.bedOrName || 'Non specificato'}</td>
            <td style="width: 25%; background-color: #f9fafb;"><strong>Età / Sesso:</strong></td>
            <td style="width: 25%;">${patient.age} anni (${patient.gender})</td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb;"><strong>Peso / BMI:</strong></td>
            <td><strong>${patient.weightKg} kg</strong> (BMI: ${bmi})</td>
            <td style="background-color: #f9fafb;"><strong>Funzione Renale:</strong></td>
            <td><strong>eGFR ${patient.egfr} mL/min</strong></td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb;"><strong>Diagnosi / Glicemia:</strong></td>
            <td>${patient.diabetesType} (${patient.admissionGlucose} mg/dL)</td>
            <td style="background-color: #f9fafb;"><strong>Fattore Sensibilità (ISF):</strong></td>
            <td><strong>1 U riduce ~${regimen.isf} mg/dL</strong></td>
          </tr>
        </table>

        ${regimen.nutritionProtocol ? `
          <div class="alert-box">
            <strong>${regimen.nutritionProtocol.title}:</strong> ${regimen.nutritionProtocol.safetyRule} | <em>Monitoraggio: ${regimen.nutritionProtocol.monitoring}</em>
          </div>
        ` : ''}

        <!-- SCHEMA FISSO -->
        <div class="section-title">2. SCHEMA INSULINICO PROGRAMMATO FISSO (TDD: ${regimen.tdd} U/die - ${regimen.factorUsed} U/kg)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 12%; text-align: center;">Orario</th>
              <th style="width: 22%;">Somministrazione</th>
              <th style="width: 14%; text-align: center;">Dose Fissa</th>
              <th style="width: 24%;">Tipo Farmaco / Via</th>
              <th style="width: 28%;">Istruzioni Reparto</th>
            </tr>
          </thead>
          <tbody>
            ${scheduledDosesRowsHtml}
          </tbody>
        </table>

        <!-- SCALA CORREZIONI -->
        <div class="section-title">3. SCALA DI CORREZIONE PRE-PRANDIALE SU STICK GLICEMICO</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25%; text-align: center;">Glicemia Capillare</th>
              <th style="width: 20%; text-align: center;">Dose Extra Rapida</th>
              <th style="width: 55%;">Azione Infermieristica / Clinica</th>
            </tr>
          </thead>
          <tbody>
            ${correctionRowsHtml}
          </tbody>
        </table>

        <!-- FARMACI SOSPESI -->
        <div class="section-title">4. TERAPIE DOMICILIARI SOSPESE IN RICOVERO</div>
        ${suspendedMedsHtml}

        <!-- PROTOCOLLO IPOGLICEMIA -->
        <div class="alert-box">
          <strong>🚨 GESTIONE IPOGLICEMIA (&lt; 70 mg/dL):</strong> Sospendere bolo rapido. Somministrare immediatamente 15g carboidrati semplici (3 bustine zucchero in acqua o 1 succo). Ricontrollo stick a 15 minuti ("Regola del 15"). Se pz non collaborante/NPO: Glucosata 33% 20-30 mL ev o Glucagone 1 mg im.
        </div>

        <!-- FIRMA -->
        <table class="signature-box" style="border: none;">
          <tr>
            <td style="border: none; padding: 0; width: 50%; font-size: 9.5pt;">
              Data Prescrizione: <strong>${currentDateFormatted}</strong>
            </td>
            <td style="border: none; padding: 0; width: 50%; text-align: right; font-size: 9.5pt;">
              Firma Medico Prescrittore: _____________________________
            </td>
          </tr>
        </table>

        <!-- DISCLAIMER -->
        <div class="disclaimer">
          <strong>Avvertenza Medico-Legale:</strong> Strumento informatico di supporto decisionale basato su linee guida ADA/SID-AMD/ESPEN. Il medico prescrittore rimane l'unico responsabile della validazione clinica, della congruenza dei dosaggi e dell'adattamento al singolo paziente. L'autore (Dott. Maestri Lorenzo) declina ogni responsabilità per esiti clinici avversi.
        </div>

      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', docContent], {
      type: 'application/msword;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const cleanName = (patient.bedOrName || 'Paziente')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    downloadLink.href = url;
    downloadLink.download = `Prescrizione_Insulina_${cleanName}_${currentDateFormatted.replace(/\//g, '-')}.doc`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    setWordExported(true);
    setTimeout(() => setWordExported(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Actions Toolbar */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Scheda Prescrizione Terapia Ospedaliera
              </h3>
              <p className="text-[11px] text-slate-400">
                Stampa in PDF (tutte le pagine), Esporta in Word (.doc) o Copia per Cartella Elettronica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Word Export Button */}
            <button
              type="button"
              id="btn-export-word"
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
              title="Esporta documento Word (.doc) semplificato e pulito"
            >
              {wordExported ? <Check className="h-3.5 w-3.5 text-blue-200" /> : <FileDown className="h-3.5 w-3.5" />}
              <span>{wordExported ? 'Scaricato Word!' : 'Scarica Word (.doc)'}</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              id="btn-print-pdf"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
              title="Stampa diretta o Salva come PDF (tutte le pagine)"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Stampa / Salva PDF</span>
            </button>

            {/* Copy text button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 text-slate-200 transition-all cursor-pointer"
              title="Copia formato testuale per cartella clinica informatizzata"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-300" />}
              <span className="hidden sm:inline">{copied ? 'Copiato!' : 'Copia'}</span>
            </button>

            {/* Close modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900" id="printable-order-sheet">
          
          {/* Header of the sheet */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Presidio Ospedaliero • Scheda Terapeutica Diabetologica
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                SCHEMA INSULINICO & PROTOCOLLO CORREZIONI
              </h2>
              <div className="text-xs text-teal-800 font-bold mt-0.5">
                Creato dal Dott. Maestri Lorenzo
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Data Prescrizione: <strong>{currentDateFormatted}</strong> | Linee Guida: ADA Inpatient / SID-AMD / ESPEN
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                {patient.department || 'Degenza Reparto'}
              </div>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs page-break-inside-avoid">
            <div>
              <span className="text-slate-500 block">Paziente / Letto:</span>
              <strong className="text-slate-900 text-sm">{patient.bedOrName || 'Non specificato'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Dati Antropometrici:</span>
              <strong className="text-slate-900">{patient.weightKg} kg</strong> (BMI: {bmi}) • {patient.age} anni
            </div>
            <div>
              <span className="text-slate-500 block">Funzione Renale:</span>
              <strong className="text-slate-900">eGFR {patient.egfr} mL/min</strong>
              <span className="text-[10px] text-slate-500 block">Creatinina: {patient.creatinine ?? 'N/D'} mg/dL</span>
            </div>
            <div>
              <span className="text-slate-500 block">Diabete & Glicemia Ingresso:</span>
              <strong className="text-slate-900">{patient.diabetesType}</strong>
              <span className="text-[10px] text-slate-500 block">Glicemia: {patient.admissionGlucose} mg/dL</span>
            </div>
          </div>

          {/* Special Nutrition Protocol warning if present */}
          {regimen.nutritionProtocol && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 space-y-1 page-break-inside-avoid">
              <div className="font-bold text-amber-900">
                PROTOCOLLO NUTRIZIONE SPECIALE: {regimen.nutritionProtocol.title}
              </div>
              <div><strong>Regola di Sicurezza:</strong> {regimen.nutritionProtocol.safetyRule}</div>
              <div><strong>Monitoraggio:</strong> {regimen.nutritionProtocol.monitoring}</div>
            </div>
          )}

          {/* 1. Scheduled Fixed Doses Table */}
          <div className="space-y-2 page-break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Terapia Insulinica Programmata Fissa (Fabbisogno Totale: {regimen.tdd} U/die - {regimen.factorUsed} U/kg):
              </h4>
              <span className="text-[11px] text-slate-500">
                Quota Basale: {regimen.basalDose} U | Quota Bolo Totale: {regimen.totalBolus} U
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                <tr>
                  <th className="p-2 border w-16">Orario</th>
                  <th className="p-2 border">Somministrazione</th>
                  <th className="p-2 border text-center w-20">Dose Fissa</th>
                  <th className="p-2 border">Tipo Farmaco / Via</th>
                  <th className="p-2 border">Istruzioni Cliniche Reparto</th>
                </tr>
              </thead>
              <tbody>
                {regimen.scheduledDoses.map((dose, idx) => {
                  const isBasal = dose.label.toLowerCase().includes('basale');
                  const isInBag = dose.route.includes('sacca');
                  return (
                    <tr
                      key={idx}
                      className={
                        isBasal
                          ? 'bg-teal-50/70 font-semibold'
                          : isInBag
                          ? 'bg-emerald-50/60 font-semibold'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/50'
                      }
                    >
                      <td className="p-2 font-mono font-bold border">{dose.time}</td>
                      <td className="p-2 border font-medium text-slate-900">{dose.label}</td>
                      <td className="p-2 border text-center font-mono font-black text-sm text-teal-800">
                        {dose.dose} U
                      </td>
                      <td className="p-2 border text-slate-700">
                        <span className="font-medium">{dose.drugType}</span>
                        <span className="text-[10px] text-slate-500 block">({dose.route})</span>
                      </td>
                      <td className="p-2 border text-[11px] text-slate-600">{dose.instructions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. Pre-prandial Correction Scale Table */}
          <div className="space-y-2 page-break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Scala Mobile di Correzione Estemporanea su Stick Glicemico (Target: 100-140 mg/dL):
              </h4>
              <span className="text-[11px] text-teal-800 font-bold">
                ISF: 1 U riduce ~{regimen.isf} mg/dL
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                <tr>
                  <th className="p-2 border w-36">Glicemia Capillare</th>
                  <th className="p-2 border text-center w-28">Dose Extra Rapida</th>
                  <th className="p-2 border">Istruzioni Infermieristiche & Gestione</th>
                </tr>
              </thead>
              <tbody>
                {correctionScale.map((step, idx) => {
                  const isHypo = step.minGlucose === 0;
                  const isEga = step.minGlucose > 400;
                  const isVeryHigh = step.minGlucose > 320;
                  return (
                    <tr
                      key={idx}
                      className={
                        isHypo
                          ? 'bg-rose-50 font-bold text-rose-950'
                          : isEga
                          ? 'bg-rose-100/80 font-bold text-rose-950'
                          : isVeryHigh
                          ? 'bg-amber-50'
                          : ''
                      }
                    >
                      <td className="p-2 font-mono font-bold border">{step.glucoseRange}</td>
                      <td className="p-2 font-mono font-bold border text-center">
                        {isHypo ? '0 U (SOSPENDI)' : `+${step.extraUnits} U`}
                      </td>
                      <td className="p-2 border text-[11px]">{step.actionNote}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 3. Suspended Home Medications */}
          {suspendedMeds.length > 0 && (
            <div className="page-break-inside-avoid">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-2 border-b border-rose-200 pb-1">
                3. Terapie Antidiabetiche Domiciliari SOSPESE Durante la Degenza:
              </h4>
              <ul className="text-xs space-y-1 text-slate-800">
                {suspendedMeds.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>
                      <strong>{m.name} ({m.commercialExamples}):</strong> <span className="text-rose-700 font-bold">SOSPESA</span> ({m.clinicalRationale})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Monitoring and Hypoglycemia Protocol */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 page-break-inside-avoid">
            <strong className="text-slate-900 block font-bold">
              4. Monitoraggio Glicemico & Regola del 15 per Ipoglicemie (&lt; 70 mg/dL):
            </strong>
            <p>
              • Controlli capillari: 4 volte al giorno (prima di colazione 07:30, pranzo 12:00, cena 19:00 e ore 22:00) o ogni 4-6h in nutrizione artificiale/NPO.<br/>
              • Se glicemia &lt; 70 mg/dL: somministrare 15g carboidrati semplici (3 bustine di zucchero) e ricontrollare dopo 15 min. Se grave/incosciente/NPO: Glucosata 33% 20-30 mL ev o Glucagone 1 mg im.
            </p>
          </div>

          {/* 5. Signature line */}
          <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600 page-break-inside-avoid">
            <div>
              Data Prescrizione: <strong>{currentDateFormatted}</strong>
            </div>
            <div>
              Firma del Medico Prescrittore: ________________________________
            </div>
          </div>

          {/* 6. Medical Disclaimer */}
          <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-2 leading-relaxed page-break-inside-avoid">
            <strong>Avvertenza Medico-Legale:</strong> Strumento di supporto decisionale clinico basato su linee guida. Il medico prescrittore rimane l'unico responsabile della validazione dei dosaggi e dell'adattamento al paziente. L'autore (Dott. Maestri Lorenzo) declina ogni responsabilità per esiti clinici avversi.
          </div>

        </div>

      </div>
    </div>
  );
};
