let blurQueueToken = 0;

/**
 * iOS Akıcı Blur Metin Değiştirici
 * @param {HTMLElement} element - Yazısı değişecek span elemanı
 * @param {string} newText - Yeni eklenecek metin
 */
export function updateLabelWithBlur(element, newText) {
  if (!element || element.innerText === newText) return;

  if (document.body.classList.contains("performans-modu")) {
    element.innerText = newText;
    return;
  }

  const currentToken = ++blurQueueToken;

  element.classList.remove("text-in");
  element.classList.add("text-out");

  setTimeout(() => {
    if (blurQueueToken === currentToken) {
      element.innerText = newText;
      element.classList.remove("text-out");
      element.classList.add("text-in");

      setTimeout(() => {
        element.classList.remove("text-in");
      }, 220);
    }
  }, 180);
}

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

  toast.className = `${bg} border text-white px-5 py-3 rounded-xl shadow-2xl flex items-center justify-between min-w-[300px] text-sm font-medium z-50`;
  toast.innerHTML = `<span>${mesaj}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

export function TemaGuncelle(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  localStorage.setItem("adas_tema", tema);
}

export function PerformansGuncelle(aktifAyar, bildirimVer = false) {
  if (aktifAyar === "on") {
    document.body.classList.add("performans-modu");
    localStorage.setItem("adas_performans", "on");
    if (bildirimVer) EngineToastGoster("⚡ Performans modu aktif.", "basari");
  } else {
    document.body.classList.remove("performans-modu");
    localStorage.setItem("adas_performans", "off");
    if (bildirimVer) {
      EngineToastGoster("✨ Grafik modu aktif.", "uyari");
    }
  }
}

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

function setupButtonPhysics() {
  document.querySelectorAll(".adas-btn").forEach((btn) => {
    const handlePress = (e) => {
      if (document.body.classList.contains("performans-modu")) return;

      const rect = btn.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      btn.style.setProperty("--touch-x", `${x}px`);
      btn.style.setProperty("--touch-y", `${y}px`);

      const shadowX = (x - rect.width / 2) / 3;
      const shadowY = (y - rect.height / 2) / 3 + 10;

      btn.style.setProperty("--shadow-dx", `${shadowX}px`);
      btn.style.setProperty("--shadow-dy", `${shadowY}px`);

      btn.classList.add("is-pressing");
    };

    const handleRelease = () => {
      btn.classList.remove("is-pressing");
    };

    btn.addEventListener("pointerdown", handlePress);
    btn.addEventListener("pointermove", (e) => {
      if (btn.classList.contains("is-pressing")) handlePress(e);
    });
    btn.addEventListener("pointerup", handleRelease);
    btn.addEventListener("pointerleave", handleRelease);
  });
}

function setupAnimatedInputs() {
  document.querySelectorAll(".animated-char-input").forEach((input) => {
    input.addEventListener("input", () => {
      if (document.body.classList.contains("performans-modu")) return;

      input.classList.remove("char-typed");
      void input.offsetWidth;
      input.classList.add("char-typed");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const kaydedilenTema = localStorage.getItem("adas_tema") || "dark";
  TemaGuncelle(kaydedilenTema);

  const kaydedilenPerformans = localStorage.getItem("adas_performans") || "off";
  PerformansGuncelle(kaydedilenPerformans, false);

  setupButtonPhysics();
  setupAnimatedInputs();

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