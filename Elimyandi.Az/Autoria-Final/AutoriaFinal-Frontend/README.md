# Əlimyandı.az - Auction Platform

Bu layihə iki əsas hissədən ibarətdir:
- **Admin Panel** - İdarəetmə paneli
- **Presentation** - İstifadəçi interfeysi

## 🚀 Tez Başlama

### Tələblər
- Node.js (v18+)
- npm

### Quraşdırma

1. **Bütün dependencies quraşdırın:**
```bash
npm run install:all
```

2. **Unified platform işə salın:**
```bash
npm run dev
```

Bu komanda tək bir React app-i işə salacaq (http://localhost:5173):
- **Presentation** (default): http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **Admin Login**: http://localhost:5173/admin/login

### Ayrı-ayrı işə salma

**Yalnız Admin Panel:**
```bash
npm run dev:admin
```

**Yalnız Presentation:**
```bash
npm run dev:presentation
```

## 📍 URL-lər

- **Single App**: http://localhost:5173
- **Presentation** (default): http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **Admin Login**: http://localhost:5173/admin/login

## 🔐 Admin Access Control

Admin panelə giriş üçün role-based access control mövcuddur:

### **Admin Role Tələbləri:**
- JWT token-də `admin` və ya `Admin` role-u olmalıdır
- Yalnız admin istifadəçilər admin panelə giriş edə bilər

### **Demo Admin Məlumatları:**
- **Email**: admin@alimyandi.az
- **Şifrə**: admin123
- **URL**: http://localhost:5173/admin/login

### **Access Denied:**
- Admin olmayan istifadəçilər admin panelə giriş etməyə çalışdıqda gözəl bir "Giriş İcazəsi Yoxdur" səhifəsi göstərilir

## 📁 Layihə Strukturu

```
├── unified-app/          # Tək React app
│   ├── src/
│   │   ├── admin/       # Admin panel komponentləri
│   │   ├── components/ # Shared komponentlər
│   │   │   ├── AdminGuard.tsx    # Role-based access control
│   │   │   └── AccessDenied.tsx  # Access denied səhifəsi
│   │   ├── pages/       # Presentation səhifələri
│   │   │   └── AdminLogin.tsx    # Admin login səhifəsi
│   │   └── App.tsx      # Unified routing
│   └── package.json
├── package.json         # Root package.json
├── start.bat           # Windows start script
├── start.sh            # Linux/Mac start script
└── README.md           # Bu fayl
```

## 🛠️ Texnologiyalar

### Admin Panel
- React 18.2.0
- TypeScript
- React Router DOM 6.20.1
- Tailwind CSS
- Lucide React icons
- Vite

### Presentation
- React 18.3.1
- TypeScript
- React Router DOM 7.9.1
- Tailwind CSS
- Lucide React icons
- Vite
- SignalR (real-time communication)
- Supabase

## 📋 Əsas Xüsusiyyətlər

### Admin Panel
- Dashboard və KPI göstəriciləri
- Auksion idarəetməsi
- İnventar idarəetməsi
- İstifadəçi idarəetməsi
- Rollar və icazələr
- Audit logları

### Presentation
- Auksion siyahısı və detalları
- Real-time bid sistemi
- İstifadəçi profil idarəetməsi
- Nəticələri izləmə
- Vasitə axtarışı
- Təqvim görünüşü

## 🔧 Build və Deploy

**Bütün layihələri build etmək:**
```bash
npm run build
```

**Ayrı-ayrı build:**
```bash
npm run build:admin
npm run build:presentation
```

## 🧹 Təmizlik

**Bütün node_modules və dist folderlərini silmək:**
```bash
npm run clean
```

## 📞 Dəstək

Hər hansı sual və ya problem üçün layihə sahibi ilə əlaqə saxlayın.
