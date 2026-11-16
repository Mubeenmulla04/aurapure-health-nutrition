import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export interface SlideData {
  _id: string;
  title: string;
  heading: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  imageAltText: string;
  ctaText: string;
  ctaLink: string;
  badgeText?: string;
  displayOrder: number;
}

const fallbackSlides: SlideData[] = [
  {
    _id: 'default_1',
    title: 'Clean Plant Protein Launch',
    heading: 'Pure Plant Power. Zero Compromise.',
    subtitle:
      'Cold-pressed organic plant protein with papain & bromelain enzymes plus KSM-66 Ashwagandha. 100% gentle on Indian stomachs.',
    desktopImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1920&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
    imageAltText: 'AuraPure Organic Plant Protein Powder',
    ctaText: 'Shop Clean Proteins',
    ctaLink: '/collections/plant-protein-powder',
    badgeText: 'Zero Bloat Guarantee • 25g Pure Protein',
    displayOrder: 0,
  },
  {
    _id: 'default_2',
    title: 'Daily Super Greens & Detox',
    heading: 'Daily Cellular Reset. Feel The Vitality.',
    subtitle:
      'Organic Moringa, Spirulina, Chlorella & Wheatgrass sourced directly from certified organic farms across India.',
    desktopImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1920&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    imageAltText: 'AuraPure Daily Greens & Superfoods',
    ctaText: 'Explore Superfoods',
    ctaLink: '/collections/superfoods-greens',
    badgeText: '30+ Alkalizing Whole Greens',
    displayOrder: 1,
  },
  {
    _id: 'default_3',
    title: 'Golden Turmeric Super-Elixir',
    heading: 'Ayurvedic Restorative Elixir.',
    subtitle:
      '7.5% Natural Curcumin blended with organic Ceylon cinnamon and BioPerine piperine for maximum cellular absorption.',
    desktopImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1920&q=80',
    mobileImage: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    imageAltText: 'AuraPure Ayurvedic Golden Turmeric',
    ctaText: 'Discover Daily Wellness',
    ctaLink: '/collections/daily-wellness',
    badgeText: 'High-Curcumin Lakadong Turmeric',
    displayOrder: 2,
  },
];

export const HeroSlideshow: React.FC = () => {
  const [slides, setSlides] = useState<SlideData[]>(fallbackSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance in px
  const minSwipeDistance = 50;

  // Fetch active slides from API
  useEffect(() => {
    api
      .get('/slides/active')
      .then((res) => {
        if (res.data?.data?.slides && res.data.data.slides.length > 0) {
          setSlides(res.data.data.slides);
        }
      })
      .catch(() => {
        // Fallbacks remain in place on error
      });
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  // Autoplay timer (4.5s), pauses on hover or touch
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    // Respect user reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(interval);
  }, [slides.length, isPaused, nextSlide]);

  // Pause when browser tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Touch Swipe Handlers for Mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  if (!slides.length) return null;

  return (
    <div
      className="relative w-full overflow-hidden bg-brand-secondary/40 select-none group/slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides Viewport - Compact Responsive Height: 210-230px (Mobile), 300-360px (Tablet), 420-450px (Desktop) */}
      <div className="relative h-[210px] xs:h-[230px] sm:h-[300px] md:h-[360px] lg:h-[420px] xl:h-[450px] w-full">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide._id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Dual-Viewport Responsive Image with Zero Distortion */}
              <picture className="absolute inset-0 w-full h-full">
                <source media="(max-width: 639px)" srcSet={slide.mobileImage} />
                <img
                  src={slide.desktopImage}
                  alt={slide.imageAltText || slide.heading}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover object-center"
                />
              </picture>

              {/* Dynamic Gradient Overlays for High Legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10 sm:from-black/80 sm:via-black/45 sm:to-transparent" />

              {/* Text & CTA Content Layer (Vertically centered, scaled typography) */}
              <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-center">
                <div className="max-w-xs sm:max-w-md lg:max-w-xl text-white space-y-1 xs:space-y-1.5 sm:space-y-3 lg:space-y-4">
                  {slide.badgeText && (
                    <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9px] xs:text-[10px] sm:text-xs font-semibold tracking-wide shadow-sm">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-brand-gold flex-shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-none">{slide.badgeText}</span>
                    </div>
                  )}

                  <h1 className="font-serif text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
                    {slide.heading}
                  </h1>

                  <p className="text-[11px] sm:text-xs md:text-sm lg:text-base text-white/90 leading-snug sm:leading-relaxed font-normal line-clamp-2 max-w-sm sm:max-w-md lg:max-w-lg drop-shadow-sm">
                    {slide.subtitle}
                  </p>

                  <div className="pt-0.5 sm:pt-1">
                    <Link
                      to={slide.ctaLink}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 lg:py-3 rounded-full bg-brand-gold hover:bg-amber-400 text-brand-dark font-bold text-[11px] sm:text-xs md:text-sm tracking-wide transition-all shadow-md active:scale-95 group"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Navigation Arrows (Hidden on mobile touch screens) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md border border-white/30 items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 hover:scale-105 active:scale-95 shadow-md"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md border border-white/30 items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 hover:scale-105 active:scale-95 shadow-md"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </>
      )}

      {/* Pagination Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-brand-gold shadow-sm'
                  : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
