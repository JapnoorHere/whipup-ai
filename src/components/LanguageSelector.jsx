import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentLanguage } from '../store/recipeSlice';

const languages = [
  { code: 'en', name: 'English'},
  { code: 'hi', name: 'हिन्दी'},
  { code: 'pa', name: 'ਪੰਜਾਬੀ'},
];

const LanguageSelector = () => {
  const dispatch = useDispatch();
  const currentLanguage = useSelector(state => state.recipe.currentLanguage);

  const handleLanguageChange = (langCode) => {
    dispatch(setCurrentLanguage(langCode));
  };

  return (
    <div className="flex items-center justify-center space-x-4 sm:space-x-2 bg-white/10 backdrop-blur-sm p-1 rounded-full">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          title={`Switch to ${lang.name}`}
          className={` cursor-pointer px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400
            ${currentLanguage === lang.code
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
            }`}
        >
          <span className="inline">{lang.name}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
