import { dbGet } from "./firebase-config.js";
import {
  EngineToastGoster,
  fillBubbleMenu,
  updateLabelWithBlur,
} from "./theme-engine.js";

const loadingArea = document.getElementById("loadingArea");
const loginForm = document.getElementById("loginForm");
const cmbFamilies = document.getElementById("cmbFamilies");
const cmbMembers = document.getElementById("cmbMembers");
const txtPassword = document.getElementById("txtPassword");
const btnForgotPass = document.getElementById("btnForgotPass");

const lblCaptchaSoru = document.getElementById("lblCaptchaSoru");
const txtCaptchaCevap = document.getElementById("txtCaptchaCevap");

let tumAileler = {};
let mevcutCaptchaCevabi = 0;

function Sansurle(metin) {
  return String(metin)
    .split(/(\s+)/)
    .map((parca) => {
      if (/\s+/.test(parca)) return parca;
      if (parca.length < 2) return "*";
      return `${parca[0]}${"*".repeat(Math.max(1, parca.length - 1))}`;
    })
    .join("");
}

function SifirlamaButonunuGuncelle() {
  if (!btnForgotPass) return;
  const aktif = Boolean(cmbFamilies.value && cmbMembers.value);
  btnForgotPass.disabled = !aktif;
  btnForgotPass.classList.toggle("opacity-40", !aktif);
  btnForgotPass.classList.toggle("cursor-not-allowed", !aktif);
}

function CaptchaUret() {
  const sayi1 = Math.floor(Math.random() * 9) + 1;
  const sayi2 = Math.floor(Math.random() * 9) + 1;
  mevcutCaptchaCevabi = sayi1 + sayi2;
  if (lblCaptchaSoru) lblCaptchaSoru.textContent = `${sayi1} + ${sayi2} =`;
  if (txtCaptchaCevap) txtCaptchaCevap.value = "";
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const veri = await dbGet("families");

    if (veri) {
      tumAileler = veri;

      cmbFamilies.innerHTML =
        '<option value="" disabled selected>-- Lütfen Ailenizi Seçin --</option>';

      const familyItems = [];
      Object.keys(tumAileler).forEach((aileAdi) => {
        const option = document.createElement("option");
        option.value = aileAdi;
        option.textContent = aileAdi;
        cmbFamilies.appendChild(option);

        familyItems.push({ id: aileAdi, name: Sansurle(aileAdi) });
      });

      fillBubbleMenu("menuFamilies", familyItems);

      CaptchaUret();
      if (loadingArea) loadingArea.classList.add("hidden");
      if (loginForm) loginForm.classList.remove("hidden");
    } else {
      if (loadingArea) {
        loadingArea.innerHTML =
          "<p class='text-amber-400 font-medium text-xs'>Sistemde henüz kayıtlı bir aile bulunamadı!</p>";
      }
    }
  } catch (error) {
    if (loadingArea) {
      loadingArea.innerHTML =
        "<p class='text-rose-400 font-medium text-xs'>Veritabanı bağlantısı kurulamadı!</p>";
    }
    EngineToastGoster("Veritabanı bağlantısı başarısız.", "hata");
  }
});

cmbFamilies.addEventListener("change", () => {
  const secilenAile = cmbFamilies.value;
  cmbMembers.innerHTML =
    '<option value="" disabled selected>-- Üye Seçiniz --</option>';
  cmbMembers.disabled = false;

  const memberTrigger = document.getElementById("selectMemberTrigger");
  if (memberTrigger) {
    memberTrigger.classList.remove("opacity-50", "pointer-events-none");
    const span = memberTrigger.querySelector(".blur-text-layer");
    if (span) updateLabelWithBlur(span, "-- Üye Seçiniz --");
  }

  if (tumAileler[secilenAile] && tumAileler[secilenAile].members) {
    const uyeler = tumAileler[secilenAile].members;
    const memberItems = [];

    Object.keys(uyeler).forEach((uyeAdi) => {
      const option = document.createElement("option");
      option.value = uyeAdi;
      option.textContent = uyeAdi;
      cmbMembers.appendChild(option);

      memberItems.push({ id: uyeAdi, name: Sansurle(uyeAdi) });
    });

    fillBubbleMenu("menuMembers", memberItems);
  } else {
    cmbMembers.disabled = true;
    if (memberTrigger) {
      memberTrigger.classList.add("opacity-50", "pointer-events-none");
    }
  }
  SifirlamaButonunuGuncelle();
});

cmbMembers.addEventListener("change", SifirlamaButonunuGuncelle);

if (btnForgotPass) {
  btnForgotPass.addEventListener("click", () => {
    if (btnForgotPass.disabled || !cmbFamilies.value || !cmbMembers.value)
      return;
    sessionStorage.setItem("sifirlamaAile", cmbFamilies.value);
    sessionStorage.setItem("sifirlamaUye", cmbMembers.value);
    window.location.href = "sifre-sifirlama.html";
  });
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const aile = cmbFamilies.value;
  const uye = cmbMembers.value;
  const girilenSifre = txtPassword.value.trim();
  const girilenCaptcha = parseInt(txtCaptchaCevap.value.trim());

  if (!aile || !uye || !girilenSifre || isNaN(girilenCaptcha)) {
    EngineToastGoster("Lütfen tüm alanları doldurun!", "uyari");
    return;
  }

  if (girilenCaptcha !== mevcutCaptchaCevabi) {
    EngineToastGoster("Güvenlik doğrulaması hatalı!", "hata");
    CaptchaUret();
    return;
  }

  const dogruSifre = tumAileler[aile]?.members?.[uye]?.sistemID?.toString();

  if (girilenSifre === dogruSifre) {
    sessionStorage.setItem("secilenAile", aile);
    sessionStorage.setItem("secilenUye", uye);
    EngineToastGoster("Giriş başarılı! Yönlendiriliyorsunuz...", "basari");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  } else {
    EngineToastGoster("Hatalı şifre! Lütfen kontrol edin.", "hata");
    txtPassword.value = "";
    txtPassword.focus();
    CaptchaUret();
  }
});
