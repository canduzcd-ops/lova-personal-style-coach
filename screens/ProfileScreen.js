import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button, Input } from '../components/Shared';
import { Crown, BarChart2, Calendar, Mail, User, ArrowLeft, LogOut, Lock, Edit2, Save, Smile, Palette, Camera, Sparkles, Eye, Sun, Heart, Bell, BellOff, } from 'lucide-react';
import { pushService } from '../services/pushService';
import { authService } from '../services/authService';
import { analyzeFaceForMakeup } from '../services/aiService';
import { enable as enableLocalNotifications, cancelAll as cancelAllLocalNotifications, isSupported as notificationsSupported, } from '../services/notificationService';
import { useImagePicker } from '../hooks/useImagePicker';
import { ImagePickerModal } from '../components/ImagePickerModal';
import { usePremium } from '../contexts/PremiumContext';
import { Toast } from '../components/Toast';
import * as engagementLocal from '../services/engagementLocal';
import { optimizeImageDataUrl } from '../services/imageOptimizer';
// ✅ Yeni: canvas yerine ortak optimizer
const compressImage = async (base64) => {
    try {
        return await optimizeImageDataUrl(base64, {
            maxDimension: 800,
            quality: 0.8,
            mimeType: 'image/jpeg',
        });
    }
    catch {
        return base64;
    }
};
// Body Type Calculation Logic
const calculateBodyType = (m) => {
    const { bust, waist, hips } = m;
    // Simplistic Logic
    if (waist > bust && waist > hips) {
        return {
            type: 'elma',
            name: 'Elma',
            desc: 'İmparator kesim elbiseler ve dökümlü üstler ile zarif bir silüet oluşturabilirsin.',
        };
    }
    else if (hips > bust * 1.05) {
        return {
            type: 'armut',
            name: 'Armut',
            desc: 'A-kesim etekler ve omuzları geniş gösteren üstler ile denge sağlayabilirsin.',
        };
    }
    else if (bust > hips * 1.05) {
        return {
            type: 'ters_ucgen',
            name: 'Ters Üçgen',
            desc: 'V yakalı üstler ve hacimli etekler/pantolonlar ile alt vücudu dengeleyebilirsin.',
        };
    }
    else if (bust - waist > 15 && hips - waist > 15) {
        return {
            type: 'kum_saati',
            name: 'Kum Saati',
            desc: 'Bel vurgulu elbiseler, kısa ceketler ve yüksek bel pantolonlar vücut oranlarını en iyi şekilde öne çıkarır.',
        };
    }
    else {
        return {
            type: 'dikdortgen',
            name: 'Dikdörtgen',
            desc: 'Bel oyuntusu yaratan kemerli parçalar ve asimetrik kesimler sana çok yakışır.',
        };
    }
};
const BodyMeasurementsCard = ({ user, onOpenPremium, onSave, }) => {
    const { isPremium } = usePremium();
    const savedM = user.bodyMeasurements;
    const [isEditing, setIsEditing] = useState(!savedM);
    const [form, setForm] = useState({
        height: savedM?.height || 0,
        weight: savedM?.weight || 0,
        bust: savedM?.bust || 0,
        waist: savedM?.waist || 0,
        hips: savedM?.hips || 0,
    });
    const handleChange = (field, val) => {
        // Only allow numbers
        if (!/^\d*$/.test(val))
            return;
        setForm((prev) => ({ ...prev, [field]: Number(val) }));
    };
    const handleSave = () => {
        const result = calculateBodyType(form);
        if (onSave)
            onSave(form, result.type);
        setIsEditing(false);
    };
    const isValid = form.height > 0 &&
        form.weight > 0 &&
        form.bust > 0 &&
        form.waist > 0 &&
        form.hips > 0;
    if (!isPremium) {
        return (_jsxs("div", { className: "relative overflow-hidden rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark mt-6", children: [_jsxs("div", { className: "relative z-10 flex flex-col items-center justify-center p-8 text-center bg-page/60 dark:bg-black/60 backdrop-blur-sm min-h-[200px]", children: [_jsx(Lock, { size: 32, className: "text-secondary mb-3" }), _jsx("h3", { className: "font-serif font-bold text-lg text-primary dark:text-white mb-2", children: "V\u00FCcut \u00D6l\u00E7\u00FClerin" }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark mb-6 max-w-[240px]", children: "V\u00FCcut \u00F6l\u00E7\u00FClerine g\u00F6re ki\u015Fisel stil \u00F6nerileri almak i\u00E7in LOVA Premium\u2019a ge\u00E7." }), _jsx(Button, { onClick: onOpenPremium, variant: "gold", icon: Crown, className: "!py-3 !px-6 !text-xs !w-auto shadow-lg", children: "Premium'a Ge\u00E7" })] }), _jsxs("div", { className: "absolute inset-0 opacity-30 pointer-events-none blur-sm select-none p-6 z-0", children: [_jsx("h3", { className: "text-sm font-bold mb-4", children: "V\u00FCcut \u00D6l\u00E7\u00FClerin" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx("div", { className: "bg-white p-3 rounded-xl", children: "Boy: 170" }), _jsx("div", { className: "bg-white p-3 rounded-xl", children: "Kilo: 60" })] })] })] }));
    }
    if (!isEditing && savedM && user.bodyType) {
        const typeInfo = calculateBodyType(savedM); // Recalculate just for display text consistency
        return (_jsxs("div", { className: "bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-transparent mt-6 relative group", children: [_jsx("button", { onClick: () => setIsEditing(true), className: "absolute top-4 right-4 p-2 bg-white dark:bg-white/10 rounded-full text-secondary hover:text-primary transition-colors", children: _jsx(Edit2, { size: 16 }) }), _jsxs("h3", { className: "text-sm font-bold text-primary dark:text-primary-dark mb-4 px-1 flex items-center gap-2", children: [_jsx(User, { size: 16, className: "text-accent" }), " V\u00FCcut Tipin"] }), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-3xl font-serif text-primary dark:text-white font-bold mb-2", children: typeInfo.name }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark leading-relaxed font-medium", children: typeInfo.desc })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border dark:border-border-dark", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-[9px] uppercase tracking-wider text-secondary", children: "G\u00F6\u011F\u00FCs" }), _jsx("div", { className: "font-bold text-primary dark:text-white", children: savedM.bust })] }), _jsxs("div", { className: "text-center border-l border-r border-border dark:border-border-dark", children: [_jsx("div", { className: "text-[9px] uppercase tracking-wider text-secondary", children: "Bel" }), _jsx("div", { className: "font-bold text-primary dark:text-white", children: savedM.waist })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-[9px] uppercase tracking-wider text-secondary", children: "Basen" }), _jsx("div", { className: "font-bold text-primary dark:text-white", children: savedM.hips })] })] })] }));
    }
    return (_jsxs("div", { className: "bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-border dark:border-border-dark mt-6 animate-fade-in", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "text-sm font-bold text-primary dark:text-primary-dark px-1", children: "V\u00FCcut \u00D6l\u00E7\u00FClerin" }), savedM && (_jsx("button", { onClick: () => setIsEditing(false), className: "text-xs text-secondary hover:text-primary", children: "\u0130ptal" }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsx(Input, { label: "Boy (cm)", value: form.height.toString(), onChange: (v) => handleChange('height', v), placeholder: "170", type: "text" }), _jsx(Input, { label: "Kilo (kg)", value: form.weight.toString(), onChange: (v) => handleChange('weight', v), placeholder: "60", type: "text" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 mb-6", children: [_jsx(Input, { label: "G\u00F6\u011F\u00FCs", value: form.bust.toString(), onChange: (v) => handleChange('bust', v), placeholder: "90", type: "text" }), _jsx(Input, { label: "Bel", value: form.waist.toString(), onChange: (v) => handleChange('waist', v), placeholder: "60", type: "text" }), _jsx(Input, { label: "Basen", value: form.hips.toString(), onChange: (v) => handleChange('hips', v), placeholder: "90", type: "text" })] }), _jsx(Button, { onClick: handleSave, disabled: !isValid, icon: Save, children: "Kaydet ve Analiz Et" })] }));
};
const MakeupAnalysisCard = ({ user, onOpenPremium, onSave, onNotify, }) => {
    const { isPremium } = usePremium();
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isReset, setIsReset] = useState(false);
    // Image picker hook
    const handleImageSelected = (base64) => {
        setSelectedImage(base64);
        setIsReset(false);
    };
    const imagePicker = useImagePicker({
        onImageSelected: handleImageSelected,
        onError: (err) => console.error('Makeup image picker error:', err),
    });
    // Sync state with user prop updates (e.g. when analysis is saved)
    useEffect(() => {
        if (user.makeupAnalysis) {
            setIsReset(false);
        }
    }, [user.makeupAnalysis]);
    const runAnalysis = async () => {
        if (!selectedImage)
            return;
        setLoading(true);
        try {
            const result = await analyzeFaceForMakeup(selectedImage);
            if (result && onSave) {
                // Save analysis along with the image
                onSave({
                    ...result,
                    lastAnalyzed: new Date().toISOString(),
                    userImage: selectedImage,
                });
                setSelectedImage(null); // Clear local image to rely on saved userImage
            }
            else {
                onNotify?.({
                    type: 'info',
                    title: 'Analiz yapılamadı',
                    desc: 'Fotoğraf net olduğundan emin ol.',
                });
            }
        }
        catch (e) {
            const message = e instanceof Error && e.message ? e.message : 'Bir hata oluştu.';
            onNotify?.({ type: 'error', title: 'Analiz hatası', desc: message });
        }
        finally {
            setLoading(false);
        }
    };
    const handleCameraClick = () => {
        setSelectedImage(null);
        setIsReset(true);
        imagePicker.showPicker();
    };
    const triggerUpload = () => {
        imagePicker.showPicker();
    };
    if (!isPremium) {
        return (_jsxs("div", { className: "relative overflow-hidden rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark mt-6", children: [_jsxs("div", { className: "relative z-10 flex flex-col items-center justify-center p-8 text-center bg-page/60 dark:bg-black/60 backdrop-blur-sm min-h-[200px]", children: [_jsx(Lock, { size: 32, className: "text-secondary mb-3" }), _jsx("h3", { className: "font-serif font-bold text-lg text-primary dark:text-white mb-2", children: "Y\u00FCz\u00FCne G\u00F6re Makyaj \u00D6nerin" }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark mb-6 max-w-[240px]", children: "Makyajs\u0131z y\u00FCz foto\u011Fraf\u0131na g\u00F6re ki\u015Fisel makyaj \u00F6nerileri almak i\u00E7in LOVA Premium\u2019a ge\u00E7." }), _jsx(Button, { onClick: onOpenPremium, variant: "gold", icon: Crown, className: "!py-3 !px-6 !text-xs !w-auto shadow-lg", children: "Premium'a Ge\u00E7" })] }), _jsxs("div", { className: "absolute inset-0 opacity-30 pointer-events-none blur-sm select-none p-6 z-0", children: [_jsx("h3", { className: "text-sm font-bold mb-4", children: "Makyaj Analizi" }), _jsx("div", { className: "h-32 bg-white rounded-xl mb-4" })] })] }));
    }
    const analysis = user.makeupAnalysis;
    const showResult = analysis && !selectedImage && !isReset;
    if (showResult && analysis) {
        return (_jsxs("div", { className: "bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-transparent mt-6 relative group", children: [_jsx("button", { onClick: handleCameraClick, className: "absolute top-4 right-4 p-2 bg-white dark:bg-white/10 rounded-full text-secondary hover:text-primary transition-colors z-20 shadow-sm", title: "Yeni Foto\u011Fraf Y\u00FCkle", children: _jsx(Camera, { size: 16 }) }), _jsxs("h3", { className: "text-sm font-bold text-primary dark:text-primary-dark mb-4 px-1 flex items-center gap-2", children: [_jsx(Smile, { size: 16, className: "text-accent" }), " Makyaj \u00D6nerin"] }), analysis.userImage && (_jsx("div", { className: "w-20 h-20 rounded-full border-2 border-page dark:border-page-dark overflow-hidden mx-auto mb-6 shadow-md", children: _jsx("img", { src: analysis.userImage, className: "w-full h-full object-cover", alt: "User Face" }) })), _jsxs("div", { className: "flex gap-4 mb-6", children: [_jsxs("div", { className: "flex-1 bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-border dark:border-border-dark", children: [_jsx("div", { className: "text-[9px] uppercase tracking-wider text-secondary", children: "Cilt Tonu" }), _jsx("div", { className: "font-bold text-primary dark:text-white", children: analysis.skinTone })] }), _jsxs("div", { className: "flex-1 bg-white/50 dark:bg-white/5 p-3 rounded-xl border border-border dark:border-border-dark", children: [_jsx("div", { className: "text-[9px] uppercase tracking-wider text-secondary", children: "G\u00F6z \u015Eekli" }), _jsx("div", { className: "font-bold text-primary dark:text-white", children: analysis.eyeShape })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shrink-0 text-accent", children: _jsx(Eye, { size: 16 }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-1", children: "Eyeliner" }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark leading-relaxed font-light", children: analysis.eyeliner })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shrink-0 text-accent", children: _jsx(Palette, { size: 16 }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-1", children: "Far" }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark leading-relaxed font-light", children: analysis.eyeshadow })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shrink-0 text-accent", children: _jsx(Sun, { size: 16 }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-1", children: "All\u0131k" }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark leading-relaxed font-light", children: analysis.blush })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-page dark:bg-page-dark flex items-center justify-center shrink-0 text-accent", children: _jsx(Heart, { size: 16 }) }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-1", children: "Ruj" }), _jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark leading-relaxed font-light", children: analysis.lipstick })] })] })] }), _jsx(ImagePickerModal, { isVisible: imagePicker.isPickerVisible, onClose: () => imagePicker.setPickerVisible(false), onSelectCamera: () => imagePicker.pickImage('camera'), onSelectGallery: () => imagePicker.pickImage('gallery') }), _jsx("input", { type: "file", ref: imagePicker.fileInputRef, hidden: true, accept: "image/*", onChange: imagePicker.handleFileInput })] }));
    }
    return (_jsxs("div", { className: "bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-border dark:border-border-dark mt-6 animate-fade-in", children: [_jsx(ImagePickerModal, { isVisible: imagePicker.isPickerVisible, onClose: () => imagePicker.setPickerVisible(false), onSelectCamera: () => imagePicker.pickImage('camera'), onSelectGallery: () => imagePicker.pickImage('gallery') }), _jsx("input", { type: "file", ref: imagePicker.fileInputRef, hidden: true, accept: "image/*", onChange: imagePicker.handleFileInput }), _jsxs("h3", { className: "text-sm font-bold text-primary dark:text-primary-dark mb-4 px-1 flex items-center gap-2", children: [_jsx(Smile, { size: 16, className: "text-accent" }), " Y\u00FCz\u00FCne G\u00F6re Makyaj \u00D6nerin"] }), !selectedImage ? (_jsxs("div", { className: "text-center py-6", children: [_jsx("p", { className: "text-sm text-secondary dark:text-secondary-dark mb-4", children: "Y\u00FCz hatlar\u0131na en uygun makyaj tekniklerini \u00F6\u011Frenmek i\u00E7in makyajs\u0131z ve ayd\u0131nl\u0131k bir foto\u011Fraf\u0131n\u0131 y\u00FCkle." }), _jsxs("button", { onClick: triggerUpload, className: "w-full py-8 border-2 border-dashed border-border dark:border-border-dark rounded-2xl hover:bg-page/50 dark:hover:bg-page-dark/20 transition-colors flex flex-col items-center gap-2", children: [_jsx(Camera, { size: 32, className: "text-secondary opacity-50" }), _jsx("span", { className: "text-xs font-bold text-primary dark:text-white", children: "Foto\u011Fraf Se\u00E7" })] })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-page dark:border-page-dark shadow-lg relative", children: _jsx("img", { src: selectedImage, className: "w-full h-full object-cover" }) }), _jsx("div", { className: "text-center", children: loading ? (_jsxs("div", { className: "flex flex-col items-center gap-2 text-accent animate-pulse", children: [_jsx(Sparkles, { size: 24 }), _jsx("p", { className: "text-sm font-bold", children: "Stil asistan\u0131n y\u00FCz\u00FCn\u00FC inceliyor..." })] })) : (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setSelectedImage(null), children: "De\u011Fi\u015Ftir" }), _jsx(Button, { onClick: runAnalysis, icon: Sparkles, children: "Analiz Et" })] })) })] }))] }));
};
export const ProfileScreen = ({ user, onBack, onLogout, onOpenPremium, updateUser }) => {
    const joinDate = new Date(user.joinedAt).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const subEndDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate).toLocaleDateString('tr-TR') : null;
    const { isPremium } = usePremium();
    const [toast, setToast] = useState(null);
    // ✅ Avatar: Firestore'a yazmadan önce mutlaka optimize et
    const handleAvatarSelected = async (base64) => {
        console.log('[ProfileScreen] Avatar selected, base64 length:', base64?.length);
        try {
            const optimized = await compressImage(base64);
            console.log('[ProfileScreen] Avatar optimized, length:', optimized?.length);
            if (updateUser) {
                const newUser = { ...user, avatar_url: optimized };
                updateUser(newUser);
                await authService.updateProfile(newUser);
                console.log('[ProfileScreen] Avatar saved successfully');
                setToast({ type: 'success', title: 'Profil fotoğrafı güncellendi' });
            }
        }
        catch (err) {
            console.error('[ProfileScreen] Avatar optimize/save error:', err);
            setToast({ type: 'error', title: 'Avatar kaydedilemedi', desc: 'Lütfen tekrar dene.' });
        }
    };
    const avatarImagePicker = useImagePicker({
        onImageSelected: handleAvatarSelected,
        onError: (err) => {
            console.error('[ProfileScreen] Avatar image picker error:', err);
            setToast({ type: 'error', title: 'Fotoğraf seçilemedi', desc: err?.message || 'Lütfen tekrar dene.' });
        },
    });
    const handleSaveMeasurements = async (m, type) => {
        if (updateUser) {
            const newUser = { ...user, bodyMeasurements: m, bodyType: type };
            updateUser(newUser);
            await authService.updateProfile(newUser);
        }
    };
    const handleSaveMakeupAnalysis = async (result) => {
        if (updateUser) {
            const newUser = { ...user, makeupAnalysis: result };
            updateUser(newUser);
            await authService.updateProfile(newUser);
        }
    };
    const handleEnableNotifications = async () => {
        if (!notificationsSupported()) {
            setToast({ type: 'info', title: 'Sadece mobilde çalışır' });
            return;
        }
        try {
            await enableLocalNotifications();
            setToast({ type: 'success', title: 'Bildirim açıldı', desc: '5 saniye içinde test bildirimi gelecek.' });
        }
        catch (err) {
            console.error('Bildirim etkinleştirme hatası', err);
            setToast({ type: 'error', title: 'Bildirim açılamadı', desc: 'Lütfen tekrar dene.' });
        }
    };
    const handleDisableNotifications = async () => {
        if (!notificationsSupported()) {
            setToast({ type: 'info', title: 'Sadece mobilde çalışır' });
            return;
        }
        try {
            await cancelAllLocalNotifications();
            setToast({ type: 'info', title: 'Bildirimler kapatıldı' });
        }
        catch (err) {
            console.error('Bildirim kapatma hatası', err);
            setToast({ type: 'error', title: 'Bildirim kapatılamadı', desc: 'Lütfen tekrar dene.' });
        }
    };
    const handleEnablePush = async () => {
        if (!pushService.isSupported()) {
            setToast({ type: 'info', title: 'Sadece mobilde çalışır' });
            return;
        }
        await pushService.register();
    };
    const handleDisablePush = () => {
        setToast({ type: 'info', title: 'Push kapatma yakında eklenecek' });
    };
    // Debug logging for picker visibility
    console.log('[ProfileScreen] Render, isPickerVisible:', avatarImagePicker.isPickerVisible);
    return (_jsxs("div", { className: "h-full flex flex-col bg-page dark:bg-page-dark animate-slide-up overflow-y-auto pb-20", children: [_jsx(ImagePickerModal, { isVisible: avatarImagePicker.isPickerVisible, onClose: () => {
                    console.log('[ProfileScreen] ImagePickerModal onClose called');
                    avatarImagePicker.setPickerVisible(false);
                }, onSelectCamera: () => {
                    console.log('[ProfileScreen] Camera selected from modal');
                    avatarImagePicker.pickImage('camera');
                }, onSelectGallery: () => {
                    console.log('[ProfileScreen] Gallery selected from modal');
                    avatarImagePicker.pickImage('gallery');
                } }), _jsx("input", { type: "file", ref: avatarImagePicker.fileInputRef, hidden: true, accept: "image/*", onChange: avatarImagePicker.handleFileInput }), _jsxs("div", { className: "px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-page/80 dark:bg-page-dark/80 backdrop-blur-xl z-10", children: [_jsx("button", { onClick: onBack, className: "p-2 -ml-2 hover:bg-surface dark:hover:bg-surface-dark rounded-full transition-colors", children: _jsx(ArrowLeft, { size: 24, className: "text-primary dark:text-primary-dark" }) }), _jsx("h2", { className: "text-xl font-serif font-bold text-primary dark:text-primary-dark", children: "Profilim" }), _jsx("div", { className: "w-10" })] }), _jsxs("div", { className: "px-6 mt-4", children: [_jsxs("div", { className: "flex flex-col items-center mb-8", children: [_jsxs("button", { onClick: () => {
                                    console.log('[ProfileScreen] Avatar button clicked, showing picker...');
                                    console.log('[ProfileScreen] isPickerVisible before:', avatarImagePicker.isPickerVisible);
                                    avatarImagePicker.showPicker();
                                    console.log('[ProfileScreen] showPicker() called');
                                }, className: "w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-accent to-accent-soft mb-4 shadow-lg relative group active:scale-95 transition-transform", children: [_jsxs("div", { className: "w-full h-full rounded-full bg-page dark:bg-page-dark overflow-hidden border-4 border-page dark:border-page-dark relative", children: [user.avatar_url ? (_jsx("img", { src: user.avatar_url, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center bg-surface dark:bg-surface-dark text-4xl font-serif text-primary dark:text-primary-dark", children: user.name.charAt(0).toUpperCase() })), _jsx("div", { className: "absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Camera, { size: 24, className: "text-white drop-shadow-md" }) })] }), isPremium && (_jsx("div", { className: "absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full border-4 border-page dark:border-page-dark shadow-sm z-10", children: _jsx(Crown, { size: 14, fill: "currentColor" }) }))] }), _jsx("h1", { className: "text-2xl font-serif font-bold text-primary dark:text-primary-dark", children: user.name }), _jsx("p", { className: "text-secondary dark:text-secondary-dark text-sm font-medium mt-1", children: user.email }), _jsxs("div", { className: "mt-3 px-3 py-1 bg-surface dark:bg-surface-dark rounded-full text-[10px] font-bold uppercase tracking-widest text-secondary dark:text-secondary-dark", children: [joinDate, " tarihinden beri \u00FCye"] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-8", children: [_jsxs("div", { className: "bg-surface dark:bg-surface-dark p-5 rounded-2xl border border-transparent hover:border-border dark:border-border-dark transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2 text-accent", children: [_jsx(BarChart2, { size: 18 }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Dolap" })] }), _jsx("div", { className: "text-2xl font-serif text-primary dark:text-white font-bold", children: user.usage.wardrobeCount }), _jsx("div", { className: "text-xs text-secondary dark:text-secondary-dark", children: "Par\u00E7a Eklendi" })] }), _jsxs("div", { className: "bg-surface dark:bg-surface-dark p-5 rounded-2xl border border-transparent hover:border-border dark:border-border-dark transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2 text-accent", children: [_jsx(Calendar, { size: 18 }), _jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Analiz" })] }), _jsx("div", { className: "text-2xl font-serif text-primary dark:text-white font-bold", children: user.usage.dailyScanCount }), _jsx("div", { className: "text-xs text-secondary dark:text-secondary-dark", children: "Bug\u00FCnk\u00FC Kullan\u0131m" })] })] }), _jsxs("div", { className: "bg-surface dark:bg-surface-dark p-5 rounded-2xl border border-border dark:border-border-dark mb-8", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-page dark:bg-page-dark flex items-center justify-center text-accent", children: _jsx(Bell, { size: 18 }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-primary dark:text-primary-dark", children: "Bildirimler" }), _jsx("p", { className: "text-xs text-secondary dark:text-secondary-dark", children: "Test bildirimi planlamak i\u00E7in izni a\u00E7." })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 mb-3", children: [_jsx(Button, { onClick: handleEnableNotifications, icon: Bell, children: "Bildirimleri A\u00E7 (Test)" }), _jsx(Button, { onClick: handleDisableNotifications, variant: "secondary", icon: BellOff, children: "Bildirimleri Kapat" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx(Button, { onClick: handleEnablePush, icon: Bell, children: "Push'i A\u00E7" }), _jsx(Button, { onClick: handleDisablePush, variant: "secondary", icon: BellOff, children: "Push'i Kapat" })] })] }), _jsx(BodyMeasurementsCard, { user: user, onOpenPremium: onOpenPremium, onSave: handleSaveMeasurements }), _jsx(MakeupAnalysisCard, { user: user, onOpenPremium: onOpenPremium, onSave: handleSaveMakeupAnalysis, onNotify: (payload) => setToast(payload) }), _jsxs("div", { className: "mb-8 mt-8", children: [_jsx("h3", { className: "text-sm font-bold text-primary dark:text-primary-dark mb-4 px-1", children: "\u00DCyelik Durumu" }), _jsxs("div", { className: "bg-gradient-to-br from-primary to-[#2a1e1b] dark:from-surface-dark dark:to-black rounded-2xl p-6 text-page relative overflow-hidden shadow-soft", children: [_jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-[0.2em] opacity-70 mb-1", children: "Mevcut Plan" }), _jsx("div", { className: "text-2xl font-serif italic", children: isPremium ? 'Lova Premium' : 'Lova Free' })] }), isPremium && _jsx(Crown, { size: 24, className: "text-accent" })] }), isPremium ? (_jsxs("div", { className: "text-sm opacity-80 font-light", children: ["\u00DCyeli\u011Finiz ", _jsx("span", { className: "font-bold text-accent", children: subEndDate }), " tarihine kadar aktiftir."] })) : (_jsxs("div", { children: [_jsx("p", { className: "text-sm opacity-80 font-light mb-4", children: "Daha fazla \u00F6zellik i\u00E7in Premium'a ge\u00E7in." }), _jsx(Button, { onClick: onOpenPremium, variant: "gold", className: "!py-3 !text-xs", children: "Y\u00FCkselt" })] }))] }), _jsx("div", { className: "absolute -right-8 -bottom-8 w-32 h-32 bg-accent/10 rounded-full blur-2xl" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "text-sm font-bold text-primary dark:text-primary-dark mb-2 px-1", children: "Hesap" }), _jsxs("button", { className: "w-full flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-border dark:border-border-dark rounded-xl text-left hover:bg-surface dark:hover:bg-surface-dark transition-colors", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center text-primary dark:text-white", children: _jsx(User, { size: 16 }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-bold text-primary dark:text-white", children: "Ki\u015Fisel Bilgiler" }), _jsx("div", { className: "text-xs text-secondary dark:text-secondary-dark", children: "\u0130sim ve stil tercihlerini d\u00FCzenle" })] })] }), _jsxs("button", { className: "w-full flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-border dark:border-border-dark rounded-xl text-left hover:bg-surface dark:hover:bg-surface-dark transition-colors", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center text-primary dark:text-white", children: _jsx(Mail, { size: 16 }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-bold text-primary dark:text-white", children: "E-posta Tercihleri" }), _jsx("div", { className: "text-xs text-secondary dark:text-secondary-dark", children: user.email })] })] }), _jsxs("div", { className: "mt-6 p-4 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Bell, { size: 16, className: "text-secondary dark:text-secondary-dark" }), _jsx("h3", { className: "text-sm font-bold text-primary dark:text-white", children: "Bildirim Tercihleri" })] }), _jsxs("div", { className: "flex items-center justify-between mb-3 pb-3 border-b border-border dark:border-border-dark", children: [_jsx("label", { className: "text-xs text-secondary dark:text-secondary-dark", children: "Bildirimleri A\u00E7" }), _jsx("button", { onClick: () => {
                                                    const newState = !engagementLocal.isNotifEnabled();
                                                    engagementLocal.setNotifEnabled(newState);
                                                    setToast({ type: 'info', title: newState ? 'Bildirimler açıldı' : 'Bildirimler kapatıldı' });
                                                }, className: `w-12 h-6 rounded-full transition-colors ${engagementLocal.isNotifEnabled() ? 'bg-accent dark:bg-accent-dark' : 'bg-border dark:bg-border-dark'}`, children: _jsx("div", { className: `w-5 h-5 rounded-full bg-white transition-transform ${engagementLocal.isNotifEnabled() ? 'translate-x-6' : 'translate-x-0.5'}` }) })] }), _jsxs("div", { className: "mb-3 pb-3 border-b border-border dark:border-border-dark", children: [_jsx("div", { className: "text-xs text-secondary dark:text-secondary-dark mb-1", children: "Sessiz Saatler" }), _jsx("div", { className: "text-xs font-semibold text-primary dark:text-white", children: "22:00 \u2013 09:00" })] }), engagementLocal.isPushEnabled() && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-green-500" }), _jsx("span", { className: "text-xs text-green-600 dark:text-green-400", children: "Push aktif" })] }))] }), _jsxs("button", { onClick: onLogout, className: "w-full flex items-center gap-4 p-4 mt-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors", children: [_jsx(LogOut, { size: 18 }), _jsx("span", { className: "text-sm font-bold", children: "\u00C7\u0131k\u0131\u015F Yap" })] })] }), toast && (_jsx(Toast, { type: toast.type, title: toast.title, desc: toast.desc, onClose: () => setToast(null) }))] })] }));
};
