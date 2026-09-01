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
  ShieldAlert, 
  FileDown,
  AlertTriangle
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

  const handleExportWord = () => {
    const tableRowsHtml = correctionScale.map((step) => {
      const isHypo = step.minGlucose === 0;
      const isHigh = step.minGlucose > 320;
      const isEga = step.minGlucose > 400;
      const bgCol = isEga ? '#ffebee' : isHigh ? '#fff8e1' : isHypo ? '#fce4ec' : '#ffffff';
      const textColor = isEga ? '#b71c1c' : isHypo ? '#880e4f' : '#212121';
      return `
        <tr style="background-color: ${bgCol};">
          <td style="padding: 8px 10px; border: 1px solid #cccccc; font-weight: bold; font-family: monospace; color: ${textColor}; font-size: 13px;">${step.glucoseRange}</td>
          <td style="padding: 8px 10px; border: 1px solid #cccccc; font-weight: bold; text-align: center; color: ${textColor}; font-size: 13px;">
            ${isHypo ? '0 U (SOSPENDI)' : `+${step.extraUnits} U`}
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cccccc; font-size: 12px; color: #333333;">${step.actionNote}</td>
        </tr>
      `;
    }).join('');

    const scheduledDosesRowsHtml = regimen.scheduledDoses.map((d) => {
      const isBasal = d.label.toLowerCase().includes('basale');
      const isInBag = d.route.includes('sacca');
      const bg = isBasal ? '#eef2ff' : isInBag ? '#e6fffa' : '#ffffff';

      return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #dddddd;">
          <td style="padding: 8px 10px; border: 1px solid #cccccc; font-weight: bold; font-family: monospace; font-size: 12pt; color: #111827;">${d.time}</td>
          <td style="padding: 8px 10px; border: 1px solid #cccccc; font-weight: bold; font-size: 10.5pt; color: #004d40;">${d.label}</td>
          <td style="padding: 8px 10px; border: 1px solid #cccccc; text-align: center; font-weight: bold; font-size: 14pt; color: #0f766e;">${d.dose} U</td>
          <td style="padding: 8px 10px; border: 1px solid #cccccc; font-size: 10pt; color: #374151;">${d.drugType} <br><span style="color: #6b7280; font-size: 9pt;">[Via: ${d.route}]</span></td>
          <td style="padding: 8px 10px; border: 1px solid #cccccc; font-size: 9.5pt; color: #4b5563;">${d.instructions}</td>
        </tr>
      `;
    }).join('');

    const suspendedMedsHtml = suspendedMeds.length > 0
      ? `<ul style="margin: 5px 0 10px 20px; font-size: 12px; color: #212121;">
          ${suspendedMeds.map(m => `<li style="margin-bottom: 6px;"><strong>${m.name} (${m.commercialExamples}):</strong> <span style="color: #c62828; font-weight: bold;">SOSPESA</span> - ${m.clinicalRationale}</li>`).join('')}
        </ul>`
      : `<p style="font-size: 12px; color: #555555; font-style: italic;">Nessun farmaco orale da sospendere indicato.</p>`;

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Prescrizione Schema Insulinico - ${patient.bedOrName || 'Paziente'}</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; color: #1a1a1a; margin: 20px; line-height: 1.4; }
          h1 { color: #004d40; font-size: 18pt; margin-bottom: 2px; }
          h2 { color: #004d40; font-size: 13pt; margin-top: 16px; margin-bottom: 6px; border-bottom: 1.5pt solid #004d40; padding-bottom: 3px; }
          .author { font-size: 11pt; color: #00796b; font-weight: bold; margin-bottom: 8px; }
          .header-box { background-color: #f5f5f5; border: 1pt solid #dddddd; padding: 10px 14px; margin-bottom: 14px; border-radius: 4px; }
          .grid-table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 14px; }
          .grid-table th { background-color: #004d40; color: #ffffff; padding: 8px 10px; font-size: 10.5pt; text-align: left; border: 1pt solid #004d40; }
          .protocol-box { background-color: #fffbeb; border: 1.5pt solid #f59e0b; padding: 10px; margin: 10px 0; border-radius: 4px; font-size: 10.5pt; color: #92400e; }
          .signature-section { margin-top: 25px; padding-top: 15px; border-top: 1pt solid #888888; font-size: 11pt; }
        </style>
      </head>
      <body>
        <div style="text-align: right; font-size: 10pt; color: #666666;">
          Presidio Ospedaliero • Scheda Prescrizione Terapeutica Diabetologica<br>
          Data Prescrizione: <strong>${currentDateFormatted}</strong>
        </div>

        <h1>SCHEMA INSULINICO OSPEDALIERO PERSONALIZZATO</h1>
        <div class="author">Creato dal Dott. Maestri Lorenzo • Linee Guida ADA / SID-AMD / ESPEN</div>

        <div class="header-box">
          <table style="width: 100%; font-size: 10.5pt;">
            <tr>
              <td style="width: 50%;"><strong>Paziente / Letto:</strong> ${patient.bedOrName || 'Non specificato'}</td>
              <td style="width: 50%;"><strong>Reparto:</strong> ${patient.department || 'Degenza Ordinaria'}</td>
            </tr>
            <tr>
              <td><strong>Età / Sesso:</strong> ${patient.age} anni (${patient.gender})</td>
              <td><strong>Peso / BMI:</strong> ${patient.weightKg} kg (BMI: ${bmi})</td>
            </tr>
            <tr>
              <td><strong>Funzione Renale:</strong> eGFR ${patient.egfr} mL/min (Creatinina: ${patient.creatinine ?? 'N/D'} mg/dL)</td>
              <td><strong>Diagnosi / Glicemia Ingresso:</strong> ${patient.diabetesType} (${patient.admissionGlucose} mg/dL)</td>
            </tr>
          </table>
        </div>

        ${regimen.nutritionProtocol ? `
          <div class="protocol-box">
            <strong>${regimen.nutritionProtocol.title}:</strong><br>
            • <strong>Regola di Sicurezza:</strong> ${regimen.nutritionProtocol.safetyRule}<br>
            • <strong>Monitoraggio:</strong> ${regimen.nutritionProtocol.monitoring}
          </div>
        ` : ''}

        <h2>1. SOMMINISTRAZIONI INSULINICHE PROGRAMMATE (PROGRAMMA ORARIO VERTICALE)</h2>
        <div style="font-size: 10.5pt; margin-bottom: 8px;">
          <strong>Fabbisogno Totale Giornaliero (TDD):</strong> ${regimen.tdd} Unità/die (Fattore: ${regimen.factorUsed} U/kg/die)
        </div>

        <table class="grid-table">
          <thead>
            <tr>
              <th style="width: 14%;">Orario</th>
              <th style="width: 22%;">Somministrazione</th>
              <th style="width: 14%; text-align: center;">Dose Fissa</th>
              <th style="width: 24%;">Tipo Insulina / Via</th>
              <th style="width: 26%;">Istruzioni Reparto</th>
            </tr>
          </thead>
          <tbody>
            ${scheduledDosesRowsHtml}
          </tbody>
        </table>

        <h2>2. SCALA MOBILE DI CORREZIONE PRE-PRANDIALE (SLIDING SCALE)</h2>
        <div style="font-size: 10pt; margin-bottom: 6px;">
          <strong>Fattore di Sensibilità (ISF):</strong> 1 Unità abbassa la glicemia di <strong>~${regimen.isf} mg/dL</strong> (Target: 100 - 140 mg/dL).
        </div>

        <table class="grid-table">
          <thead>
            <tr>
              <th style="width: 22%;">Glicemia Capillare</th>
              <th style="width: 22%; text-align: center;">Dose Correzione</th>
              <th style="width: 56%;">Istruzioni Infermieristiche & Mediche</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <h2>3. TERAPIE ANTIDIABETICHE DOMICILIARI SOSPESE DURANTE IL RICOVERO</h2>
        ${suspendedMedsHtml}

        <div class="signature-section">
          <table style="width: 100%;">
            <tr>
              <td style="width: 50%;">
                Data e Ora: <strong>${currentDateFormatted} - ore ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</strong>
              </td>
              <td style="width: 50%; text-align: right;">
                Firma del Medico Prescrittore: _____________________________________
              </td>
            </tr>
          </table>
          <div style="font-size: 8pt; color: #777777; margin-top: 14px; line-height: 1.3; border-top: 0.5pt solid #cccccc; padding-top: 6px;">
            <strong>Avvertenza Medico-Legale (Disclaimer):</strong> La presente scheda è generata a scopo di supporto decisionale clinico basato su linee guida (ADA / SID-AMD / ESPEN). Il medico prescrittore rimane l'unico responsabile della validazione clinica, della congruenza dei dosaggi e dell'adattamento al singolo paziente. L'autore (Dott. Maestri Lorenzo) declina ogni responsabilità per esiti clinici avversi o modifiche terapeutiche non supervisionate.
          </div>
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
    downloadLink.download = `Schema_Insulinico_${cleanName}_${currentDateFormatted.replace(/\//g, '-')}.doc`;
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
                Stampa in PDF, Esporta in Word (.doc) o Copia per Cartella Elettronica
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
              title="Esporta documento compatibile Microsoft Word (.doc)"
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
              title="Stampa diretta o Salva come PDF"
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
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 print:p-0 print:m-0" id="printable-order-sheet">
          
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Paziente / Letto:</span>
              <strong className="text-slate-900 text-sm">{patient.bedOrName || 'Non specificato'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Età / Sesso:</span>
              <strong className="text-slate-900">{patient.age} anni ({patient.gender})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Peso / BMI:</span>
              <strong className="text-slate-900">{patient.weightKg} kg (BMI {bmi})</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Funzione Renale:</span>
              <strong className="text-slate-900">eGFR {patient.egfr} mL/min {patient.creatinine ? `(Cr: ${patient.creatinine})` : ''}</strong>
            </div>
          </div>

          {/* Special Nutrition Protocol Banner */}
          {regimen.nutritionProtocol && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 space-y-1">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                {regimen.nutritionProtocol.title}
              </div>
              <p className="text-slate-700">
                <strong>Regola di Sicurezza:</strong> {regimen.nutritionProtocol.safetyRule}
              </p>
              <p className="text-slate-600 text-[11px]">
                <strong>Monitoraggio:</strong> {regimen.nutritionProtocol.monitoring}
              </p>
            </div>
          )}

          {/* 1. Daily Injections Schedule - Vertical Table */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Somministrazioni Insuliniche Programmate (TDD: {regimen.tdd} U/die - {regimen.factorUsed} U/kg/die)
              </h4>
              <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Sequenza Verticale Giornaliera
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 w-24">Orario</th>
                    <th className="p-2 border-r border-slate-200 w-36">Somministrazione</th>
                    <th className="p-2 border-r border-slate-200 text-center w-24">Dose Fissa</th>
                    <th className="p-2 border-r border-slate-200">Tipo Farmaco & Via</th>
                    <th className="p-2">Istruzioni Reparto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {regimen.scheduledDoses.map((doseItem, idx) => {
                    const isBasal = doseItem.label.toLowerCase().includes('basale');
                    const isInBag = doseItem.route.includes('sacca');

                    return (
                      <tr
                        key={idx}
                        className={
                          isBasal
                            ? 'bg-indigo-50/50'
                            : isInBag
                            ? 'bg-teal-50/50'
                            : 'bg-white'
                        }
                      >
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {doseItem.time}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                          {doseItem.label}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center font-black font-mono text-base text-teal-700">
                          {doseItem.dose} U
                        </td>
                        <td className="p-2 border-r border-slate-200 text-slate-700">
                          <span className="font-semibold">{doseItem.drugType}</span>
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                            isBasal ? 'bg-indigo-100 text-indigo-800' : isInBag ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {doseItem.route}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600 text-[11px] leading-relaxed">
                          {doseItem.instructions}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Sliding scale correction table */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Scala Mobile di Correzione Pre-Prandiale (ISF: 1 U = -{regimen.isf} mg/dL)
              </h4>
              <span className="text-[10px] text-slate-600">Dose extra da somministrare prima dei pasti/boli</span>
            </div>

            <table className="w-full text-xs text-left border border-slate-200">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-2 border">Glicemia Capillare</th>
                  <th className="p-2 border text-center">Unità Extra di Rapida</th>
                  <th className="p-2 border">Istruzioni Infermieristiche & Mediche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {correctionScale.map((step, idx) => {
                  const isHypo = step.minGlucose === 0;
                  const isEga = step.minGlucose > 400;
                  const isVeryHigh = step.minGlucose > 320 && !isEga;

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
            <div>
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
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <strong className="text-slate-900 block font-bold">
              4. Monitoraggio Glicemico & Regola del 15 per Ipoglicemie (&lt; 70 mg/dL):
            </strong>
            <p>
              • Controlli capillari: 4 volte al giorno (prima di colazione 07:30, pranzo 12:00, cena 19:00 e ore 22:00) o ogni 4-6h in nutrizione artificiale/NPO.<br/>
              • Se glicemia &lt; 70 mg/dL: somministrare 15g carboidrati semplici (3 bustine di zucchero) e ricontrollare dopo 15 min. Se grave/incosciente/NPO: Glucosata 33% 20-30 mL ev o Glucagone 1 mg im.
            </p>
          </div>

          {/* 5. Signature line */}
          <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
            <div>
              Data Prescrizione: <strong>{currentDateFormatted}</strong>
            </div>
            <div>
              Firma del Medico Prescrittore: ________________________________
            </div>
          </div>

          {/* 6. Medical Disclaimer */}
          <div className="text-[10px] text-slate-400 border-t border-slate-200 pt-2 leading-relaxed">
            <strong>Avvertenza Medico-Legale:</strong> Strumento di supporto decisionale clinico basato su linee guida. Il medico prescrittore rimane l'unico responsabile della validazione dei dosaggi e dell'adattamento al paziente. L'autore (Dott. Maestri Lorenzo) declina ogni responsabilità per esiti clinici avversi.
          </div>

        </div>

      </div>
    </div>
  );
};
