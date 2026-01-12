import { auth, db } from './firebaseClient';
import firebase from 'firebase/compat/app';
import { setUserContext, track } from './telemetry';
import { Capacitor } from '@capacitor/core';
import { disableToken } from './pushTokenService';
// Hardcoded Premium/Admin Emails
const SPECIAL_EMAILS = ['surailkay@gmail.com', 'test@lova.com', 'test1@lova.com'];
// Helper to map DB row to UserProfile object
const mapDocumentToUser = (id, data) => {
    let isPremium = data.is_premium;
    let subscriptionEndDate = data.subscription_end_date;
    // Check expiration if not lifetime/special
    if (isPremium && subscriptionEndDate) {
        const today = new Date();
        const end = new Date(subscriptionEndDate);
        if (end < today) {
            isPremium = false;
        }
    }
    // Hardcode check for special admin emails on read as well
    if (data.email && SPECIAL_EMAILS.includes(data.email.toLowerCase())) {
        isPremium = true;
    }
    return {
        id: id,
        email: data.email,
        name: data.name,
        styles: data.styles || [],
        joinedAt: data.joined_at,
        isPremium: isPremium || false,
        isGuest: false,
        avatar_url: data.avatar_url,
        subscriptionEndDate: subscriptionEndDate,
        premiumType: data.premium_type,
        theme: data.theme || 'light',
        usage: {
            wardrobeCount: data.wardrobe_count || 0,
            dailyScanCount: data.daily_scan_count || 0,
            lastScanDate: data.last_scan_date || new Date().toISOString().split('T')[0]
        },
        // Map new trial fields
        trialUsage: {
            wardrobeAccessUsed: data.trial_wardrobe_used || false,
            combinationsCount: data.trial_combinations_count || 0
        },
        bodyMeasurements: data.bodyMeasurements || undefined,
        bodyType: data.bodyType || undefined,
        makeupAnalysis: data.makeupAnalysis || undefined,
        styleRating: data.styleRating || undefined
    };
};
export const authService = {
    // STRICT PASSWORD VALIDATION
    validatePassword: (password) => {
        if (password.length < 8)
            return { valid: false, error: "Şifre en az 8 karakter olmalıdır." };
        if (!/[A-Z]/.test(password))
            return { valid: false, error: "Şifre en az 1 büyük harf içermelidir." };
        if (!/\d/.test(password))
            return { valid: false, error: "Şifre en az 1 rakam içermelidir." };
        if (!/[^A-Za-z0-9]/.test(password))
            return { valid: false, error: "Şifre en az 1 özel karakter (!, @, #, vb.) içermelidir." };
        return { valid: true };
    },
    // Login with Firebase
    login: async (email, password) => {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            if (user && !user.emailVerified) {
                // Optional: Force email verification check
            }
            if (!user)
                throw new Error("Kullanıcı bulunamadı.");
            // Fetch Profile Data from Firestore
            const docRef = db.collection("users").doc(user.uid);
            const docSnap = await docRef.get();
            if (!docSnap.exists) {
                console.warn("Profile missing on login, attempting lazy creation...");
                const fallbackProfile = await authService.createDefaultProfileFallback(user, null);
                setUserContext({ id: fallbackProfile.id, email: fallbackProfile.email });
                track('auth_login_success', { hasUser: true });
                return fallbackProfile;
            }
            const mapped = mapDocumentToUser(user.uid, docSnap.data());
            setUserContext({ id: mapped.id, email: mapped.email });
            track('auth_login_success', { hasUser: true });
            return mapped;
        }
        catch (error) {
            console.error("Login error:", error);
            let msg = "Giriş yapılamadı.";
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                msg = "Hatalı e-posta veya şifre.";
            }
            else if (error.code === 'auth/too-many-requests') {
                msg = "Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.";
            }
            track('auth_login_failed', { error: error.code, errorCode: msg });
            throw new Error(msg);
        }
    },
    // Register with Firebase
    register: async (email, password, name, styles) => {
        // 1. Password Check
        const pwCheck = authService.validatePassword(password);
        if (!pwCheck.valid)
            throw new Error(pwCheck.error);
        try {
            // 2. Create Auth User
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            if (!user)
                throw new Error("Kullanıcı oluşturulamadı.");
            // 3. Send Verification Email
            await user.sendEmailVerification();
            // 4. Create Firestore Document
            const newProfile = {
                email: email,
                name: name,
                styles: styles,
                joined_at: new Date().toISOString(),
                // Premium fields are controlled server-side; keep default values on client create
                is_premium: false,
                premium_type: null,
                subscription_end_date: null,
                theme: 'light',
                wardrobe_count: 0,
                daily_scan_count: 0,
                last_scan_date: new Date().toISOString().split('T')[0],
                // Trial Logic
                trial_wardrobe_used: false,
                trial_combinations_count: 0
            };
            await db.collection("users").doc(user.uid).set(newProfile);
            // Track registration success
            track('auth_register_success', { hasUser: true });
            // Return null to enforce "Check your email" flow in the UI
            return null;
        }
        catch (error) {
            console.error("Register error:", error);
            let msg = "Kayıt işlemi başarısız.";
            if (error.code === 'auth/email-already-in-use') {
                msg = "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.";
            }
            else if (error.code === 'auth/weak-password') {
                msg = "Şifre çok zayıf.";
            }
            else if (error.code === 'auth/invalid-email') {
                msg = "Geçersiz e-posta adresi.";
            }
            track('auth_register_failed', { error: error.code, errorCode: msg });
            throw new Error(msg);
        }
    },
    // Fallback profile creation
    createDefaultProfileFallback: async (user, metaData) => {
        const isSpecialAdmin = user.email && SPECIAL_EMAILS.includes(user.email.toLowerCase());
        const newProfile = {
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
            styles: ['minimal'],
            joined_at: new Date().toISOString(),
            // Premium flags remain default on client-created docs
            is_premium: false,
            premium_type: null,
            subscription_end_date: null,
            theme: 'light',
            wardrobe_count: 0,
            daily_scan_count: 0,
            last_scan_date: new Date().toISOString().split('T')[0],
            trial_wardrobe_used: false,
            trial_combinations_count: 0
        };
        await db.collection("users").doc(user.uid).set(newProfile);
        const mapped = mapDocumentToUser(user.uid, newProfile);
        setUserContext({ id: mapped.id, email: mapped.email });
        return mapped;
    },
    // Password Reset
    resetPassword: async (email) => {
        const cleanedEmail = email.trim();
        if (!cleanedEmail)
            throw new Error("Geçerli bir e-posta adresi girin.");
        try {
            await auth.sendPasswordResetEmail(cleanedEmail);
        }
        catch (error) {
            let msg = "Şifre sıfırlama e-postası gönderilemedi.";
            if (error?.code === 'auth/invalid-email')
                msg = "Geçersiz e-posta adresi.";
            else if (error?.code === 'auth/user-not-found')
                msg = "Bu e-posta ile kayıt bulunamadı.";
            else if (error?.code === 'auth/too-many-requests')
                msg = "Çok fazla deneme. Bir süre sonra tekrar deneyin.";
            throw new Error(msg);
        }
    },
    // Resend Verification
    resendVerification: async (email) => {
        if (auth.currentUser) {
            await auth.currentUser.sendEmailVerification();
        }
        else {
            throw new Error("Doğrulama maili göndermek için önce giriş yapmalısınız.");
        }
    },
    getCurrentSessionUser: async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const docRef = db.collection("users").doc(user.uid);
                const docSnap = await docRef.get();
                if (docSnap.exists) {
                    return mapDocumentToUser(user.uid, docSnap.data());
                }
            }
            catch (e) {
                console.warn("Session check failed", e);
            }
        }
        return null;
    },
    logout: async () => {
        localStorage.removeItem('lova_remember_me');
        setUserContext();
        // Disable push tokens on logout (native only)
        const platform = Capacitor.getPlatform();
        if (platform === 'ios' || platform === 'android') {
            try {
                await disableToken({ platform: platform });
            }
            catch (err) {
                console.warn('Error disabling token on logout:', err);
                // Don't throw - logout should succeed even if token disable fails
            }
        }
        await auth.signOut();
    },
    // DELETE ACCOUNT
    deleteAccount: async () => {
        const user = auth.currentUser;
        if (!user)
            throw new Error("Kullanıcı oturumu bulunamadı.");
        try {
            const snapshot = await db.collection("wardrobeItems").where("userId", "==", user.uid).get();
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            await db.collection("users").doc(user.uid).delete();
            await user.delete();
            localStorage.clear();
        }
        catch (error) {
            console.error("Delete account error:", error);
            if (error.code === 'auth/requires-recent-login') {
                throw new Error("Güvenlik nedeniyle hesabınızı silmek için yeniden giriş yapmanız gerekiyor. Lütfen çıkış yapıp tekrar girdikten sonra deneyin.");
            }
            throw new Error("Hesap silinirken bir hata oluştu: " + error.message);
        }
    },
    upgradeToPremium: async (userId, plan) => {
        const endDate = new Date();
        plan === 'yearly' ? endDate.setFullYear(endDate.getFullYear() + 1) : endDate.setMonth(endDate.getMonth() + 1);
        const docRef = db.collection("users").doc(userId);
        await docRef.update({
            is_premium: true,
            premium_type: plan,
            subscription_end_date: endDate.toISOString()
        });
        const docSnap = await docRef.get();
        return mapDocumentToUser(userId, docSnap.data());
    },
    checkLimits: (user, type) => {
        if (user.isPremium)
            return true;
        // Deprecated checks, relying on UI logic mostly but keeping for safety
        if (type === 'wardrobe') {
            // If they have used the access flag, they are done. 
            // But actual check happens at "Entry" to the modal. 
            // Here we just check quantity limit if we wanted to enforce one (prompt says no quantity limit during session)
            return true;
        }
        if (type === 'scan') {
            // Combinations limit
            return user.trialUsage.combinationsCount < 2;
        }
        return false;
    },
    incrementUsage: async (user, type) => {
        const today = new Date().toISOString().split('T')[0];
        let updates = {};
        const newUsage = { ...user.usage };
        if (type === 'wardrobe') {
            updates.wardrobe_count = user.usage.wardrobeCount + 1;
            newUsage.wardrobeCount += 1;
        }
        else if (type === 'scan') {
            // This is mainly for "AI Scans" usage statistic, not the limit logic
            updates.daily_scan_count = (user.usage.lastScanDate === today) ? user.usage.dailyScanCount + 1 : 1;
            updates.last_scan_date = today;
            newUsage.dailyScanCount = updates.daily_scan_count;
            newUsage.lastScanDate = today;
        }
        const docRef = db.collection("users").doc(user.id);
        await docRef.update(updates);
        return { ...user, usage: newUsage };
    },
    // NEW: Increment Combination Trial Count
    incrementTrialCombo: async (user) => {
        if (user.isPremium)
            return user;
        const newCount = user.trialUsage.combinationsCount + 1;
        const docRef = db.collection("users").doc(user.id);
        await docRef.update({
            trial_combinations_count: newCount
        });
        return {
            ...user,
            trialUsage: {
                ...user.trialUsage,
                combinationsCount: newCount
            }
        };
    },
    // NEW: Mark Wardrobe Access as Used (Burn the bridge)
    markWardrobeAccessUsed: async (user) => {
        if (user.isPremium)
            return user;
        const docRef = db.collection("users").doc(user.id);
        await docRef.update({
            trial_wardrobe_used: true
        });
        return {
            ...user,
            trialUsage: {
                ...user.trialUsage,
                wardrobeAccessUsed: true
            }
        };
    },
    decrementWardrobeCount: async (user) => {
        if (user.usage.wardrobeCount <= 0)
            return user;
        const newCount = user.usage.wardrobeCount - 1;
        const docRef = db.collection("users").doc(user.id);
        await docRef.update({ wardrobe_count: newCount });
        return { ...user, usage: { ...user.usage, wardrobeCount: newCount } };
    },
    updateProfile: async (user) => {
        const docRef = db.collection("users").doc(user.id);
        const payload = {
            name: user.name,
            styles: user.styles,
            theme: user.theme,
            avatar_url: user.avatar_url ?? null
        };
        if (user.bodyMeasurements) {
            payload.bodyMeasurements = user.bodyMeasurements;
        }
        if (user.bodyType) {
            payload.bodyType = user.bodyType;
        }
        if (user.makeupAnalysis) {
            payload.makeupAnalysis = user.makeupAnalysis;
        }
        if (user.styleRating) {
            payload.styleRating = user.styleRating;
        }
        await docRef.update(payload);
    },
    // Check for redirect result (call this on app init for Android)
    checkGoogleRedirectResult: async () => {
        try {
            const result = await auth.getRedirectResult();
            if (result && result.user) {
                console.log('[Auth] Google redirect result found');
                const user = result.user;
                const docRef = db.collection('users').doc(user.uid);
                const docSnap = await docRef.get();
                let mapped;
                if (!docSnap.exists) {
                    mapped = await authService.createDefaultProfileFallback(user, { source: 'google' });
                }
                else {
                    mapped = mapDocumentToUser(user.uid, docSnap.data());
                }
                setUserContext({ id: mapped.id, email: mapped.email });
                track('auth_login_success', { hasUser: true, method: 'google_redirect' });
                return mapped;
            }
            return null;
        }
        catch (error) {
            console.error('[Auth] Redirect result error:', error);
            return null;
        }
    },
    // SOCIAL LOGIN: Google Sign-In (Web + Native)
    loginWithGoogle: async () => {
        try {
            const platform = Capacitor.getPlatform();
            let userCredential = null;
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            // Android için redirect kullan, diğer platformlarda popup
            if (platform === 'android') {
                console.log('[Auth] Using signInWithRedirect for Android');
                await auth.signInWithRedirect(provider);
                // Redirect sonrası uygulama yeniden başlatılacak
                // getRedirectResult App.tsx'te çağrılıyor
                throw new Error('REDIRECT_IN_PROGRESS');
            }
            else {
                console.log('[Auth] Using signInWithPopup for platform:', platform);
                userCredential = await auth.signInWithPopup(provider);
            }
            const user = userCredential?.user;
            if (!user)
                throw new Error('Google giriş başarısız.');
            // Check if profile exists
            const docRef = db.collection('users').doc(user.uid);
            const docSnap = await docRef.get();
            let mapped;
            if (!docSnap.exists) {
                // Create profile from Google data
                mapped = await authService.createDefaultProfileFallback(user, { source: 'google' });
            }
            else {
                mapped = mapDocumentToUser(user.uid, docSnap.data());
            }
            setUserContext({ id: mapped.id, email: mapped.email });
            track('auth_login_success', { hasUser: true, method: 'google', platform });
            return mapped;
        }
        catch (error) {
            // Redirect durumu normal bir hata değil
            if (error.message === 'REDIRECT_IN_PROGRESS') {
                throw error;
            }
            console.error('Google login error:', error);
            let msg = 'Google giriş başarısız.';
            if (error.code === 'auth/popup-closed-by-user') {
                msg = 'Giriş penceresi kapatıldı.';
            }
            else if (error.code === 'auth/popup-blocked') {
                msg = 'Açılır pencere engellendi. Lütfen tarayıcı ayarlarını kontrol edin.';
            }
            else if (error.code === 'auth/cancelled-popup-request') {
                msg = 'Giriş işlemi iptal edildi.';
            }
            else if (error.code === 'auth/network-request-failed') {
                msg = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
            }
            else if (error.code === 'auth/internal-error') {
                msg = 'Kimlik doğrulama hatası. SHA-1 sertifikası yapılandırmasını kontrol edin.';
            }
            else if (error.message) {
                msg = error.message;
            }
            track('auth_login_failed', { error: error.code, errorCode: msg, method: 'google' });
            throw new Error(msg);
        }
    },
    // SOCIAL LOGIN: Apple Sign-In (iOS native only)
    loginWithApple: async () => {
        try {
            const platform = Capacitor.getPlatform();
            if (platform === 'ios') {
                // Native: Use AppleSignIn plugin (requires @capacitor-community/apple-sign-in)
                // TODO: Install @capacitor-community/apple-sign-in
                throw new Error('Native Apple Sign-In (Kapacitor plugin) bu sürümde henüz desteklenmiyor. Web versiyonunu kullanın.');
            }
            else if (platform === 'web') {
                throw new Error('Apple Sign-In yalnızca iOS uygulamasında desteklenir.');
            }
            else {
                throw new Error('Desteklenmeyen platform');
            }
        }
        catch (error) {
            console.error('Apple login error:', error);
            let msg = 'Apple giriş başarısız.';
            track('auth_login_failed', { error: error.code, errorCode: msg });
            throw new Error(msg);
        }
    }
};
