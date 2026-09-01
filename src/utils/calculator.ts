import {
  PatientProfile,
  InsulinRegimen,
  CorrectionStep,
  TitrationRecommendation,
  DailyGlucoseLog,
  NutritionType,
  ScheduledDoseItem,
  SpecialNutritionProtocol,
} from '../types';

export function calculateInsulinRegimen(patient: PatientProfile): InsulinRegimen {
  const {
    weightKg,
    age,
    egfr,
    diabetesType,
    clinicalSetting,
    nutrition,
    steroids,
    admissionGlucose,
    insulinExperience,
    homeTDD,
  } = patient;

  const rationale: string[] = [];
  const alerts: string[] = [];

  // Determine active nutrition type
  const nutritionType: NutritionType = nutrition?.type || 'oral_standard';

  // 1. BASE FACTOR (U/kg/die) DETERMINATION (ADA / SID-AMD Standards)
  let baseFactor = 0.4; // standard starting factor for inpatient T2D

  // Age & Fragility Check
  if (age >= 75 || clinicalSetting === 'fragile_elderly' || nutritionType === 'oral_poor') {
    baseFactor = 0.25;
    rationale.push(`Paziente anziano (${age} anni), fragile o con apporto nutrizionale scarso: fattore prudenziale ridotto a ${baseFactor} U/kg/die per prevenire ipoglicemie.`);
    alerts.push('Paziente fragile / a rischio ipoglicemia: soglia di allerta elevata e monitoraggio frequente.');
  } else if (age < 30 && diabetesType === 'T1D') {
    baseFactor = 0.45;
    rationale.push('Diabete Tipo 1 / Paziente giovane: sensibilità insulinica conservata (fattore iniziale 0.45 U/kg).');
  } else if (admissionGlucose > 250) {
    baseFactor = 0.5;
    rationale.push(`Glicemia di ammissione elevata (${admissionGlucose} mg/dL): fattore iniziale impostato a 0.5 U/kg.`);
  }

  // Renal Function / eGFR Adjustments (KDIGO / ADA Guidelines)
  if (egfr < 15 || clinicalSetting === 'dialysis') {
    baseFactor = Math.min(baseFactor, 0.2);
    rationale.push(`Insufficienza renale terminale (eGFR ${egfr} mL/min o dialisi): ridotta clearance ed emivita dell'insulina molto prolungata -> dose ridotta a ${baseFactor} U/kg/die.`);
    alerts.push('Attenzione: nei pazienti in dialisi l\'emivita dell\'insulina è prolungata. Rischio aumentato di ipoglicemia grave nei giorni interdialitici.');
  } else if (egfr < 30) {
    baseFactor = Math.min(baseFactor, 0.25);
    rationale.push(`Insufficienza renale severa (eGFR ${egfr} mL/min): degradazione renale dell'insulina marcatamente ridotta -> fattore ridotto a ${baseFactor} U/kg/die.`);
    alerts.push('eGFR < 30 mL/min: clearance insulinica ridotta, evitare sovradosaggio.');
  } else if (egfr < 50) {
    baseFactor = Math.min(baseFactor, 0.35);
    rationale.push(`Insufficienza renale moderata (eGFR ${egfr} mL/min): fattore ridotto prudentemente a ${baseFactor} U/kg/die.`);
  }

  // Hepatic Failure
  if (clinicalSetting === 'severe_hepatic') {
    baseFactor = Math.min(baseFactor, 0.25);
    rationale.push('Insufficienza epatica severa: ridotta neoglucogenesi e ridotta clearance epatica (fattore 0.25 U/kg/die).');
    alerts.push('Insufficienza epatica: elevato rischio di ipoglicemie protratte a digiuno o notturne.');
  }

  // Severe Infection / Sepsis
  if (clinicalSetting === 'severe_infection') {
    baseFactor = Math.max(baseFactor, 0.55);
    rationale.push('Sepsi / Infezione severa in atto: marcata insulino-resistenza guidata da citochine e ormoni dello stress (fattore 0.55 U/kg/die).');
    alerts.push('Rivalutare quotidianamente: con la remissione della sepsi il fabbisogno insulinico cala rapidamente.');
  }

  // Steroids Modifier
  if (steroids.active && steroids.doseMg > 0) {
    let steroidAddon = 0.15;
    if (steroids.drug === 'desametasone' && steroids.doseMg >= 4) {
      steroidAddon = 0.25;
    } else if (steroids.drug === 'prednisone' && steroids.doseMg >= 25) {
      steroidAddon = 0.2;
    } else if (steroids.drug === 'metilprednisolone' && steroids.doseMg >= 20) {
      steroidAddon = 0.2;
    }
    baseFactor += steroidAddon;
    rationale.push(`Terapia con Glucocorticoide (${steroids.drug.toUpperCase()} ${steroids.doseMg} mg/die): aggiunto +${steroidAddon} U/kg per contrastare l'iperglicemia iatrogena.`);
    alerts.push('Iperglicemia da steroidi: picco tipico pomeridiano-serale (ore 14:00 - 22:00) con glicemia a digiuno al mattino spesso ingannevolmente normale.');
  }

  // Initial Total Daily Dose (TDD)
  let tdd = Math.round(weightKg * baseFactor);

  if (insulinExperience === 'basal_bolus' && homeTDD && homeTDD > 10) {
    const safeHomeDose = Math.round(homeTDD * 0.8);
    if (admissionGlucose < 200) {
      tdd = safeHomeDose;
      rationale.push(`Paziente già in basal-bolus a domicilio (${homeTDD} U/die): dose iniziale calcolata all'80% (${tdd} U/die) per sicurezza durante l'acuzie.`);
    } else {
      tdd = homeTDD;
      rationale.push(`Paziente già in terapia insulinica nota (${homeTDD} U/die): confermata dose totale domiciliare con ricalibrazione dello schema.`);
    }
  }

  // Minimum safety clamp
  if (tdd < 6) tdd = 6;

  // 2. NUTRITIONAL & REGIMEN SCHEDULING SPECIFIC LOGIC
  let basalPercentage = 50;
  let basalDose = Math.round(tdd * 0.5);
  let bolusTotalDose = tdd - basalDose;
  let breakfastBolus = 0;
  let lunchBolus = 0;
  let dinnerBolus = 0;

  let basalTiming = 'Ore 22:00 (prima di coricarsi)';
  let recommendedBasalType = 'Insulina Glargina U100 (Lantus/Abasaglar) o Glargina U300 (Toujeo) / Degludec (Tresiba)';
  let recommendedBolusType = 'Analogo rapido: Aspart (NovoRapid/Fiasp) o Lispro (Humalog) o Glulisina (Apidra)';

  const scheduledDoses: ScheduledDoseItem[] = [];
  let nutritionProtocol: SpecialNutritionProtocol | undefined = undefined;

  switch (nutritionType) {
    case 'npo_fasting': {
      // 1. NPO / FASTING
      basalPercentage = 100;
      basalDose = Math.round(weightKg * (egfr < 30 ? 0.15 : 0.2));
      if (basalDose < 4) basalDose = 4;
      bolusTotalDose = 0;
      breakfastBolus = 0;
      lunchBolus = 0;
      dinnerBolus = 0;
      tdd = basalDose;

      scheduledDoses.push({
        time: 'Ore 22:00 (o 08:00)',
        label: 'Insulina Basale a Digiuno',
        dose: basalDose,
        route: 's.c.',
        drugType: recommendedBasalType,
        instructions: 'Somministrare a orario fisso ogni 24h. Nel Diabete Tipo 1 NON sospendere mai la basale.',
      });

      rationale.push('Digiuno Assoluto / NPO: somministrare SOLO Insulina Basale (0.15 - 0.20 U/kg) e ZERO boli prandiali fissi. Usare solo correzioni rapide su stick glicemico.');
      alerts.push('ATTENZIONE NPO: NON sospendere mai l\'insulina basale nel Diabete Tipo 1 (rischio DKA). Se digiuno prolungato >12h, infondere Glucosata 5% o 10% ev (100-150g glucosio/die).');

      nutritionProtocol = {
        title: 'Protocollo Paziente a Digiuno (NPO - Nil Per Os)',
        summary: 'Paziente in preparazione per intervento chirurgico, procedura endoscopica o a digiuno per patologia acuta (occlusione, pancreatite).',
        safetyRule: 'Non somministrare MAI boli prandiali a digiuno. Nel Diabete Tipo 1 mantenere sempre la basale per bloccare la lipolisi epatica.',
        monitoring: 'Rilevare glicemia capillare ogni 4 - 6 ore. Applicare la scala di correzione con analogo rapido s.c. solo se glicemia > 180 mg/dL.',
        titrationRule: 'Alla ripresa dell\'alimentazione orale solida, somministrare il primo bolo di analogo rapido a FINE PASTO in base a quanto realmente consumato.',
      };
      break;
    }

    case 'oral_poor': {
      // 2. POOR / UNPREDICTABLE ORAL INTAKE
      basalPercentage = 50;
      basalDose = Math.round(tdd * 0.5);
      bolusTotalDose = tdd - basalDose;
      breakfastBolus = Math.max(1, Math.round(bolusTotalDose * 0.25));
      lunchBolus = Math.max(2, Math.round(bolusTotalDose * 0.38));
      dinnerBolus = Math.max(2, bolusTotalDose - breakfastBolus - lunchBolus);

      scheduledDoses.push({
        time: 'Fine Colazione (Ore 08:30)',
        label: 'Bolo Post-Colazione',
        dose: breakfastBolus,
        route: 's.c.',
        drugType: 'Analogo Rapido (Aspart / Lispro)',
        instructions: 'Somministrare ENTRO 20 MINUTI DALLA FINE DEL PASTO in base ai carboidrati effettivamente ingeriti (se mangia solo il 50%, somministrare il 50% del bolo).',
      });
      scheduledDoses.push({
        time: 'Fine Pranzo (Ore 13:00)',
        label: 'Bolo Post-Pranzo',
        dose: lunchBolus,
        route: 's.c.',
        drugType: 'Analogo Rapido (Aspart / Lispro)',
        instructions: 'Iniezione a fine pasto proporzionata al pasto consumato. Aggiungere correzione se glicemia pre/post pasto > 180 mg/dL.',
      });
      scheduledDoses.push({
        time: 'Fine Cena (Ore 20:00)',
        label: 'Bolo Post-Cena',
        dose: dinnerBolus,
        route: 's.c.',
        drugType: 'Analogo Rapido (Aspart / Lispro)',
        instructions: 'Iniezione a fine cena proporzionata al pasto consumato.',
      });
      scheduledDoses.push({
        time: 'Ore 22:00',
        label: 'Insulina Basale h24',
        dose: basalDose,
        route: 's.c.',
        drugType: recommendedBasalType,
        instructions: 'Somministrazione fissa serale ogni 24 ore.',
      });

      rationale.push('Alimentazione Orale Ridotta / Imprevedibile: Boli di analogo rapido somministrati DOPO IL PASTO (entro 20 min) calcolati sull\'introito effettivo consumato, per scongiurare ipoglicemie se il pasto viene rifiutato.');
      alerts.push('Alimentazione variabile: se il paziente rifiuta il pasto, omettere il bolo prandiale ed eseguire solo la correzione su stick se > 180 mg/dL.');

      nutritionProtocol = {
        title: 'Protocollo Alimentazione Orale Ridotta / Imprevedibile',
        summary: 'Indicato in anziani inappetenti, disfagici, nausea post-chemioterapia o post-operatoria.',
        safetyRule: 'Non iniettare MAI l\'insulina rapida prima che il vassoio sia stato consumato. Somministrare solo a pasto ultimato.',
        monitoring: 'Glicemia capillare prima dei 3 pasti e prima di coricarsi. Se pasto consumato per metà, dimezzare il bolo previsto.',
        titrationRule: 'Se l\'apporto orale rimane persistentemente <50% per oltre 48h, rivalutare il supporto nutrizionale artificiale con il team nutrizionale.',
      };
      break;
    }

    case 'enteral_continuous': {
      // 3. CONTINUOUS ENTERAL NUTRITION (24h tube feeding via NGT or PEG)
      // Guideline ADA: 50% Basal (Glargine/Degludec q24h or NPH q12h) + 50% Nutritional coverage split into Regular insulin q6h or Rapid analog q4h
      basalPercentage = 50;
      basalDose = Math.round(tdd * 0.5);
      bolusTotalDose = tdd - basalDose;

      // 4 doses every 6 hours (06:00, 12:00, 18:00, 24:00)
      const doseQ6 = Math.max(1, Math.round(bolusTotalDose / 4));
      const remainder = bolusTotalDose - doseQ6 * 4;

      recommendedBolusType = 'Insulina Umana Regolare (Actrapid/Humulin R) s.c. ogni 6 ore (oppure Analogo Rapido ogni 4-6 ore)';

      scheduledDoses.push({
        time: 'Ore 06:00',
        label: 'Copertura Enterale (1/4)',
        dose: doseQ6 + (remainder > 0 ? 1 : 0),
        route: 's.c.',
        drugType: 'Insulina Regolare s.c.',
        instructions: 'Somministrare ogni 6h durante infusione enterale continua (+ correzione su stick glicemico).',
      });
      scheduledDoses.push({
        time: 'Ore 12:00',
        label: 'Copertura Enterale (2/4)',
        dose: doseQ6,
        route: 's.c.',
        drugType: 'Insulina Regolare s.c.',
        instructions: 'Somministrare ogni 6h durante infusione enterale continua (+ correzione su stick).',
      });
      scheduledDoses.push({
        time: 'Ore 18:00',
        label: 'Copertura Enterale (3/4)',
        dose: doseQ6,
        route: 's.c.',
        drugType: 'Insulina Regolare s.c.',
        instructions: 'Somministrare ogni 6h durante infusione enterale continua (+ correzione su stick).',
      });
      scheduledDoses.push({
        time: 'Ore 24:00',
        label: 'Copertura Enterale (4/4)',
        dose: doseQ6,
        route: 's.c.',
        drugType: 'Insulina Regolare s.c.',
        instructions: 'Somministrare ogni 6h durante infusione enterale continua (+ correzione su stick).',
      });
      scheduledDoses.push({
        time: 'Ore 22:00',
        label: 'Insulina Basale h24',
        dose: basalDose,
        route: 's.c.',
        drugType: recommendedBasalType,
        instructions: 'Glargina o Degludec 1 volta/die (oppure NPH divisa ogni 12h: 50% ore 08:00, 50% ore 20:00).',
      });

      breakfastBolus = doseQ6;
      lunchBolus = doseQ6;
      dinnerBolus = doseQ6 * 2;

      rationale.push('Nutrizione Enterale Continua h24: 50% Basale (Glargina/Degludec h24) + 50% Copertura enterale suddivisa in 4 somministrazioni di Insulina Regolare s.c. ogni 6 ore (ore 06, 12, 18, 24).');
      alerts.push('EMERGENZA ARRESTO NUTRIZIONE ENTERALE: Se la sonda si disloca o l\'infusione si arresta bruscamente, avviare IMMEDIATAMENTE Glucosata 10% ev alla stessa velocità oraria per prevenire ipoglicemia severa!');

      nutritionProtocol = {
        title: 'Protocollo Nutrizione Enterale Continua (h24 con Pompa SNG / PEG)',
        summary: 'Copertura per infusione enterale a flusso costante nelle 24 ore.',
        safetyRule: '⚠️ Se la nutrizione si interrompe improvvisamente (ristagno gastrico, vomito, intubazione/estubazione, esame TC): avviare SUBITO infusione endovenosa di Soluzione Glucosata al 10% alla stessa velocità volumetrica della nutrizione enterale (es. 50-75 mL/h).',
        monitoring: 'Stick glicemico capillare ogni 6 ore (in corrispondenza di ciascuna somministrazione di insulina regolare ore 06-12-18-24).',
        titrationRule: 'Se glicemie costantemente >180 mg/dL nelle 24h: aumentare la quota enterale frazionata del 15-20%. Se glicemia < 100 mg/dL: ridurre la dose frazionata successiva.',
      };
      break;
    }

    case 'enteral_cyclic': {
      // 4. CYCLIC ENTERAL NUTRITION (e.g. 12-16 hours nocturnal infusion)
      basalPercentage = 40;
      basalDose = Math.round(tdd * 0.4);
      bolusTotalDose = tdd - basalDose;

      // NPH given at start of infusion (peak at 4-8h matches nocturnal feeding peak)
      const nphNutritionalDose = Math.round(bolusTotalDose * 0.7);
      const rapidSupportDose = Math.max(1, bolusTotalDose - nphNutritionalDose);

      recommendedBasalType = 'Insulina Glargina U100/Degludec (basale residua) + NPH all\'avvio dell\'infusione';
      recommendedBolusType = 'Insulina NPH (Humulin I) all\'avvio della nutrizione + Analogo Rapido per correzioni';

      scheduledDoses.push({
        time: 'Ore 20:00 (All\'avvio nutrizione)',
        label: 'Copertura Nutrizione Ciclica (NPH)',
        dose: nphNutritionalDose,
        route: 's.c.',
        drugType: 'Insulina NPH (Humulin I / Protaphane)',
        instructions: 'Somministrare esattamente all\'inizio della nutrizione enterale ciclica notturna. Il picco a 4-8 ore coprirà l\'infusione.',
      });
      scheduledDoses.push({
        time: 'Ore 24:00 (A metà infusione)',
        label: 'Supporto Rapido Intermedio',
        dose: rapidSupportDose,
        route: 's.c.',
        drugType: 'Analogo Rapido (Aspart/Lispro)',
        instructions: 'Solo se glicemia a metà infusione > 180 mg/dL.',
      });
      scheduledDoses.push({
        time: 'Ore 08:00 (Al mattino)',
        label: 'Insulina Basale Diurna Residua',
        dose: basalDose,
        route: 's.c.',
        drugType: 'Glargina U100 / Degludec',
        instructions: 'Per coprire la produzione epatica basale di glucosio durante il periodo di digiuno diurno.',
      });

      breakfastBolus = 0;
      lunchBolus = 0;
      dinnerBolus = bolusTotalDose;

      rationale.push('Nutrizione Enterale Ciclica Notturna (12-16h): Insulina NPH somministrata all\'avvio dell\'infusione (ore 20:00) per far coincidere il picco di 4-8 ore con l\'assorbimento glucidico notturno, più basale residua diurna.');
      alerts.push('Attenzione al termine della nutrizione ciclica al mattino: verificare glicemia per scongiurare ipoglicemie tardive.');

      nutritionProtocol = {
        title: 'Protocollo Nutrizione Enterale Ciclica Notturna (12-16 ore)',
        summary: 'Alimentazione enterale intermittente (es. ore 20:00 - 08:00).',
        safetyRule: 'Non somministrare la dose di NPH se l\'infusione nutrizionale non viene effettivamente avviata o viene posticipata.',
        monitoring: 'Glicemia prima di avviare la nutrizione (ore 20:00), a metà infusione (ore 02:00) e al termine della nutrizione (ore 08:00).',
        titrationRule: 'Aggiustare la dose di NPH in base alla glicemia rilevata a metà infusione (ore 02:00-04:00) e al mattino.',
      };
      break;
    }

    case 'enteral_bolus': {
      // 5. ENTERAL BOLUSES (e.g. 3-4 boluses/day via PEG)
      const bolusCount = nutrition?.enteralBolusCount || 4;
      basalPercentage = 50;
      basalDose = Math.round(tdd * 0.5);
      bolusTotalDose = tdd - basalDose;
      const singleBolus = Math.max(1, Math.round(bolusTotalDose / bolusCount));

      recommendedBolusType = 'Analogo Rapido (Aspart / Lispro) ad ogni bolo enterale';

      if (bolusCount === 3) {
        scheduledDoses.push({
          time: 'Ore 08:00 (Bolo Enterale 1)',
          label: 'Bolo Enterale 1/3',
          dose: singleBolus,
          route: 's.c.',
          drugType: 'Analogo Rapido (Aspart/Lispro)',
          instructions: 'Iniezione sottocute all\'inizio della somministrazione del bolo nutritivo.',
        });
        scheduledDoses.push({
          time: 'Ore 13:00 (Bolo Enterale 2)',
          label: 'Bolo Enterale 2/3',
          dose: singleBolus,
          route: 's.c.',
          drugType: 'Analogo Rapido (Aspart/Lispro)',
          instructions: 'Iniezione s.c. all\'inizio del bolo nutritivo (+ eventuale correzione su stick).',
        });
        scheduledDoses.push({
          time: 'Ore 19:00 (Bolo Enterale 3)',
          label: 'Bolo Enterale 3/3',
          dose: bolusTotalDose - singleBolus * 2,
          route: 's.c.',
          drugType: 'Analogo Rapido (Aspart/Lispro)',
          instructions: 'Iniezione s.c. all\'inizio del bolo nutritivo.',
        });
      } else {
        // 4 boluses (08:00, 12:00, 16:00, 20:00)
        scheduledDoses.push({ time: 'Ore 08:00 (Bolo 1)', label: 'Bolo Enterale 1/4', dose: singleBolus, route: 's.c.', drugType: 'Analogo Rapido', instructions: 'Iniezione all\'avvio del bolo nutrizionale.' });
        scheduledDoses.push({ time: 'Ore 12:00 (Bolo 2)', label: 'Bolo Enterale 2/4', dose: singleBolus, route: 's.c.', drugType: 'Analogo Rapido', instructions: 'Iniezione all\'avvio del bolo (+ correzione).' });
        scheduledDoses.push({ time: 'Ore 16:00 (Bolo 3)', label: 'Bolo Enterale 3/4', dose: singleBolus, route: 's.c.', drugType: 'Analogo Rapido', instructions: 'Iniezione all\'avvio del bolo.' });
        scheduledDoses.push({ time: 'Ore 20:00 (Bolo 4)', label: 'Bolo Enterale 4/4', dose: bolusTotalDose - singleBolus * 3, route: 's.c.', drugType: 'Analogo Rapido', instructions: 'Iniezione all\'avvio del bolo.' });
      }

      scheduledDoses.push({
        time: 'Ore 22:00',
        label: 'Insulina Basale h24',
        dose: basalDose,
        route: 's.c.',
        drugType: recommendedBasalType,
        instructions: 'Somministrazione fissa ogni 24h per coprire il fabbisogno epatico.',
      });

      breakfastBolus = singleBolus;
      lunchBolus = singleBolus;
      dinnerBolus = singleBolus;

      rationale.push(`Nutrizione Enterale a Boli (${bolusCount} boli/die tramite PEG): 50% Insulina Basale h24 + Boli di analogo rapido somministrati ad ogni bolo nutritivo.`);
      alerts.push('PEG a boli: verificare la tolleranza gastrica e il ristagno prima di iniettare l\'insulina rapida.');

      nutritionProtocol = {
        title: `Protocollo Nutrizione Enterale a Boli (${bolusCount} Boli / Die tramite PEG)`,
        summary: 'Somministrazione frazionata a boli durante la giornata.',
        safetyRule: 'Non somministrare l\'analogo rapido se il bolo enterale viene rigurgitato o se il ristagno gastrico supera i 200 mL.',
        monitoring: 'Glicemia capillare prima di ciascun bolo nutrizionale.',
        titrationRule: 'Aggiustare i singoli boli rapidi in base al profilo glicemico a 2 ore dalla somministrazione del bolo enterale.',
      };
      break;
    }

    case 'parenteral_tpn_continuous': {
      // 6. CONTINUOUS TOTAL PARENTERAL NUTRITION (TPN / NPT h24)
      // Guideline ADA/ESPEN: Human Regular Insulin added DIRECTLY to the TPN bag (0.1 U per gram of dextrose in bag)
      const dextroseGrams = nutrition?.tpnGlucoseGrams || 200; // standard 200g dextrose bag
      let regularInBagUnits = Math.round(dextroseGrams * 0.1); // 0.1 U/g glucose

      // Adjust for marked resistance or steroids: 0.15 - 0.20 U/g
      if (steroids.active || clinicalSetting === 'severe_infection' || admissionGlucose > 280) {
        regularInBagUnits = Math.round(dextroseGrams * 0.15);
      }

      // Basal requirement for liver glucose baseline (especially T1D or known T2D)
      const subcutaneousBasal = Math.max(4, Math.round(weightKg * 0.15));

      tdd = regularInBagUnits + subcutaneousBasal;
      basalDose = subcutaneousBasal;
      bolusTotalDose = regularInBagUnits;
      basalPercentage = Math.round((subcutaneousBasal / tdd) * 100);

      recommendedBasalType = 'Insulina Glargina U100 s.c. (fabbisogno basale epatico)';
      recommendedBolusType = 'Insulina Umana Regolare (Actrapid/Humulin R) AGGIUNTA NELLA SACCA NPT';

      scheduledDoses.push({
        time: 'In preparazione sacca NPT (h24)',
        label: 'Insulina Regolare in Sacca NPT',
        dose: regularInBagUnits,
        route: 'e.v. in sacca NPT',
        drugType: 'Insulina Umana Regolare (Actrapid / Humulin R)',
        instructions: `Iniettare ${regularInBagUnits} Unità di Insulina Regolare direttamente nella sacca di NPT (${dextroseGrams}g glucosio - rapporto ${((regularInBagUnits / dextroseGrams)).toFixed(2)} U/g) prima di avviare l'infusione.`,
      });

      scheduledDoses.push({
        time: 'Ore 22:00',
        label: 'Insulina Basale Sottocute',
        dose: subcutaneousBasal,
        route: 's.c.',
        drugType: 'Glargina U100 s.c.',
        instructions: 'Per coprire la produzione epatica basale di glucosio indipendente dalla sacca nutrizionale.',
      });

      scheduledDoses.push({
        time: 'Ogni 4 - 6 Ore al bisogno',
        label: 'Correzioni Estemporanee',
        dose: 0,
        route: 's.c.',
        drugType: 'Analogo Rapido (Aspart / Lispro)',
        instructions: 'Eseguire stick glicemico ogni 4-6h e correggere con analogo rapido s.c. secondo la scala solo se glicemia > 180 mg/dL.',
      });

      breakfastBolus = 0;
      lunchBolus = 0;
      dinnerBolus = regularInBagUnits;

      rationale.push(`Nutrizione Parenterale Totale Continua (NPT): Insulina Umana Regolare (${regularInBagUnits} U) aggiunta DIRETTAMENTE nella sacca NPT (${dextroseGrams}g destrosio: 0.1 - 0.15 U/g di glucosio) + ${subcutaneousBasal} U di Basale s.c.`);
      alerts.push('EMERGENZA CHIUSURA SACCA NPT: Se la sacca di NPT termina o viene interrotta, infondere Glucosata 10% ev a 50-80 mL/h per evitare un crollo ipoglicemico!');

      nutritionProtocol = {
        title: 'Protocollo Nutrizione Parenterale Totale (NPT Continua h24)',
        summary: `Sacca NPT con ${dextroseGrams}g di destrosio. Metodo raccomandato ADA/ESPEN: insulina regolare in sacca per sicurezza fisiologica.`,
        safetyRule: '⚠️ Se l\'infusione di NPT viene sospesa improvvisamente (occlusione CVC, rimozione accidentale, termine precoce sacca): avviare IMMEDIATAMENTE Soluzione Glucosata 10% ev a 50-80 mL/h.',
        bagInstructions: `Aggiungere ${regularInBagUnits} U di Insulina Umana Regolare (Actrapid/Humulin R) nella sacca NPT sotto cappa o con tecnica sterile prima dell'inizio dell'infusione.`,
        monitoring: 'Glicemia capillare ogni 4 - 6 ore. Correggere glicemie > 180 mg/dL con analogo rapido s.c.',
        titrationRule: 'TITOLAZIONE GIORNALIERA: Aggiungere il 100% dell\'insulina correttiva s.c. somministrata nelle ultime 24 ore alla dose di insulina regolare nella sacca del giorno successivo.',
      };
      break;
    }

    case 'parenteral_tpn_cyclic': {
      // 7. CYCLIC PARENTERAL NUTRITION (e.g. 12-16h infusion)
      const dextroseGrams = nutrition?.tpnGlucoseGrams || 180;
      const regularInBagUnits = Math.round(dextroseGrams * 0.12);
      const subcutaneousBasal = Math.max(4, Math.round(weightKg * 0.15));

      tdd = regularInBagUnits + subcutaneousBasal;
      basalDose = subcutaneousBasal;
      bolusTotalDose = regularInBagUnits;
      basalPercentage = Math.round((subcutaneousBasal / tdd) * 100);

      recommendedBasalType = 'Insulina Glargina U100 s.c. (basale diurna)';
      recommendedBolusType = 'Insulina Umana Regolare in sacca NPT ciclica';

      scheduledDoses.push({
        time: 'In preparazione sacca NPT Ciclica',
        label: 'Insulina Regolare in Sacca Ciclica',
        dose: regularInBagUnits,
        route: 'e.v. in sacca NPT',
        drugType: 'Insulina Umana Regolare',
        instructions: `Inserire ${regularInBagUnits} U di insulina regolare nella sacca di NPT ciclica (${dextroseGrams}g glucosio).`,
      });

      scheduledDoses.push({
        time: 'Ore 08:00',
        label: 'Basale Sottocute Diurna',
        dose: subcutaneousBasal,
        route: 's.c.',
        drugType: 'Glargina U100 s.c.',
        instructions: 'Copre il fabbisogno glucidico epatico nelle ore in cui la sacca non è in infusione.',
      });

      breakfastBolus = 0;
      lunchBolus = 0;
      dinnerBolus = regularInBagUnits;

      rationale.push(`Nutrizione Parenterale Ciclica (12-16h): ${regularInBagUnits} U di Insulina Regolare inserite in sacca NPT (${dextroseGrams}g destrosio) + ${subcutaneousBasal} U Basale s.c. diurna.`);
      alerts.push('Fine sacca NPT ciclica: monitorare glicemia capillare per escludere effetto rimbalzo o ipoglicemia.');

      nutritionProtocol = {
        title: 'Protocollo Nutrizione Parenterale Ciclica (12-16 ore)',
        summary: 'Infusione parenterale intermittente notturna o diurna.',
        safetyRule: 'Negli ultimi 60 minuti di infusione ciclica, ridurre la velocità alla metà (taper-down) per prevenire ipoglicemie da iperinsulinemia reattiva.',
        monitoring: 'Glicemia prima di avviare l\'infusione, a metà infusione e a 1-2 ore dal termine.',
        titrationRule: 'Aggiustare la dose in sacca del giorno dopo in base alla media dei controlli glicemici durante l\'infusione.',
      };
      break;
    }

    case 'oral_standard':
    default: {
      // 8. STANDARD ORAL 3 MEALS
      basalPercentage = 50;
      basalDose = Math.round(tdd * 0.5);
      bolusTotalDose = tdd - basalDose;

      if (steroids.active && steroids.frequency === 'mattina') {
        // Steroid morning peak pattern
        recommendedBasalType = 'Glargina U100/U300 ore 22:00 OPPURE Insulina NPH al mattino (ore 08:00)';
        basalTiming = 'Ore 22:00 (oppure NPH ore 08:00 in concomitanza dello steroide)';
        breakfastBolus = Math.max(2, Math.round(bolusTotalDose * 0.2));
        lunchBolus = Math.max(2, Math.round(bolusTotalDose * 0.4));
        dinnerBolus = Math.max(2, bolusTotalDose - breakfastBolus - lunchBolus);
        rationale.push('Schema Steroideo Mattutino: boli distribuiti con enfasi su Pranzo (40%) e Cena (40%) per contrastare il picco di insulino-resistenza pomeridiano.');
      } else {
        // Standard Italian hospital distribution (25% colazione, 38% pranzo, 37% cena)
        breakfastBolus = Math.max(2, Math.round(bolusTotalDose * 0.25));
        lunchBolus = Math.max(2, Math.round(bolusTotalDose * 0.38));
        dinnerBolus = Math.max(2, bolusTotalDose - breakfastBolus - lunchBolus);
        rationale.push('Ripartizione standard: 50% Fabbisogno Basale (h24) e 50% Boli Prandiali (Colazione 25%, Pranzo ~38%, Cena ~37%).');
      }

      scheduledDoses.push({
        time: 'Ore 08:00 (Colazione)',
        label: 'Bolo Colazione',
        dose: breakfastBolus,
        route: 's.c.',
        drugType: 'Analogo Rapido (Aspart / Lispro)',
        instructions: 'Iniezione s.c. subito prima del pasto (+ eventuale correzione su stick).',
      });
      scheduledDoses.push({
        time: 'Ore 12:30 (Pranzo)',
        label: 'Bolo Pranzo',
        dose: lunchBolus,
        route: 's.c.',
        drugType: 'Analogo Rapido (Aspart / Lispro)',
        instructions: 'Iniezione s.c. subito prima del pranzo (+ eventuale correzione su stick).',
      });
      scheduledDoses.push({
        time: 'Ore 19:30 (Cena)',
        label: 'Bolo Cena',
        dose: dinnerBolus,
        route: 's.c.',
        drugType: 'Analogo Rapido (Aspart / Lispro)',
        instructions: 'Iniezione s.c. subito prima della cena (+ eventuale correzione su stick).',
      });
      scheduledDoses.push({
        time: 'Ore 22:00 (Notte)',
        label: 'Insulina Basale h24',
        dose: basalDose,
        route: 's.c.',
        drugType: recommendedBasalType,
        instructions: 'Iniezione s.c. a orario fisso prima di coricarsi. Non saltare mai.',
      });
      break;
    }
  }

  // Recalculate totals for consistency
  if (nutritionType !== 'npo_fasting' && nutritionType !== 'parenteral_tpn_continuous' && nutritionType !== 'parenteral_tpn_cyclic') {
    bolusTotalDose = breakfastBolus + lunchBolus + dinnerBolus;
    tdd = basalDose + bolusTotalDose;
  }

  // 3. INSULIN SENSITIVITY FACTOR (ISF / 1800 Rule) & ICR (500 Rule)
  // ISF = 1800 / TDD (mg/dL per unit of rapid-acting insulin)
  // ISF_Regular = 1500 / TDD (mg/dL per unit of regular insulin)
  const isf = Math.max(15, Math.round(1800 / tdd));
  const isfRegular = Math.max(12, Math.round(1500 / tdd));
  const icr = Math.max(4, Math.round(500 / tdd));

  return {
    tdd,
    factorUsed: Number(baseFactor.toFixed(2)),
    basalDose,
    basalPercentage: Math.round((basalDose / tdd) * 100),
    bolusTotalDose,
    breakfastBolus,
    lunchBolus,
    dinnerBolus,
    scheduledDoses,
    nutritionProtocol,
    basalTiming,
    recommendedBasalType,
    recommendedBolusType,
    isf,
    isfRegular,
    icr,
    targetGlucose: 140, // standard hospital target pre-meal
    rationale,
    alerts,
  };
}

/**
 * Generate customized correction scale (Sliding Scale) based on patient's ISF
 */
export function generateCorrectionScale(isf: number, isElderlyOrRenal: boolean = false): CorrectionStep[] {
  let stepUnits = 1;
  if (isf < 30) {
    stepUnits = 2; // Resistant patient: bigger correction steps
  } else if (isf > 60) {
    stepUnits = 1; // Sensitive: gentle correction
  }

  const steps: CorrectionStep[] = [
    {
      glucoseRange: '< 70 mg/dL',
      minGlucose: 0,
      maxGlucose: 69,
      extraUnits: 0,
      actionNote: 'IPOGLICEMIA! Sospendere bolo, applicare Regola del 15 (15g zuccheri / Glucosata) e ricontrollare dopo 15 min.',
    },
    {
      glucoseRange: '70 - 140 mg/dL',
      minGlucose: 70,
      maxGlucose: 140,
      extraUnits: 0,
      actionNote: 'IN TARGET: somministrare solo la dose nutrizionale prevista (se prevista).',
    },
    {
      glucoseRange: '141 - 180 mg/dL',
      minGlucose: 141,
      maxGlucose: 180,
      extraUnits: isElderlyOrRenal ? 0 : 1,
      actionNote: isElderlyOrRenal ? 'Target permissivo anziano/IRC: nessuna correzione necessaria.' : `+${1} U di analogo rapido oltre alla dose nutrizionale.`,
    },
    {
      glucoseRange: '181 - 220 mg/dL',
      minGlucose: 181,
      maxGlucose: 220,
      extraUnits: Math.max(1, Math.round(stepUnits * 1.5)),
      actionNote: `+${Math.max(1, Math.round(stepUnits * 1.5))} U di analogo rapido.`,
    },
    {
      glucoseRange: '221 - 260 mg/dL',
      minGlucose: 221,
      maxGlucose: 260,
      extraUnits: Math.max(2, Math.round(stepUnits * 2.5)),
      actionNote: `+${Math.max(2, Math.round(stepUnits * 2.5))} U di analogo rapido.`,
    },
    {
      glucoseRange: '261 - 320 mg/dL',
      minGlucose: 261,
      maxGlucose: 320,
      extraUnits: Math.max(3, Math.round(stepUnits * 3.5)),
      actionNote: `+${Math.max(3, Math.round(stepUnits * 3.5))} U di analogo rapido.`,
    },
    {
      glucoseRange: '321 - 400 mg/dL',
      minGlucose: 321,
      maxGlucose: 400,
      extraUnits: Math.max(4, Math.round(stepUnits * 4.5)),
      actionNote: `+${Math.max(4, Math.round(stepUnits * 4.5))} U di analogo rapido. Avvisare il medico di reparto; verificare idratazione e chetoni.`,
    },
    {
      glucoseRange: '> 400 mg/dL',
      minGlucose: 401,
      maxGlucose: 999,
      extraUnits: Math.max(5, Math.round(stepUnits * 5.5)),
      actionNote: `+${Math.max(5, Math.round(stepUnits * 5.5))} U di analogo rapido. ALLERTA MEDICA URGENTE: Eseguire EGA (Emogasanalisi) per escludere chetoacidosi / stato iperosmolare, dosare chetonemia ed elettroliti, avviare idratazione e.v. con NaCl 0.9%.`,
    },
  ];

  return steps;
}

/**
 * Calculate single spot correction dose: (Current - Target) / ISF
 */
export function calculateSpotCorrection(
  currentGlucose: number,
  targetGlucose: number,
  isf: number,
  lastBolusHoursAgo?: number
): {
  recommendedUnits: number;
  rawCalculated: number;
  explanation: string;
  iobWarning?: string;
} {
  if (currentGlucose < 70) {
    return {
      recommendedUnits: 0,
      rawCalculated: 0,
      explanation: 'Ipoglicemia in atto (< 70 mg/dL). Non somministrare insulina. Applicare protocollo ipoglicemia con 15g di zuccheri semplici.',
    };
  }

  if (currentGlucose <= targetGlucose) {
    return {
      recommendedUnits: 0,
      rawCalculated: 0,
      explanation: `Glicemia (${currentGlucose} mg/dL) inferiore o uguale al target (${targetGlucose} mg/dL). Nessuna correzione necessaria.`,
    };
  }

  const delta = currentGlucose - targetGlucose;
  const raw = delta / isf;
  const recommendedUnits = Math.round(raw);

  let explanation = `Formula: (Glicemia ${currentGlucose} - Target ${targetGlucose}) / ISF ${isf} = ${raw.toFixed(2)} U -> Arrotondato a ${recommendedUnits} Unità di analogo rapido.`;
  let iobWarning: string | undefined = undefined;

  if (lastBolusHoursAgo !== undefined && lastBolusHoursAgo < 3) {
    iobWarning = `Attenzione: l'ultimo bolo è stato somministrato ${lastBolusHoursAgo} ore fa. L'insulina rapida ha una durata di 3-4 ore: esiste ancora "Insulina Attiva in circolo" (Insulin-On-Board). Rischio di ipoglicemia per accumulo (insulin stacking). Considerare di dimezzare la correzione o attendere.`;
  }

  return {
    recommendedUnits,
    rawCalculated: Number(raw.toFixed(2)),
    explanation,
    iobWarning,
  };
}

/**
 * Daily Titration Algorithm (Titration Advisor)
 */
export function evaluateDailyTitration(
  regimen: InsulinRegimen,
  log: DailyGlucoseLog
): TitrationRecommendation {
  let basalChange = 0;
  const bolusChanges = { breakfast: 0, lunch: 0, dinner: 0 };
  const notes: string[] = [];
  let urgency: 'routine' | 'warning' | 'critical' = 'routine';

  // Hypoglycemia check has maximum priority!
  if (log.hypoEvents > 0 || log.fasting < 70 || log.preLunch < 70 || log.preDinner < 70 || log.bedtime < 70) {
    urgency = 'warning';
    if (log.fasting < 70 || (log.night3am && log.night3am < 70)) {
      const reduction = Math.max(2, Math.round(regimen.basalDose * 0.2));
      basalChange = -reduction;
      notes.push(`IPOGLICEMIA A DIGIUNO / NOTTURNA: Ridurre subito la Basale di ${reduction} U (-20%).`);
    } else {
      const reduction = Math.max(1, Math.round(regimen.basalDose * 0.15));
      basalChange = -reduction;
      notes.push(`IPOGLICEMIA DURANTE IL GIORNO: Ridurre la Basale di ${reduction} U e i boli responsabili.`);
    }

    if (log.preLunch < 70) {
      bolusChanges.breakfast = -Math.max(1, Math.round(regimen.breakfastBolus * 0.2));
      notes.push('Ipoglicemia pre-pranzo: ridotto bolo colazione del 20%.');
    }
    if (log.preDinner < 70) {
      bolusChanges.lunch = -Math.max(1, Math.round(regimen.lunchBolus * 0.2));
      notes.push('Ipoglicemia pre-cena: ridotto bolo pranzo del 20%.');
    }
    if (log.bedtime < 70) {
      bolusChanges.dinner = -Math.max(1, Math.round(regimen.dinnerBolus * 0.2));
      notes.push('Ipoglicemia prima di coricarsi: ridotto bolo cena del 20%.');
    }

    return {
      basalChange,
      bolusChanges,
      overallAdvice: notes.join(' '),
      urgency,
    };
  }

  // Fasting Hyperglycemia -> Adjust Basal
  if (log.fasting > 180) {
    const increase = Math.max(2, Math.round(regimen.basalDose * 0.15));
    basalChange = +increase;
    notes.push(`Glicemia a digiuno elevata (${log.fasting} mg/dL): aumentare la Basale di +${increase} U (+15%).`);
  } else if (log.fasting >= 140 && log.fasting <= 180) {
    const increase = Math.max(1, Math.round(regimen.basalDose * 0.1));
    basalChange = +increase;
    notes.push(`Glicemia a digiuno lievemente sopra target (${log.fasting} mg/dL): considerare +${increase} U di Basale.`);
  }

  // Pre-Lunch Hyperglycemia
  if (log.preLunch > 180) {
    const inc = Math.max(1, Math.round(regimen.breakfastBolus * 0.15));
    bolusChanges.breakfast = +inc;
    notes.push(`Glicemia pre-pranzo alta (${log.preLunch} mg/dL): aumentare bolo Colazione di +${inc} U.`);
  }

  // Pre-Dinner Hyperglycemia
  if (log.preDinner > 180) {
    const inc = Math.max(1, Math.round(regimen.lunchBolus * 0.15));
    bolusChanges.lunch = +inc;
    notes.push(`Glicemia pre-cena alta (${log.preDinner} mg/dL): aumentare bolo Pranzo di +${inc} U.`);
  }

  // Bedtime Hyperglycemia
  if (log.bedtime > 180) {
    const inc = Math.max(1, Math.round(regimen.dinnerBolus * 0.15));
    bolusChanges.dinner = +inc;
    notes.push(`Glicemia prima di coricarsi alta (${log.bedtime} mg/dL): aumentare bolo Cena di +${inc} U.`);
  }

  if (notes.length === 0) {
    notes.push('Glicemie ben controllate ed entro i range target ospedalieri (100-180 mg/dL). Mantenere lo schema invariato.');
  }

  return {
    basalChange,
    bolusChanges,
    overallAdvice: notes.join(' '),
    urgency,
  };
}
