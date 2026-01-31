console.log("Coherencia App: main.tsx is starting...");
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  RefreshCw, 
  ArrowRight
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

// ==========================================
// 1. TIPOS (TYPES)
// ==========================================

type AnswerType = 'A' | 'B' | 'C' | 'D';

interface Option {
  id: AnswerType;
  text: string;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface ResultDetail {
  state: string;
  subtitle: string;
  majority: string;
  description: string[];
  cta: string;
  image: string;
  ctaUrl?: string;
}

type AppState = 'HOME' | 'INSTRUCTIONS' | 'PRE_QUESTIONS' | 'QUIZ' | 'RESULTS_INTRO' | 'RESULTS' | 'AI_ANALYSIS' | 'MENTORSHIP';

// ==========================================
// 2. CONSTANTES (CONSTANTS)
// ==========================================

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "1. ¿QUÉ TE DICE TU INSOMNIO A LAS 3:00 AM?",
    options: [
      { id: 'A', text: "Es pánico puro." },
      { id: 'B', text: "Es una carga de responsabilidad que no es mía." },
      { id: 'C', text: "Es un vacío que no sé llenar." },
      { id: 'D', text: "Es un llamado al silencio creativo." }
    ]
  },
  {
    id: 2,
    text: "2. CUANDO TOMAS UNA DECISIÓN, ¿DE QUIÉN ES LA VOZ QUE APRUEBA?",
    options: [
      { id: 'A', text: "El miedo al castigo." },
      { id: 'B', text: "Una figura externa que me controla." },
      { id: 'C', text: "La lealtad a mi pasado." },
      { id: 'D', text: "Mi propia soberanía en Dios." }
    ]
  },
  {
    id: 3,
    text: "3. ¿QUÉ HACES CUANDO SIENTES QUE TU VIDA NO TE PERTENECE?",
    options: [
      { id: 'A', text: "Me paralizo y espero que pase." },
      { id: 'B', text: "Busco culpables externos." },
      { id: 'C', text: "Intento recordar quién era antes." },
      { id: 'D', text: "Reclamo mi territorio con acción consciente." }
    ]
  },
  {
    id: 4,
    text: "4. ¿CÓMO REACCIONAS ANTE EL DOLOR EMOCIONAL PROFUNDO?",
    options: [
      { id: 'A', text: "Lo evito a toda costa, me aterra." },
      { id: 'B', text: "Lo proyectó en otros para no sentirlo." },
      { id: 'C', text: "Lo acepto pero no sé qué hacer con él." },
      { id: 'D', text: "Lo uso como combustible para mi transformación." }
    ]
  },
  {
    id: 5,
    text: "5. ¿QUÉ SIGNIFICA PARA TI EL CONCEPTO DE \"MERICIMIENTO\"?",
    options: [
      { id: 'A', text: "No me siento merecedor de nada bueno." },
      { id: 'B', text: "Debo ganarme todo con esfuerzo extremo." },
      { id: 'C', text: "Sé que merezco, pero no sé cómo recibirlo." },
      { id: 'D', text: "Habito mi merecimiento divino sin culpa." }
    ]
  },
  {
    id: 6,
    text: "6. ¿CUÁL ES TU RELACIÓN CON EL SILENCIO?",
    options: [
      { id: 'A', text: "Me aterra, lo lleno con ruido constante." },
      { id: 'B', text: "Lo evito porque me confronta." },
      { id: 'C', text: "Lo busco pero no sé habitarlo." },
      { id: 'D', text: "Es mi hogar, mi fuente de poder." }
    ]
  },
  {
    id: 7,
    text: "7. ¿CÓMO DESCRIBES TU RELACIÓN CON EL DINERO?",
    options: [
      { id: 'A', text: "Es una fuente constante de ansiedad." },
      { id: 'B', text: "Siento que nunca es suficiente, sin importar cuánto tenga." },
      { id: 'C', text: "Estoy aprendiendo a verlo como energía neutra." },
      { id: 'D', text: "Fluye hacia mí porque gobierno mi abundancia." }
    ]
  },
  {
    id: 8,
    text: "8. ¿QUÉ HACES CUANDO ALGUIEN INTENTA CONTROLAR TU VOLUNTAD?",
    options: [
      { id: 'A', text: "Me someto para evitar conflicto." },
      { id: 'B', text: "Reacciono con rabia pero no logro liberarme." },
      { id: 'C', text: "Identifico el patrón pero aún cedo terreno." },
      { id: 'D', text: "Establezco límites desde mi soberanía." }
    ]
  },
  {
    id: 9,
    text: "9. ¿CUÁL ES TU MAYOR MIEDO EXISTENCIAL?",
    options: [
      { id: 'A', text: "Que mi vida no tenga sentido." },
      { id: 'B', text: "Que nunca sea suficiente para los demás." },
      { id: 'C', text: "Que mi dolor haya sido en vano." },
      { id: 'D', text: "Ya no tengo miedo, tengo propósito." }
    ]
  },
  {
    id: 10,
    text: "10. ¿CÓMO TE RELACIONAS CON TU CUERPO?",
    options: [
      { id: 'A', text: "Lo veo como un enemigo que me traiciona." },
      { id: 'B', text: "Lo uso hasta agotarlo, es una herramienta." },
      { id: 'C', text: "Estoy aprendiendo a escucharlo." },
      { id: 'D', text: "Es mi templo, lo honro y lo cuido." }
    ]
  },
  {
    id: 11,
    text: "11. ¿QUÉ HACES CUANDO SIENTES QUE HAS PERDIDO TU IDENTIDAD?",
    options: [
      { id: 'A', text: "Entro en crisis total." },
      { id: 'B', text: "Busco desesperadamente respuestas en otros." },
      { id: 'C', text: "Acepto que estoy en proceso de redefinición." },
      { id: 'D', text: "Sé que mi identidad está sellada en lo divino." }
    ]
  },
  {
    id: 12,
    text: "12. ¿CUÁL ES TU RELACIÓN CON EL CONCEPTO DE \"DIOS\"?",
    options: [
      { id: 'A', text: "Es un juez que me castiga." },
      { id: 'B', text: "Es una idea abstracta sin conexión real." },
      { id: 'C', text: "Estoy reconstruyendo mi fe desde cero." },
      { id: 'D', text: "Es mi fuente, mi origen, mi gobierno interno." }
    ]
  }
];

const RESULTS_DETAILS: Record<string, ResultDetail> = {
  A: {
    state: "ESTADO DE SUPERVIVENCIA",
    subtitle: "EL PRISIONERO",
    majority: "(MAYORÍA DE A)",
    description: [
      "Tu sistema nervioso ha colapsado. Estás en modo supervivencia, intentando apagar incendios con las manos vacías. Tu agotamiento no es falta de energía, es una crisis de coherencia.",
      "Vives en el pánico constante, donde cada decisión se siente como una amenaza. Tu cuerpo grita, pero no sabes escucharlo. Has perdido el acceso a tu centro.",
      "No necesitas más información. Necesitas una Intervención Divina que restaure tu sistema desde la raíz."
    ],
    cta: "SÍ, RECLAMO MI DERECHO A LA PAZ",
    ctaUrl: "/store/cart/add-to-cart-via-link/19/",
    image: "https://cdn.gamma.app/1t9xwjq0t5abiv2/generated-images/MonbnVn8Gb_ygv7I3oiB1.png"
  },
  B: {
    state: "ESTADO DE INTERVENCIÓN",
    subtitle: "EL SITIADO",
    majority: "(MAYORÍA DE B)",
    description: [
      "Estás viviendo la vida de alguien más. Tu voluntad está secuestrada por figuras externas.",
      "Identificar al invasor es tu primer acto de guerra.",
      "Sabes que algo no está bien, pero no logras nombrar qué. Hay voces externas que gobiernan tus decisiones. Tu territorio ha sido ocupado y necesitas recuperarlo.",
      "El mapa de tus muros es el primer paso hacia tu liberación. Sin él, seguirás peleando batallas equivocadas."
    ],
    cta: "SÍ, RECLAMO EL MAPA DE MIS MUROS",
    ctaUrl: "/store/cart/add-to-cart-via-link/15/",
    image: "https://cdn.gamma.app/1t9xwjq0t5abiv2/7a291f95d2c144158b8211d56308bf46/original/image-3.png"
  },
  C: {
    state: "ESTADO DE TRANSICIÓN",
    subtitle: "La Purificación",
    majority: "(mayoría c)",
    description: [
      "Tus muros han caído, pero el agua de tu fuente sigue turbia. Estás listo para dejar que el dolor te moldee. No busques parches, busca la purificación de la sal.",
      "Has hecho el trabajo de identificar y derribar lo que no era tuyo. Ahora viene la parte más profunda: limpiar lo que quedó dentro. El dolor ya no te paraliza, te transforma.",
      "Este es el estado de la alquimia sagrada que prepara Una Vasija Nueva. Aquí se forjan los soberanos."
    ],
    cta: "SÍ, RECLAMO EL MISTERIO DE LA SAL",
    ctaUrl: "/store/cart/add-to-cart-via-link/6/",
    image: "https://cdn.gamma.app/1t9xwjq0t5abiv2/8fd683ffc9334ee09e580a7e3d331a07/original/BO4866_1.jpg"
  },
  D: {
    state: "ESTADO DE GOBIERNO",
    subtitle: "EL SOBERANO",
    majority: "(MAYORÍA D)",
    description: [
      "Habitas el Silencio, pero aún no sabes cómo administrar la abundancia que emana de él. Es momento de sellar tu identidad y gobernar tu territorio sin intermediarios.",
      "Has llegado a tu centro. Conoces tu origen. Tu voluntad es tuya. Pero ahora viene el desafío más grande: sostener tu soberanía en medio de la abundancia sin culpa, sin autosabotaje.",
      "Este es el nivel donde se sella el merecimiento divino. Aquí gobiernas desde tu esencia y eres pilar fundamental para otros."
    ],
    cta: "SÍ, RECLAMO MI MERECIMIENTO DIVINO",
    ctaUrl: "/store/cart/add-to-cart-via-link/8/",
    image: "https://cdn.gamma.app/1t9xwjq0t5abiv2/7dfb748a774b49baacd790592f35b824/original/_image_generation_-_action_input__-_Realistic-100-cinematic-photo-of-a-serene-and-powerful-woman-hair-black-long-standing-from-behind-looking-towards-a-vast-golden-portal-of-light-in-a-universe-textured-stone-s.jpg"
  },
  EMPATE: {
    state: "LUCIDEZ RADICAL",
    subtitle: "DESCIFRANDO TU DIAGNÓSTICO",
    majority: "SI TIENES EMPATE",
    description: [
      "Si tu resultado es un empate entre dos letras, o si al leer tu diagnóstico sientes un quiebre total, no busques libros: reclama una Intervención Definitiva.",
      "Tu estado requiere un mapa personalizado que solo la Mentoría 1:1 puede entregarte. No intentes adivinar por cuál libro empezar. Tu estado de confusión es la señal clara de que necesitas:",
      "INTERVENCIÓN DIVINA",
      "Tu resultado no es lo que eres, es el lugar donde te has estacionado."
    ],
    cta: "SÍ, RECLAMO MI INTERVENCIÓN DIVINA",
    ctaUrl: "/store/cart/add-to-cart-via-link/5/",
    image: "https://cdn.gamma.app/1t9xwjq0t5abiv2/generated-images/sdLRWr3tgxGnju8-Ma0Bq.png"
  }
};

const IMAGENES_GLOBALES = {
  PORTADA: "https://cdn.gamma.app/1t9xwjq0t5abiv2/uploaded-images/TAqUN2Ma5gp3G-wn3vPjf.png",
  INSTRUCCIONES: "https://cdn.gamma.app/1t9xwjq0t5abiv2/3928db7bb2bd4832b989717bfc3bd3ab/original/RETRAT_3.jpg",
  PRE_QUIZ: "https://cdn.gamma.app/1t9xwjq0t5abiv2/generated-images/WR-m4Da2aCmRBWxXR2H2I.png",
  RESULTADOS_INTRO: "https://cdn.gamma.app/1t9xwjq0t5abiv2/a04370c37a5f4b4c8c8fb7e51313f1a3/original/Generated-Image-November-27-2025---11_18AM.png",
  MENTORIA: "https://cdn.gamma.app/1t9xwjq0t5abiv2/generated-images/8litVOdXDNYjXMx-1THHd.png",
};

const IMAGENES_PREGUNTAS = [
  "https://cdn.gamma.app/1t9xwjq0t5abiv2/generated-images/x8Elu_uv4v60QPisajobr.png",
  "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:500/https://cdn.gamma.app/1t9xwjq0t5abiv2/e699557d80594bad9ac3f2dc9c96d7af/original/MAGICC_1.jpg",
  "https://cdn.gamma.app/1t9xwjq0t5abiv2/15b58908b5ab4c1a85e7e2c5b858ebb4/original/0a957e08-4f71-44c0-b13f-186aae2ed197.png",
  "https://cdn.gamma.app/1t9xwjq0t5abiv2/d3babd756f5541709762e4171cce1176/original/Generated-Image-December-13-2025---7_40AM-1.png",
  "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:500/https://cdn.gamma.app/1t9xwjq0t5abiv2/3ef43bebad99495a8d11db2753054bad/original/Generated-Image-December-19-2025---12_23PM.png",
  "https://cdn.gamma.app/1t9xwjq0t5abiv2/3a66ba44e12c4d04b97829f981a11529/original/CLOSE-_2.jpg",
  "https://cdn.gamma.app/1t9xwjq0t5abiv2/generated-images/D9V0hYr3dhyVQiPK4QJOc.png",
  "https://cdn.gamma.app/1t9xwjq0t5abiv2/generated-images/BuUFXfrdF_OR_h-Qr67DI.png",
  "https://cdn.gamma.app/1t9xwjq0t5abiv2/d5fca279ab1840049a9201c0c7e8f174/original/DINNER_1.jpg",
  "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:500/https://cdn.gamma.app/1t9xwjq0t5abiv2/db7c2913d5044715976002669f057e36/original/QIbp0cDUdCu1Jco9nBeCC.png",
  "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:500/https://cdn.gamma.app/1t9xwjq0t5abiv2/73757aa5036349309c71d2a7d481b502/original/ChatGPT-Image-2-ene-2026-09_30_38.png",
  "https://imgproxy.gamma.app/resize/quality:80/resizing_type:fit/width:500/https://cdn.gamma.app/1t9xwjq0t5abiv2/c313bded1cbe46c48cde743d3d25ac60/original/Conceptual-photographic-art.-A-beautifully-set-dinner-table-in-a-luxurious-sun-drenched-garden.-Elegant-people-are-seated-laughing-but-their-heads-are-replaced-by-floating-ornate-birdcages.-Inside-the-cages-sma.jpg",
];

// ==========================================
// 3. COMPONENTE PRINCIPAL (APP)
// ==========================================

const getPersonalizedAnalysis = async (state: string, answers: string[], resultSubtitle: string) => {
  try {
    const apiKey = (window as any).GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key not found. Using fallback message.");
      return "En el silencio de la incertidumbre, tu verdad espera ser reclamada.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Actúa como una mentora espiritual y experta en coherencia interna. 
    El usuario ha completado un diagnóstico llamado "El Escáner de la Coherencia". 
    Su resultado predominante es: ${state} (${resultSubtitle}).
    Sus respuestas fueron: ${answers.join(', ')}.
    
    Escribe un mensaje corto (máximo 2-3 frases), profundo, poético y confrontador que le ayude a entender su momento actual desde el "Silencio". 
    No uses introducciones ni conclusiones, solo el mensaje directo. Usa un tono místico pero directo.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().replace(/"/g, '').trim() || "En el silencio de la incertidumbre, tu verdad espera ser reclamada.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Tu centro irradia una frecuencia de búsqueda. Los muros de tu castillo espiritual están listos para ser redefinidos.";
  }
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerType[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const quizQuestions = useMemo(() => {
    return [...QUESTIONS];
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [appState, currentQuestionIndex]);

  const handleStart = () => setAppState('INSTRUCTIONS');
  const handleNextToPreQuiz = () => setAppState('PRE_QUESTIONS');
  const handleStartQuiz = () => setAppState('QUIZ');

  const handleAnswer = (type: AnswerType) => {
    const newAnswers = [...answers, type];
    setAnswers(newAnswers);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      triggerAnalysis(newAnswers);
    }
  };

  const calculateResultsKey = (currentAnswers: AnswerType[]) => {
    if (currentAnswers.length === 0) return 'A';
    const counts = currentAnswers.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number));
    
    if (sorted.length > 1 && (sorted[0][1] as number) === (sorted[1][1] as number)) {
      return 'EMPATE';
    }
    return sorted[0][0];
  };

  const triggerAnalysis = async (finalAnswers: AnswerType[]) => {
    setAppState('RESULTS_INTRO');
    setIsAnalyzing(true);
    
    const dominantStateKey = calculateResultsKey(finalAnswers);
    const resultData = RESULTS_DETAILS[dominantStateKey] || RESULTS_DETAILS['EMPATE'];
    
    try {
      const insight = await getPersonalizedAnalysis(resultData.state, finalAnswers, resultData.subtitle);
      setAiAnalysis(insight);
    } catch (e) {
      setAiAnalysis("El silencio guarda tu verdad. Recala en tu centro.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setAiAnalysis(null);
    setAppState('HOME');
  };

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  } as const;

  const currentResultKey = calculateResultsKey(answers);
  const currentResult = RESULTS_DETAILS[currentResultKey] || RESULTS_DETAILS['EMPATE'];
  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return [...currentQuestion.options].sort(() => Math.random() - 0.5);
  }, [currentQuestion?.id]);

  const currentQuizImage = IMAGENES_PREGUNTAS[currentQuestionIndex] || IMAGENES_GLOBALES.PORTADA;

  return (
    <div className="min-h-screen-safe w-full flex items-center justify-center p-4 md:p-8 overflow-hidden relative selection:bg-[#ae8625] selection:text-black bg-[#0d0d09]">
      
      {/* BRANDING PERSISTENTE */}
      <div className="fixed top-8 left-8 z-50 pointer-events-none opacity-40">
        <p className="font-alexandria font-bold text-[8px] md:text-[10px] tracking-[1.2em] uppercase text-white">ADELA VALVERDE</p>
      </div>
      <div className="fixed bottom-8 right-8 z-50 pointer-events-none opacity-20">
        <p className="font-alexandria font-bold text-[8px] md:text-[10px] tracking-[0.8em] uppercase text-white">COHERENCIA INTERNA</p>
      </div>

      <AnimatePresence mode="wait">
        
        {appState === 'HOME' && (
          <motion.div 
            key="home" {...slideVariants}
            className="slide-container max-w-6xl w-full flex flex-col md:flex-row overflow-hidden border border-gold-start/10"
          >
            <div className="md:w-[55%] h-[350px] md:h-[600px] relative overflow-hidden bg-black">
              <img src={IMAGENES_GLOBALES.PORTADA} className="w-full h-full object-cover scale-105" alt="Portada" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black hidden md:block"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black md:hidden"></div>
            </div>
            <div className="md:w-[45%] p-10 md:p-14 lg:p-20 flex flex-col justify-center bg-black">
              <div className="mb-14 text-left">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-alexandria font-bold tracking-tight text-white uppercase leading-none">EL ESCÁNER</h1>
                <p className="text-xl md:text-2xl lg:text-3xl font-raleway italic font-medium text-gold-gradient tracking-wide mt-3">de la Coherencia</p>
              </div>
              <div className="space-y-4 mb-14 text-left">
                <p className="text-sm md:text-base font-alexandria text-white/40 tracking-[0.2em] font-medium uppercase">NO ES UNA ENCUESTA...</p>
                <p className="text-lg md:text-xl font-alexandria font-bold text-gold-gradient tracking-[0.1em] uppercase">"ES UNA INICIACIÓN"</p>
              </div>
              <button onClick={handleStart} className="bg-gold-gradient text-black px-10 py-6 font-alexandria font-bold tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all group flex items-center justify-between shadow-2xl uppercase text-[10px] md:text-xs w-full max-w-sm">
                <span>COMENZAR EL DIAGNÓSTICO</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {appState === 'INSTRUCTIONS' && (
          <motion.div key="instructions" {...slideVariants} className="slide-container max-w-5xl w-full flex flex-col md:flex-row-reverse overflow-hidden border border-white/5">
            <div className="md:w-1/2 h-[220px] md:h-auto relative">
              <img src={IMAGENES_GLOBALES.INSTRUCCIONES} className="w-full h-full object-cover" alt="Instrucciones" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0d0d09] hidden md:block"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d09] md:hidden"></div>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-[#0d0d09]">
              <h2 className="text-xl md:text-3xl font-alexandria font-bold mb-8 text-gold-gradient tracking-[0.08em] uppercase">INSTRUCCIONES</h2>
              <div className="space-y-4 text-sm md:text-base font-raleway font-light leading-relaxed text-white/90">
                <p>Este test mide el nivel de sitio o soberanía del alma. No es una evaluación superficial de tu personalidad.</p>
                <p>Es un espejo que refleja el estado real de tu coherencia interna: dónde habitas, quién gobierna tu voluntad, y qué tan cerca estás de tu Origen Divino.</p>
                <p>Responde con honestidad brutal. Cada pregunta es una llave que abre una puerta hacia tu verdad más profunda. No hay respuestas correctas o incorrectas, solo grados de Conciencia.</p>
              </div>
              <button onClick={handleNextToPreQuiz} className="mt-10 bg-white text-black px-6 py-4 font-alexandria font-bold tracking-[0.15em] hover:bg-gold-gradient transition-all text-[10px] uppercase flex items-center justify-center self-start">
                Práctica de Autoconocimiento
                <ArrowRight className="w-4 h-4 ml-4" />
              </button>
            </div>
          </motion.div>
        )}

        {appState === 'PRE_QUESTIONS' && (
          <motion.div key="pre-questions" {...slideVariants} className="slide-container max-w-4xl w-full flex flex-col md:flex-row overflow-hidden border border-white/5">
            <div className="md:w-1/2 h-[220px] md:h-auto relative">
              <img src={IMAGENES_GLOBALES.PRE_QUIZ} className="w-full h-full object-cover" alt="Pre-preguntas" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0d0d09] hidden md:block"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d09] md:hidden"></div>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-[#0d0d09]">
              <h2 className="text-xl md:text-3xl font-alexandria font-bold mb-8 text-white tracking-tight uppercase">Las Preguntas de <br /> Indagación</h2>
              <div className="space-y-4 text-sm md:text-base font-raleway font-light leading-relaxed text-white/70">
                <p>Cada una de estas preguntas, confronta una dimensión de tu ser.</p>
                <p>Lee con atención y elige la respuesta que más resuene con tu verdad actual, no con la que desearías que fuera cierta.</p>
                <p className="font-bold italic text-gold-gradient mt-4 underline decoration-gold-start/30">Sé brutalmente honesto contigo mismo.</p>
              </div>
              <button onClick={handleStartQuiz} className="mt-10 bg-gold-gradient text-black px-10 py-5 font-alexandria font-bold tracking-[0.15em] hover:bg-white transition-all shadow-lg uppercase text-[10px]">SIGUIENTE</button>
            </div>
          </motion.div>
        )}

        {appState === 'QUIZ' && currentQuestion && (
          <motion.div key="quiz" {...slideVariants} className="slide-container max-w-5xl w-full flex flex-col md:flex-row overflow-hidden border border-white/5 min-h-[500px]">
            <div className="md:w-[35%] h-[200px] md:h-auto relative overflow-hidden bg-black/50">
              <motion.img key={currentQuestionIndex} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} src={currentQuizImage} className="w-full h-full object-cover" alt={`Pregunta ${currentQuestionIndex + 1}`} />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                 <div className="w-full mb-1">
                    <p className="font-alexandria text-[10px] tracking-[0.3em] text-gold-mid uppercase font-bold mb-3 drop-shadow-md">Indagación {currentQuestionIndex + 1} / {quizQuestions.length}</p>
                    <div className="w-full h-[2px] bg-white/20 relative rounded-full overflow-hidden">
                        <motion.div className="absolute top-0 left-0 h-full bg-gold-gradient" animate={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }} />
                    </div>
                 </div>
              </div>
            </div>
            <div className="md:w-[65%] p-8 md:p-12 lg:p-16 flex flex-col bg-[#0d0d09]/80 backdrop-blur-md">
              <motion.h2 key={currentQuestion.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-xl lg:text-2xl font-alexandria font-medium mb-10 text-white leading-snug">{currentQuestion.text}</motion.h2>
              <div className="grid grid-cols-1 gap-2">
                {shuffledOptions.map((option) => (
                  <motion.button whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.03)" }} key={option.id} onClick={() => handleAnswer(option.id)} className="flex items-center p-4 md:p-6 text-left border-l border-white/5 bg-white/[0.02] transition-all group">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center border border-gold-start/40 rounded-full mr-6 group-hover:bg-gold-gradient transition-all duration-300">
                      <div className="w-1.5 h-1.5 bg-gold-mid rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
                    </div>
                    <span className="text-sm md:text-base font-raleway font-light text-white/80 group-hover:text-white transition-colors tracking-wide">{option.text}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {appState === 'RESULTS_INTRO' && (
          <motion.div key="results-intro" {...slideVariants} className="slide-container max-w-5xl w-full flex flex-col md:flex-row overflow-hidden border border-white/5">
            <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-[#0d0d09]">
              <h2 className="text-xl md:text-3xl font-alexandria font-bold text-white mb-8 tracking-[0.08em] uppercase">TUS RESULTADOS</h2>
              <div className="space-y-4 text-white/70 font-raleway font-light text-sm md:text-base leading-relaxed mb-8">
                <p>Basado en tus respuestas, tu diagnóstico revelará en qué estado de coherencia habitas actualmente.</p>
                <p>Cada estado representa un Nivel de Conciencia y Soberanía del Alma. Estos no son diagnósticos permanentes. Son fotografías de tu momento actual.</p>
                <p>Puedes haber sido Soberano y caído en Prisionero tras una crisis. O estar en Purificación camino a Soberanía. Tu estado de HOY no define quién eres, sino dónde estás parado AHORA.</p>
                <p className="font-alexandria font-bold text-gold-mid tracking-[0.2em] mt-10 uppercase text-lg">Los Cuatro <br /> Estados del Alma</p>
              </div>
              <button disabled={isAnalyzing} onClick={() => setAppState('RESULTS')} className={`bg-gold-gradient text-black px-10 py-5 font-alexandria font-bold tracking-[0.15em] transition-all flex items-center justify-center uppercase text-xs shadow-xl w-fit ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}>
                {isAnalyzing ? 'ANALIZANDO...' : 'VER MI DIAGNÓSTICO'}
                {!isAnalyzing && <ChevronRight className="w-4 h-4 ml-3" />}
              </button>
            </div>
            <div className="md:w-1/2 h-[300px] md:h-auto relative overflow-hidden bg-black">
               <img src={IMAGENES_GLOBALES.RESULTADOS_INTRO} className="w-full h-full object-cover" alt="Resultados" />
               {isAnalyzing && (
                 <div className="absolute inset-0 bg-[#0d0d09]/80 backdrop-blur-md flex flex-col items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="mb-6"><RefreshCw className="w-12 h-12 text-gold-mid" /></motion.div>
                    <p className="font-alexandria font-bold text-xs tracking-[0.5em] text-white uppercase">Sintonizando tu Verdad</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}

        {appState === 'RESULTS' && (
          <motion.div key="results-detail" {...slideVariants} className="slide-container max-w-6xl w-full flex flex-col md:flex-row overflow-hidden border border-white/5 min-h-[550px]">
            <div className="md:w-[40%] relative h-[300px] md:h-auto overflow-hidden bg-black">
              <img src={currentResult.image} className="w-full h-full object-cover" alt={currentResult.subtitle} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d09] via-transparent to-transparent flex flex-col justify-end p-10">
                  <h2 className="text-3xl md:text-5xl font-alexandria font-bold text-white uppercase leading-none tracking-tight">{currentResult.state}</h2>
              </div>
            </div>
            <div className="md:w-[60%] p-8 md:p-16 lg:p-20 flex flex-col justify-center bg-[#0d0d09]/90 backdrop-blur-sm">
              <h3 className="text-2xl md:text-4xl font-alexandria font-bold text-white uppercase mb-4">{currentResult.subtitle}</h3>
              <p className="text-gold-gradient font-alexandria font-bold tracking-[0.3em] text-xs md:text-sm mb-10 border-b border-gold-start/20 pb-4 uppercase">{currentResult.majority}</p>
              <div className="space-y-6 text-sm md:text-base font-raleway font-light leading-relaxed text-white/90 mb-12 max-h-[300px] overflow-y-auto pr-6">
                {currentResult.description.map((para, i) => <p key={i}>{para}</p>)}
              </div>
              <div className="flex flex-col gap-4">
                <a href={currentResult.ctaUrl} className="bg-gold-gradient text-black px-10 py-5 font-alexandria font-bold tracking-[0.15em] hover:scale-105 transition-all text-center text-xs uppercase shadow-2xl flex items-center justify-center rounded">{currentResult.cta}</a>
                <button onClick={() => setAppState('AI_ANALYSIS')} className="text-white/40 font-alexandria font-bold text-[10px] tracking-[0.5em] hover:text-gold-mid transition-all uppercase flex items-center justify-center gap-3 mt-2">
                   OBTENER ANÁLISIS PERSONALIZADO (IA)
                </button>
                <button onClick={reset} className="text-white/20 font-alexandria font-bold text-[10px] tracking-[0.5em] hover:text-gold-mid transition-all uppercase flex items-center justify-center gap-3 mt-6">
                  <RefreshCw className="w-4 h-4" /> REINICIAR DIAGNÓSTICO
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {appState === 'AI_ANALYSIS' && (
          <motion.div key="ai-analysis" {...slideVariants} className="slide-container max-w-4xl w-full bg-[#0d0d09] border border-[#ae8625]/30 p-12 md:p-20 lg:p-24 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-[10px] md:text-xs font-alexandria font-bold tracking-[0.8em] text-gold-mid uppercase mb-16">Mensaje desde el Silencio</h2>
              <div className="space-y-8 text-xl md:text-3xl font-raleway font-light italic leading-relaxed text-white/90 mb-20 px-6">
                 {aiAnalysis ? (aiAnalysis.split('\n\n').map((para, i) => <p key={i}>{para}</p>)) : (
                   <div className="flex flex-col items-center gap-6">
                      <RefreshCw className="w-8 h-8 animate-spin text-gold-mid" />
                      <p className="text-xs font-alexandria tracking-widest text-white/40 uppercase">Sintonizando tu verdad...</p>
                   </div>
                 )}
              </div>
              <button onClick={() => setAppState('MENTORSHIP')} className="bg-gold-gradient text-black px-12 py-6 font-alexandria font-bold tracking-[0.2em] hover:scale-105 transition-all text-xs uppercase shadow-2xl">SIGUIENTE</button>
            </div>
          </motion.div>
        )}

        {appState === 'MENTORSHIP' && (
          <motion.div key="mentorship" {...slideVariants} className="slide-container max-w-6xl w-full flex flex-col md:flex-row-reverse overflow-hidden border border-white/5">
            <div className="md:w-1/2 h-[300px] md:h-auto relative bg-black">
              <img src={IMAGENES_GLOBALES.MENTORIA} className="w-full h-full object-cover" alt="Mentoría" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0d0d09] hidden md:block"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d09] md:hidden"></div>
            </div>
            <div className="md:w-1/2 p-10 md:p-16 lg:p-20 flex flex-col justify-center bg-[#0d0d09]">
              <h2 className="text-2xl md:text-4xl font-alexandria font-bold mb-4 text-white tracking-[0.05em] uppercase leading-tight">EL UMBRAL DEL <br /> SILENCIO</h2>
              <h3 className="text-gold-gradient font-alexandria font-bold mb-10 tracking-[0.1em] text-[10px] md:text-xs uppercase border-b border-gold-start/20 pb-6">LA INTERVENCIÓN DEFINITIVA EN MENTORÍA 1:1</h3>
              <div className="space-y-6 text-sm md:text-base font-raleway font-light leading-relaxed text-white/80 mb-12">
                <p>Si este diagnóstico te confrontó, si reconociste tu estado con claridad brutal, entonces sabes que necesitas más que información. Necesitas una intervención.</p>
                <p>Esta mentoría no es para todos. Es para quienes están listos para el quiebre total, para quienes ya no toleran vivir en la incoherencia, para quienes reclaman su soberanía sin negociación.</p>
                <div className="p-6 border border-gold-mid/10 bg-white/5 text-center mt-6">
                   <p className="text-gold-gradient font-alexandria font-bold tracking-[0.1em] text-[10px] md:text-xs uppercase leading-relaxed">
                     Una sesión. Un mapa. Una llave. $222 dólares que sellan tu compromiso con tu propia transformación.
                   </p>
                </div>
              </div>
              <button className="bg-gold-gradient text-black px-10 py-6 font-alexandria font-bold tracking-[0.2em] hover:scale-105 active:scale-95 transition-all w-full text-xs uppercase shadow-2xl flex items-center justify-center gap-4 group">
                SÍ, RECLAMO MI SESIÓN AHORA
                <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

// ==========================================
// 4. RENDERIZADO (MOUNT)
// ==========================================

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log("Coherencia App: Root element found, initializing React...");
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Coherencia App: CRITICAL - Root element 'root' not found in DOM!");
}
