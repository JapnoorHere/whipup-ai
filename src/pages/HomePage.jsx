import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import RecipeCard from '../components/RecipeCard';
import RecipeModal from '../components/RecipeModal';
import Loader from '../components/Loader';
import Footer from '../components/Footer';
import { categories, recipes as sampleRecipes } from '../data/recipeData';
import { generateRecipe } from '../services/apiService';
import { showLoader, hideLoader } from '../store/loaderSlice';
import { setRecipe } from '../store/recipeSlice';
import { MdLightbulbOutline } from 'react-icons/md';
import HomeBanner from '../assets/home-banner.jpg'
import BugReportModal from '../components/BugReportModal';
import { IoBugSharp } from 'react-icons/io5';


const HomePage = () => {
    const [activeCategory, setActiveCategory] = useState(categories[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecipeForModal, setSelectedRecipeForModal] = useState(null);
    const [heroSearchQuery, setHeroSearchQuery] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isLoading = useSelector(state => state.loader.loading);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);     // For bug reports
    const heroInputRef = useRef(null);
    const placeholderExamples = [
        "e.g., Butter Chicken", "जैसे, छोले भटूरे", "ਜਿਵੇਂ, ਸ਼ਾਹੀ ਪਨੀਰ",
        "e.g., Pasta Carbonara", "जैसे, दाल मਖਨੀ", "ਜਿਵੇਂ, ਮੱਕੀ ਦੀ ਰੋਟੀ ਤੇ ਸਰੋਂ ਦਾ ਸਾਗ",
        "e.g., Chocolate Cake", "Hinglish: Paneer Tikka Masala", "e.g., Aloo Gobi",
        "जैसे, मटर पनीर", "ਜਿਵੇਂ, ਦਾਲ ਤੜਕਾ"
    ];
    const [currentPlaceholderText, setCurrentPlaceholderText] = useState(placeholderExamples[0]);
    const placeholderIndexRef = useRef(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (!heroInputRef.current || document.activeElement !== heroInputRef.current) {
                placeholderIndexRef.current = (placeholderIndexRef.current + 1) % placeholderExamples.length;
                setCurrentPlaceholderText(placeholderExamples[placeholderIndexRef.current]);
            }
        }, 3000);
        return () => clearInterval(intervalId);
    }, [placeholderExamples]);

    const filteredSampleRecipes = sampleRecipes.filter(recipe => recipe.cuisine === activeCategory);

    const handleRecipeCardClick = (recipeFromCard) => {
        setSelectedRecipeForModal({
            recipeName: recipeFromCard.name,
            diet: recipeFromCard.diet,
            cuisine: recipeFromCard.cuisine,
            description: recipeFromCard.description || '',
        });
        setIsModalOpen(true);
    };

    const handleCategoryClick = (category) => {
        setActiveCategory(category);
    };

    const handleHeroSearchSubmit = (query) => {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length === 0) {
            toast.error("Please enter a recipe name or idea");
            return;
        }
        setSelectedRecipeForModal({
            recipeName: trimmedQuery,
            diet: 'veg',
            cuisine: '',
            description: '',
        });
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (formDataFromModal) => {
        
        if (!formDataFromModal.recipeName || formDataFromModal.recipeName.trim().length === 0) {
            toast.error("Recipe name is required in the modal.");
            return;
        }
        if (!formDataFromModal.servingsCount || formDataFromModal.servingsCount < 1) {
            toast.error("Servings count must be at least 1.");
            return;
        }
        dispatch(showLoader());
        try {
            const generatedRecipeData = await generateRecipe(formDataFromModal);
            if (!generatedRecipeData?.recipeName?.en || !generatedRecipeData.ingredients || !generatedRecipeData.steps) {
                
                throw new Error('Received incomplete recipe data from AI.');
            }
            dispatch(setRecipe(generatedRecipeData));
            const recipeNameForToast = (typeof generatedRecipeData.recipeName === 'object' && generatedRecipeData.recipeName.en)
                ? generatedRecipeData.recipeName.en
                : formDataFromModal.recipeName;
            toast.success(`Recipe for "${recipeNameForToast}" generated!`);
            setTimeout(() => navigate('/ingredients'), 100);
        } catch (error) {
            
            if (error.message === "DIET_MISMATCH") {
                const userEnteredRecipeName = formDataFromModal.recipeName;
                const selectedDiet = formDataFromModal.diet;
                let customMessage = `The recipe idea "${userEnteredRecipeName}" doesn't seem to match the selected diet (${selectedDiet}). Please adjust your selections.`;
                toast.error(customMessage, { autoClose: 7000, className: 'toast-error-diet' });
            } else if (error.message === "NONSENSICAL_INPUT") {
                toast.error("That doesn't sound like a recipe. Please try describing a food dish!", { autoClose: 6000 });
            } else if (error.message.includes('AI flagged an issue') || error.message.includes('incomplete or invalid structure') || error.message.includes('AI returned invalid')) {
                toast.error("The AI had trouble with that request. Please try rephrasing or be more specific.", { autoClose: 6000 });
            } else {
                toast.error(error.message || 'Something went wrong while generating the recipe. Please try again.');
            }
        } finally {
            dispatch(hideLoader());
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {isLoading && <Loader showMessages={true} />}
            <Header />
            <main className="flex-grow">
                <section className="relative h-[75vh] sm:h-[70vh] overflow-hidden">
                    <img src={HomeBanner} alt="Delicious food spread" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-white">What do you want to cook today?</h1>
                        <p className="text-lg md:text-xl max-w-2xl mb-6 text-white/90">Describe any dish, and our AI chef will whip up a recipe for you!</p>
                        <div className="flex flex-col sm:flex-row w-full max-w-xl items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                            <div className="relative flex-1">
                                <input
                                    ref={heroInputRef}
                                    type="text"
                                    placeholder={currentPlaceholderText}
                                    value={heroSearchQuery}
                                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleHeroSearchSubmit(heroSearchQuery)}
                                    className="w-full text-base sm:text-lg bg-white/95 backdrop-blur-sm border-2 border-transparent focus-within:border-orange-500 rounded-xl px-5 py-3.5 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 shadow-lg hover:shadow-orange-500/20"
                                    aria-label="Enter recipe name or idea"
                                />
                            </div>
                            <button
                                onClick={() => handleHeroSearchSubmit(heroSearchQuery)}
                                className="btn-primary px-6 sm:px-8 cursor-pointer py-3.5 text-base sm:text-lg whitespace-nowrap"
                            >
                                Get Recipe
                            </button>
                        </div>
                        <div className="mt-3 p-3 bg-black/40 backdrop-blur-sm rounded-lg max-w-xl text-center">
                            <div className="flex items-center justify-center text-orange-400 mb-1"><MdLightbulbOutline className="text-xl mr-2" /><span className="font-semibold">Language Tip!</span></div>
                            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">Feel free to type your recipe name in English, Hindi (जैसे, छोले भटूरे), Punjabi (ਜਿਵੇਂ, ਸ਼ਾਹੀ ਪਨੀਰ), or even Hinglish! Our AI understands.</p>
                        </div>
                    </div>
                </section>
                <section className="container mx-auto px-4 py-16 max-w-7xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Discover Flavors Around the World</h2>
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-12">{categories.map((category) => (<button key={category} onClick={() => handleCategoryClick(category)} className={`category-pill ${activeCategory === category ? 'category-pill-active' : 'category-pill-inactive'}`}>{category}</button>))}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">{filteredSampleRecipes.map((recipe, index) => (<RecipeCard key={index} {...recipe} onClick={() => handleRecipeCardClick(recipe)} />))}</div>
                </section>
            </main>
            <RecipeModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedRecipeForModal(null); }} recipeData={selectedRecipeForModal} onSubmit={handleModalSubmit} />
            <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />

            <button
                onClick={() => setIsBugModalOpen(true)}
                className="cursor-pointer fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3.5 sm:p-4 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 z-50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Report a bug or give feedback"
                title="Report a Bug / Feedback"
            >
                <IoBugSharp size={24} />
            </button>
            <Footer />
        </div>
    );
};

export default HomePage;
