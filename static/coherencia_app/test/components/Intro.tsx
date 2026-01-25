
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck } from 'lucide-react';

interface IntroProps {
  onNext: () => void;
}

const Intro: React.FC<IntroProps> = ({ onNext }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl w-full flex flex-col md:flex-row items-stretch bg-[#F5F2ED] rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
    >
      {/* Lado Visual: Imagen Artística */}
      <div className="md:w-[45%] relative min-h-[400px] md:min-h-[700px]">
        <img 
          src="https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=1000&auto=format&fit=crop" 
          alt="Silence and Wisdom" 
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 brightness-90"
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

      {/* Lado de Contenido: Tipografía Editorial */}
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
            
            {/* Adorno Minimalista */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r border-b border-[#C5A059]"></div>
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l border-t border-[#C5A059]"></div>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Intro;
