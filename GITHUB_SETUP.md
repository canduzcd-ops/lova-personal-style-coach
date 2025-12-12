# GitHub Kurulum Rehberi (Lova-v1 + Vite)

**DİKKAT:** GitHub'ın size verdiği `echo "# Lova-v1" >> README.md` veya `git add README.md` gibi komutları **KULLANMAYIN**. Bu komutlar boş projeler içindir ve sizin mevcut kodlarınızı yüklemenizi engeller.

Projenizi eksiksiz yüklemek için aşağıdaki adımları VS Code terminalinde (`Ctrl + "`) sırasıyla uygulayın.

### 1. Hazırlık ve Kurulum
Önce gerekli paketleri yükleyin:
```bash
npm install
```

### 2. Git Geçmişini Sıfırla ve Yükle
Aşağıdaki komut bloğunu kopyalayıp terminale yapıştırın. Bu işlem projeyi sıfırdan Git'e hazırlar ve tüm dosyaları (sadece README'yi değil) kapsar.

```bash
# Eğer Windows PowerShell kullanıyorsanız eski git klasörünü silin:
rm -r -force .git

# Git'i başlat
git init

# TÜM dosyaları ekle (Önemli adım budur)
git add .

# İlk kaydı oluştur
git commit -m "LOVA v1: Initial commit with Vite"

# Ana dal ismini ayarla
git branch -M main

# Yeni deponuzu bağlayın
git remote add origin https://github.com/canduzcd-ops/Lova-v1.git

# Kodları gönder (Zorla gönderim yaparak çakışmaları önler)
git push -u origin main --force
```

### 3. İşlem Tamamlandığında
Yükleme bittikten sonra GitHub sayfanızı yenileyin. Tüm dosyaların (`src`, `public`, `package.json` vb.) orada olduğunu görmelisiniz.

### Projeyi Çalıştırma
```bash
npm run dev
```
