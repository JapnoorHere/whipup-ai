import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  IoArrowBack,
  IoPlay,
  IoPause,
  IoStop,
  IoCheckmark,
  IoRestaurant,
  IoList,
  IoBookOutline,
  IoOptionsOutline,
} from 'react-icons/io5';
import {
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { GiChefToque } from 'react-icons/gi';
import { MdTimer, MdTimerOff } from 'react-icons/md';

import Header from '../components/Header';
import Loader from '../components/Loader';
import AllStepsModal from '../components/AllStepsModal';
import LanguageSelector from '../components/LanguageSelector';
import RecipeChangeRequestModal from '../components/RecipeChangeRequestModal';

import {
  clearRecipe,
  restoreCurrentRecipe,
  selectLocalizedText,
  setRecipe,
} from '../store/recipeSlice';
import { showLoader, hideLoader } from '../store/loaderSlice';
import { requestRecipeModification } from '../services/apiService';

const StepsPage = () => {
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
  const [isAllStepsModalOpen, setIsAllStepsModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [originalTime, setOriginalTime] = useState(0);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentRecipe) {
      dispatch(restoreCurrentRecipe());
    }
    const timer = setTimeout(() => setIsRecipeLoading(false), 150);
    return () => clearTimeout(timer);
  }, [dispatch, currentRecipe]);

  useEffect(() => {
    if (!isRecipeLoading && !currentRecipe) {
      navigate('/');
    }
  }, [isRecipeLoading, currentRecipe, navigate]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            toast.success('Step timer finished!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (currentRecipe?.steps?.[currentStep]) {
      const stepData = currentRecipe.steps[currentStep];
      const stepTimeRequired =
        stepData.timeRequired && stepData.timeRequired !== 'null'
          ? parseInt(stepData.timeRequired)
          : 0;
      setTimeLeft(stepTimeRequired > 0 ? stepTimeRequired : 0);
      setOriginalTime(stepTimeRequired > 0 ? stepTimeRequired : 0);
      setIsTimerRunning(false);
    } else if (
      currentRecipe &&
      (!currentRecipe.steps || !currentRecipe.steps[currentStep])
    ) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
    }
  }, [currentStep, currentRecipe]);

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
      setCurrentStep(0);
      setCompletedSteps(new Set());
    } catch (error) {
      
      if (error.message === 'DIET_MISMATCH_MODIFICATION') {
        toast.error(
          'The requested change creates a diet mismatch.',
          { autoClose: 6000 }
        );
      } else {
        toast.error(error.message || 'Could not modify recipe.');
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  if (isRecipeLoading) {
    return <Loader showMessages={false} />;
  }
  if (
    !currentRecipe ||
    !currentRecipe.steps ||
    currentRecipe.steps.length === 0
  ) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-white text-center text-lg">
            Recipe data not available or empty. Redirecting...
          </p>
        </div>
      </div>
    );
  }
  if (isLoadingGlobal && !isChangeModalOpen && !isAllStepsModalOpen) {
    return <Loader showMessages={true} type="recipe" />;
  }

  const { recipeName, steps, ingredients: allIngredients } = currentRecipe;
  const localizedRecipeName = selectLocalizedText(recipeName, currentLanguage);
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const totalSteps = steps.length;

  const formatTime = (secondsStr) => {
    const totalSeconds = parseInt(secondsStr) || 0;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };
  const startTimer = () => {
    if (currentStepData?.timeRequired && currentStepData.timeRequired !== 'null') {
      const timeInSeconds = parseInt(currentStepData.timeRequired);
      if (timeInSeconds > 0) {
        setTimeLeft(timeInSeconds);
        setOriginalTime(timeInSeconds);
        setIsTimerRunning(true);
      }
    }
  };
  const pauseTimer = () => setIsTimerRunning(false);
  const stopTimer = () => {
    setIsTimerRunning(false);
    const stepTime =
      currentStepData?.timeRequired && currentStepData.timeRequired !== 'null'
        ? parseInt(currentStepData.timeRequired)
        : 0;
    setTimeLeft(stepTime > 0 ? stepTime : 0);
  };
  const nextStep = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  const finishCooking = () => {
    dispatch(clearRecipe());
    navigate('/');
  };
  const getIngredientImages = (ingredientsUsedStr) => {
    if (
      !ingredientsUsedStr ||
      ingredientsUsedStr === 'null' ||
      !allIngredients ||
      allIngredients.length === 0
    ) {
      return [];
    }
    const usedEnglishNames = ingredientsUsedStr
      .split(',')
      .map((name) => name.trim().toLowerCase());
    return allIngredients
      .filter(
        (ing) =>
          ing.name &&
          selectLocalizedText(ing.name, 'en') &&
          usedEnglishNames.includes(
            selectLocalizedText(ing.name, 'en').toLowerCase()
          )
      )
      .map((ing) => ({
        name: selectLocalizedText(ing.name, currentLanguage),
        image: ing.image,
      }));
  };
  const getTimerProgress = () => {
    if (originalTime === 0) {
      return 0;
    }
    const progress = ((originalTime - timeLeft) / originalTime) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const allStepsDone = completedSteps.has(totalSteps - 1) && totalSteps > 0;

  const getResponsiveStepDots = () => {
    const dots = [];
    const maxDotsWithEllipses =
      windowWidth < 420 ? 5 : windowWidth < 640 ? 7 : 9;

    if (totalSteps <= maxDotsWithEllipses) {
      for (let i = 0; i < totalSteps; i++) dots.push(i);
      return dots;
    }

    const maxNumericDots =
      maxDotsWithEllipses -
      (maxDotsWithEllipses < totalSteps && maxDotsWithEllipses > 2 ? 2 : 0);

    const firstDot = 0;
    const lastDot = totalSteps - 1;
    const current = currentStep;

    let sideDots = Math.floor((maxNumericDots - 1) / 2);
    if (maxNumericDots <= 3) sideDots = 0;

    dots.push(firstDot);

    let rangeStart = Math.max(firstDot + 1, current - sideDots);
    let rangeEnd = Math.min(lastDot - 1, current + sideDots);

    if (current - firstDot <= sideDots + 1) {
      rangeEnd = Math.min(
        lastDot - 1,
        firstDot + (maxNumericDots - (lastDot === firstDot ? 1 : 2))
      );
      rangeStart = firstDot + 1;
    } else if (lastDot - current <= sideDots + 1) {
      rangeStart = Math.max(
        firstDot + 1,
        lastDot - (maxNumericDots - (lastDot === firstDot ? 1 : 2))
      );
      rangeEnd = lastDot - 1;
    }

    if (rangeStart > firstDot + 1) {
      dots.push('ellipsis_start');
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i !== firstDot && i !== lastDot) {
        dots.push(i);
      }
    }

    if (rangeEnd < lastDot - 1) {
      dots.push('ellipsis_end');
    }

    if (lastDot !== firstDot) dots.push(lastDot);

    return Array.from(new Set(dots));
  };
  const responsiveDots = getResponsiveStepDots();

  if (allStepsDone) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 sm:py-16 max-w-2xl text-center">
          <div className="card">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Congratulations!
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-6 sm:mb-8">
              Your delicious{' '}
              <span className="text-orange-400 font-semibold">
                {localizedRecipeName}
              </span>{' '}
              is ready!
            </p>
            <div className="flex justify-center flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
              <button
                onClick={() => navigate('/ingredients')}
                className="cursor-pointer btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center space-x-2 justify-center"
              >
                <IoList className="text-xl" /> <span>View Ingredients</span>
              </button>
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setCompletedSteps(new Set());
                }}
                className="cursor-pointer btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center space-x-2 justify-center"
              >
                <IoRestaurant className="text-xl" /> <span>Cook Again</span>
              </button>
            </div>
            <button
              onClick={finishCooking}
              className="cursor-pointer btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentStepData) {
    return <Loader showMessages={false} />;
  }
  const currentStepTimeRequired =
    currentStepData.timeRequired && currentStepData.timeRequired !== 'null'
      ? parseInt(currentStepData.timeRequired)
      : 0;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <button
            onClick={() => navigate('/ingredients')}
            className="cursor-pointer flex items-center space-x-2 text-white/70 hover:text-white transition-colors self-start"
          >
            <IoArrowBack className="text-xl" />{' '}
            <span className="font-medium">Ingredients</span>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3 self-start sm:self-center">
            <LanguageSelector />
            <button
              onClick={() => setIsChangeModalOpen(true)}
              title="Request Recipe Changes"
              className="cursor-pointer  btn-secondary px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2"
            >
              <IoOptionsOutline className="text-base sm:text-lg" />
              <span className="hidden sm:inline">Customize</span>
            </button>
            <button
              onClick={() => setIsAllStepsModalOpen(true)}
              title="View All Steps"
              className="cursor-pointer btn-secondary px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2"
            >
              <IoBookOutline className="text-base sm:text-lg" />
              <span className="hidden sm:inline">All Steps</span>
            </button>
          </div>
        </div>
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2 px-2">
            {localizedRecipeName}
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
        <div className="progress-bar mb-6 sm:mb-8">
          <div
            className="progress-fill"
            style={{
              width: `${((currentStep + 1) / (totalSteps || 1)) * 100}%`,
            }}
          ></div>
        </div>

        <div className="card mb-6 sm:mb-8">
          <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0">
              {currentStepData.stepNumber}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-lg text-white leading-relaxed break-words">
                {selectLocalizedText(
                  currentStepData.instruction,
                  currentLanguage
                )}
              </p>
            </div>
          </div>

          {currentStepTimeRequired > 0 ? (
            <div className="bg-gradient-to-br from-orange-600/20 to-amber-600/20 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-700/50"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-orange-500 drop-shadow-[0_2px_5px_rgba(249,115,22,0.5)]"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={
                        (2 * Math.PI * 42) -
                        (getTimerProgress() / 100) * (2 * Math.PI * 42)
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className={`text-3xl sm:text-4xl font-bold text-orange-400 ${
                        isTimerRunning ? 'timer-active' : ''
                      }`}
                    >
                      {isTimerRunning || timeLeft < originalTime
                        ? formatTime(timeLeft)
                        : formatTime(originalTime)}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      {isTimerRunning
                        ? 'Remaining'
                        : timeLeft < originalTime && timeLeft > 0
                        ? 'Paused'
                        : originalTime > 0
                        ? 'Set For'
                        : 'No Timer'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-orange-300">
                  <MdTimer className="text-xl sm:text-2xl" />
                  <span className="font-semibold text-sm sm:text-base">
                    Cooking Timer
                  </span>
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pt-2">
                  {!isTimerRunning &&
                    timeLeft === originalTime &&
                    originalTime > 0 && (
                      <button
                        onClick={startTimer}
                        className="cursor-pointer btn-secondary flex items-center space-x-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                      >
                        <IoPlay /> <span>Start</span>
                      </button>
                    )}
                  {isTimerRunning && (
                    <button
                      onClick={pauseTimer}
                      className="cursor-pointer btn-secondary flex items-center space-x-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                    >
                      <IoPause /> <span>Pause</span>
                    </button>
                  )}
                  {!isTimerRunning &&
                    timeLeft > 0 &&
                    timeLeft < originalTime && (
                      <button
                        onClick={() => setIsTimerRunning(true)}
                        className="cursor-pointer btn-secondary flex items-center space-x-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                      >
                        <IoPlay /> <span>Resume</span>
                      </button>
                    )}
                  {originalTime > 0 &&
                    (timeLeft < originalTime || isTimerRunning) && (
                      <button
                        onClick={stopTimer}
                        className="cursor-pointer btn-secondary flex items-center space-x-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3"
                      >
                        <IoStop /> <span>Reset</span>
                      </button>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="text-center">
                <MdTimerOff className="text-blue-400 text-2xl sm:text-3xl mx-auto mb-2" />
                <h4 className="text-blue-400 font-semibold mb-2 text-sm sm:text-base">
                  Take Your Time
                </h4>
                <p className="text-white/70 text-xs sm:text-sm">
                  This step has no specific active cooking time. Follow the
                  instructions and proceed when ready.
                </p>
              </div>
            </div>
          )}

          {currentStepData.ingredientsUsed &&
            currentStepData.ingredientsUsed.trim() !== '' && (
              <div className="bg-white/5 rounded-xl p-3 sm:p-4">
                <h4 className="font-semibold text-white mb-3 flex items-center text-sm sm:text-base">
                  <GiChefToque className="text-orange-400 mr-2" />
                  Ingredients for this step:
                </h4>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {getIngredientImages(currentStepData.ingredientsUsed).map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 bg-white/10 rounded-lg p-2"
                      >
                        {item.image && item.image !== 'null' ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs sm:text-sm text-white">
                          {item.name}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        <div className="flex justify-between items-center space-x-2 sm:space-x-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex-shrink-0 flex items-center space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
              currentStep === 0
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'btn-secondary cursor-pointer '
            }`}
          >
            <FiChevronLeft />{' '}
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <div className="flex-grow flex justify-center items-center space-x-1 sm:space-x-1.5 min-w-0 px-1">
            {responsiveDots.map((dot, index) =>
              typeof dot === 'number' ? (
                <div
                  key={`dot-indicator-${dot}`}
                  className={`flex-shrink-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300
                    ${
                      dot === currentStep
                        ? 'bg-orange-500 scale-125 ring-1 ring-orange-400/50'
                        : completedSteps.has(dot)
                        ? 'bg-green-500'
                        : 'bg-white/30'
                    }`}
                  title={`Step ${dot + 1}`}
                />
              ) : (
                <span
                  key={`ellipsis-${dot}-${index}`}
                  className="text-white/50 flex-shrink-0 flex items-center px-0.5 sm:px-1"
                >
                  <FiMoreHorizontal className="text-sm sm:text-base" />
                </span>
              )
            )}
          </div>

          <button
            onClick={nextStep}
            className={`cursor-pointer flex-shrink-0 flex items-center space-x-2 btn-primary px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base`}
          >
            <span>{isLastStep ? 'Finish' : 'Next'}</span>
            {isLastStep ? <IoCheckmark /> : <FiChevronRight />}
          </button>
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
      {currentRecipe && steps && (
        <AllStepsModal
          isOpen={isAllStepsModalOpen}
          onClose={() => setIsAllStepsModalOpen(false)}
          steps={steps}
          recipeName={currentRecipe.recipeName}
        />
      )}
    </div>
  );
};

export default StepsPage;
