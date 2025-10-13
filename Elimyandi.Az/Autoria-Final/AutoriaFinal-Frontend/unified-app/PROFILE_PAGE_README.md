# İstifadəçi Profili Səhifəsi - ProfilePage.tsx

## 🎯 Ümumi Məlumat

Bu səhifə "Əlimyandı.az" layihəsi üçün müasir, futuristik və tam funksional istifadəçi profil səhifəsidir. Saytın ümumi dizayn sisteminə uyğun glassmorphism stilində hazırlanmış və tam API inteqrasiyasına malikdir.

## ✅ Təkmilləşdirilmiş Xüsusiyyətlər

### 🎨 Vizual Düzəlişlər
- **Rəng Palitrası**: Bənövşəyi rənglərdən imtina edilərək, saytın əsas slate-indigo-blue palitrasına uyğunlaşdırıldı
- **Panellər**: `bg-slate-900/50 backdrop-blur-lg border border-slate-700` stilində
- **Form Elementləri**: `bg-slate-800/60 border-slate-600 text-slate-200` stilində
- **Düymələr**: Mavi gradient (`bg-blue-600 hover:bg-blue-700`) və şəffaf border stilində

### 🔧 Tam Dinamik Funksionallıq
- **Real-time API İnteqrasiyası**: GET və PUT endpoint-ləri ilə tam inteqrasiya
- **Form Validasiyası**: Client-side validasiya və error handling
- **Parol Dəyişmə**: Tam funksional parol dəyişmə modalı
- **Şəkil Yükləmə**: Drag & drop ilə profil şəkli yükləmə
- **Toast Bildirişləri**: react-hot-toast ilə real-time bildirişlər

## ✨ Xüsusiyyətlər

### 🎨 Dizayn Xüsusiyyətləri
- **Glassmorphism Dizayn**: Şəffaf, bulanıq fonlu müasir dizayn
- **Responsive Layout**: Bütün cihazlarda mükəmməl görünüş
- **Gradient Background**: Slate və Purple gradient fon
- **Interactive Elements**: Hover effektləri və animasiyalar

### 📱 Komponent Strukturu

#### 1. Profil Başlığı (Profile Header)
- **Avatar/Profil Şəkli**: 
  - Drag & drop ilə şəkil yükləmə
  - Hover effekti ilə kamera ikonu
  - Base64 formatında saxlama
- **İstifadəçi Adı və Rolu**: 
  - Tam ad göstərilməsi
  - Rol badge-ləri (Admin, Seller)
  - Status nişanları (Email Təsdiqlənib, Hesab Aktivdir)

#### 2. Şəxsi Məlumatlar Paneli
- **Form Elementləri**:
  - Ad və Soyad inputları
  - Telefon nömrəsi
  - Email (read-only)
  - Doğum tarixi (Date Picker)

#### 3. Ünvan Məlumatları Paneli
- **Location Fields**:
  - Şəhər və Ölkə inputları
  - Vaxt zonası dropdown

#### 4. Bio və Parametrlər Paneli
- **Bio**: 
  - 500 simvol limiti ilə textarea
  - Simvol sayğacı
- **Parametrlər**:
  - Marketinq bildirişlərinə icazə toggle
  - Üstünlük verilən dil seçimi

#### 5. Təhlükəsizlik və Aktivlik
- **Read-only Məlumatlar**:
  - Son giriş tarixi
  - Parolun son dəyişdirilmə tarixi
- **Parol Dəyişmə**: Modal pəncərə ilə parol dəyişmə

#### 6. Əməliyyat Düymələri
- **Yadda Saxla**: Əsas əməliyyat düyməsi
- **Ləğv Et**: Dəyişiklikləri sıfırlama

## 🛠 Texniki Təfərrüatlar

### TypeScript Interface-ləri
```typescript
interface IUserProfile {
  id: string;
  userName?: string;
  email?: string;
  emailConfirmed: boolean;
  roles?: string[];
  createdAt: string;
  lastLoginAt?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  isActive: boolean;
  fullName?: string;
  age?: number;
  primaryRole?: string;
  isAdmin: boolean;
  isSeller: boolean;
  bio?: string;
  city?: string;
  country?: string;
  timeZone?: string;
  allowMarketing?: boolean;
  preferredLanguage?: string;
  passwordChangedAt?: string;
}

interface IUpdateUserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  bio?: string;
  city?: string;
  country?: string;
  timeZone?: string;
  allowMarketing?: boolean;
  preferredLanguage?: string;
}
```

### API İnteqrasiyası
- **GET /api/Auth/profile**: Profil məlumatlarını yükləmə
- **PUT /api/Auth/profile**: Profil məlumatlarını yeniləmə

### İstifadə Olunan Kitabxanalar
- **react-hot-toast**: Bildiriş sistemi
- **react-dropzone**: Fayl yükləmə
- **react-day-picker**: Təqvim seçici
- **lucide-react**: İkonlar

## 🎨 CSS Stil Xüsusiyyətləri

### Glassmorphism Effektləri
```css
background: rgba(15, 23, 42, 0.5); /* slate-900/50 */
backdrop-filter: blur(10px);
border: 1px solid rgba(51, 65, 85, 1); /* slate-700 */
```

### Gradient Background
```css
background: linear-gradient(to bottom right, 
  from-slate-900, 
  via-indigo-900, 
  to-slate-900);
```

### Interactive Elements
- Hover effektləri
- Focus ring-ləri
- Transition animasiyaları
- Loading spinner-ləri

## 🚀 İstifadə Təlimatı

### 1. Səhifəyə Giriş
```
/profile - İstifadəçi profil səhifəsi
```

### 2. Profil Şəkli Yükləmə
- Avatar üzərinə klikləyin
- Faylı sürükləyib buraxın və ya seçin
- Dəstəklənən formatlar: JPEG, JPG, PNG, GIF, WebP
- Maksimum ölçü: 5MB

### 3. Məlumatları Yeniləmə
- Form sahələrini doldurun
- "Dəyişiklikləri Yadda Saxla" düyməsinə basın
- Uğurlu yeniləmə toast bildirişi göstəriləcək

### 4. Parol Dəyişmə
- "Parolu Dəyiş" düyməsinə basın
- Modal pəncərədə parol məlumatlarını daxil edin
- "Parolu Dəyiş" düyməsinə basın

## 🔧 Konfiqurasiya

### Toast Bildirişləri
```typescript
toast.success('Profil uğurla yeniləndi!');
toast.error('Profil yenilənə bilmədi');
```

### Fayl Yükləmə Konfiqurasiyası
```typescript
const { getRootProps, getInputProps } = useDropzone({
  onDrop,
  accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
  multiple: false,
  maxSize: 5 * 1024 * 1024 // 5MB
});
```

## 🎯 Gələcək Təkmilləşdirmələr

1. **Profil Şəkli Optimizasiyası**: Şəkil ölçülərinin avtomatik optimizasiyası
2. **İki Faktorlu Autentifikasiya**: 2FA dəstəyi
3. **Profil Aktivlik Tarixçəsi**: Dəyişiklik tarixçəsi
4. **Sosial Media İnteqrasiyası**: Sosial media hesablarının əlaqələndirilməsi
5. **Profil Eksportu**: Profil məlumatlarının PDF formatında eksportu

## 🐛 Problemlərin Həlli

### Ümumi Problemlər
1. **Profil yüklənmir**: API endpoint-inin işlədiyini yoxlayın
2. **Şəkil yüklənmir**: Fayl ölçüsünü və formatını yoxlayın
3. **Toast bildirişləri göstərilmir**: react-hot-toast konfiqurasiyasını yoxlayın

### Debug Məlumatları
- Console-da API sorğularını izləyin
- Network tab-da API cavablarını yoxlayın
- React DevTools ilə state dəyişikliklərini izləyin

## 📝 Qeydlər

- Bu səhifə tam responsive dizayna malikdir
- Bütün form validasiyaları client-side-də həyata keçirilir
- API error handling tam şəkildə tətbiq edilmişdir
- Accessibility standartlarına uyğundur
- Modern React hooks istifadə edilir (useState, useEffect, useCallback)

---

**Yaradılma Tarixi**: 2024  
**Versiya**: 1.0.0  
**Texnologiyalar**: React, TypeScript, Tailwind CSS, Glassmorphism  
**API**: RESTful API inteqrasiyası
