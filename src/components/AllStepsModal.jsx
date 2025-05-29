import React from 'react';
import { IoClose } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { selectLocalizedText } from '../store/recipeSlice';

const AllStepsModal = ({ isOpen, onClose, steps, recipeName }) => {
  const currentLanguage = useSelector(state => state.recipe.currentLanguage);

  if (!isOpen) return null;

  const localizedRecipeName = selectLocalizedText(recipeName, currentLanguage);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl border border-orange-500/20 shadow-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent pr-2 flex-1 min-w-0">
            All Steps for <span className="line-clamp-1">{localizedRecipeName}</span>
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-white/60 hover:text-white text-xl sm:text-2xl transition-colors p-1 hover:bg-white/10 rounded-full flex-shrink-0 ml-2"
          >
            <IoClose />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {steps && steps.map((step, index) => (
            <div key={index} className="bg-white/5 p-3 sm:p-4 rounded-xl border border-white/10">
              <div className="flex items-start space-x-3">
                <div className="bg-orange-500 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 mt-1">
                  {step.stepNumber}
                </div>
                <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                  {selectLocalizedText(step.instruction, currentLanguage)}
                </p>
              </div>
            </div>
          ))}
          {(!steps || steps.length === 0) && (
            <p className="text-white/70 text-center">No steps available.</p>
          )}
        </div>
        <div className="p-2 sm:p-3 border-t border-white/10 flex-shrink-0 text-center">
          <button onClick={onClose} className="cursor-pointer btn-secondary px-4 py-2 text-sm">Done</button>
        </div>
      </div>
    </div>
  );
};

export default AllStepsModal;
