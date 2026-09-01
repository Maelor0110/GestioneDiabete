export type DiabetesType = 'T2D' | 'T1D' | 'STEROID' | 'NEW_ONSET' | 'STRESS';

export type ClinicalSetting =
  | 'standard'
  | 'fragile_elderly'
  | 'severe_infection'
  | 'severe_hepatic'
  | 'dialysis';

export type NutritionType =
  | 'oral_standard' // Pasti standard per os (Colazione, Pranzo, Cena)
  | 'oral_poor' // Alimentazione orale ridotta/imprevedibile (bolo post-prandiale)
  | 'npo_fasting' // Digiuno assoluto / NPO (pre-op / procedure / occlusione)
  | 'enteral_continuous' // Nutrizione Enterale Continua (h24 tramite SNG/PEG con pompa)
  | 'enteral_cyclic' // Nutrizione Enterale Ciclica (es. 12-16 ore notturne)
  | 'enteral_bolus' // Nutrizione Enterale a Boli (es. 3-4 somministrazioni/die tramite PEG)
  | 'parenteral_tpn_continuous' // Nutrizione Parenterale Totale TPN Continua (24h)
  | 'parenteral_tpn_cyclic'; // Nutrizione Parenterale Ciclica (es. 12-16h)

export interface NutritionDetails {
  type: NutritionType;
  dailyCarbsGrams?: number; // Grammi di carboidrati totali stimati al giorno
  dailyCaloriesKcal?: number; // Calorie totali (kcal/die)
  tpnGlucoseGrams?: number; // Grammi di destrosio/glucosio presenti nella sacca NPT (es. 200g)
  tpnInsulinInBag?: boolean; // Se l'insulina umana regolare viene aggiunta direttamente in sacca NPT (true) o somministrata s.c. (false)
  enteralBolusCount?: number; // Numero di boli per enterale a boli (es. 3, 4 o 5)
  infusionHours?: number; // Durata infusione in ore (es. 12, 16 o 24)
  rateMlPerHour?: number; // Velocità di infusione in mL/ora (es. 60-85 mL/h)
}

export type InsulinExperience = 'naive' | 'basal_only' | 'basal_bolus' | 'mixed';

export type SteroidDrug = 'prednisone' | 'desametasone' | 'metilprednisolone' | 'idrocortisone' | 'altro';

export interface SteroidInfo {
  active: boolean;
  drug: SteroidDrug;
  doseMg: number;
  frequency: 'mattina' | 'frazionata' | 'sera';
}

export type HomeMedicationId =
  | 'metformina'
  | 'sglt2i'
  | 'sulfonilurea'
  | 'repaglinide'
  | 'glp1_ra'
  | 'dpp4i'
  | 'pioglitazone'
  | 'acarbosio';

export interface PatientProfile {
  id: string;
  bedOrName: string;
  department: string;
  age: number;
  gender: 'M' | 'F';
  weightKg: number;
  heightCm: number;
  diabetesType: DiabetesType;
  insulinExperience: InsulinExperience;
  homeTDD?: number; // Se già in insulina
  egfr: number; // mL/min/1.73m²
  creatinine?: number; // mg/dL
  clinicalSetting: ClinicalSetting;
  nutrition: NutritionDetails;
  steroids: SteroidInfo;
  admissionGlucose: number; // mg/dL
  hba1c?: number; // %
  homeMedications: HomeMedicationId[];
  notes?: string;
  updatedAt: string;
}

export interface ScheduledDoseItem {
  time: string; // e.g. "Ore 08:00", "Ore 06:00", "Sacca NPT h24"
  label: string; // e.g. "Colazione", "Copertura Enterale (1/4)", "Insulina in Sacca NPT"
  dose: number; // Units
  route: 's.c.' | 'e.v. in sacca NPT' | 'e.v. continua';
  drugType: string; // e.g. "Analogo Rapido (Aspart/Lispro)", "Insulina Umana Regolare"
  instructions: string; // e.g. "Somministrare prima del pasto", "Iniettare nella sacca prima dell'avvio"
}

export interface SpecialNutritionProtocol {
  title: string;
  summary: string;
  safetyRule: string; // e.g. "In caso di interruzione improvvisa della nutrizione: avviare Glucosata 10% ev alla stessa velocità"
  bagInstructions?: string; // Dettagli per NPT
  monitoring: string; // e.g. "Glicemia capillare ogni 4-6 ore"
  titrationRule: string; // e.g. "Aggiungere il 100% dell'insulina correttiva nella sacca del giorno dopo"
}

export interface InsulinRegimen {
  tdd: number; // Total Daily Dose in Units
  factorUsed: number; // U/kg
  basalDose: number; // Units
  basalPercentage: number; // e.g. 50%
  bolusTotalDose: number; // Units
  breakfastBolus: number; // Units
  lunchBolus: number; // Units
  dinnerBolus: number; // Units
  scheduledDoses: ScheduledDoseItem[];
  nutritionProtocol?: SpecialNutritionProtocol;
  basalTiming: string; // e.g. "Ore 22:00" o "Ore 08:00"
  recommendedBasalType: string; // Glargina U100/U300, Degludec, NPH
  recommendedBolusType: string; // Aspart, Lispro, Glulisina, Regolare
  isf: number; // Insulin Sensitivity Factor (mg/dL per 1 Unit) - 1800 rule
  isfRegular: number; // 1500 rule
  icr: number; // Insulin to Carb Ratio (g CHO per 1 Unit) - 500 rule
  targetGlucose: number; // Target medio, es. 140 mg/dL
  rationale: string[];
  alerts: string[];
}

export interface CorrectionStep {
  glucoseRange: string;
  minGlucose: number;
  maxGlucose: number;
  extraUnits: number;
  actionNote: string;
}

export interface MedicationAction {
  id: HomeMedicationId;
  name: string;
  commercialExamples: string;
  action: 'SOSPENDERE' | 'SOSPENDERE_CONDIZIONATO' | 'MANTENIBILE' | 'MONITORARE';
  severity: 'danger' | 'warning' | 'success' | 'info';
  clinicalRationale: string;
  resumptionCriteria: string;
}

export interface DailyGlucoseLog {
  id: string;
  date: string;
  fasting: number;
  preLunch: number;
  postLunch?: number;
  preDinner: number;
  postDinner?: number;
  bedtime: number;
  night3am?: number;
  hypoEvents: number; // Count of <70 episodes
  notes?: string;
}

export interface TitrationRecommendation {
  basalChange: number; // e.g. +2, -4 Units or percentage
  bolusChanges: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  overallAdvice: string;
  urgency: 'routine' | 'warning' | 'critical';
}
