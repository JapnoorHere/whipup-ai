import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { selectLocalizedText } from '../store/recipeSlice';

const RecipeChangeRequestModal = ({ isOpen, onClose, currentRecipeNameObj, onSubmitRequest }) => {
  const [changeRequest, setChangeRequest] = useState('');
  const currentLanguage = useSelector(state => state.recipe.currentLanguage);

  useEffect(() => {
    if (isOpen) {
      setChangeRequest('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (changeRequest.trim()) {
      onSubmitRequest(changeRequest.trim());
    }
  };

  const localizedRecipeName = selectLocalizedText(currentRecipeNameObj, currentLanguage);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl border border-orange-500/20 shadow-2xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent pr-2 flex-1 min-w-0">
            Modify: <span className="line-clamp-1" title={localizedRecipeName}>{localizedRecipeName}</span>
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-white/60 hover:text-white text-xl sm:text-2xl transition-colors p-1 hover:bg-white/10 rounded-full flex-shrink-0 ml-2"
            aria-label="Close modal"
          >
            <IoClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="changeRequestInput" className="text-white font-semibold block mb-2 sm:mb-3 text-sm sm:text-base">
              What changes would you like to make?
            </label>
            <textarea
              id="changeRequestInput"
              value={changeRequest}
              onChange={(e) => setChangeRequest(e.target.value)}
              placeholder="e.g., Make it spicier, replace chicken with tofu, add more vegetables, make it gluten-free..."
              className="w-full h-32 sm:h-40 bg-white/5 border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base resize-none"
              required
              aria-required="true"
            />
            <p className="text-xs text-white/50 mt-2">
              Describe your desired modifications. The AI will try its best to update the recipe.
            </p>
          </div>
        </form>
        <div className="p-4 sm:p-6 border-t border-white/10 flex-shrink-0">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!changeRequest.trim()}
            className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 ${
              changeRequest.trim()
                ? 'btn-primary cursor-pointer '
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Request Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeChangeRequestModal;
