import React, { useState } from 'react';
import { PatientProfile, InsulinRegimen } from '../types';
import { generateCorrectionScale } from '../utils/calculator';
import { MEDICATION_GUIDELINES } from '../data/medicationKnowledge';
import { 
  Copy, 
  Check, 
  X, 
  FileText, 
  FileDown,
  Layers,
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface PrintableOrderSheetProps {
  patient: PatientProfile;
  regimen: InsulinRegimen;
  onClose: () => void;
}

export const PrintableOrderSheet: React.FC<PrintableOrderSheetProps> = ({ patient, regimen, onClose }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedRegimenOnly, setCopiedRegimenOnly] = useState(false);
  const [copiedScaleOnly, setCopiedScaleOnly] = useState(false);
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

  // Testo Pagina 1 per Cartella Clinica Elettronica
  const generatePage1Text = () => {
    const dosesText = regimen.scheduledDoses
      .map((d) => `  * ${d.time} [${d.route}]: ${d.label} -> ${d.dose} U di ${d.drugType}\n    Istruzioni: ${d.instructions}`)
      .join('\n');

    return `=== PAGINA 1: SCHEMA TERAPEUTICO INSULINICO OSPEDALIERO ===
Presidio Ospedaliero - Protocolli ADA / SID-AMD / ESPEN
Data: ${currentDateFormatted} | Reparto: ${patient.department || 'Degenza Ordinaria'}
Paziente: ${patient.bedOrName || 'Non specificato'} | Età: ${patient.age} anni (${patient.gender})
Peso: ${patient.weightKg} kg (BMI: ${bmi}) | eGFR: ${patient.egfr} mL/min | Creatinina: ${patient.creatinine ?? 'N/D'} mg/dL
Diagnosi: ${patient.diabetesType} | Glicemia Ingresso: ${patient.admissionGlucose} mg/dL | HbA1c: ${patient.hba1c ? `${patient.hba1c}%` : 'N/D'}
Regime Nutrizionale: ${regimen.nutritionProtocol ? regimen.nutritionProtocol.title : 'Pasti Orali Standard'}

1. SCHEMA INSULINICO PROGRAMMATO FISSO (TDD: ${regimen.tdd} U/die - ${regimen.factorUsed} U/kg/die):
${dosesText}
Quota Basale: ${regimen.basalDose} U | Quota Prandiale/Nutritiva: ${regimen.totalBolus} U

${regimen.nutritionProtocol ? `NOTE NUTRIZIONE SPECIALE:
${regimen.nutritionProtocol.safetyRule}
Monitoraggio: ${regimen.nutritionProtocol.monitoring}
` : ''}
2. TERAPIE ORALI DOMICILIARI SOSPESE IN RICOVERO:
${suspendedMeds.length > 0
  ? suspendedMeds.map((m) => `- ${m.name} (${m.action}): ${m.clinicalRationale}`).join('\n')
  : '- Nessun farmaco orale da sospendere indicato.'}

3. PROTOCOLLO IPOGLICEMIA (< 70 mg/dL):
Sospendere insulina rapida. Somministrare 15g carboidrati semplici (3 bustine zucchero in acqua o 1 succo). Ricontrollo stick a 15 minuti. Se NPO/incosciente: Glucosata 33% 20-30 mL ev o Glucagone 1 mg im.

Firma del Medico Prescrittore: ________________________ (Data: ${currentDateFormatted})`;
  };

  // Testo Pagina 2 per Cartella Clinica Elettronica
  const generatePage2Text = () => {
    const scaleLines = correctionScale
      .map((s) => `  * ${s.glucoseRange.padEnd(16)} -> ${s.minGlucose === 0 ? '0 U (SOSPENDI)' : `+${s.extraUnits} U`.padEnd(8)} | ${s.actionNote}`)
      .join('\n');

    return `=== PAGINA 2: SCALA MOBILE DI CORREZIONE PRE-PRANDIALE SU STICK GLICEMICO ===
Paziente: ${patient.bedOrName || 'Non specificato'} | Reparto: ${patient.department || 'Degenza Ordinaria'}
Data Prescrizione: ${currentDateFormatted}
Target Glicemico Pre-Prandiale: 100 - 140 mg/dL (Anziano/Fragile: 140 - 180 mg/dL)
Fattore di Sensibilità Insulinica (ISF): 1 U di analogo rapido riduce ~${regimen.isf} mg/dL

SCALA DI CORREZIONE SU GLICEMIA CAPILLARE:
${scaleLines}

MODALITÀ DI SOMMINISTRAZIONE:
- Misurare lo stick capillare prima di Colazione, Pranzo, Cena e prima di coricarsi (ore 22:00).
- Somministrare la dose extra di Insulina Rapida in aggiunta alla dose fissa prevista dal pasto.
- Se glicemia > 400 mg/dL: allertare il medico di reparto, eseguire EGA per escludere chetoacidosi/iperosmolarità, valutare chetonemia e idratazione ev NaCl 0.9%.

Firma del Medico Prescrittore: ________________________ (Data: ${currentDateFormatted})`;
  };

  // Testo Completo combinato
  const generateFullText = () => {
    return `${generatePage1Text()}

================================================================================

${generatePage2Text()}`;
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generateFullText());
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopyRegimenOnly = () => {
    navigator.clipboard.writeText(generatePage1Text());
    setCopiedRegimenOnly(true);
    setTimeout(() => setCopiedRegimenOnly(false), 2500);
  };

  const handleCopyScaleOnly = () => {
    navigator.clipboard.writeText(generatePage2Text());
    setCopiedScaleOnly(true);
    setTimeout(() => setCopiedScaleOnly(false), 2500);
  };

  // Generazione Word strutturata esattamente in 2 pagine separate
  const handleExportWord = () => {
    const scheduledDosesRowsHtml = regimen.scheduledDoses.map((d) => {
      const isBasal = d.label.toLowerCase().includes('basale');
      const bg = isBasal ? '#f0f9ff' : '#ffffff';

      return `
        <tr style="background-color: ${bg};">
          <td style="padding: 6px 8px; border: 1px solid #999; font-weight: bold; text-align: center;">${d.time}</td>
          <td style="padding: 6px 8px; border: 1px solid #999; font-weight: bold;">${d.label}</td>
          <td style="padding: 6px 8px; border: 1px solid #999; text-align: center; font-weight: bold; font-size: 13pt; color: #004d40;">${d.dose} U</td>
          <td style="padding: 6px 8px; border: 1px solid #999;">${d.drugType} <span style="color: #666; font-size: 8.5pt;">(${d.route})</span></td>
          <td style="padding: 6px 8px; border: 1px solid #999; font-size: 9pt;">${d.instructions}</td>
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
          <td style="padding: 5px 8px; border: 1px solid #999; font-weight: bold; text-align: center; color: ${textColor}; font-size: 9.5pt;">${step.glucoseRange}</td>
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
            <th style="border: 1px solid #999; padding: 4px 6px; text-align: left; font-size: 9pt; width: 35%;">Farmaco Domiciliare</th>
            <th style="border: 1px solid #999; padding: 4px 6px; text-align: left; font-size: 9pt; width: 65%;">Motivazione Clinica Sospensione</th>
          </tr>
          ${suspendedMeds.map(m => `
            <tr>
              <td style="border: 1px solid #999; padding: 4px 6px; font-weight: bold; font-size: 9pt; color: #991b1b;">
                ${m.name} (${m.commercialExamples})
              </td>
              <td style="border: 1px solid #999; padding: 4px 6px; font-size: 8.5pt; color: #374151;">
                ${m.clinicalRationale}
              </td>
            </tr>
          `).join('')}
        </table>`
      : `<p style="font-size: 9pt; color: #555555; margin: 3px 0;">Nessun farmaco orale da sospendere indicato.</p>`;

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Prescrizione Schema Insulinico - ${patient.bedOrName || 'Paziente'}</title>
        <style>
          @page { 
            size: A4 portrait; 
            margin: 1.2cm 1.2cm 1.2cm 1.2cm; 
            mso-header-margin: 0.8cm;
            mso-footer-margin: 0.8cm;
          }
          body { 
            font-family: Arial, Calibri, sans-serif; 
            font-size: 9.5pt; 
            line-height: 1.3; 
            color: #111827; 
          }
          h1 { color: #004d40; font-size: 14pt; margin: 0 0 2px 0; text-transform: uppercase; }
          .header-table { width: 100%; border: none; margin-bottom: 8px; border-bottom: 2px solid #004d40; padding-bottom: 4px; }
          .section-title { font-size: 10.5pt; font-weight: bold; color: #004d40; background-color: #e0f2f1; padding: 3px 6px; margin-top: 8px; margin-bottom: 4px; border-left: 4px solid #004d40; }
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
          table.data-table th { background-color: #f3f4f6; border: 1px solid #999; padding: 4px 6px; font-size: 9pt; text-align: left; }
          table.data-table td { border: 1px solid #999; padding: 4px 6px; font-size: 9pt; }
          .alert-box { background-color: #fffbeb; border: 1px solid #f59e0b; padding: 6px 8px; font-size: 8.5pt; margin-top: 6px; }
          .signature-box { margin-top: 14px; width: 100%; }
          .disclaimer { font-size: 7.5pt; color: #666; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 4px; line-height: 1.2; }
          .page-break { 
            page-break-before: always; 
            mso-special-character: line-break;
            clear: all;
          }
        </style>
      </head>
      <body>
        
        <!-- ========================================== -->
        <!-- PAGINA 1: SCHEMA INSULINICO PROGRAMMATO -->
        <!-- ========================================== -->

        <!-- INTESTAZIONE PAGINA 1 -->
        <table class="header-table">
          <tr>
            <td style="border:none; padding:0;">
              <h1>SCHEDA PRESCRIZIONE INSULINICA OSPEDALIERA</h1>
              <div style="font-size: 8.5pt; color: #00695c; font-weight: bold;">Protocollo Basal-Bolus & Riconciliazione Terapeutica (ADA / SID-AMD / ESPEN)</div>
            </td>
            <td style="border:none; padding:0; text-align:right; font-size: 8.5pt; color: #4b5563;">
              Data Prescrizione: <strong>${currentDateFormatted}</strong><br>
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

        <!-- FARMACI SOSPESI -->
        <div class="section-title">3. TERAPIE DOMICILIARI SOSPESE IN RICOVERO</div>
        ${suspendedMedsHtml}

        <!-- PROTOCOLLO IPOGLICEMIA -->
        <div class="alert-box">
          <strong>🚨 GESTIONE SICUREZZA IPOGLICEMIA (&lt; 70 mg/dL):</strong> Sospendere bolo rapido. Somministrare 15g carboidrati semplici (3 bustine zucchero o 1 succo). Ricontrollo a 15 minuti ("Regola del 15"). Se pz non collaborante/NPO: Glucosata 33% 20-30 mL ev o Glucagone 1 mg im.
        </div>

        <!-- FIRMA PAGINA 1 -->
        <table class="signature-box" style="border: none;">
          <tr>
            <td style="border: none; padding: 0; width: 50%; font-size: 9pt;">
              Data Prescrizione: <strong>${currentDateFormatted}</strong>
            </td>
            <td style="border: none; padding: 0; width: 50%; text-align: right; font-size: 9pt;">
              Firma Medico Prescrittore: _____________________________
            </td>
          </tr>
        </table>

        <!-- DISCLAIMER PAGINA 1 -->
        <div class="disclaimer">
          <strong>Avvertenza Medico-Legale:</strong> Strumento di supporto decisionale clinico conforme alle linee guida internazionali. Il medico prescrittore rimane l'unico responsabile della validazione clinica, della congruenza dei dosaggi e dell'adattamento al singolo paziente.
        </div>


        <!-- ======================================================= -->
        <!-- INTERRUZIONE DI PAGINA FORZATA PER IL DOCUMENTO WORD    -->
        <!-- ======================================================= -->
        <br clear=all style='mso-special-character:line-break;page-break-before:always' class="page-break">


        <!-- ======================================================= -->
        <!-- PAGINA 2: SCALA MOBILE DI CORREZIONE ESTEMPORANEA       -->
        <!-- ======================================================= -->

        <!-- INTESTAZIONE PAGINA 2 -->
        <table class="header-table">
          <tr>
            <td style="border:none; padding:0;">
              <h1>ALLEGATO: SCALA DI CORREZIONE SU STICK GLICEMICO</h1>
              <div style="font-size: 8.5pt; color: #00695c; font-weight: bold;">Protocollo Correzione Iperglicemia Pre-Prandiale & Decubito (Target 100-140 mg/dL)</div>
            </td>
            <td style="border:none; padding:0; text-align:right; font-size: 8.5pt; color: #4b5563;">
              Paziente: <strong>${patient.bedOrName || 'Letto ___'}</strong><br>
              Data: <strong>${currentDateFormatted}</strong>
            </td>
          </tr>
        </table>

        <div class="section-title">PARAMETRI DI CALCOLO DELLA SENSIBILITÀ</div>
        <table class="data-table">
          <tr>
            <td style="width: 33%; background-color: #f9fafb;"><strong>Fattore Sensibilità (ISF):</strong></td>
            <td style="width: 67%; font-weight: bold; color: #004d40;">1 U di analogo rapido riduce ~${regimen.isf} mg/dL</td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb;"><strong>Target Glicemico Pre-Prandiale:</strong></td>
            <td>100 - 140 mg/dL ${isElderlyOrRenal ? '<span style="color:#b91c1c; font-weight:bold;">(Fascia permissiva per età >= 75 anni o IRC: 140-180 mg/dL)</span>' : ''}</td>
          </tr>
        </table>

        <!-- SCALA CORREZIONI -->
        <div class="section-title">TABELLA CORREZIONI ESTEMPORANEE CON INSULINA RAPIDA</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25%; text-align: center;">Glicemia Rilevata</th>
              <th style="width: 20%; text-align: center;">Dose Extra Rapida</th>
              <th style="width: 55%;">Istruzioni Infermieristiche & Gestione Clinica</th>
            </tr>
          </thead>
          <tbody>
            ${correctionRowsHtml}
          </tbody>
        </table>

        <div class="alert-box" style="margin-top: 10px;">
          <strong>ISTRUZIONI PER IL PERSONALE INFERMIERISTICO:</strong>
          <ul style="margin: 4px 0 0 16px; padding: 0;">
            <li>Rilevare la glicemia capillare prima di Colazione (07:30), Pranzo (12:00), Cena (19:00) e ore 22:00.</li>
            <li>Somministrare le unità extra di Insulina Rapida indicate sopra <strong>in aggiunta</strong> alla dose fissa prevista dal pasto.</li>
            <li>Se glicemia &gt; 400 mg/dL: allertare tempestivamente il medico di reparto, eseguire EGA ed escludere chetoacidosi/iperosmolarità.</li>
          </ul>
        </div>

        <!-- FIRMA PAGINA 2 -->
        <table class="signature-box" style="border: none; margin-top: 25px;">
          <tr>
            <td style="border: none; padding: 0; width: 50%; font-size: 9pt;">
              Data Prescrizione: <strong>${currentDateFormatted}</strong>
            </td>
            <td style="border: none; padding: 0; width: 50%; text-align: right; font-size: 9pt;">
              Firma Medico Prescrittore: _____________________________
            </td>
          </tr>
        </table>

        <!-- DISCLAIMER PAGINA 2 -->
        <div class="disclaimer">
          <strong>Avvertenza Medico-Legale:</strong> Documento clinico generato a supporto della prescrizione terapeutica. Validazione clinica a cura del medico prescrittore.
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Actions Toolbar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
                Esportazione Prescrizione & Copia Testuale
              </h3>
              <p className="text-xs text-slate-300">
                Word (.doc) formattato su 2 pagine separate (Pag. 1 Schema / Pag. 2 Correzioni) o copia rapida
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Word Export Button */}
            <button
              type="button"
              id="btn-export-word"
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs sm:text-sm font-bold text-white transition-all shadow-md shadow-blue-950/30 cursor-pointer hover:scale-[1.02]"
              title="Scarica documento Word (.doc) organizzato su 2 pagine perfette"
            >
              {wordExported ? <Check className="h-4 w-4 text-blue-200" /> : <FileDown className="h-4 w-4" />}
              <span>{wordExported ? 'Scaricato in Word!' : 'Scarica Word (.doc)'}</span>
            </button>

            {/* Copy All button */}
            <button
              type="button"
              id="btn-copy-all"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
              title="Copia l'intero testo formattato (Pagina 1 + Pagina 2)"
            >
              {copiedAll ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4" />}
              <span>{copiedAll ? 'Copiato Tutto!' : 'Copia Tutto'}</span>
            </button>

            {/* Close modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Quick Copy Action Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1 font-medium text-slate-700">
            <Layers className="h-3.5 w-3.5 text-teal-600" />
            <span>Copie Selettive per Cartella Elettronica:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRegimenOnly}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              {copiedRegimenOnly ? <Check className="h-3 w-3 text-emerald-600" /> : <ClipboardList className="h-3 w-3 text-slate-500" />}
              <span>{copiedRegimenOnly ? 'Copiato Schema!' : 'Copia Solo Pagina 1 (Schema)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyScaleOnly}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              {copiedScaleOnly ? <Check className="h-3 w-3 text-emerald-600" /> : <ClipboardList className="h-3 w-3 text-slate-500" />}
              <span>{copiedScaleOnly ? 'Copiata Scala!' : 'Copia Solo Pagina 2 (Scala Correzioni)'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Document Preview Area (Pagina 1 & Pagina 2) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 text-slate-900">
          
          {/* ========================================== */}
          {/* ANTEPRIMA PAGINA 1: SCHEMA PROGRAMMATO     */}
          {/* ========================================== */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-5 relative">
            <div className="absolute -top-3 right-4 bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              PAGINA 1 DI 2 NEL FILE WORD
            </div>

            {/* Header Pagina 1 */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Presidio Ospedaliero • Scheda Terapeutica Diabetologica
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  SCHEMA INSULINICO PROGRAMMATO OSPEDALIERO
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Data: <strong>{currentDateFormatted}</strong> | Linee Guida: ADA Inpatient / SID-AMD / ESPEN
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                  {patient.department || 'Degenza Reparto'}
                </div>
              </div>
            </div>

            {/* Dati Paziente */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
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
                <span className="text-slate-500 block">Diabete & Glicemia:</span>
                <strong className="text-slate-900">{patient.diabetesType}</strong>
                <span className="text-[10px] text-slate-500 block">Glicemia Ingresso: {patient.admissionGlucose} mg/dL</span>
              </div>
            </div>

            {/* Protocollo Nutrizione se attivo */}
            {regimen.nutritionProtocol && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 space-y-1">
                <div className="font-bold text-amber-900">
                  PROTOCOLLO NUTRIZIONE: {regimen.nutritionProtocol.title}
                </div>
                <div><strong>Regola di Sicurezza:</strong> {regimen.nutritionProtocol.safetyRule}</div>
                <div><strong>Monitoraggio:</strong> {regimen.nutritionProtocol.monitoring}</div>
              </div>
            )}

            {/* Schema Fisso Dosi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  1. Terapia Insulinica Programmata Fissa (TDD: {regimen.tdd} U/die - {regimen.factorUsed} U/kg):
                </h4>
                <span className="text-[11px] text-slate-500">
                  Quota Basale: {regimen.basalDose} U | Quota Prandiale: {regimen.totalBolus} U
                </span>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-2 border w-16 text-center">Orario</th>
                    <th className="p-2 border">Somministrazione</th>
                    <th className="p-2 border text-center w-20">Dose Fissa</th>
                    <th className="p-2 border">Tipo Farmaco / Via</th>
                    <th className="p-2 border">Istruzioni Reparto</th>
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
                        <td className="p-2 font-mono font-bold border text-center">{dose.time}</td>
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

            {/* Farmaci Sospesi */}
            {suspendedMeds.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 mb-1 border-b border-rose-200 pb-1">
                  2. Terapie Domiciliari SOSPESE In Ricovero:
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

            {/* Protocollo Ipoglicemia */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 space-y-1">
              <strong className="text-amber-900 block font-bold">
                3. Gestione Sicurezza Ipoglicemia (&lt; 70 mg/dL):
              </strong>
              <p>
                Sospendere bolo rapido. Somministrare 15g carboidrati semplici (3 bustine zucchero in acqua o 1 succo). Ricontrollo stick a 15 minuti ("Regola del 15"). Se NPO/incosciente: Glucosata 33% 20-30 mL ev o Glucagone 1 mg im.
              </p>
            </div>

            {/* Firma Pagina 1 */}
            <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
              <div>
                Data Prescrizione: <strong>{currentDateFormatted}</strong>
              </div>
              <div>
                Firma del Medico Prescrittore: ________________________________
              </div>
            </div>

            {/* Disclaimer Pagina 1 */}
            <div className="text-[9.5px] text-slate-400 border-t border-slate-200 pt-1.5 leading-relaxed">
              <strong>Avvertenza Medico-Legale:</strong> Strumento di supporto decisionale basato su linee guida. Il medico prescrittore rimane l'unico responsabile della validazione dei dosaggi.
            </div>
          </div>


          {/* ========================================== */}
          {/* ANTEPRIMA PAGINA 2: SCALA DI CORREZIONE    */}
          {/* ========================================== */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs space-y-5 relative">
            <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
              PAGINA 2 DI 2 NEL FILE WORD
            </div>

            {/* Header Pagina 2 */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Allegato Prescrizione Terapeutica
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  SCALA MOBILE DI CORREZIONE PRE-PRANDIALE SU STICK
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Target: 100 - 140 mg/dL | Paziente: <strong>{patient.bedOrName || 'Letto ___'}</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-300">
                  ISF: 1 U riduce ~{regimen.isf} mg/dL
                </div>
              </div>
            </div>

            {/* Tabella Scala di Correzione */}
            <div className="space-y-2">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-2 border w-36 text-center">Glicemia Capillare Rilevata</th>
                    <th className="p-2 border text-center w-28">Dose Extra Rapida</th>
                    <th className="p-2 border">Istruzioni Infermieristiche & Gestione Reparto</th>
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
                        <td className="p-2 font-mono font-bold border text-center">{step.glucoseRange}</td>
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

            {/* Note Operative per Infermieri */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <strong className="text-slate-900 block font-bold">
                Istruzioni Operative Infermieristiche:
              </strong>
              <ul className="space-y-1 text-slate-600">
                <li>• Rilevare la glicemia capillare prima di Colazione (07:30), Pranzo (12:00), Cena (19:00) e ore 22:00 (o ogni 4-6h in NPO/nutrizione artificiale).</li>
                <li>• Somministrare le unità di analogo rapido sopra indicate <strong>in aggiunta</strong> alla dose fissa programmata dal pasto.</li>
                <li>• Se glicemia &gt; 400 mg/dL: allertare subito il medico di reparto per escludere chetoacidosi/iperosmolarità con EGA e chetonemia.</li>
              </ul>
            </div>

            {/* Firma Pagina 2 */}
            <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
              <div>
                Data Prescrizione: <strong>{currentDateFormatted}</strong>
              </div>
              <div>
                Firma del Medico Prescrittore: ________________________________
              </div>
            </div>

            {/* Disclaimer Pagina 2 */}
            <div className="text-[9.5px] text-slate-400 border-t border-slate-200 pt-1.5 leading-relaxed">
              <strong>Avvertenza Medico-Legale:</strong> Documento clinico generato a supporto della prescrizione terapeutica.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
