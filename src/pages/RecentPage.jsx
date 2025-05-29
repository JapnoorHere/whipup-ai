import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoTime, IoTrash, IoSearch, IoCalendar } from 'react-icons/io5';
import { MdDelete, MdAccessTime } from 'react-icons/md';
import { GiCookingPot } from 'react-icons/gi';
import Header from '../components/Header';
import {
  setRecipe,
  removeRecentRecipe,
  clearAllRecentRecipes,
  selectLocalizedText,
} from '../store/recipeSlice';
import { formatTimeToMinutes } from '../utils/timeUtils';

const RecentPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { recentRecipes, currentLanguage } = useSelector((state) => ({
    recentRecipes: state.recipe.recentRecipes,
    currentLanguage: state.recipe.currentLanguage,
  }));
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = recentRecipes.filter((recipe) => {
    const searchableRecipeName = selectLocalizedText(
      recipe.recipeName,
      'en'
    ).toLowerCase();
    const localizedRecipeNameForDisplay = selectLocalizedText(
      recipe.recipeName,
      currentLanguage
    ).toLowerCase();
    const query = searchQuery.toLowerCase();
    const nameMatches =
      searchableRecipeName.includes(query) ||
      localizedRecipeNameForDisplay.includes(query);
    const ingredientMatches =
      recipe.ingredients &&
      recipe.ingredients.some((ing) => {
        const searchableIngredientName = selectLocalizedText(
          ing.name,
          'en'
        ).toLowerCase();
        const localizedIngredientNameForDisplay = selectLocalizedText(
          ing.name,
          currentLanguage
        ).toLowerCase();
        return (
          searchableIngredientName.includes(query) ||
          localizedIngredientNameForDisplay.includes(query)
        );
      });
    return nameMatches || ingredientMatches;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const handleRecipeClick = (recipe) => {
    dispatch(setRecipe(recipe));
    navigate('/ingredients');
  };

  const handleDeleteRecipe = (e, recipeId) => {
    e.stopPropagation();
    const recipeToDelete = recentRecipes.find(
      (recipe) => recipe.id === recipeId
    );
    if (recipeToDelete) {
      const recipeNameToDisplay = selectLocalizedText(
        recipeToDelete.recipeName,
        currentLanguage
      );
      dispatch(removeRecentRecipe(recipeId));
      toast.info(`"${recipeNameToDisplay}" deleted successfully!`);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all recent recipes?')) {
      dispatch(clearAllRecentRecipes());
      toast.info('All recent recipes cleared!');
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Recent Recipes
            </h1>
            <p className="text-white/60">
              Your cooking history - {filteredRecipes.length} of{' '}
              {recentRecipes.length} recipe
              {recentRecipes.length !== 1 ? 's' : ''}
            </p>
          </div>

          {recentRecipes.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex cursor-pointer items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <MdDelete className="text-lg" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {recentRecipes.length > 0 && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <IoSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 text-xl" />
              <input
                type="text"
                placeholder="Search recipes or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12 w-full"
              />
            </div>
          </div>
        )}

        {recentRecipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto">
              <GiCookingPot className="text-6xl text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Recent Recipes
              </h3>
              <p className="text-white/60 mb-6">
                Start cooking some delicious recipes to see them here!
              </p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Explore Recipes
              </button>
            </div>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto">
              <IoSearch className="text-6xl text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Results Found
              </h3>
              <p className="text-white/60 mb-6">
                Try searching with different keywords
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="btn-secondary"
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => {
              const dateTime = formatDate(recipe.createdAt);
              const displayName = selectLocalizedText(
                recipe.recipeName,
                currentLanguage
              );
              return (
                <div
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe)}
                  className="card hover-lift cursor-pointer group relative overflow-hidden"
                >
                  <button
                    onClick={(e) => handleDeleteRecipe(e, recipe.id)}
                    className="absolute top-3 right-3 z-20 w-7 h-7 bg-red-500/90 hover:scale-130 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
                  >
                    <IoTrash className="text-xs cursor-pointer" />
                  </button>

                  <div className="mb-4 pr-10">
                    <h3
                      className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2 mb-3"
                      title={displayName}
                    >
                      {displayName}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-white/60 mb-3">
                      <div className="flex items-center space-x-1">
                        <MdAccessTime className="text-orange-400" />
                        <span>
                          {formatTimeToMinutes(recipe.totalTime)} min cook
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <IoCalendar className="text-orange-400" />
                        <div className="text-right">
                          <div className="text-white/80">{dateTime.date}</div>
                          <div className="text-white/60 text-xs">
                            {dateTime.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">
                      Ingredients ({recipe.ingredients?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {recipe.ingredients
                        ?.slice(0, 4)
                        .map((ingredient, index) => {
                          const displayedIngredientName = selectLocalizedText(
                            ingredient.name,
                            currentLanguage
                          );
                          return (
                            <span
                              key={index}
                              className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded-full"
                              title={displayedIngredientName}
                            >
                              {displayedIngredientName}
                            </span>
                          );
                        })}
                      {recipe.ingredients?.length > 4 && (
                        <span className="text-xs text-white/60">
                          +{recipe.ingredients.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">
                      Steps ({recipe.steps?.length || 0})
                    </h4>
                    <p className="text-sm text-white/70 line-clamp-2">
                      {recipe.steps?.[0]
                        ? selectLocalizedText(
                            recipe.steps[0].instruction,
                            currentLanguage
                          )
                        : 'No steps available'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full">
                      Recipe Generated
                    </span>
                    <button className="cursor-pointer text-white/60 hover:text-white text-sm font-medium transition-colors">
                      Cook Again →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {recentRecipes.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">
              Your Cooking Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {recentRecipes.length}
                </div>
                <div className="text-white/60">Unique Recipes</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {formatTimeToMinutes(
                    recentRecipes.reduce(
                      (total, recipe) =>
                        total + (parseInt(recipe.totalTime) || 0),
                      0
                    )
                  )}
                </div>
                <div className="text-white/60">Minutes Cooking</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {
                    new Set(
                      recentRecipes.map((recipe) => {
                        const englishName = selectLocalizedText(
                          recipe.recipeName,
                          'en'
                        ).toLowerCase();
                        if (
                          englishName.includes('dessert') ||
                          englishName.includes('cake') ||
                          englishName.includes('sweet')
                        )
                          return 'dessert';
                        if (englishName.includes('indian')) return 'indian';
                        if (englishName.includes('chinese')) return 'chinese';
                        if (englishName.includes('italian')) return 'italian';
                        return 'other';
                      })
                    ).size
                  }
                </div>
                <div className="text-white/60">Different Cuisines</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPage;
