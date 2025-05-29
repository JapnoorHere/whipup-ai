import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IoClose, IoAdd, IoRemove } from 'react-icons/io5';
import { selectLocalizedText } from '../store/recipeSlice';

const RecipeModal = ({ isOpen, onClose, recipeData, onSubmit }) => {
  const currentLanguage = useSelector(state => state.recipe.currentLanguage);
  const [formData, setFormData] = useState({
    recipeName: '',
    cuisine: '',
    healthGoals: '',
    restrictions: '',
    description: '',
  });
  const [servingsCount, setServingsCount] = useState(1);
  const [diet, setDiet] = useState('veg');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (recipeData) {
      const nameToEdit = recipeData.recipeName
        ? (typeof recipeData.recipeName === 'object' ? recipeData.recipeName.en : recipeData.recipeName)
        : '';
      setFormData({
        recipeName: nameToEdit || '',
        cuisine: recipeData.cuisine || '',
        healthGoals: '',
        restrictions: '',
        description: recipeData.description || '',
      });
      setDiet(recipeData.diet || 'veg');
      setServingsCount(recipeData.servings || 1);
    } else {
      setFormData({
        recipeName: '',
        cuisine: '',
        healthGoals: '',
        restrictions: '',
        description: '',
      });
      setDiet('veg');
      setServingsCount(1);
    }
  }, [recipeData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    const finalData = {
      recipeName: formData.recipeName.trim(),
      servingsCount: servingsCount,
      diet: diet,
      cuisine: formData.cuisine.trim() || 'Any',
      healthGoals: formData.healthGoals.trim() || 'None',
      restrictions: formData.restrictions.trim() || 'None',
      description: formData.description.trim() || '',
    };
    console.log('Submitting form data to API:', finalData);
    onSubmit(finalData);
    onClose();
  };

  const displayRecipeName = formData.recipeName || (recipeData?.recipeName ? selectLocalizedText(recipeData.recipeName, currentLanguage) : 'Recipe Details');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl border border-orange-500/20 shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent pr-2 flex-1 min-w-0">
            <span className="line-clamp-2">{displayRecipeName}</span>
          </h2>
          <button onClick={onClose} className="text-white/60 cursor-pointer hover:text-white text-xl sm:text-2xl transition-colors p-1 hover:bg-white/10 rounded-full flex-shrink-0 ml-2" aria-label="Close modal">
            <IoClose />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label htmlFor="description" className="text-white font-semibold block mb-2 text-sm sm:text-base">
              Description / Special Notes
              <span className="text-gray-400 ml-1 text-xs">(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="e.g.,make it extra spicy, for a party of 10 but recipe for 1..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base resize-none"
            />
          </div>
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <label className="text-white font-semibold text-sm sm:text-base">Servings</label>
              <div className="flex items-center bg-white/10 rounded-xl p-1">
                <button onClick={() => setServingsCount(Math.max(1, servingsCount - 1))} className="w-8 h-8 cursor-pointer sm:w-10 sm:h-10 bg-orange-500/20 hover:bg-orange-500/40 rounded-lg flex items-center justify-center transition-colors"><IoRemove className="text-white text-sm sm:text-base" /></button>
                <span className="text-white font-bold text-lg sm:text-xl w-10 sm:w-12 text-center">{servingsCount}</span>
                <button onClick={() => setServingsCount(servingsCount + 1)} className="w-8 h-8 sm:w-10  cursor-pointer sm:h-10 bg-orange-500/20 hover:bg-orange-500/40 rounded-lg flex items-center justify-center transition-colors"><IoAdd className="text-white text-sm sm:text-base" /></button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-white font-semibold block mb-2 sm:mb-3 text-sm sm:text-base">Dietary Preference</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ value: 'veg', label: 'Veg', emoji: '🥬' }, { value: 'nonveg', label: 'Non-Veg', emoji: '🍖' }, { value: 'vegan', label: 'Vegan', emoji: '🌱' }].map(({ value, label, emoji }) => (
                <button key={value} onClick={() => setDiet(value)}
                  className={`flex cursor-pointer flex-col items-center py-2 sm:py-3 px-1 sm:px-2 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${diet === value ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white claim-shadow-lg scale-105' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:scale-105'}`}
                ><span className="text-base sm:text-xl mb-1">{emoji}</span><span>{label}</span></button>
              ))}
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-white font-semibold block mb-2 text-sm sm:text-base">Cuisine Preference <span className="text-gray-400 ml-1 text-xs">(Optional)</span></label>
              <input type="text" name="cuisine" value={formData.cuisine} onChange={handleChange} placeholder="e.g., Italian, Indian"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                readOnly={!!recipeData?.cuisine && typeof recipeData.cuisine === 'string'}
              />
            </div>
            <div>
              <label className="text-white font-semibold block mb-2 text-sm sm:text-base">Health Goals <span className="text-gray-400 ml-1 text-xs">(Optional)</span></label>
              <input type="text" name="healthGoals" value={formData.healthGoals} onChange={handleChange} placeholder="e.g., low-calorie, high-protein"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="text-white font-semibold block mb-2 text-sm sm:text-base">Dietary Restrictions <span className="text-gray-400 ml-1 text-xs">(Optional)</span></label>
              <input type="text" name="restrictions" value={formData.restrictions} onChange={handleChange} placeholder="Ingredients to avoid"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 border-t border-white/10 flex-shrink-0">
          <button onClick={handleSubmit} disabled={!formData.recipeName.trim()}
            className={`w-full cursor-pointer py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 ${formData.recipeName.trim() ? 'btn-primary' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
          >{formData.recipeName.trim() ? 'Generate Recipe' : 'Enter Recipe Name'}</button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
