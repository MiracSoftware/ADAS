// ADAS/assets/js/auth.js
import { dbGet, auth, signInWithEmailAndPassword } from "./firebase-config.js";

const loadingArea = document.getElementById("loadingArea");
const loginForm = document.getElementById("loginForm");
const cmbFamilies = document.getElementById("cmbFamilies");
const cmbMembers = document.getElementById("cmbMembers");
const txtPassword = document.getElementById("txtPassword");

const lblCaptchaSoru = document.getElementById("lblCaptchaSoru");
const txtCaptchaCevap = document.getElementById("txtCaptchaCevap");

let tumAileler = {};
let mevcutCaptchaCevabi = 0;

function CaptchaUret() {
  const sayi1 = Math.floor(Math.random() * 9) + 1;
  const sayi2 = Math.floor(Math.random() * 9) + 1;
  mevcutCaptchaCevabi = sayi1 + sayi2;
  lblCaptchaSoru.textContent = `${sayi1} + ${sayi2} =`;
  txtCaptchaCevap.value = "";
}

function HataGoster(mesaj, tur = "hata") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  const rgbaBg = tur === "hata" ? "bg-rose-600 border-rose-700" : "bg-amber-500 border-amber-600";

  toast.className = `${rgbaBg} border text-white px-5 py-3 rounded-lg shadow-2xl flex items-center justify-between min-w-[320px] transform translate-x-full transition-all duration-300 pointer-events-auto`;
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium">${mesaj}</span>
    </div>
    <button type="button" class="text-white opacity-70 hover:opacity-100 font-bold ml-4 text-xs">X</button>
  `;

  toast.querySelector("button").addEventListener("click", () => toast.remove());
  container.appendChild(toast);

  setTimeout(() => toast.classList.remove("translate-x-full"), 10);
  setTimeout(() => {
    if (toast) {
      toast.classList.add("translate-x-full");
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Anonim / Temel Yetkilendirme
    await signInWithEmailAndPassword(auth, "system@adas.com", "adas_system_password_123").catch(() => {});
    
    const veri = await dbGet("families");
    if (veri) {
      tumAileler = veri;
      Object.keys(tumAileler).forEach((aileAdi) => {
        const option = document.createElement("option");
        option.value = aileAdi;
        option.textContent = aileAdi;
        cmbFamilies.appendChild(option);
      });

      CaptchaUret();
      loadingArea.classList.add("hidden");
      loginForm.classList.remove("hidden");
    } else {
      loadingArea.innerHTML = "<p class='text-amber-400 font-medium'>Sistemde kayıtlı aile bulunamadı!</p>";
    }
  } catch (error) {
    loadingArea.innerHTML = "<p class='text-rose-400 font-medium'>Bağlantı hatası oluştu!</p>";
    HataGoster("Veritabanı bağlantısı başarısız.", "hata");
  }
});

cmbFamilies.addEventListener("change", () => {
  const secilenAile = cmbFamilies.value;
  cmbMembers.innerHTML = '<option value="" disabled selected>-- Üye Seçiniz --</option>';
  cmbMembers.disabled = false;

  if (tumAileler[secilenAile] && tumAileler[secilenAile].members) {
    const uyeler = tumAileler[secilenAile].members;
    Object.keys(uyeler).forEach((uyeAdi) => {
      const option = document.createElement("option");
      option.value = uyeAdi;
      option.textContent = uyeAdi;
      cmbMembers.appendChild(option);
    });
  } else {
    cmbMembers.disabled = true;
  }
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const aile = cmbFamilies.value;
  const uye = cmbMembers.value;
  const girilenSifre = txtPassword.value.trim();
  const girilenCaptcha = parseInt(txtCaptchaCevap.value.trim());

  if (!aile || !uye || !girilenSifre || isNaN(girilenCaptcha)) {
    HataGoster("Lütfen alanların tamamını ve doğrulamayı doldurun!", "uyari");
    return;
  }

  if (girilenCaptcha !== mevcutCaptchaCevabi) {
    HataGoster("Robot doğrulaması başarısız! Matematik işlemini kontrol edin.", "hata");
    CaptchaUret();
    return;
  }

  const dogruSifre = tumAileler[aile]?.members?.[uye]?.sistemID?.toString();

  if (girilenSifre === dogruSifre) {
    sessionStorage.setItem("secilenAile", aile);
    sessionStorage.setItem("secilenUye", uye);
    window.location.href = "dashboard.html";
  } else {
    HataGoster("Hatalı üye giriş şifresi (SistemID)! Lütfen tekrar deneyin.", "hata");
    txtPassword.value = "";
    txtPassword.focus();
    CaptchaUret();
  }
});