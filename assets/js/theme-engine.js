// Global Toast Tetikleyici (Mevcut yapıya entegre)
// Bu fonksiyon, sayfanın herhangi bir yerinde çağrılabilir ve kullanıcıya kısa süreli bildirimler (toast) gösterir.
// mesaj: gösterilecek metin
// tur: "basari" veya "uyari" (varsayılan: "uyari")
// Bu fonksiyon, toastContainer adlı bir div içinde toast mesajlarını oluşturur ve belirli bir süre sonra otomatik olarak kaldırır.
//Adas/assets/js/theme-engine.js
function EngineToastGoster(mesaj, tur = "uyari") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  const bg = tur === "basari" ? "bg-emerald-600" : "bg-amber-500";
  toast.className = `${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center justify-between min-w-[300px] transform transition-all duration-300 z-50 text-sm font-medium`;
  toast.innerHTML = `<span>${mesaj}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// 1. TEMA MOTORU YÖNETİMİ
function TemaGuncelle(tema) {
  if (tema === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  localStorage.setItem("adas_tema", tema);
}

// 2. PERFORMANS MOTORU YÖNETİMİ
function PerformansGuncelle(aktifAyar, bildirimVer = false) {
  if (aktifAyar === "on") {
    document.body.classList.add("performans-modu");
    localStorage.setItem("adas_performans", "on");
    if (bildirimVer)
      EngineToastGoster(
        "⚡ Performans modu aktif: Animasyonlar ve ağır görsel efektler kapatıldı.",
        "basari",
      );
  } else {
    document.body.classList.remove("performans-modu");
    localStorage.setItem("adas_performans", "off");
    if (bildirimVer) {
      EngineToastGoster(
        "⚠️ Dikkat! Takılmalar yaşanabilir. Eğer yavaşlama hissederseniz performans modunu (⚡) açın.",
        "uyari",
      );
    }
  }
}

// SİSTEMİ İLK AÇILIŞTA BAŞLATMA
document.addEventListener("DOMContentLoaded", () => {
  // Hafızadaki temayı oku (Yoksa karanlık başla)
  const kaydedilenTema = localStorage.getItem("adas_tema") || "dark";
  TemaGuncelle(kaydedilenTema);

  // Hafızadaki performans modunu oku (Yoksa kapalı başla)
  const kaydedilenPerformans = localStorage.getItem("adas_performans") || "off";
  PerformansGuncelle(kaydedilenPerformans, false);

  // DOM Buton Tetikleyicileri (Sayfada mevcutlarsa bağlanırlar)
  const btnTheme = document.getElementById("btnToggleTheme");
  const btnPerf = document.getElementById("btnTogglePerformance");

  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const mevcut =
        document.documentElement.getAttribute("data-theme") === "light"
          ? "dark"
          : "light";
      TemaGuncelle(mevcut);
    });
  }

  if (btnPerf) {
    btnPerf.addEventListener("click", () => {
      const aktiflik = document.body.classList.contains("performans-modu")
        ? "off"
        : "on";
      PerformansGuncelle(aktiflik, true); // Kullanıcı kendi tıkladığı için uyarı verilsin
    });
  }
});
