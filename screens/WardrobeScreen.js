import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, X, Loader2, Shirt, ImageIcon, Camera, Sparkles } from 'lucide-react';
import { Button, Input } from '../components/Shared';
import { WARDROBE_CATEGORIES } from '../constants';
import { analyzeImage } from '../services/aiService';
import { authService } from '../services/authService';
import { wardrobeService } from '../services/wardrobeService';
import { useTranslation } from 'react-i18next';
import { useImagePicker } from '../hooks/useImagePicker';
// Simplified compression logic
const compressImage = (base64) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            }
            else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            }
            else
                resolve(base64);
        };
        img.onerror = () => resolve(base64);
    });
};
const FastImage = React.memo(({ src, alt }) => {
    const [loaded, setLoaded] = useState(false);
    return (_jsx("div", { className: "w-full h-full bg-surface dark:bg-surface-dark relative overflow-hidden flex items-center justify-center", children: src ? (_jsx("img", { src: src, alt: alt, loading: "lazy", onLoad: () => setLoaded(true), className: `w-full h-full object-cover transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}` })) : (_jsx(Shirt, { size: 20, className: "text-border dark:text-border-dark opacity-50" })) }));
});
const WardrobeGridItem = React.memo(({ item, onClick }) => {
    return (_jsxs("button", { onClick: () => onClick(item), className: "w-full aspect-[3/4] outline-none active:scale-[0.97] transition-all duration-300 group relative", children: [_jsxs("div", { className: "w-full h-full rounded-2xl overflow-hidden relative border border-border/50 dark:border-border-dark bg-surface dark:bg-surface-dark shadow-sm", children: [_jsx(FastImage, { src: item.image, alt: item.name }), _jsx("div", { className: "absolute inset-x-0 bottom-0 pt-10 pb-3 px-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300", children: _jsx("p", { className: "text-xs font-bold text-white truncate text-left drop-shadow-md", children: item.name }) })] }), _jsx("div", { className: "absolute top-2 right-2 bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-primary dark:text-white shadow-sm", children: item.type })] }));
}, (prev, next) => prev.item.id === next.item.id);
export const WardrobeScreen = ({ user, updateUser, onStatsUpdate, onTriggerPremium, onGenerateWithItem }) => {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [filter, setFilter] = useState('all');
    // Modal States
    const [selectedItem, setSelectedItem] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    // Add Flow States
    const [addItemStep, setAddItemStep] = useState('source');
    const [newItemImg, setNewItemImg] = useState(null);
    const [newItemName, setNewItemName] = useState('');
    const [newItemType, setNewItemType] = useState('ust');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Image Picker Hook
    const handleImageSelected = async (base64) => {
        setAddItemStep('preview');
        setIsAnalyzing(true);
        setNewItemImg(base64);
        // AI Analysis
        try {
            const res = await analyzeImage(base64);
            if (res) {
                setNewItemName(res.name);
                setNewItemType(res.type);
            }
        }
        catch (err) {
            console.error("AI Analysis Failed", err);
        }
        finally {
            setIsAnalyzing(false);
        }
    };
    const imagePicker = useImagePicker({
        onImageSelected: handleImageSelected,
        onError: (err) => console.error('Image picker error:', err),
    });
    // Scroll Lock Effect
    useEffect(() => {
        if (isAdding || selectedItem) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isAdding, selectedItem]);
    useEffect(() => { loadItems(); }, []);
    const loadItems = async () => {
        try {
            const data = await wardrobeService.getWardrobeItemsForCurrentUser();
            setItems(data);
            onStatsUpdate({ count: data.length, uniqueCategories: new Set(data.map(i => i.type)).size });
        }
        catch (e) {
            console.error(e);
        }
        setLoadingItems(false);
    };
    const filteredItems = useMemo(() => filter === 'all' ? items : items.filter(i => i.type === filter), [items, filter]);
    const resetAddModal = () => {
        setIsAdding(false);
        // Delay reset slightly for animation close
        setTimeout(() => {
            setAddItemStep('source');
            setNewItemImg(null);
            setNewItemName('');
            setNewItemType('ust');
            setIsAnalyzing(false);
        }, 300);
    };
    const handleSave = async () => {
        if (!newItemName)
            return alert(t('wardrobe.alerts.nameRequired'));
        setIsSaving(true);
        try {
            const newItem = await wardrobeService.addWardrobeItem({
                name: newItemName, type: newItemType, image: newItemImg || undefined, color: t('wardrobe.item.unknownColor'), aiTags: undefined
            });
            setItems(prev => [newItem, ...prev]);
            updateUser(await authService.incrementUsage(user, 'wardrobe'));
            resetAddModal();
        }
        catch (e) {
            alert(t('wardrobe.alerts.generic'));
        }
        setIsSaving(false);
    };
    const handleDelete = async (id) => {
        if (!confirm(t('wardrobe.alerts.confirmDelete')))
            return;
        await wardrobeService.deleteWardrobeItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
        setSelectedItem(null);
    };
    return (_jsxs("div", { className: "h-full flex flex-col bg-page dark:bg-page-dark relative", children: [_jsxs("div", { className: "pt-2 pb-2 px-4 bg-page/95 dark:bg-page-dark/95 backdrop-blur-sm sticky top-0 z-30 border-b border-border dark:border-border-dark transition-colors", children: [_jsxs("div", { className: "flex justify-between items-center mb-4 mt-2", children: [_jsx("h2", { className: "text-xl font-serif font-bold text-primary dark:text-primary-dark", children: t('wardrobe.title') }), _jsx("div", { className: "flex gap-2", children: _jsxs("div", { className: "px-3 py-1.5 bg-surface dark:bg-surface-dark rounded-full text-[10px] font-bold text-secondary border border-border dark:border-border-dark", children: [items.length, " ", t('wardrobe.item.count')] }) })] }), _jsxs("div", { className: "flex gap-2 overflow-x-auto no-scrollbar pb-2", children: [_jsx("button", { onClick: () => setFilter('all'), className: `px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${filter === 'all' ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border-transparent hover:bg-border/50'}`, children: t('wardrobe.filters.all') }), WARDROBE_CATEGORIES.map(cat => (_jsx("button", { onClick: () => setFilter(cat.id), className: `px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${filter === cat.id ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border-transparent hover:bg-border/50'}`, children: t(`wardrobe.filters.${cat.id}`, cat.label) }, cat.id)))] })] }), _jsx("div", { className: "flex-1 overflow-y-auto px-4 pt-4 pb-24", children: loadingItems ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-20 gap-4", children: [_jsx(Loader2, { className: "animate-spin text-accent", size: 32 }), _jsx("p", { className: "text-xs text-secondary font-medium tracking-widest uppercase", children: t('wardrobe.loading') })] })) : filteredItems.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [_jsx("div", { className: "w-20 h-20 bg-surface dark:bg-surface-dark rounded-full flex items-center justify-center mb-6 animate-pulse", children: _jsx(Shirt, { size: 32, className: "text-border dark:text-border-dark" }) }), _jsx("p", { className: "text-primary dark:text-primary-dark font-serif text-lg mb-2", children: t('wardrobe.empty.title') }), _jsx("p", { className: "text-secondary dark:text-secondary-dark text-sm max-w-[200px]", children: t('wardrobe.empty.body') })] })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in", children: filteredItems.map(item => (_jsx(WardrobeGridItem, { item: item, onClick: setSelectedItem }, item.id))) })) }), _jsx("div", { className: "absolute bottom-6 right-6 z-40", children: _jsx("button", { onClick: () => setIsAdding(true), className: "w-14 h-14 bg-primary dark:bg-white text-white dark:text-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group", children: _jsx(Plus, { size: 28, className: "group-hover:rotate-90 transition-transform duration-300" }) }) }), _jsx("input", { type: "file", ref: imagePicker.fileInputRef, hidden: true, accept: "image/*", onChange: imagePicker.handleFileInput }), isAdding && (_jsxs("div", { className: "fixed inset-0 z-50 flex justify-end flex-col", children: [_jsx("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300", onClick: resetAddModal }), _jsxs("div", { className: "bg-page dark:bg-page-dark relative z-10 w-full rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up border-t border-white/10 max-h-[90vh] overflow-y-auto flex flex-col", children: [_jsx("div", { className: "w-12 h-1 bg-border dark:bg-border-dark rounded-full mx-auto mb-6 shrink-0" }), _jsxs("div", { className: "flex justify-between items-center mb-6 shrink-0", children: [_jsx("h3", { className: "text-2xl font-serif font-bold text-primary dark:text-primary-dark", children: addItemStep === 'source' ? t('wardrobe.modal.addTitle') : t('wardrobe.modal.editTitle') }), _jsx("button", { onClick: resetAddModal, className: "p-2 bg-surface dark:bg-surface-dark rounded-full hover:bg-border transition-colors", children: _jsx(X, { size: 20, className: "text-primary dark:text-primary-dark" }) })] }), addItemStep === 'source' ? (_jsxs("div", { className: "grid grid-cols-2 gap-4 mb-8", children: [_jsxs("button", { onClick: () => imagePicker.pickImage('gallery'), className: "flex flex-col items-center justify-center gap-3 p-8 bg-surface dark:bg-surface-dark border-2 border-dashed border-border dark:border-border-dark rounded-3xl hover:bg-page dark:hover:bg-page-dark/50 transition-colors group", children: [_jsx("div", { className: "w-12 h-12 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", children: _jsx(ImageIcon, { size: 24, className: "text-accent" }) }), _jsx("span", { className: "font-bold text-sm text-primary dark:text-primary-dark", children: t('wardrobe.modal.selectFromGallery') })] }), _jsxs("button", { onClick: () => imagePicker.pickImage('camera'), className: "flex flex-col items-center justify-center gap-3 p-8 bg-surface dark:bg-surface-dark border-2 border-dashed border-border dark:border-border-dark rounded-3xl hover:bg-page dark:hover:bg-page-dark/50 transition-colors group", children: [_jsx("div", { className: "w-12 h-12 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", children: _jsx(Camera, { size: 24, className: "text-accent" }) }), _jsx("span", { className: "font-bold text-sm text-primary dark:text-primary-dark", children: t('wardrobe.modal.takePhoto') })] })] })) : (_jsxs("div", { className: "space-y-6 flex-1", children: [_jsxs("div", { className: "relative w-full aspect-[4/5] max-h-[300px] mx-auto bg-surface dark:bg-surface-dark rounded-2xl overflow-hidden shadow-inner border border-border dark:border-border-dark group", children: [newItemImg && _jsx("img", { src: newItemImg, className: "w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" }), isAnalyzing && (_jsxs("div", { className: "absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3 animate-in fade-in", children: [_jsx(Loader2, { size: 32, className: "animate-spin text-accent" }), _jsxs("div", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-widest", children: [_jsx(Sparkles, { size: 14, className: "text-accent" }), t('wardrobe.modal.analyzing')] })] })), _jsx("button", { onClick: () => setAddItemStep('source'), className: "absolute bottom-3 right-3 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md", children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx(Input, { label: t('wardrobe.modal.nameLabel'), value: newItemName, onChange: setNewItemName, placeholder: isAnalyzing ? t('wardrobe.modal.namePlaceholderAnalyzing') : t('wardrobe.modal.namePlaceholder') }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-[0.2em] mb-3 ml-1", children: t('wardrobe.modal.categoryLabel') }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: WARDROBE_CATEGORIES.map(c => (_jsx("button", { onClick: () => setNewItemType(c.id), className: `py-3 text-[10px] font-bold uppercase rounded-xl border transition-all duration-200 ${newItemType === c.id ? 'bg-primary text-white border-primary shadow-md scale-[1.02]' : 'bg-surface dark:bg-surface-dark text-secondary dark:text-secondary-dark border-transparent hover:border-border'}`, children: c.label }, c.id))) })] }), _jsx("div", { className: "pt-4", children: _jsx(Button, { onClick: handleSave, disabled: isSaving || isAnalyzing, className: "shadow-xl", children: isSaving ? _jsx(Loader2, { className: "animate-spin" }) : t('wardrobe.modal.addButton') }) })] })] }))] })] })), selectedItem && (_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-page/90 dark:bg-black/90 backdrop-blur-xl animate-in fade-in duration-300", onClick: () => setSelectedItem(null) }), _jsxs("div", { className: "relative z-10 w-full max-w-md h-full sm:h-auto flex flex-col sm:block animate-scale-in p-4 sm:p-0", children: [_jsx("button", { onClick: () => setSelectedItem(null), className: "absolute top-4 right-4 z-20 p-3 bg-black/20 dark:bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors sm:hidden", children: _jsx(X, { size: 24 }) }), _jsxs("div", { className: "bg-transparent sm:bg-page sm:dark:bg-page-dark rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-full sm:h-auto max-h-[90vh]", children: [_jsxs("div", { className: "relative flex-1 sm:aspect-[4/5] bg-surface dark:bg-surface-dark", children: [_jsx("img", { src: selectedItem.image, className: "w-full h-full object-contain sm:object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 sm:to-transparent pointer-events-none" }), _jsx("button", { onClick: () => setSelectedItem(null), className: "absolute top-4 right-4 z-20 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors hidden sm:block", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "p-8 bg-page dark:bg-page-dark rounded-t-[32px] sm:rounded-none -mt-6 sm:mt-0 relative z-10 flex flex-col gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]", children: [_jsx("div", { className: "w-12 h-1.5 bg-border dark:bg-border-dark rounded-full mx-auto sm:hidden opacity-50 mb-2" }), _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-bold text-accent uppercase tracking-[0.2em] mb-2", children: selectedItem.type }), _jsx("h3", { className: "font-serif text-3xl font-bold text-primary dark:text-primary-dark leading-none", children: selectedItem.name })] }), _jsx("button", { onClick: () => handleDelete(selectedItem.id), className: "p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full hover:bg-red-100 transition-colors", children: _jsx(Trash2, { size: 20 }) })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [selectedItem.aiTags?.season?.map(s => (_jsx("span", { className: "px-3 py-1 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-wider", children: s }, s))), selectedItem.aiTags?.fabric && (_jsx("span", { className: "px-3 py-1 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-[10px] font-bold text-secondary dark:text-secondary-dark uppercase tracking-wider", children: selectedItem.aiTags.fabric }))] }), _jsx("div", { className: "pt-4 mt-auto", children: _jsx(Button, { onClick: () => {
                                                        if (onGenerateWithItem) {
                                                            onGenerateWithItem(selectedItem);
                                                            setSelectedItem(null);
                                                        }
                                                    }, variant: "gold", className: "w-full shadow-xl !py-4", icon: Sparkles, children: t('wardrobe.detail.combine') }) })] })] })] })] }))] }));
};
