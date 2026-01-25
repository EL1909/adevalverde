
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, RefreshCw, User, Shield, Sparkles, Gem, Quote } from 'lucide-react';
import { QUESTIONS, RESULTS } from './constants';
import { OptionLetter, Scores, ResultType } from './types';

// Components
import Intro from './components/Intro';
import QuestionCard from './components/QuestionCard';
import ResultDisplay from './components/ResultDisplay';

type AppState = 'START' | 'INSTRUCTIONS' | 'QUIZ' | 'RESULTS_TRANSITION' | 'RESULTS';

export default function App() {
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
      calculateResult();
    }
  };

  const calculateResult = () => {
    setState('RESULTS_TRANSITION');
    
    setTimeout(() => {
      const maxVal = Math.max(scores.A, scores.B, scores.C, scores.D);
      const candidates = (Object.keys(scores) as Array<keyof Scores>).filter(key => scores[key] === maxVal);

      if (candidates.length > 1) {
        setSelectedResult('EMPATE');
      } else {
        const winner = candidates[0];
        if (winner === 'A') setSelectedResult('PRISIONERO');
        else if (winner === 'B') setSelectedResult('SITIADO');
        else if (winner === 'C') setSelectedResult('PURIFICACION');
        else if (winner === 'D') setSelectedResult('SOBERANO');
      }
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#050505]">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-900/10 blur-[120px] rounded-full"></div>
      </div>

      <AnimatePresence mode="wait">
        {state === 'START' && (
          <Intro key="intro" onNext={startTest} />
        )}

        {state === 'INSTRUCTIONS' && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl w-full bg-cream rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]"
          >
            <div className="md:w-1/2 relative hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1506466010722-395ee2bef877?q=80&w=1000&auto=format&fit=crop" 
                alt="Introspección" 
                className="absolute inset-0 w-full h-full object-cover grayscale contrast-125"
              />
              <div className="absolute inset-0 bg-deep-blue/40 mix-blend-multiply"></div>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-deep-blue">
              <h2 className="text-3xl md:text-4xl font-cinzel mb-8 tracking-wider">INSTRUCCIONES</h2>
              <div className="space-y-6 text-lg font-light leading-relaxed">
                <p>Este test mide el nivel de sitio o soberanía del alma. No es una evaluación superficial de tu personalidad.</p>
                <p>Es un espejo que refleja el estado real de tu coherencia interna: dónde habitas, quién gobierna tu voluntad, y qué tan cerca estás de tu Origen Divino.</p>
                <p className="font-semibold italic">Responde con honestidad brutal. Cada pregunta es una llave que abre una puerta hacia tu verdad más profunda.</p>
              </div>
              <button
                onClick={beginQuiz}
                className="mt-12 bg-deep-blue text-white px-8 py-4 rounded-md font-cinzel tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group"
              >
                PRÁCTICA DE AUTOCONOCIMIENTO
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {state === 'QUIZ' && (
          <div key="quiz" className="max-w-2xl w-full">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <span className="text-gold font-cinzel text-sm tracking-widest">INDAGACIÓN</span>
                <h3 className="text-2xl text-white font-cinzel">{currentQuestionIndex + 1} de {QUESTIONS.length}</h3>
              </div>
              <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gold"
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
              <RefreshCw className="w-16 h-16 text-gold opacity-50" />
            </motion.div>
            <h2 className="text-3xl font-cinzel text-white mb-4 tracking-widest uppercase">Descifrando el Código</h2>
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
