/** Gray placeholder for future campaign photos */
const PhotoPlaceholder = ({ label = 'صورة', className = '' }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-beige-400 bg-beige-200/80 text-olive-500 min-h-[140px] sm:min-h-[180px] ${className}`}
  >
    <span className="text-3xl sm:text-4xl opacity-40 mb-2" aria-hidden>
      🖼️
    </span>
    <span className="text-xs sm:text-sm font-bold opacity-70">{label}</span>
  </div>
)

export default PhotoPlaceholder
