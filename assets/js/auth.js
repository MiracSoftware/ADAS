import { dbGet } from "./firebase-config.js";
import { EngineToastGoster, fillBubbleMenu } from "./theme-engine.js";

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

        familyItems.push({ id: aileAdi, name: aileAdi });
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
    const span = memberTrigger.querySelector("#lblSelectedMember");
    if (span) span.innerText = "-- Üye Seçiniz --";
  }

  if (tumAileler[secilenAile] && tumAileler[secilenAile].members) {
    const uyeler = tumAileler[secilenAile].members;
    const memberItems = [];

    Object.keys(uyeler).forEach((uyeAdi) => {
      const option = document.createElement("option");
      option.value = uyeAdi;
      option.textContent = uyeAdi;
      cmbMembers.appendChild(option);

      memberItems.push({ id: uyeAdi, name: uyeAdi });
    });

    fillBubbleMenu("menuMembers", memberItems);
  } else {
    cmbMembers.disabled = true;
    if (memberTrigger) {
      memberTrigger.classList.add("opacity-50", "pointer-events-none");
    }
  }
});

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