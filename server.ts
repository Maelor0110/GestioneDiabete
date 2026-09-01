import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Gemini clinical assistant endpoint for hospital diabetes inquiries
app.post("/api/gemini/consult", async (req, res) => {
  try {
    const { patientProfile, question } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({
        error: "Servizio di consulto AI non configurato (chiave API non presente). I calcoli matematici e gli algoritmi clinici integrati continuano a funzionare regolarmente.",
      });
    }

    const systemInstruction = `Sei un esperto diabetologo clinico e consulente ospedaliero per medici di reparto.
Il tuo compito è fornire chiarimenti specialistici, indicazioni evidence-based basate sulle Linee Guida ADA (Standards of Care in Hospital) e SID-AMD per la gestione dell'iperglicemia e del diabete nei pazienti adulti ricoverati in ambiente non-critico e semi-intensivo.

Caratteristiche del tuo supporto:
1. Sii chiaro, sintetico, strutturato e orientato alla pratica clinica di reparto.
2. Fornisci razionali per la sospensione dei farmaci orali/non insulinici (es. SGLT2i per chetoacidosi euglicemica/digiuno, Metformina per rischio acidosi lattica con eGFR < 30 o mdc, Sulfoniluree per ipoglicemia prolungata).
3. Suggerisci la gestione di scenari specifici (es. steroidi ad alte dosi come desametasone/prednisone con picco iperglicemico pomeridiano, nutrizione enterale/parenterale NPO, insufficienza renale dialitica o eGFR < 30).
4. Ricorda sempre al medico che i suggerimenti sono un ausilio decisionale e richiedono validazione clinica individuale. Rispondi sempre in lingua italiana professionale.`;

    const prompt = `Dati del paziente ricoverato:
- Età: ${patientProfile.age ?? 'Non specificata'} anni
- Peso: ${patientProfile.weight ?? 'Non specificato'} kg
- Altezza: ${patientProfile.height ?? 'Non specificata'} cm
- Tipo di Diabete: ${patientProfile.diabetesType ?? 'Tipo 2'}
- eGFR / Funzione Renale: ${patientProfile.egfr ? `${patientProfile.egfr} mL/min/1.73m²` : 'Non specificata'} (Creatinina: ${patientProfile.creatinine ?? 'N/D'})
- Terapia Domiciliare: ${patientProfile.homeTherapies?.length ? patientProfile.homeTherapies.join(', ') : 'Nessuna/Naïve'}
- Stato Clinico / Setting: ${patientProfile.clinicalCondition ?? 'Reparto Medico/Chirurgico Standard'}
- Regime Nutrizionale: ${patientProfile.nutritionType ?? 'Pasti standard'}
- Terapia Steroidea in corso: ${patientProfile.steroids?.active ? `${patientProfile.steroids.drug} ${patientProfile.steroids.dose} mg/die` : 'No'}
- Glicemia media/ingresso: ${patientProfile.admissionGlucose ?? 'N/D'} mg/dL, HbA1c: ${patientProfile.hba1c ?? 'N/D'}%

Quesito Clinico del Medico:
"${question}"

Fornisci una risposta clinica puntuale, evidenziando le priorità pratiche per la degenza.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return res.json({
      answer: response.text || "Nessuna risposta generata.",
    });
  } catch (error: any) {
    console.error("Gemini consult error:", error);
    return res.status(500).json({
      error: error.message || "Errore durante l'elaborazione del consulto clinico con AI.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hospital Diabetes Basal-Bolus App listening on port ${PORT}`);
  });
}

startServer();
