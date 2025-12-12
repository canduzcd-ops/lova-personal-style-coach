import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
export const LegalModal = ({ type, onClose }) => {
    const content = {
        privacy: {
            title: "Gizlilik Politikası",
            text: `
        Son Güncelleme: 25 Ekim 2023

        LOVA olarak kişisel verilerinizin güvenliğine önem veriyoruz.

        1. Toplanan Veriler:
        - Hesap bilgileri (E-posta, İsim).
        - Gardırop fotoğrafları (Yalnızca cihazınızda ve güvenli sunucularımızda analiz için tutulur).
        - Kullanım istatistikleri.

        2. Veri Kullanımı:
        Verileriniz yalnızca size daha iyi stil önerileri sunmak ve uygulama deneyimini iyileştirmek için kullanılır. Üçüncü taraflarla pazarlama amacıyla paylaşılmaz.

        3. İzinler:
        Kamera ve galeri izni, yalnızca kıyafetlerinizi eklemeniz için istenir.

        4. Güvenlik:
        Verileriniz endüstri standardı şifreleme yöntemleriyle korunmaktadır.
        
        Sorularınız için: support@lovaapp.com
      `
        },
        terms: {
            title: "Kullanım Koşulları",
            text: `
        Son Güncelleme: 25 Ekim 2023

        1. Hizmet Tanımı:
        LOVA, yapay zeka destekli bir gardırop asistanıdır.

        2. Premium Üyelik ve İptal:
        - Ödemeler Google Play üzerinden tahsil edilir.
        - Aboneliğinizi Google Play ayarlarından dilediğiniz zaman iptal edebilirsiniz. İptal işlemi, mevcut dönemin sonunda geçerli olur. Geriye dönük iade yapılmaz.

        3. Kullanıcı Sorumlulukları:
        Kullanıcılar, yükledikleri içeriklerin telif haklarına ve genel ahlak kurallarına uygunluğundan sorumludur.

        4. Değişiklikler:
        LOVA, bu koşulları dilediği zaman güncelleme hakkını saklı tutar.
      `
        }
    };
    const data = content[type];
    return (_jsxs("div", { className: "fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300", children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0", children: [_jsx("h2", { className: "text-lg font-serif font-bold", children: data.title }), _jsx("button", { onClick: onClose, className: "p-2 bg-gray-50 rounded-full hover:bg-gray-100", children: _jsx(X, { size: 20 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: _jsx("p", { className: "text-sm text-gray-600 whitespace-pre-line leading-relaxed", children: data.text }) })] }));
};
