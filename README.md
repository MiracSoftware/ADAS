# 🛡️ ADAS - Aile Davranış Analiz Sistemi

> **Aile İçi Bireysel Gelişim ve Davranış İzleme Platformu**  
> ADAS, aile içi etkileşimleri, gelişim süreçlerini ve bireysel davranışları veri odaklı izlemek amacıyla modern web mimarisi ve Firebase altyapısıyla geliştirilmiş yeni nesil bir yönetim panelidir.

---

## 🌟 Öne Çıkan Özellikler

* **🔐 Güvenli Yönetici Paneli:** `admin_credentials` tabanlı dinamik kimlik doğrulama ve rol bazlı erişim denetimi.
* **⚡ Canlı Veri Senkronizasyonu:** Firebase Realtime Database entegrasyonu ile aile, üye ve puan verilerinin anlık olarak güncellenmesi.
* **👨‍👩‍👧‍👦 Aile & Üye Yönetimi:** Aile grubu oluşturma, lisans/plan yönetimi (Haftalık, Aylık, Yıllık, Özel), üye ekleme, yaş/rol ve puan takibi.
* **⭐ Dinamik Puanlama & Log Sistemi:** Üyelere anlık puan tanımlama, hızlı puan verme/düşme ve yapılan tüm işlemlerin geçmişe dönük kayıt altına alınması.
* **📋 Kayıt ve Premium Talepleri:** Kullanıcılardan gelen paket yükseltme veya yeni aile kayıt taleplerinin yönetim paneli üzerinden tek tıkla onaylanması veya reddedilmesi.
* **📊 Pedagogik Raporlama Arayüzü:** KVKK ve pedagojik veri izleme protokollerine uygun, kullanıcı dostu Glassmorphism/Modern Dark UI teması.

---

## 🛠️ Teknolojiler ve Altyapı

* **Frontend:** HTML5, CSS3, JavaScript (ES6+ Modules), Tailwind CSS
* **Backend / Database:** Firebase Realtime Database, Firebase Authentication
* **İkon & Font:** FontAwesome v6, Inter / Mono typography

---

## 🚀 Kurulum ve Yerel Çalıştırma

Projede bağımlılık yönetimi için `npm` veya derleme süreci gerekmemektedir. Doğrudan bir web sunucusu (Live Server vb.) üzerinde çalıştırılabilir.

Adım 1 > Depoyu klonlayın:
```bash
git clone [https://github.com/MiracSoftware/ADAS.git](https://github.com/MiracSoftware/ADAS.git)
cd ADAS
Adım 2 > Firebase Yapılandırmasını Düzenleyin:
assets/js/firebase-config.js dosyası içerisine kendi Firebase projenizin kimlik bilgilerini ekleyin:

JavaScript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
Adım 3 > Web sunucunuzu başlatın ve index.html dosyasını tarayıcınızda açın.

🔐 Veritabanı Şeması (Realtime Database)
Projenin sorunsuz çalışması için Firebase Realtime Database üzerinde aşağıdaki kök düğümlerin tanımlı olması gerekir:

JSON
{
  "admin_credentials": {
    "username": "YOUR_ADMIN_USERNAME",
    "password": "YOUR_ADMIN_PASSWORD"
  },
  "families": {
    "Örnek Ailesi": {
      "subscription": {
        "isPremium": true,
        "planType": "aylik",
        "startDate": "2026-09-01 12:00:00",
        "endDate": "2026-10-01 12:00:00",
        "uyeLimiti": 6
      },
      "members": {},
      "logs": {}
    }
  },
  "premium_talepleri": {}
}
📄 Lisans
Bu proje MIT lisansı altında korunmaktadır. Detaylar için LICENSE dosyasına göz atabilirsiniz.