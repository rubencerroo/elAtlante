import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

// Use Vite's import.meta.glob to dynamically load all images from src/assets/slider
const imageModules = import.meta.glob('../assets/slider/*.{jpg,jpeg,png,webp}', { eager: true });
const rawImages = Object.values(imageModules).map((mod: any) => mod.default);

export default function AboutSlider() {
  const [isMobile, setIsMobile] = useState(false);

  // Original images
  const baseImages = useMemo(() => rawImages.length > 0 
    ? rawImages 
    : [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDHN_4hnzs64uVTD9pNvyjzMd0gmF4u7d9jlcgGRfAeXVF6xYmg615NSyZS8rGp-W024Q6a7_VHAgETZykcP6iOmw5Q_bM7W4ySND3PfvJ0dKZeFEnZF7doKn5ut9QjDorkWL-tX8aPlHIukSpo6etujfLfe3dPBQuh8rfJoeS4UG_U9KSG3Y8sWtncAfSc0vaVFDKhnSKbOSMbQEx7lxCR4ub3_jIV_J89xZN_YklPuNB5zQlixYXbykzNRiO5ihIRGpKeVAtcraQ',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1600&h=1000',
        'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80&w=1600&h=1000'
      ]
  , []);

  // For infinite loop: [last, ...images, first]
  const images = useMemo(() => [baseImages[baseImages.length - 1], ...baseImages, baseImages[0]], [baseImages]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const slideWidth = isMobile ? 85 : 70; // %
  const numImages = baseImages.length;

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => prev + 1);
  }, [isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);
  }, [isAnimating]);

  const goToSlide = (idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(idx + 1);
  };

  // Handle auto-slide
  useEffect(() => {
    if (numImages <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, numImages]);

  // Infinite loop logic: handle jump after animation
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    if (currentIndex === 0) {
      setCurrentIndex(numImages);
    } else if (currentIndex === numImages + 1) {
      setCurrentIndex(1);
    }
  };

  // Maps currentIndex to the indicator dots (0 to numImages-1)
  const indicatorIndex = ((currentIndex - 1) % numImages + numImages) % numImages;

  return (
    <div className="relative w-full overflow-hidden py-10 md:py-16 group select-none bg-slate-50/50 dark:bg-black/20">
      
      {/* Main Track */}
      <div className="relative overflow-visible">
        <motion.div
          className="flex items-center cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={() => setIsAnimating(true)}
          onDragEnd={(_, info) => {
            setIsAnimating(false);
            if (info.offset.x < -100) nextSlide();
            else if (info.offset.x > 100) prevSlide();
          }}
          animate={{ x: `calc(50% - ${currentIndex * slideWidth}% - ${slideWidth / 2}%)` }}
          transition={isAnimating ? { type: "spring", stiffness: 200, damping: 25, mass: 1 } : { duration: 0 }}
          onAnimationComplete={handleAnimationComplete}
        >
          {images.map((img, i) => {
            // Calculate active state for clones correctly
            const isActualCurrent = i === currentIndex || 
              (currentIndex === 0 && i === numImages) || 
              (currentIndex === numImages + 1 && i === 1);

            return (
              <motion.div
                key={i}
                className="flex-shrink-0 relative aspect-[16/9] md:aspect-[21/9] overflow-hidden shadow-2xl bg-slate-100 dark:bg-zinc-900"
                style={{ 
                  width: `${slideWidth}%`,
                }}
                animate={{
                  scale: isActualCurrent ? 1 : 0.92,
                  opacity: isActualCurrent ? 1 : 0.45,
                  filter: isActualCurrent ? 'blur(0px)' : 'blur(2px)',
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {/* Blurred background (letterbox fill) - High opacity and large blur for a clean look */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-3xl scale-125 opacity-70"
                  style={{ backgroundImage: `url('${img}')` }}
                />
                
                {/* Reference-style subtle light/dark overlay on the blur itself to keep it 'clean' */}
                <div className="absolute inset-0 bg-white/10 dark:bg-black/20 z-0" />
                
                {/* Sharp foreground image without cropping */}
                <img 
                  src={img} 
                  className="relative w-full h-full object-contain z-10 drop-shadow-2xl" 
                  alt="" 
                />

                {/* Reference-style dark overlay for non-active slides */}
                {!isActualCurrent && (
                  <div className="absolute inset-0 bg-black/30 z-20 pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Navigation arrows (Reference style) */}
      {numImages > 1 && (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-10 z-20">
            <button
              onClick={prevSlide}
              className="md:p-5 p-4 rounded-full bg-white/20 backdrop-blur-md text-slate-900 dark:text-white shadow-xl border border-white/20 transition-all hover:bg-white/40 active:scale-95"
              aria-label="Previous image"
            >
              <svg className="size-6 md:size-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-10 z-20">
            <button
              onClick={nextSlide}
              className="md:p-5 p-4 rounded-full bg-white/20 backdrop-blur-md text-slate-900 dark:text-white shadow-xl border border-white/20 transition-all hover:bg-white/40 active:scale-95"
              aria-label="Next image"
            >
              <svg className="size-6 md:size-8" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Indicators Bar (Tesla/Apple style minimalist) */}
          <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3 items-center">
            {baseImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`transition-all duration-700 ease-in-out rounded-full ${
                  idx === indicatorIndex 
                  ? 'bg-white w-8 h-1 md:w-10' // Active line
                  : 'bg-white/40 w-1.5 h-1.5 md:w-2 md:h-2 hover:bg-white/60' // Inactive dot
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
