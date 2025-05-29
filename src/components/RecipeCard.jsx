const RecipeCard = ({ name, cuisine, description, image, diet, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-105 cursor-pointer w-full h-80 overflow-hidden group border border-white/10 hover:border-orange-400/50"
    >
      <div className="relative h-1/2 w-full overflow-hidden">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 shimmer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-b-2xl p-5 space-y-3">
        <h3 className="text-lg font-bold text-white truncate group-hover:text-orange-400 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-white/80 line-clamp-2">
          {description}
        </p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs font-semibold text-black bg-orange-400 px-3 py-1 rounded-full">
            {cuisine}
          </span>
          <span className="text-xs font-semibold text-black bg-amber-400 px-3 py-1 rounded-full">
            {diet}
          </span>
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default RecipeCard;
