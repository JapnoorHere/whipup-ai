import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  IoArrowBack,
  IoTime,
  IoPlay,
  IoOptionsOutline,
} from 'react-icons/io5';
import {
  GiChefToque,
  GiCookingPot,
  GiArtificialIntelligence,
} from 'react-icons/gi';
import { MdRestaurantMenu, MdInfo } from 'react-icons/md';
import Header from '../components/Header';
import Loader from '../components/Loader';
import LanguageSelector from '../components/LanguageSelector';
import RecipeChangeRequestModal from '../components/RecipeChangeRequestModal';
import { formatTimeToMinutes } from '../utils/timeUtils';
import {
  restoreCurrentRecipe,
  selectLocalizedText,
  setRecipe,
} from '../store/recipeSlice';
import { showLoader, hideLoader } from '../store/loaderSlice';
import { requestRecipeModification } from '../services/apiService';
import AiIcon from '../assets/ai-icon.png'

const IngredientsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentRecipe, currentLanguage, isLoadingGlobal } = useSelector(
    (state) => ({
      currentRecipe: state.recipe.currentRecipe,
      currentLanguage: state.recipe.currentLanguage,
      isLoadingGlobal: state.loader.loading,
    })
  );
  const [isRecipeLoading, setIsRecipeLoading] = useState(true);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  useEffect(() => {
    if (!currentRecipe) {
      dispatch(restoreCurrentRecipe());
    }
    const timer = setTimeout(() => setIsRecipeLoading(false), 100);
    return () => clearTimeout(timer);
  }, [currentRecipe, dispatch]);

  useEffect(() => {
    if (!isRecipeLoading && !currentRecipe) {
      navigate('/');
    }
  }, [currentRecipe, navigate, isRecipeLoading]);

  const handleModificationRequest = async (changeRequestText) => {
    if (!currentRecipe) {
      toast.error('No current recipe to modify.');
      return;
    }
    setIsChangeModalOpen(false);
    dispatch(showLoader());
    try {
      const modifiedRecipe = await requestRecipeModification(
        currentRecipe,
        changeRequestText
      );
      dispatch(setRecipe(modifiedRecipe));
      toast.success('Recipe updated successfully!');
    } catch (error) {
      console.error('Error modifying recipe:', error);
      if (error.message === 'DIET_MISMATCH_MODIFICATION') {
        toast.error(
          'The requested change creates a diet mismatch. Please try a different modification.',
          { autoClose: 6000 }
        );
      } else {
        toast.error(
          error.message ||
            'Could not modify recipe. Please try a different request.'
        );
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  if (isRecipeLoading) {
    return <Loader showMessages={false} />;
  }
  if (!currentRecipe) {
    return null;
  }
  if (isLoadingGlobal && !isChangeModalOpen) {
    return <Loader showMessages={true} type="recipe" />;
  }

  const { recipeName, ingredients, totalTime, steps } = currentRecipe;
  const localizedRecipeName = selectLocalizedText(recipeName, currentLanguage);

  const handleIngredientImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'flex';
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <button
            onClick={() => navigate('/')}
            className="cursor-pointer flex items-center space-x-2 text-white/70 hover:text-white transition-all duration-300 hover:scale-105 self-start"
          >
            <IoArrowBack className="text-xl" />
            <span className="font-medium">Back to Home</span>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3 self-start sm:self-center">
            <LanguageSelector />
            <button
              onClick={() => setIsChangeModalOpen(true)}
              title="Request Recipe Changes"
              className=" cursor-pointer btn-secondary px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2"
            >
              <IoOptionsOutline className="text-base sm:text-lg" />
              <span className=" hidden sm:inline">Customize</span>
            </button>
          </div>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent px-2">
            {localizedRecipeName}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-white/60 text-sm sm:text-base">
            <div className="flex items-center space-x-2">
              <IoTime className="text-lg text-orange-400" />
              <span className="font-medium">
                {formatTimeToMinutes(totalTime)} minutes
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MdRestaurantMenu className="text-lg text-orange-400" />
              <span className="font-medium">
                {ingredients?.length || 0} ingredients
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <GiCookingPot className="text-lg text-orange-400" />
              <span className="font-medium">{steps?.length || 0} steps</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3">
            <img src={AiIcon} className="text-blue-400 w-8 h-8 text-xl sm:text-2xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2 flex items-center text-sm sm:text-base">
                AI Generated Content Notice
              </h3>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                Ingredient images are AI-generated and for reference. Rely on
                names/quantities.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="card text-center py-3 sm:py-6">
            <IoTime className="text-2xl sm:text-3xl text-orange-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-white">
              {formatTimeToMinutes(totalTime)}
            </div>
            <div className="text-white/60 text-xs sm:text-base">Minutes</div>
          </div>
          <div className="card text-center py-3 sm:py-6">
            <GiChefToque className="text-2xl sm:text-3xl text-orange-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-white">
              {ingredients?.length || 0}
            </div>
            <div className="text-white/60 text-xs sm:text-base">
              Ingredients
            </div>
          </div>
          <div className="card text-center py-3 sm:py-6">
            <GiCookingPot className="text-2xl sm:text-3xl text-orange-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-lg sm:text-2xl font-bold text-white">
              {steps?.length || 0}
            </div>
            <div className="text-white/60 text-xs sm:text-base">Steps</div>
          </div>
        </div>

        <div className="card mb-6 sm:mb-8">
          <div className="flex items-center mb-4 sm:mb-6">
            <GiChefToque className="text-orange-500 text-2xl sm:text-3xl mr-2 sm:mr-3" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Ingredients Checklist
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {ingredients?.map((ingredient, index) => {
              const localizedIngredientName = selectLocalizedText(
                ingredient.name,
                currentLanguage
              );
              const englishIngredientNameForFallback = selectLocalizedText(
                ingredient.name,
                'en'
              );
              return (
                <div
                  key={index}
                  className="group flex items-center space-x-3 sm:space-x-4 bg-white/5 hover:bg-white/10 rounded-xl p-3 sm:p-4 transition-all duration-300 hover:scale-105 border border-white/10 hover:border-orange-400/30"
                >
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-500">
                    {ingredient.image && ingredient.image !== 'null' ? (
                      <>
                        <img
                          src={ingredient.image}
                          alt={englishIngredientNameForFallback}
                          className="w-full h-full object-cover shimmer transition-transform duration-300 group-hover:scale-110"
                          onError={handleIngredientImageError}
                        />
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs text-center p-1 hidden">
                          {englishIngredientNameForFallback
                            .split(' ')
                            .slice(0, 2)
                            .join(' ')}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs text-center p-1">
                        {englishIngredientNameForFallback
                          .split(' ')
                          .slice(0, 2)
                          .join(' ')}
                      </div>
                    )}
                    {/* <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <GiArtificialIntelligence className="text-white text-xs" />
                    </div> */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-white text-base sm:text-lg group-hover:text-orange-400 transition-colors truncate"
                      title={localizedIngredientName}
                    >
                      {localizedIngredientName}
                    </h3>
                    <p className="text-orange-400 font-medium text-sm sm:text-base">
                      {ingredient.quantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
            <GiCookingPot className="text-orange-500 mr-2" />
            Preparation Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="font-semibold text-orange-400 mb-2 text-sm sm:text-base">
                Before You Start
              </h4>
              <ul className="text-white/80 text-xs sm:text-sm space-y-1">
                <li>• Wash and prep all vegetables</li>
                <li>• Measure out all ingredients</li>
                <li>• Preheat oven if needed</li>
                <li>• Gather all cooking utensils</li>
              </ul>
            </div>
            <div className="bg-white/5 rounded-xl p-3 sm:p-4">
              <h4 className="font-semibold text-orange-400 mb-2 text-sm sm:text-base">
                Pro Tips
              </h4>
              <ul className="text-white/80 text-xs sm:text-sm space-y-1">
                <li>• Read through all steps first</li>
                <li>• Keep ingredients organized</li>
                <li>• Have clean towels ready</li>
                <li>• Taste and adjust seasonings</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="card max-w-md mx-auto">
            <div className="mb-6">
              <GiChefToque className="text-4xl sm:text-6xl text-orange-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Ready to Cook?
              </h3>
              <p className="text-white/60 mb-6 text-sm sm:text-base">
                Make sure you have all ingredients ready!
              </p>
            </div>
            <button
              onClick={() => navigate('/steps')}
              className="cursor-pointer btn-primary text-lg sm:text-xl px-8 sm:px-12 py-3 sm:py-4 flex items-center space-x-3 mx-auto group w-full sm:w-auto justify-center"
            >
              <IoPlay className="text-xl sm:text-2xl transition-transform group-hover:scale-110" />
              <span>Start Cooking</span>
            </button>
            <p className="text-white/50 mt-4 text-xs sm:text-sm">
              Estimated cooking time: {formatTimeToMinutes(totalTime)} minutes
            </p>
          </div>
        </div>
        <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-orange-400">
              {ingredients?.filter((ing) => {
                const nameEn = selectLocalizedText(
                  ing.name,
                  'en'
                ).toLowerCase();
                return (
                  nameEn.includes('spice') ||
                  nameEn.includes('salt') ||
                  nameEn.includes('pepper')
                );
              }).length || 0}
            </div>
            <div className="text-white/60 text-xs sm:text-sm">
              Spices & Seasonings
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-orange-400">
              {ingredients?.filter((ing) => {
                const nameEn = selectLocalizedText(
                  ing.name,
                  'en'
                ).toLowerCase();
                return (
                  nameEn.includes('vegetable') ||
                  nameEn.includes('onion') ||
                  nameEn.includes('tomato')
                );
              }).length || 0}
            </div>
            <div className="text-white/60 text-xs sm:text-sm">
              Fresh Ingredients
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-orange-400">
              {Math.ceil((steps?.length || 0) / 3)}
            </div>
            <div className="text-white/60 text-xs sm:text-sm">
              Cooking Phases
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-orange-400">
              {steps?.filter(
                (step) => step.timeRequired && step.timeRequired !== 'null'
              ).length || 0}
            </div>
            <div className="text-white/60 text-xs sm:text-sm">Timed Steps</div>
          </div>
        </div>
      </div>
      {currentRecipe && (
        <RecipeChangeRequestModal
          isOpen={isChangeModalOpen}
          onClose={() => setIsChangeModalOpen(false)}
          currentRecipeNameObj={currentRecipe.recipeName}
          onSubmitRequest={handleModificationRequest}
        />
      )}
    </div>
  );
};

export default IngredientsPage;
