
import { UserProfile, FREE_LIMITS } from '../types';
import { auth, db } from './firebaseClient';
import firebase from 'firebase/compat/app';

// Hardcoded Premium/Admin Emails
const SPECIAL_EMAILS = ['surailkay@gmail.com', 'test@lova.com', 'test1@lova.com'];

// Helper to map DB row to UserProfile object
const mapDocumentToUser = (id: string, data: any): UserProfile => {
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
  validatePassword: (password: string): { valid: boolean; error?: string } => {
    if (password.length < 8) return { valid: false, error: "Şifre en az 8 karakter olmalıdır." };
    if (!/[A-Z]/.test(password)) return { valid: false, error: "Şifre en az 1 büyük harf içermelidir." };
    if (!/\d/.test(password)) return { valid: false, error: "Şifre en az 1 rakam içermelidir." };
    if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, error: "Şifre en az 1 özel karakter (!, @, #, vb.) içermelidir." };
    return { valid: true };
  },

  // Login with Firebase
  login: async (email: string, password: string): Promise<UserProfile> => {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (user && !user.emailVerified) {
             // Optional: Force email verification check
        }

        if (!user) throw new Error("Kullanıcı bulunamadı.");

        // Fetch Profile Data from Firestore
        const docRef = db.collection("users").doc(user.uid);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
             console.warn("Profile missing on login, attempting lazy creation...");
             return await authService.createDefaultProfileFallback(user, null);
        }

        return mapDocumentToUser(user.uid, docSnap.data());

    } catch (error: any) {
        console.error("Login error:", error);
        let msg = "Giriş yapılamadı.";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            msg = "Hatalı e-posta veya şifre.";
        } else if (error.code === 'auth/too-many-requests') {
            msg = "Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.";
        }
        throw new Error(msg);
    }
  },

  // Register with Firebase
  register: async (email: string, password: string, name: string, styles: string[]): Promise<UserProfile | null> => {
    // 1. Password Check
    const pwCheck = authService.validatePassword(password);
    if (!pwCheck.valid) throw new Error(pwCheck.error);

    try {
        // 2. Create Auth User
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        if (!user) throw new Error("Kullanıcı oluşturulamadı.");

        // 3. Send Verification Email
        await user.sendEmailVerification();

        // 4. Create Firestore Document
        
        // SPECIAL RULE: Special emails get Lifetime Premium
        const isSpecialAdmin = SPECIAL_EMAILS.includes(email.toLowerCase());

        const newProfile = {
            email: email,
            name: name,
            styles: styles,
            joined_at: new Date().toISOString(),
            // Only admin is premium, others are NOT premium
            is_premium: isSpecialAdmin,
            premium_type: isSpecialAdmin ? 'lifetime' : null,
            subscription_end_date: null, // No end date for free or lifetime
            theme: 'light',
            wardrobe_count: 0,
            daily_scan_count: 0,
            last_scan_date: new Date().toISOString().split('T')[0],
            // Trial Logic
            trial_wardrobe_used: false,
            trial_combinations_count: 0
        };

        await db.collection("users").doc(user.uid).set(newProfile);

        // Return null to enforce "Check your email" flow in the UI
        return null; 

    } catch (error: any) {
        console.error("Register error:", error);
        let msg = "Kayıt işlemi başarısız.";
        if (error.code === 'auth/email-already-in-use') {
            msg = "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.";
        } else if (error.code === 'auth/weak-password') {
            msg = "Şifre çok zayıf.";
        } else if (error.code === 'auth/invalid-email') {
             msg = "Geçersiz e-posta adresi.";
        }
        throw new Error(msg);
    }
  },

  // Fallback profile creation
  createDefaultProfileFallback: async (user: firebase.User, metaData: any) => {
    const isSpecialAdmin = user.email && SPECIAL_EMAILS.includes(user.email.toLowerCase());

    const newProfile = {
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
      styles: ['minimal'],
      joined_at: new Date().toISOString(),
      is_premium: isSpecialAdmin,
      premium_type: isSpecialAdmin ? 'lifetime' : null,
      subscription_end_date: null,
      theme: 'light',
      wardrobe_count: 0,
      daily_scan_count: 0,
      last_scan_date: new Date().toISOString().split('T')[0],
      trial_wardrobe_used: false,
      trial_combinations_count: 0
    };

    await db.collection("users").doc(user.uid).set(newProfile);
    return mapDocumentToUser(user.uid, newProfile);
  },

  // Password Reset
  resetPassword: async (email: string): Promise<void> => {
    try {
        await auth.sendPasswordResetEmail(email);
    } catch (error: any) {
        throw new Error("Şifre sıfırlama e-postası gönderilemedi.");
    }
  },

  // Resend Verification
  resendVerification: async (email: string): Promise<void> => {
      if (auth.currentUser) {
          await auth.currentUser.sendEmailVerification();
      } else {
          throw new Error("Doğrulama maili göndermek için önce giriş yapmalısınız.");
      }
  },

  getCurrentSessionUser: async (): Promise<UserProfile | null> => {
    const user = auth.currentUser;
    if (user) {
        try {
            const docRef = db.collection("users").doc(user.uid);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                return mapDocumentToUser(user.uid, docSnap.data());
            }
        } catch (e) {
            console.warn("Session check failed", e);
        }
    }
    return null;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('lova_remember_me');
    await auth.signOut();
  },

  // DELETE ACCOUNT
  deleteAccount: async (): Promise<void> => {
      const user = auth.currentUser;
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");
      
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

      } catch (error: any) {
          console.error("Delete account error:", error);
          if (error.code === 'auth/requires-recent-login') {
              throw new Error("Güvenlik nedeniyle hesabınızı silmek için yeniden giriş yapmanız gerekiyor. Lütfen çıkış yapıp tekrar girdikten sonra deneyin.");
          }
          throw new Error("Hesap silinirken bir hata oluştu: " + error.message);
      }
  },

  upgradeToPremium: async (userId: string, plan: 'monthly' | 'yearly'): Promise<UserProfile> => {
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

  checkLimits: (user: UserProfile, type: 'wardrobe' | 'scan'): boolean => {
    if (user.isPremium) return true; 
    
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

  incrementUsage: async (user: UserProfile, type: 'wardrobe' | 'scan'): Promise<UserProfile> => {
    const today = new Date().toISOString().split('T')[0];
    let updates: any = {};
    const newUsage = { ...user.usage };

    if (type === 'wardrobe') {
        updates.wardrobe_count = user.usage.wardrobeCount + 1;
        newUsage.wardrobeCount += 1;
    } else if (type === 'scan') {
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
  incrementTrialCombo: async (user: UserProfile): Promise<UserProfile> => {
      if (user.isPremium) return user;
      
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
  markWardrobeAccessUsed: async (user: UserProfile): Promise<UserProfile> => {
      if (user.isPremium) return user;

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
  
  decrementWardrobeCount: async (user: UserProfile): Promise<UserProfile> => {
      if (user.usage.wardrobeCount <= 0) return user;
      const newCount = user.usage.wardrobeCount - 1;
      
      const docRef = db.collection("users").doc(user.id);
      await docRef.update({ wardrobe_count: newCount });

      return { ...user, usage: { ...user.usage, wardrobeCount: newCount } };
  },

  updateProfile: async (user: UserProfile): Promise<void> => {
      const docRef = db.collection("users").doc(user.id);
      
      const payload: any = {
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
  }
};
