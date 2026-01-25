
import { Question, ResultType, ResultDetail } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "¿Qué te dice tu insomnio a las 3:00 AM?",
    imageUrl: "https://images.unsplash.com/photo-1509130298739-651801c76e96?q=80&w=1000&auto=format&fit=crop", // Reemplazar con imagen del PDF
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
    imageUrl: "https://images.unsplash.com/photo-1499209974431-9dac3adaf471?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1516589174184-c68524c14ec4?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1493134794382-71d3a094ea05?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1554224155-169641357599?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1515023115689-589c33041d3c?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1000&auto=format&fit=crop",
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
    imageUrl: "https://images.unsplash.com/photo-1501139083538-0139583c060f?q=80&w=1000&auto=format&fit=crop",
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
    title: "ESTADO DE SUPERVIVENCIA",
    subtitle: "EL PRISIONERO",
    description: [
      "Tu sistema nervioso ha colapsado. Estás en modo supervivencia, intentando apagar incendios con las manos vacías. Tu agotamiento no es falta de energía, es una crisis de coherencia.",
      "Vives en el pánico constante, donde cada decisión se siente como una amenaza. Tu cuerpo grita, pero no sabes escucharlo. Has perdido el acceso a tu centro.",
      "No necesitas más información. Necesitas una Intervención Divina que restaure tu sistema desde la raíz."
    ],
    ctaText: "SÍ, RECLAMO MI DERECHO A LA PAZ",
    image: "https://images.unsplash.com/photo-1518131394553-c4e979a06649?q=80&w=1000&auto=format&fit=crop"
  },
  SITIADO: {
    title: "ESTADO DE INTERVENCIÓN",
    subtitle: "EL SITIADO",
    description: [
      "Estás viviendo la vida de alguien más. Tu voluntad está secuestrada por figuras externas.",
      "Identificar al invasor es tu primer acto de guerra. Sabes que algo no está bien, pero no logras nombrar qué.",
      "Hay voces externas que gobiernan tus decisiones. Tu territorio ha sido ocupado y necesitas recuperarlo.",
      "El mapa de tus muros es el primer paso hacia tu liberación. Sin él, seguirás peleando batallas equivocadas."
    ],
    ctaText: "SÍ, RECLAMO EL MAPA DE MIS MUROS",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1000&auto=format&fit=crop"
  },
  PURIFICACION: {
    title: "ESTADO DE TRANSICIÓN",
    subtitle: "LA PURIFICACIÓN",
    description: [
      "Tus muros han caído, pero el agua de tu fuente sigue turbia. Estás listo para dejar que el dolor te moldee.",
      "No busques parches, busca la purificación de la sal. Has hecho el trabajo de identificar y derribar lo que no era tuyo.",
      "Ahora viene la parte más profunda: limpiar lo que quedó dentro. El dolor ya no te paraliza, te transforma.",
      "Este es el estado de la alquimia sagrada que prepara Una Vasija Nueva. Aquí se forjan los soberanos."
    ],
    ctaText: "SÍ, RECLAMO EL MISTERIO DE LA SAL",
    image: "https://images.unsplash.com/photo-1528722828814-77b9b83acf1d?q=80&w=1000&auto=format&fit=crop"
  },
  SOBERANO: {
    title: "ESTADO DE GOBIERNO",
    subtitle: "EL SOBERANO",
    description: [
      "Habitas el Silencio, pero aún no sabes cómo administrar la abundancia que emana de él. Es momento de sellar tu identidad y gobernar tu territorio sin intermediarios.",
      "Has llegado a tu centro. Conoces tu origen. Tu voluntad es tuya. Pero ahora viene el desafío más grande: sostener tu soberanía en medio de la abundancia sin culpa, sin autosabotaje.",
      "Este es el nivel donde se sella el merecimiento divino. Aquí gobiernas desde tu esencia y eres pilar fundamental para otros."
    ],
    ctaText: "SÍ, RECLAMO MI MERECIMIENTO DIVINO",
    image: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=1000&auto=format&fit=crop"
  },
  EMPATE: {
    title: "DESCIFRANDO TU DIAGNÓSTICO",
    subtitle: "LUCIDEZ RADICAL",
    description: [
      "Si tu resultado es un empate entre dos letras, o si al leer tu diagnóstico sientes un quiebre total, no busques libros: reclama una Intervención Definitiva.",
      "Tu estado requiere un mapa personalizado que solo la Mentoría 1:1 puede entregarte.",
      "No intentes adivinar por cuál libro empezar. Tu estado de confusión es la señal clara de que necesitas intervención divina."
    ],
    ctaText: "RECLAMAR MI SESIÓN DE MENTORÍA",
    image: "https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?q=80&w=1000&auto=format&fit=crop"
  }
};
