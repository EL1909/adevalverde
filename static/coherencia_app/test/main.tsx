
console.log("main.tsx loading started");
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ArrowLeft, RefreshCw, User, Shield, Sparkles, Gem, Quote, 
  ShieldCheck, UserCheck, ArrowRight, Target, Circle
} from 'lucide-react';

// --- TYPES ---
export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export interface Option {
  id: OptionLetter;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  imageUrl?: string;
  options: Option[];
}

export interface Scores {
  A: number;
  B: number;
  C: number;
  D: number;
}

export type ResultType = 'PRISIONERO' | 'SITIADO' | 'PURIFICACION' | 'SOBERANO' | 'EMPATE';

export interface ResultDetail {
  title: string;
  subtitle: string;
  description: string[];
  ctaText: string;
  ctaUrl: string;
  image: string;
}

// --- CONSTANTS ---
export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "¿Qué te dice tu insomnio a las 3:00 AM?",
    imageUrl: "/static/coherencia_app/images/test1.jpeg",
    options: [
      { id: 'A', text: "Es pánico puro." },
      { id: 'B', text: "Es una carga de responsabilidad que no es mía." },
      { id: 'C', text: "Es un vacío que no sé llenar." },
      { id: 'D', text: "Es un llamado al silencio creativo." }
    ]
  },
  {
    id: 2,
    text: "Cuando tomas una decisión, ¿de quién es la voz que aprueba?",
    imageUrl: "/static/coherencia_app/images/test2.jpeg",
    options: [
      { id: 'A', text: "El miedo al castigo." },
      { id: 'B', text: "Una figura externa que me controla." },
      { id: 'C', text: "La lealtad a mi pasado." },
      { id: 'D', text: "Mi propia soberanía en Dios." }
    ]
  },
  {
    id: 3,
    text: "¿Qué haces cuando sientes que tu vida no te pertenece?",
    imageUrl: "/static/coherencia_app/images/test3.jpeg",
    options: [
      { id: 'A', text: "Me paralizo y espero que pase." },
      { id: 'B', text: "Busco culpables externos." },
      { id: 'C', text: "Intento recordar quién era antes." },
      { id: 'D', text: "Reclamo mi territorio con acción consciente." }
    ]
  },
  {
    id: 4,
    text: "¿Cómo reaccionas ante el dolor emocional profundo?",
    imageUrl: "/static/coherencia_app/images/test4.jpeg",
    options: [
      { id: 'A', text: "Lo evito a toda costa, me aterra." },
      { id: 'B', text: "Lo proyecto en otros para no sentirlo." },
      { id: 'C', text: "Lo acepto pero no sé qué hacer con él." },
      { id: 'D', text: "Lo uso como combustible para mi transformación." }
    ]
  },
  {
    id: 5,
    text: "¿Qué significa para ti el concepto de 'Merecimiento'?",
    imageUrl: "/static/coherencia_app/images/test5.jpg",
    options: [
      { id: 'A', text: "No me siento merecedor de nada bueno." },
      { id: 'B', text: "Debo ganarme todo con esfuerzo extremo." },
      { id: 'C', text: "Sé que merezco, pero no sé cómo recibirlo." },
      { id: 'D', text: "Habito mi merecimiento divino sin culpa." }
    ]
  },
  {
    id: 6,
    text: "¿Cuál es tu relación con el silencio?",
    imageUrl: "/static/coherencia_app/images/test6.jpeg",
    options: [
      { id: 'A', text: "Me aterra, lo lleno con ruido constante." },
      { id: 'B', text: "Lo evito porque me confronta." },
      { id: 'C', text: "Lo busco pero no sé habitarlo." },
      { id: 'D', text: "Es mi hogar, mi fuente de poder." }
    ]
  },
  {
    id: 7,
    text: "¿Cómo describes tu relación con el dinero?",
    imageUrl: "/static/coherencia_app/images/test7.jpg",
    options: [
      { id: 'A', text: "Es una fuente constante de ansiedad." },
      { id: 'B', text: "Siento que nunca es suficiente, sin importar cuánto tenga." },
      { id: 'C', text: "Estoy aprendiendo a verlo como energía neutra." },
      { id: 'D', text: "Fluye hacia mí porque gobierno mi abundancia." }
    ]
  },
  {
    id: 8,
    text: "¿Qué haces cuando alguien intenta controlar tu voluntad?",
    imageUrl: "/static/coherencia_app/images/test8.jpg",
    options: [
      { id: 'A', text: "Me someto para evitar conflicto." },
      { id: 'B', text: "Reacciono con rabia pero no logro liberarme." },
      { id: 'C', text: "Identifico el patrón pero aún cedo terreno." },
      { id: 'D', text: "Establezco límites desde mi soberanía." }
    ]
  },
  {
    id: 9,
    text: "¿Cuál es tu mayor miedo existencial?",
    imageUrl: "/static/coherencia_app/images/test9.jpeg",
    options: [
      { id: 'A', text: "Que mi vida no tenga sentido." },
      { id: 'B', text: "Que nunca sea suficiente para los demás." },
      { id: 'C', text: "Que mi dolor haya sido en vano." },
      { id: 'D', text: "Ya no tengo miedo, tengo propósito." }
    ]
  },
  {
    id: 10,
    text: "¿Cómo te relacionas con tu cuerpo?",
    imageUrl: "/static/coherencia_app/images/test10.jpg",
    options: [
      { id: 'A', text: "Lo veo como un enemigo que me traiciona." },
      { id: 'B', text: "Lo uso hasta agotarlo, es una herramienta." },
      { id: 'C', text: "Estoy aprendiendo a escucharlo." },
      { id: 'D', text: "Es mi templo, lo honro y lo cuido." }
    ]
  },
  {
    id: 11,
    text: "¿Qué haces cuando sientes que has perdido tu identidad?",
    imageUrl: "/static/coherencia_app/images/test11.jpg",
    options: [
      { id: 'A', text: "Entro en crisis total." },
      { id: 'B', text: "Busco desesperadamente respuestas en otros." },
      { id: 'C', text: "Acepto que estoy en proceso de redefinición." },
      { id: 'D', text: "Sé que mi identidad está sellada en lo divino." }
    ]
  },
  {
    id: 12,
    text: "¿Cuál es tu relación con el concepto de 'Dios'?",
    imageUrl: "/static/coherencia_app/images/test12.jpg",
    options: [
      { id: 'A', text: "Es un juez que me castiga." },
      { id: 'B', text: "Es una idea abstracta sin conexión real." },
      { id: 'C', text: "Estoy reconstruyendo mi fe desde cero." },
      { id: 'D', text: "Es mi fuente, mi origen, mi gobierno interno." }
    ]
  }
];

export const RESULTS: Record<ResultType, ResultDetail> = {
  PRISIONERO: {
    title: "ESTADO: SUPERVIVENCIA",
    subtitle: "EL PRISIONERO",
    description: [
      "Tu cansancio no es debilidad, es el testimonio de cuánto has intentado sostener por tu cuenta. Tu alma ha decidido que ya no necesitas luchar para sobrevivir.",
      "EL ESTADO: Tu sistema nervioso se encuentra actualmente colapsado. Te encuentras habitando un estado de 'pánico constante', donde cada decisión es percibida como una amenaza a tu seguridad.",
      "MODO DE VIDA: Estás intentando 'apagar incendios con las manos vacías'. Tu falta de energía no es física, sino una crisis profunda de coherencia interna.",
      "PRIORIDAD: Has perdido el acceso a tu centro. El objetivo inmediato es reclamar tu derecho a la paz antes de intentar cualquier otro proceso de autodescubrimiento."
    ],
    ctaText: "SÍ, RECLAMO MI DERECHO A LA PAZ",
    ctaUrl: "https://adelavalverde.info/store/products/19/",
    image: "/static/coherencia_app/images/prisionero.jpg"      
  },
  SITIADO: {
    title: "ESTADO: INTERVENCIÓN",
    subtitle: "EL SITIADO",
    description: [
      "Haber identificado las voces ajenas es el primer acto de libertad. No estás perdido; simplemente has estado cuidando un territorio que otros intentaron reclamar.",
      "EL DIAGNÓSTICO: Estás viviendo la vida de alguien más. Tu voluntad ha sido 'secuestrada' o 'sitiada' por influencias externas (padres, pareja, religión) que dictan tu camino.",
      "EL INVASOR: Te describes como un territorio que ha sido ocupado. Sabes que algo está mal, pero te sientes impotente para expulsar esa voz que gobierna desde adentro.",
      "CIERRE DE ESPERANZA: Reconocer el muro es el primer paso para demolerlo. Tu voluntad está regresando a casa. Es momento de pasar de ser 'víctima' a ser 'estratega'."
    ],
    ctaText: "SÍ, RECLAMO EL MAPA DE MIS MUROS",
    ctaUrl: "https://adelavalverde.info/store/products/15/",
    image: "/static/coherencia_app/images/sitiado.jpg"
  },
  PURIFICACION: {
    title: "ESTADO: TRANSICIÓN",
    subtitle: "LA PURIFICACIÓN",
    description: [
      "El fuego que sientes ahora no ha venido a consumirte, sino a revelar el oro que siempre ha estado debajo de las estructuras que ya no necesitas.",
      "LA ALQUIMIA: Has realizado el arduo trabajo de identificar y derribar lo ajeno. Ahora te encuentras en la fase de la 'Alquimia Sagrada', donde el dolor te moldee.",
      "CAÍDA DE DEFENSAS: Los muros han caído, dejándote en una posición de vulnerabilidad sagrada. Es el momento de limpiar lo que quedó dentro de esas estructuras.",
      "GIMNASIO DE SOBERANOS: Este estado es el puente necesario antes de habitar plenamente tu territorio. Es el espacio donde se construye la soberanía real."
    ],
    ctaText: "SÍ, RECLAMO EL MISTERIO DE LA SAL",
    ctaUrl: "https://adelavalverde.info/store/products/6/",
    image: "/static/coherencia_app/images/purificacion.jpeg"
  },
  SOBERANO: {
    title: "ESTADO: GOBIERNO",
    subtitle: "EL SOBERANO",
    description: [
      "¡Felicidades! Haber obtenido este resultado indica que has logrado silenciar el ruido externo y has recuperado el mando de tu propia voluntad.",
      "RECLAMO DE VOZ: Has regresado a tu centro. El desafío ahora es permitirte recibir la abundancia del Origen sin pedir perdón por tu paz. Tu soberanía es la roca para otros.",
      "EL RETO: Tu fuente de autoridad es interna. Ya no buscas respuestas en gurús ni actúas por miedo. Sin embargo, el ego intentará reinstalar la culpa mediante el autosabotaje.",
      "HOJA DE RUTA: La 'leche espiritual' básica ya no es suficiente. Necesitas herramientas de sellado y expansión para consolidar tu gobierno sobre roca firme."
    ],
    ctaText: "SÍ, RECLAMO MI MERECIMIENTO DIVINO",
    ctaUrl: "https://adelavalverde.info/store/products/8/",
    image: "/static/coherencia_app/images/soberano.jpeg"
  },
  EMPATE: {
    title: "ESTADO: FRAGMENTACIÓN",
    subtitle: "EL EMPATE (TRANSICIÓN CRÍTICA)",
    description: [
      "Un empate no es un error estadístico, sino un síntoma de fragmentación. Tu voluntad está siendo tironeada por dos fuerzas opuestas, generando incertidumbre espiritual.",
      "SIGNIFICADO ESPECÍFICO: Si es A y B, hay una urgencia de intervención por colapso. Si es B y C, estás en un 'parto espiritual' doloroso. Si es C y D, estás a un paso de la soberanía.",
      "LUCIDEZ RADICAL: Tu subconsciente ha levantado defensas tan complejas que necesitas una 'intervención técnica' externa para desmantelar lo que gobierna tu voluntad.",
      "SOLUCIÓN: El documento es directo: ya no es momento de leer libros por tu cuenta. Reclamar tu Mentoría 1:1 es el refugio para quienes han agotado sus fuerzas."
    ],
    ctaText: "RECLAMAR MI SESIÓN DE MENTORÍA",
    ctaUrl: "https://www.adelavalverde.info/store/products/5/",
    image: "https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=1000&auto=format&fit=crop"
  }
};

// --- COMPONENTS ---

const Intro: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl w-full flex flex-col md:flex-row items-stretch bg-[#F5F2ED] rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
    >
      <div className="md:w-[45%] relative min-h-[400px] md:min-h-[700px]">
        <img 
          src="/static/coherencia_app/images/portada2.jpg" 
          alt="Silence and Wisdom" 
          className="absolute inset-0 w-full h-full object-cover contrast-125 brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2A3A]/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-12 left-12">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 60 }}
            className="h-1 bg-[#C5A059] mb-4"
          />
          <h3 className="font-cinzel text-white text-sm tracking-[0.3em] uppercase">Adela Valverde</h3>
          <p className="font-playfair italic text-white/70 text-lg">El Umbral del Silencio</p>
        </div>
      </div>
      <div className="md:w-[55%] p-10 md:p-20 flex flex-col justify-center bg-[#F5F2ED] text-[#1A2A3A]">
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="h-px w-8 bg-[#C5A059]"></span>
            <span className="font-cinzel text-[#C5A059] text-xs tracking-[0.4em] uppercase">Diagnóstico Profundo</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-cinzel leading-[0.9] mb-8 tracking-tighter">
            ESCÁNER DE <br />
            <span className="italic font-playfair font-normal text-4xl md:text-5xl block mt-2 text-[#C5A059]">la Coherencia Interna</span>
          </h1>
          <div className="space-y-6 mb-12">
            <p className="text-xl font-playfair italic text-[#1A2A3A]/80 leading-relaxed">
              "Para gobernar el territorio externo, primero debes reclamar la soberanía del alma."
            </p>
            <p className="text-sm font-light leading-relaxed max-w-md border-l border-[#C5A059] pl-6 py-2">
              Este proceso de 12 indagaciones ha sido diseñado para mapear los muros de tu castillo interno y revelar quién habita en tu centro.
            </p>
          </div>
          <button
            onClick={onNext}
            className="group relative flex items-center justify-center bg-[#1A2A3A] text-white font-cinzel tracking-[0.2em] px-10 py-6 rounded-none transition-all hover:bg-[#080808]"
          >
            <span className="mr-4">INICIAR INDAGACIÓN</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r border-b border-[#C5A059]"></div>
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l border-t border-[#C5A059]"></div>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const QuestionCard: React.FC<{ question: Question; onSelect: (letter: OptionLetter) => void }> = ({ question, onSelect }) => {
  const hasImage = !!question.imageUrl;

  const shuffledOptions = useMemo(() => {
    return [...question.options].sort(() => Math.random() - 0.5);
  }, [question.id]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className={`w-full bg-[#F5F2ED] shadow-[0_30px_80px_rgba(0,0,0,0.4)] rounded-2xl overflow-hidden flex flex-col ${hasImage ? 'lg:flex-row' : ''} min-h-[500px] border-t-[6px] border-[#C5A059]`}
      >
        {hasImage && (
          <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-0 bg-[#080808]">
            <motion.img 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              src={question.imageUrl} 
              alt="Contexto visual" 
              className="absolute inset-0 w-full h-full object-cover brightness-75 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A2A3A]/60 via-transparent to-transparent"></div>
            <div className="absolute top-8 left-8">
               <span className="font-cinzel text-[#C5A059] text-[10px] tracking-[0.5em] uppercase px-3 py-1 border border-[#C5A059]/30 bg-black/40 backdrop-blur-md">
                 Indagación No. {question.id}
               </span>
            </div>
          </div>
        )}
        <div className={`${hasImage ? 'lg:w-1/2' : 'w-full'} p-8 md:p-14 flex flex-col justify-center`}>
          <div className="mb-10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              className="h-[1px] bg-[#C5A059] mb-6"
            />
            <h2 className="text-2xl md:text-3xl font-cinzel text-[#1A2A3A] leading-snug">
              {question.text}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {shuffledOptions.map((option, idx) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                onClick={() => onSelect(option.id)}
                className="group flex items-center text-left p-5 border border-[#1A2A3A]/10 hover:border-[#C5A059] transition-all duration-500 relative bg-white/30"
              >
                <span className="mr-6 flex items-center justify-center w-8 h-8 font-cinzel text-[10px] border border-[#C5A059] text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                  <Target className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                </span>
                <span className="text-base font-light text-[#1A2A3A] group-hover:translate-x-1 transition-transform duration-500">
                  {option.text}
                </span>
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-1 h-1 bg-[#C5A059] rounded-full"></div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const ResultDisplay: React.FC<{ resultType: ResultType; scores: Scores; onReset: () => void }> = ({ resultType, scores, onReset }) => {
  const detail = RESULTS[resultType];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl w-full"
    >
      <div className="bg-[#080808] border border-[#C5A059]/30 rounded-none overflow-hidden flex flex-col lg:flex-row min-h-[800px]">
        <div className="lg:w-[40%] bg-[#F5F2ED] p-10 md:p-16 text-[#1A2A3A] flex flex-col border-r border-[#C5A059]/20">
          <div className="mb-12">
            <h3 className="font-cinzel text-[#C5A059] text-xs tracking-[0.4em] mb-4">MAPA DE SOBERANÍA</h3>
            <div className="w-12 h-1 bg-[#C5A059]"></div>
          </div>
          <div className="space-y-12 flex-grow">
            {[
              { label: 'PRISIONERO (A)', key: 'A', score: scores.A, icon: ShieldCheck },
              { label: 'SITIADO (B)', key: 'B', score: scores.B, icon: UserCheck },
              { label: 'PURIFICACIÓN (C)', key: 'C', score: scores.C, icon: Gem },
              { label: 'SOBERANO (D)', key: 'D', score: scores.D, icon: Quote }
            ].map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-baseline mb-3">
                  <span className={`font-cinzel text-xs tracking-widest ${
                    (resultType === 'PRISIONERO' && item.key === 'A') || 
                    (resultType === 'SITIADO' && item.key === 'B') || 
                    (resultType === 'PURIFICACION' && item.key === 'C') || 
                    (resultType === 'SOBERANO' && item.key === 'D') ? 'text-[#C5A059]' : 'text-[#1A2A3A]/40'
                  }`}>
                    {item.label}
                  </span>
                  <span className="font-playfair text-xl italic">{Math.round((item.score / 12) * 100)}%</span>
                </div>
                <div className="h-[2px] w-full bg-[#1A2A3A]/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.score / 12) * 100}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + (idx * 0.1) }}
                    className={`h-full ${item.score === Math.max(scores.A, scores.B, scores.C, scores.D) ? 'bg-[#C5A059]' : 'bg-[#1A2A3A]/30'}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-20 p-8 border border-[#C5A059]/40 bg-white/50 backdrop-blur-sm">
            <Quote className="text-[#C5A059] w-6 h-6 mb-4 opacity-50" />
            <p className="font-playfair italic text-lg text-[#1A2A3A]/80 leading-relaxed">
              "Tu coherencia no es una meta, es el suelo sobre el que construyes tu destino."
            </p>
          </div>
        </div>
        <div className="lg:w-[60%] p-10 md:p-20 flex flex-col justify-center bg-gradient-to-br from-[#080808] to-[#121212]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#C5A059]"></div>
              <span className="font-cinzel text-[#C5A059] text-xs tracking-[0.5em] uppercase">{detail.title}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-cinzel text-white mb-10 tracking-tight">
              {detail.subtitle}
            </h2>
            <div className="space-y-6 text-slate-300 text-lg font-light leading-relaxed mb-12 font-inter border-l border-white/5 pl-6">
              {detail.description.map((para, i) => (
                <p key={i} className="hover:text-white transition-colors duration-500">
                  {para}
                </p>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <a
                href={detail.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#C5A059] text-[#080808] px-10 py-6 font-cinzel tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3"
              >
                {detail.ctaText}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button
                onClick={onReset}
                className="group border border-white/20 text-white/50 hover:text-white px-10 py-6 font-cinzel tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-3"
              >
                REINTENTAR INDAGACIÓN
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// --- APP LOGIC ---

type AppState = 'START' | 'INSTRUCTIONS' | 'QUIZ' | 'RESULTS_TRANSITION' | 'RESULTS';

function App() {
  const [state, setState] = useState<AppState>('START');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Scores>({ A: 0, B: 0, C: 0, D: 0 });
  const [selectedResult, setSelectedResult] = useState<ResultType | null>(null);

  const startTest = () => setState('INSTRUCTIONS');
  const beginQuiz = () => setState('QUIZ');

  const handleOptionSelect = (letter: OptionLetter) => {
    setScores(prev => ({
      ...prev,
      [letter]: prev[letter] + 1
    }));

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      calculateFinalResult();
    }
  };

  const calculateFinalResult = () => {
    setState('RESULTS_TRANSITION');
    
    setTimeout(() => {
      setScores(currentScores => {
        const maxVal = Math.max(currentScores.A, currentScores.B, currentScores.C, currentScores.D);
        const candidates = (Object.keys(currentScores) as Array<keyof Scores>).filter(key => currentScores[key] === maxVal);

        if (candidates.length > 1) {
          setSelectedResult('EMPATE');
        } else {
          const winner = candidates[0];
          if (winner === 'A') setSelectedResult('PRISIONERO');
          else if (winner === 'B') setSelectedResult('SITIADO');
          else if (winner === 'C') setSelectedResult('PURIFICACION');
          else if (winner === 'D') setSelectedResult('SOBERANO');
        }
        return currentScores;
      });
      setState('RESULTS');
    }, 2000);
  };

  const reset = () => {
    setState('START');
    setCurrentQuestionIndex(0);
    setScores({ A: 0, B: 0, C: 0, D: 0 });
    setSelectedResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-transparent">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-900/10 blur-[120px] rounded-full"></div>
      </div>

      <AnimatePresence mode="wait">
        {state === 'START' && <Intro key="intro" onNext={startTest} />}

        {state === 'INSTRUCTIONS' && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl w-full bg-[#F5F2ED] rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]"
          >
            <div className="md:w-1/2 relative hidden md:block">
              <img 
                src="/static/coherencia_app/images/proposito.jpg" 
                alt="Introspección" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#1A2A3A]/40 mix-blend-multiply"></div>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-[#1A2A3A]">
              <h2 className="text-3xl md:text-4xl font-cinzel mb-8 tracking-wider uppercase">El Propósito</h2>
              <div className="space-y-6 text-lg font-light leading-relaxed">
                <p>El propósito fundamental del escáner es ubicarte geográficamente en tu proceso espiritual para que dejes de dar palos de ciego.</p>
                <p>Sirve para identificar tu "Estado del Alma", validar tu malestar y romper la negación mediante una honestidad brutal.</p>
                <p className="font-semibold italic">Cada respuesta es una elección de territorio. No pienses, solo siente qué voz está hablando en ti.</p>
              </div>
              <button
                onClick={beginQuiz}
                className="mt-12 bg-[#1A2A3A] text-white px-8 py-4 rounded-md font-cinzel tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
              >
                INICIAR EL ESCÁNER
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {state === 'QUIZ' && (
          <div key="quiz" className="max-w-2xl w-full">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <span className="text-[#C5A059] font-cinzel text-sm tracking-widest uppercase">Indagación</span>
                <h3 className="text-2xl text-white font-cinzel">{currentQuestionIndex + 1} de {QUESTIONS.length}</h3>
              </div>
              <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#C5A059]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>
            <QuestionCard 
              question={QUESTIONS[currentQuestionIndex]} 
              onSelect={handleOptionSelect}
            />
          </div>
        )}

        {state === 'RESULTS_TRANSITION' && (
          <motion.div
            key="transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="mb-8 flex justify-center"
            >
              <RefreshCw className="w-16 h-16 text-[#C5A059] opacity-50" />
            </motion.div>
            <h2 className="text-3xl font-cinzel text-white mb-4 tracking-widest uppercase">Mapeando tu Castillo</h2>
            <p className="text-slate-400 font-light italic">Analizando tu nivel de coherencia y soberanía del alma...</p>
          </motion.div>
        )}

        {state === 'RESULTS' && selectedResult && (
          <ResultDisplay 
            resultType={selectedResult} 
            scores={scores} 
            onReset={reset} 
          />
        )}
      </AnimatePresence>

      <footer className="mt-12 text-slate-500 text-sm tracking-widest uppercase font-light opacity-60">
        Adela Valverde — El Umbral del Silencio
      </footer>
    </div>
  );
}

// --- RENDER ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
