
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question, OptionLetter } from '../types';

interface QuestionCardProps {
  question: Question;
  onSelect: (letter: OptionLetter) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onSelect }) => {
  const hasImage = !!question.imageUrl;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className={`w-full bg-[#F5F2ED] shadow-[0_30px_80px_rgba(0,0,0,0.4)] rounded-2xl overflow-hidden flex flex-col ${hasImage ? 'lg:flex-row' : ''} min-h-[500px] border-t-[6px] border-[#C5A059]`}
      >
        {/* Espacio para la imagen del PDF */}
        {hasImage && (
          <div className="lg:w-1/2 relative min-h-[300px] lg:min-h-0 bg-[#080808]">
            <motion.img 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              src={question.imageUrl} 
              alt="Contexto visual" 
              className="absolute inset-0 w-full h-full object-cover grayscale brightness-75 contrast-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A2A3A]/60 via-transparent to-transparent"></div>
            <div className="absolute top-8 left-8">
               <span className="font-cinzel text-[#C5A059] text-[10px] tracking-[0.5em] uppercase px-3 py-1 border border-[#C5A059]/30 bg-black/40 backdrop-blur-md">
                 Indagación No. {question.id}
               </span>
            </div>
          </div>
        )}

        {/* Lado de Contenido y Opciones */}
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
            {question.options.map((option, idx) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                onClick={() => onSelect(option.id)}
                className="group flex items-center text-left p-5 border border-[#1A2A3A]/10 hover:border-[#C5A059] transition-all duration-500 relative bg-white/30"
              >
                <span className="mr-6 flex items-center justify-center w-8 h-8 font-cinzel text-[10px] border border-[#C5A059] text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-white transition-colors">
                  {option.id}
                </span>
                
                <span className="text-base font-light text-[#1A2A3A] group-hover:translate-x-1 transition-transform duration-500">
                  {option.text}
                </span>

                {/* Sutil indicador de selección */}
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

export default QuestionCard;
