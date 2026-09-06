// Global Toast Tetikleyici
export function EngineToastGoster(mesaj, tur = "uyari") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  const bg =
    tur === "basari"
      ? "bg-emerald-600 border-emerald-700"
      : tur === "hata"
      ? "bg-rose-600 border-rose-700"
      : "bg-amber-500 border-amber-600";

  toast.className = `${bg} border text-white px-5 py-3 rounded-xl shadow-2xl flex items-center justify-between min-w-[300px] transform transition-all duration-300 z-50 text-sm font-medium`;
  toast.innerHTML = `<span>${mesaj}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// 1. TEMA MOTORU YÖNETİMİ
export function TemaGuncelle(tema) {
  if (tema === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  localStorage.setItem("adas_tema", tema);
}

// 2. PERFORMANS MOTORU YÖNETİMİ
export function PerformansGuncelle(aktifAyar, bildirimVer = false) {
  if (aktifAyar === "on") {
    document.body.classList.add("performans-modu");
    localStorage.setItem("adas_performans", "on");
    if (bildirimVer)
      EngineToastGoster(
        "Performans Modu Açık.",
        "basari"
      );
  } else {
    document.body.classList.remove("performans-modu");
    localStorage.setItem("adas_performans", "off");
    if (bildirimVer) {
      EngineToastGoster(
        "⚠️ Dikkat! Takılmalar yaşarsanız performans modunu açın.",
        "uyari"
      );
    }
  }
}

// SİSTEMİ İLK AÇILIŞTA BAŞLATMA
document.addEventListener("DOMContentLoaded", () => {
  const kaydedilenTema = localStorage.getItem("adas_tema") || "dark";
  TemaGuncelle(kaydedilenTema);

  const kaydedilenPerformans = localStorage.getItem("adas_performans") || "off";
  PerformansGuncelle(kaydedilenPerformans, false);

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
      PerformansGuncelle(aktiflik, true);
    });
  }
});


// 3. BALONCUK MENÜLERİ İÇİN SEÇİM YÖNETİMİ

export function fillBubbleMenu(menuId, items) {
  const menu = document.getElementById(menuId);
  if (!menu) return;

  menu.innerHTML = items
    .map(
      (item) => `
    <div class="ios-bubble-item" data-value="${item.id}" data-label="${item.name}">
      <span>${item.name}</span>
      <i class="fa-solid fa-check text-xs opacity-0 check-icon"></i>
    </div>
  `
    )
    .join("");
}