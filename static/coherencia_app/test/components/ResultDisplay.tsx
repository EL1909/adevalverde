
import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ArrowRight, Quote, Gem, UserCheck, ShieldCheck } from 'lucide-react';
import { ResultType, Scores } from '../types';
import { RESULTS } from '../constants';

interface ResultDisplayProps {
  resultType: ResultType;
  scores: Scores;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ resultType, scores, onReset }) => {
  const detail = RESULTS[resultType];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl w-full"
    >
      <div className="bg-[#080808] border border-[#C5A059]/30 rounded-none overflow-hidden flex flex-col lg:flex-row min-h-[800px]">
        
        {/* Visual Report Section */}
        <div className="lg:w-[40%] bg-[#F5F2ED] p-10 md:p-16 text-[#1A2A3A] flex flex-col border-r border-[#C5A059]/20">
          <div className="mb-12">
            <h3 className="font-cinzel text-[#C5A059] text-xs tracking-[0.4em] mb-4">MAPA DE SOBERANÍA</h3>
            <div className="w-12 h-1 bg-[#C5A059]"></div>
          </div>

          <div className="space-y-12 flex-grow">
            {[
              { label: 'PRISIONERO', score: scores.A, icon: ShieldCheck },
              { label: 'SITIADO', score: scores.B, icon: UserCheck },
              { label: 'PURIFICACIÓN', score: scores.C, icon: Gem },
              { label: 'SOBERANO', score: scores.D, icon: Quote }
            ].map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-baseline mb-3">
                  <span className={`font-cinzel text-xs tracking-widest ${item.label === resultType || (resultType === 'PRISIONERO' && item.label === 'PRISIONERO') ? 'text-[#C5A059]' : 'text-[#1A2A3A]/40'}`}>
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

        {/* Narrative Section */}
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
            
            <h2 className="text-5xl md:text-7xl font-cinzel text-white mb-12 tracking-tight">
              {detail.subtitle}
            </h2>
            
            <div className="space-y-8 text-slate-400 text-xl font-light leading-relaxed mb-16 font-inter border-l border-white/5 pl-8">
              {detail.description.map((para, i) => (
                <p key={i} className="hover:text-white transition-colors duration-500">{para}</p>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <a
                href="https://www.adelavalverde.info"
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

export default ResultDisplay;
