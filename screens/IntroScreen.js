import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
const SLIDES = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1470&auto=format&fit=crop",
        title: "Stilini\nYönet.",
        subtitle: "Gardırobundaki kaosu, kişisel stilinin\nen güçlü silahına dönüştür.",
        btnText: "Devam Et"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1473&auto=format&fit=crop",
        title: "Sihri\nKeşfet.",
        subtitle: "Yapay zeka asistanın ile her gün\npodyum ışıltısını yakala.",
        btnText: "Lova'ya Giriş"
    }
];
export const IntroScreen = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const handleNext = () => {
        if (isAnimating)
            return;
        if (currentSlide < SLIDES.length - 1) {
            setIsAnimating(true);
            setCurrentSlide(prev => prev + 1);
            setTimeout(() => setIsAnimating(false), 800);
        }
        else {
            onComplete();
        }
    };
    return (_jsxs("div", { className: "fixed inset-0 z-[100] bg-page font-sans overflow-hidden", children: [SLIDES.map((slide, index) => (_jsxs("div", { className: `absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`, children: [_jsxs("div", { className: "absolute inset-0 bg-primary", children: [_jsx("img", { src: slide.image, alt: "Intro Visual", className: `w-full h-full object-cover opacity-90 transition-transform duration-[10s] ease-out ${index === currentSlide ? 'scale-110' : 'scale-100'}` }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent opacity-90" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent" })] }), _jsx("div", { className: "absolute inset-0 flex flex-col justify-end p-8 pb-32", children: _jsxs("div", { className: `transition-all duration-1000 delay-300 transform ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`, children: [_jsx("h1", { className: "text-6xl font-serif leading-[0.9] mb-6 tracking-tight text-page", children: slide.title }), _jsx("div", { className: "w-16 h-1 bg-accent mb-6 rounded-full" }), _jsx("p", { className: "text-border text-sm font-light leading-relaxed max-w-[280px]", children: slide.subtitle })] }) })] }, slide.id))), _jsx("div", { className: "absolute top-12 left-8 flex gap-2 z-20", children: SLIDES.map((_, i) => (_jsx("div", { className: `h-0.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-10 bg-accent' : 'w-4 bg-white/20'}` }, i))) }), _jsx("div", { className: "absolute bottom-6 left-0 right-0 text-center z-20 opacity-40", children: _jsx("p", { className: "text-[9px] font-bold tracking-[0.3em] uppercase font-sans text-white/50", children: "Developed by RACA LABS" }) }), _jsx("div", { className: "absolute bottom-10 right-8 z-30", children: _jsxs("button", { onClick: handleNext, className: "group relative flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-accent/30 rounded-full blur-xl group-hover:bg-accent/50 transition-all duration-500" }), _jsxs("div", { className: "relative bg-page/10 backdrop-blur-xl border border-page/20 pl-6 pr-2 py-2 rounded-full flex items-center gap-4 transition-all duration-300 group-hover:bg-page group-hover:text-primary group-active:scale-95 text-page", children: [_jsx("span", { className: "text-[10px] font-bold uppercase tracking-[0.2em] pt-0.5", children: SLIDES[currentSlide].btnText }), _jsx("div", { className: "w-10 h-10 bg-accent rounded-full flex items-center justify-center text-page shadow-lg group-hover:bg-primary transition-colors", children: currentSlide === SLIDES.length - 1 ? (_jsx(Sparkles, { size: 16, strokeWidth: 1.5, fill: "currentColor", className: "text-white/90" })) : (_jsx(ArrowRight, { size: 18, strokeWidth: 1.5 })) })] })] }) })] }));
};
