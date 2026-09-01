import { HomeMedicationId, MedicationAction } from '../types';

export const MEDICATION_GUIDELINES: Record<HomeMedicationId, MedicationAction> = {
  sglt2i: {
    id: 'sglt2i',
    name: 'SGLT2-Inibitori (Gliflozine)',
    commercialExamples: 'Empagliflozin (Jardiance), Dapagliflozin (Forxiga), Canagliflozin (Invokana), Ertugliflozin (Steglatro)',
    action: 'SOSPENDERE',
    severity: 'danger',
    clinicalRationale:
      'ALTO RISCHIO DI CHETOACIDOSI DIABETICA EUGLICEMICA (euDKA) in corso di patologia acuta, stress chirurgico, infezione o digiuno. Rischio di deplezione volemica, ipotensione e infezioni urogenitali.',
    resumptionCriteria:
      'Sospendere all\'ammissione o 3-4 giorni prima di interventi chirurgici. Riprendere solo dopo dimissione o completa stabilizzazione clinica, con ripresa dell\'alimentazione normale e normalizzazione dei parametri emodinamici e renali.',
  },
  metformina: {
    id: 'metformina',
    name: 'Metformina (Biguanidi)',
    commercialExamples: 'Metforal, Glucophage, Slo-Met, generici (e in associazione fissa)',
    action: 'SOSPENDERE_CONDIZIONATO',
    severity: 'warning',
    clinicalRationale:
      'Rischio di ACIDOSI LATTICA in condizioni di ipoperfusione tissutale, sepsi, insufficienza renale acuta o peggioramento di eGFR (< 30 mL/min), insufficienza epatica o uso di Mezzo di Contrasto Iodato (es. TC mdc, coronarografia).',
    resumptionCriteria:
      'Sospendere in acuto. Sospendere tassativamente 48h prima e dopo esami con mezzo di contrasto iodato. Mantenibile solo in pazienti clinicamente stabili in reparto a basso rischio con eGFR > 45-60 mL/min e regolare intake orale.',
  },
  sulfonilurea: {
    id: 'sulfonilurea',
    name: 'Sulfoniluree',
    commercialExamples: 'Gliclazide (Diamicron), Glimepiride (Amaryl, Solosa), Glibenclamide (Daonil)',
    action: 'SOSPENDERE',
    severity: 'danger',
    clinicalRationale:
      'ALTO RISCHIO DI IPOGLICEMIA SEVERA E PROLUNGATA (anche per 24-48 ore per emivita biologica e accumulo nei metaboliti renali). In ospedale i pasti sono spesso variabili o ritardati per esami/procedure.',
    resumptionCriteria:
      'Sospendere all\'ingresso. Sostituire con schema insulinico Basal-Bolus o Basal-Plus. Non raccomandate durante la degenza per il profilo di sicurezza sfavorevole.',
  },
  repaglinide: {
    id: 'repaglinide',
    name: 'Glinidi (Repaglinide)',
    commercialExamples: 'Novonorm, Repaglinide generica',
    action: 'SOSPENDERE',
    severity: 'warning',
    clinicalRationale:
      'Rischio di ipoglicemia se assunta prima di pasti non consumati o incompleti. In ospedale è preferibile titolare boli di analogo rapido dopo il pasto.',
    resumptionCriteria:
      'Sospendere di routine e passare a insulina rapida ai pasti.',
  },
  glp1_ra: {
    id: 'glp1_ra',
    name: 'Agonisti Recettoriali GLP-1 / Dual GIP-GLP1',
    commercialExamples: 'Semaglutide (Ozempic, Rybelsus), Dulaglutide (Trulicity), Liraglutide (Victoza), Tirzepatide (Mounjaro)',
    action: 'SOSPENDERE',
    severity: 'warning',
    clinicalRationale:
      'Rallentamento dello svuotamento gastrico con aumentato rischio di ab-ingestis in caso di procedure/sedazioni/anestesia; frequenti effetti collaterali gastrointestinali (nausea, inappetenza, vomito) che complicano il monitoraggio nutrizionale.',
    resumptionCriteria:
      'Sospendere in acuto. Sospendere almeno 1 settimana prima di interventi chirurgici elettivi (per ritardo svuotamento gastrico secondo linee guida anestesiologiche).',
  },
  dpp4i: {
    id: 'dpp4i',
    name: 'Inibitori DPP-4 (Gliptine)',
    commercialExamples: 'Linagliptin (Trajenta), Sitagliptin (Januvia, Xelevia), Vildagliptin (Galvus)',
    action: 'MANTENIBILE',
    severity: 'success',
    clinicalRationale:
      'Profilo di sicurezza eccellente, NON inducono ipoglicemia. Linagliptin può essere usato a dose piena anche con qualsiasi grado di insufficienza renale (eGFR < 15 / dialisi).',
    resumptionCriteria:
      'Mantenibili o utilizzabili in monoterapia/con basale in pazienti non critici con iperglicemia lieve-moderata (glicemia < 180-200 mg/dL). Se glicemia > 200 mg/dL passare a Basal-Bolus.',
  },
  pioglitazone: {
    id: 'pioglitazone',
    name: 'Tiazolidinedioni (Pioglitazone)',
    commercialExamples: 'Actos, Pioglitazone generico',
    action: 'SOSPENDERE',
    severity: 'danger',
    clinicalRationale:
      'Ritenzione idrosalina con rischio di precipitazione o peggioramento di SCOMPENSO CARDIACO acuto ed edemi periferici. Inizio d\'azione lento (settimane), inutile per il controllo glicemico in acuto.',
    resumptionCriteria:
      'Sospendere durante il ricovero. Controindicato in corso di insufficienza cardiaca (NYHA I-IV).',
  },
  acarbosio: {
    id: 'acarbosio',
    name: 'Inibitori Alfa-Glucosidasi (Acarbosio)',
    commercialExamples: 'Glucobay, Acarphage',
    action: 'SOSPENDERE',
    severity: 'info',
    clinicalRationale:
      'Efficacia ipoglicemizzante modesta; frequenti disturbi addominali (meteorismo, flatulenza, diarrea) mal tollerati dal paziente allettato o con problematiche addominali.',
    resumptionCriteria:
      'Sospendere durante il ricovero e gestire con insulina prandiale.',
  },
};

export const INSULIN_TYPES_KNOWLEDGE = [
  {
    category: 'Analogo Rapido / Ultrarapido (Boli Prandiali & Correzioni)',
    molecules: 'Aspart (NovoRapid, Fiasp), Lispro (Humalog, Lyumjev), Glulisina (Apidra)',
    onset: '10 - 20 min (5-10 min per Fiasp/Lyumjev)',
    peak: '1 - 2 ore',
    duration: '3 - 5 ore',
    role: 'Copertura del picco glicemico del pasto e correzione iperglicemia estemporanea.',
    clinicalTip: 'Somministrare immediatamente prima o entro 20 minuti dall\'inizio del pasto. Se il paziente mangia in modo imprevedibile, somministrare subito DOPO il pasto calcolando sui carboidrati effettivamente ingeriti.',
  },
  {
    category: 'Insulina Umana Regolare / Pronta',
    molecules: 'Actrapid, Humulin R',
    onset: '30 - 60 min',
    peak: '2 - 4 ore',
    duration: '6 - 8 ore',
    role: 'Uso in nutrizione parenterale (NPT) o pompe infusionali ev (infusione continua).',
    clinicalTip: 'Per via sottocutanea richiede iniezione 30 min prima del pasto e ha maggior rischio di ipoglicemie tardive rispetto agli analoghi rapidi.',
  },
  {
    category: 'Analogo Basale a Lenta / Ultralenta Azione',
    molecules: 'Glargina U100 (Lantus, Abasaglar), Glargina U300 (Toujeo), Degludec (Tresiba), Detemir (Levemir)',
    onset: '1 - 2 ore (Toujeo/Degludec ~2-4h)',
    peak: 'Profilo piatto (senza picco evidente)',
    duration: '24 ore (Glargina U100), 24-36h (Toujeo U300), >42h (Degludec)',
    role: 'Copertura del fabbisogno epatico basale di glucosio h24.',
    clinicalTip: 'Somministrare a orario fisso ogni giorno (solitamente ore 22:00, oppure ore 08:00). Non sospendere MAI nel Diabete Tipo 1 anche se il paziente è a digiuno.',
  },
  {
    category: 'Insulina NPH (Isofane)',
    molecules: 'Humulin I, Protaphane',
    onset: '1 - 2 ore',
    peak: '4 - 8 ore',
    duration: '12 - 18 ore',
    role: 'Indicazione elettiva nel DIABETE DA STEROIDI assunto al mattino (es. Desametasone / Prednisone ore 08:00).',
    clinicalTip: 'Il picco di azione della NPH a 4-8 ore combacia perfettamente con il picco di insulino-resistenza steroidea del primo pomeriggio.',
  },
];

export const STEROID_EQUIVALENCES = [
  { drug: 'desametasone', name: 'Desametasone (Decadron, Soldesam)', potencyFactor: 25, eq5mgPrednisone: 0.75, halfLife: 'Lunga (36-54h)', hyperglycemicPeak: 'Pomeriggio - Notte (14:00 - 24:00)' },
  { drug: 'metilprednisolone', name: 'Metilprednisolone (Urbason, Medrol)', potencyFactor: 5, eq5mgPrednisone: 4.0, halfLife: 'Intermedia (18-36h)', hyperglycemicPeak: 'Pomeriggio - Sera (14:00 - 22:00)' },
  { drug: 'prednisone', name: 'Prednisone (Deltacortene)', potencyFactor: 4, eq5mgPrednisone: 5.0, halfLife: 'Intermedia (18-36h)', hyperglycemicPeak: 'Pomeriggio - Sera (14:00 - 22:00)' },
  { drug: 'idrocortisone', name: 'Idrocortisone (Flebocortid, Solu-Cortef)', potencyFactor: 1, eq5mgPrednisone: 20.0, halfLife: 'Breve (8-12h)', hyperglycemicPeak: '4-8 ore post-somministrazione' },
];
