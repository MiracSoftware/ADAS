// ADAS/assets/js/dashboard.js
import {
  auth,
  db,
  dbListen,
  push,
  ref,
  set,
  signOut,
} from "./firebase-config.js";

const mainDashboard = document.getElementById("mainDashboard");
const lblWelcome = document.getElementById("lblWelcome");
const lblFamilyName = document.getElementById("lblFamilyName");
const lblTotalPuan = document.getElementById("lblTotalPuan");
const lblStatus = document.getElementById("lblStatus");
const lblSistemID = document.getElementById("lblSistemID");
const lblLastAction = document.getElementById("lblLastAction");
const lblLogCount = document.getElementById("lblLogCount");
const tbodyLogs = document.getElementById("tbodyLogs");
const btnLogout = document.getElementById("btnLogout");
const cmbLogSort = document.getElementById("cmbLogSort");

const puanlaModal = document.getElementById("puanlaModal");
const btnOpenPuanlaModal = document.getElementById("btnOpenPuanlaModal");
const btnClosePuanlaModal = document.getElementById("btnClosePuanlaModal");
const cmbModalMembers = document.getElementById("cmbModalMembers");
const tabOlumlu = document.getElementById("tabOlumlu");
const tabOlumsuz = document.getElementById("tabOlumsuz");
const areaOlumlu = document.getElementById("areaOlumlu");
const areaOlumsuz = document.getElementById("areaOlumsuz");
const txtDavranisAra = document.getElementById("txtDavranisAra");
const lblNoResult = document.getElementById("lblNoResult");

const secilenAile = sessionStorage.getItem("secilenAile");
const secilenUye = sessionStorage.getItem("secilenUye");

let tumCekilenUyeler = {};
let activeListeners = [];
let sonPuan = null;
let sonLogVerisi = null;

function DashboardComboboxlariniBaslat() {
  document.querySelectorAll("[data-dashboard-combobox]").forEach((combobox) => {
    const trigger = combobox.querySelector(".dashboard-select-trigger");
    const menu = combobox.querySelector(".dashboard-select-menu");
    const nativeSelect = combobox.querySelector(".dashboard-native-select");
    if (!trigger || !menu || !nativeSelect) return;

    let peekTimer = null;
    let popTimer = null;
    let peekStarted = false;

    const menuKapat = () => {
      window.clearTimeout(peekTimer);
      window.clearTimeout(popTimer);
      trigger.classList.remove("peek-active", "pop-active");
      menu.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
      peekStarted = false;
    };

    const menuAc = () => {
      document
        .querySelectorAll(".dashboard-select-menu.open")
        .forEach((acikMenu) => {
          if (acikMenu !== menu) acikMenu.classList.remove("open");
        });
      menu.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    };

    const popBaslat = () => {
      if (!peekStarted) return;
      trigger.classList.add("pop-active");
      if (navigator.vibrate) navigator.vibrate([10, 20, 18]);
    };

    trigger.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      trigger.setPointerCapture?.(event.pointerId);
      peekStarted = false;
      peekTimer = window.setTimeout(() => {
        peekStarted = true;
        trigger.classList.add("peek-active");
        menuAc();
        if (navigator.vibrate) navigator.vibrate(12);
      }, 200);
      popTimer = window.setTimeout(popBaslat, 500);
    });

    trigger.addEventListener("pointerup", (event) => {
      event.preventDefault();
      const wasPeek = peekStarted;
      const wasOpen = menu.classList.contains("open");
      if (wasPeek) {
        window.clearTimeout(peekTimer);
        window.clearTimeout(popTimer);
        trigger.classList.remove("peek-active", "pop-active");
        peekStarted = false;
        return;
      }
      menuKapat();
      if (!wasOpen) menuAc();
    });

    trigger.addEventListener("pointercancel", (event) => {
      event.preventDefault();
      menuKapat();
    });
    trigger.addEventListener("contextmenu", (event) => event.preventDefault());
    menu.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const item = event.target.closest(".ios-bubble-item");
      if (!item) return;
      const value = item.dataset.value;
      nativeSelect.value = value;
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      const label = trigger.querySelector("span");
      if (label) label.textContent = item.textContent.trim();
      menuKapat();
    });

    menu.addEventListener("pointerdown", (event) => event.preventDefault());
    menu.addEventListener("pointermove", (event) => event.preventDefault());
    menu.addEventListener("pointerup", (event) => event.preventDefault());

    nativeSelect.addEventListener("change", () => {
      const selected = nativeSelect.selectedOptions[0];
      const label = trigger.querySelector("span");
      if (selected && label) label.textContent = selected.textContent;
    });
  });
}

function DashboardMenuDoldur(menuId, selectId, items, placeholder = "") {
  const menu = document.getElementById(menuId);
  const select = document.getElementById(selectId);
  if (!menu || !select) return;

  menu.innerHTML = items
    .map(
      (item) =>
        `<div class="ios-bubble-item" data-value="${item.value}" role="option">${item.label}</div>`,
    )
    .join("");

  select.innerHTML = placeholder
    ? `<option value="" disabled selected>${placeholder}</option>`
    : "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
}

function TarihiSayiyaCevir(tarih) {
  const parcalar = (tarih || "").match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (!parcalar) return 0;
  return new Date(
    Number(parcalar[3]),
    Number(parcalar[2]) - 1,
    Number(parcalar[1]),
    Number(parcalar[4] || 0),
    Number(parcalar[5] || 0),
    Number(parcalar[6] || 0),
  ).getTime();
}

DashboardComboboxlariniBaslat();
DashboardMenuDoldur("menuLogSort", "cmbLogSort", [
  { value: "desc", label: "Günümüzden geçmişe" },
  { value: "asc", label: "Geçmişten günümüze" },
]);

if (cmbLogSort) {
  cmbLogSort.addEventListener("change", () => TabloyuDoldur(sonLogVerisi));
}

if (!secilenAile || !secilenUye) {
  alert("Yetkisiz erişim! Giriş sayfasına yönlendiriliyorsunuz.");
  window.location.href = "index.html";
} else {
  mainDashboard.classList.remove("hidden");
  CanliVeriAkisiniBaslat();
}

function BildirimSesiCal() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

function HataGoster(mesaj, tur = "hata") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  const bg =
    tur === "hata"
      ? "bg-rose-600"
      : tur === "basari"
        ? "bg-emerald-600"
        : "bg-amber-500";
  toast.className = `${bg} text-white px-5 py-3 rounded-xl shadow-xl flex items-center justify-between min-w-[280px] sm:min-w-[320px] transform translate-x-full transition-all duration-300 pointer-events-auto text-sm font-medium`;
  toast.innerHTML = `<span>${mesaj}</span>`;
  container.appendChild(toast);

  BildirimSesiCal();

  setTimeout(() => toast.classList.remove("translate-x-full"), 10);
  setTimeout(() => {
    if (toast) {
      toast.classList.add("translate-x-full");
      setTimeout(() => toast.remove(), 300);
    }
  }, 3500);
}

function PuanRenkSinifiUygula(puan) {
  const sayisalPuan = parseInt(puan) || 0;
  lblTotalPuan.className =
    "text-5xl md:text-6xl font-black tracking-tight transition-all duration-300";
  if (sayisalPuan === 0) lblTotalPuan.classList.add("puan-sifir");
  else if (sayisalPuan > 0) lblTotalPuan.classList.add("puan-pozitif");
  else lblTotalPuan.classList.add("puan-negatif");
}

function CanliVeriAkisiniBaslat() {
  lblWelcome.textContent = `Hoş Geldin, ${secilenUye}`;
  lblFamilyName.textContent = `Aile Grubu: ${secilenAile}`;

  const unsubscribeProfil = dbListen(
    `families/${secilenAile}/members/${secilenUye}`,
    (profilVerisi) => {
      if (profilVerisi) {
        const gelenPuan =
          profilVerisi.puan !== undefined ? profilVerisi.puan : "0";

        if (sonPuan !== null && sonPuan !== gelenPuan) {
          const fark = parseInt(gelenPuan) - parseInt(sonPuan);
          const isaret = fark > 0 ? `+${fark}` : `${fark}`;
          HataGoster(
            `Puanınız Güncellendi! Yeni Puan: ${gelenPuan} (${isaret})`,
            fark >= 0 ? "basari" : "hata",
          );
        }
        sonPuan = gelenPuan;

        lblTotalPuan.textContent = gelenPuan;
        lblStatus.textContent = profilVerisi.rol || "--";
        lblSistemID.textContent = profilVerisi.sistemID || "--";
        lblLastAction.textContent = profilVerisi.sonIslem || "--";
        PuanRenkSinifiUygula(gelenPuan);
      }
    },
  );

  const unsubscribeAile = dbListen(
    `families/${secilenAile}/members`,
    (tumUyeler) => {
      if (tumUyeler) {
        tumCekilenUyeler = tumUyeler;
        const eskiSecim = cmbModalMembers.value;
        const uyeSecenekleri = Object.keys(tumCekilenUyeler)
          .filter((uyeAdi) => uyeAdi !== secilenUye)
          .map((uyeAdi) => ({ value: uyeAdi, label: uyeAdi }));
        DashboardMenuDoldur(
          "menuModalMembers",
          "cmbModalMembers",
          uyeSecenekleri,
          "-- Üye Seçiniz --",
        );
        if (eskiSecim && tumCekilenUyeler[eskiSecim]) {
          cmbModalMembers.value = eskiSecim;
          cmbModalMembers.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    },
  );

  const unsubscribeLogs = dbListen(
    `logs/${secilenAile}/${secilenUye}`,
    (logVerisi) => {
      TabloyuDoldur(logVerisi);
    },
  );

  activeListeners.push(unsubscribeProfil, unsubscribeAile, unsubscribeLogs);
}

function TabloyuDoldur(logVerisi) {
  sonLogVerisi = logVerisi;
  tbodyLogs.innerHTML = "";
  if (!logVerisi || Object.keys(logVerisi).length === 0) {
    tbodyLogs.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 italic text-xs sm:text-sm">Henüz bir işlem geçmişiniz bulunmuyor.</td></tr>`;
    lblLogCount.textContent = "0 Kayıt";
    return;
  }
  const siralamaYonu = cmbLogSort?.value === "asc" ? 1 : -1;
  const siraliDizi = Object.values(logVerisi).sort(
    (a, b) =>
      (TarihiSayiyaCevir(a.tarih) - TarihiSayiyaCevir(b.tarih)) * siralamaYonu,
  );
  lblLogCount.textContent = `${siraliDizi.length} Kayıt`;

  siraliDizi.forEach((log) => {
    const tr = document.createElement("tr");
    tr.className =
      "hover:bg-[#2b2b2b] transition duration-150 border-b border-gray-700 text-xs sm:text-sm";
    const hamPuan = (log.degisim || "0").toString();
    const degisimKutusu = hamPuan.includes("-")
      ? `<span class="text-rose-400 font-bold">${hamPuan}</span>`
      : `<span class="text-emerald-400 font-bold">+${hamPuan.replace("+", "")}</span>`;

    tr.innerHTML = `
      <td class="p-3 text-gray-300 font-mono tracking-tight whitespace-nowrap">${log.tarih || "--"}</td>
      <td class="p-3 text-gray-200 font-medium">${log.islemYapan || "--"}</td>
      <td class="p-3"><span class="bg-[#2b2b2b] border border-gray-600 px-2 py-0.5 rounded text-[11px] text-orange-300 font-semibold whitespace-nowrap">${log.islemTuru || "--"}</span></td>
      <td class="p-3">${degisimKutusu}</td>
      <td class="p-3 text-gray-400 max-w-[120px] sm:max-w-xs truncate" title="${log.islemNotu || ""}">${log.islemNotu || "--"}</td>
    `;
    tbodyLogs.appendChild(tr);
  });
}

function DavranislariFiltrele() {
  const arananKelime = txtDavranisAra.value.toLocaleLowerCase("tr-TR").trim();
  const aktifAlanId = areaOlumlu.classList.contains("hidden")
    ? "areaOlumsuz"
    : "areaOlumlu";
  const aktifAlan = document.getElementById(aktifAlanId);

  const butonlar = aktifAlan.querySelectorAll(".btn-davranis");
  const kategoriler = aktifAlan.querySelectorAll(".category-title");
  let gorunurButonSayisi = 0;

  butonlar.forEach((buton) => {
    const metin = buton.textContent.toLocaleLowerCase("tr-TR");
    const tur = buton.getAttribute("data-tur").toLocaleLowerCase("tr-TR");
    const not = buton.getAttribute("data-not").toLocaleLowerCase("tr-TR");

    if (
      metin.includes(arananKelime) ||
      tur.includes(arananKelime) ||
      not.includes(arananKelime)
    ) {
      buton.classList.remove("hidden");
      gorunurButonSayisi++;
    } else {
      buton.classList.add("hidden");
    }
  });

  kategoriler.forEach((kategori) => {
    let sonrakiEleman = kategori.nextElementSibling;
    let kategorideButonVarMi = false;

    while (
      sonrakiEleman &&
      !sonrakiEleman.classList.contains("category-title")
    ) {
      if (
        sonrakiEleman.classList.contains("btn-davranis") &&
        !sonrakiEleman.classList.contains("hidden")
      ) {
        kategorideButonVarMi = true;
        break;
      }
      sonrakiEleman = sonrakiEleman.nextElementSibling;
    }
    if (kategorideButonVarMi) kategori.classList.remove("hidden");
    else kategori.classList.add("hidden");
  });

  if (gorunurButonSayisi === 0) lblNoResult.classList.remove("hidden");
  else lblNoResult.classList.add("hidden");
}

txtDavranisAra.addEventListener("input", DavranislariFiltrele);

btnOpenPuanlaModal.addEventListener("click", () => {
  puanlaModal.classList.remove("hidden");
  txtDavranisAra.value = "";
  DavranislariFiltrele();
});

btnClosePuanlaModal.addEventListener("click", () => {
  puanlaModal.classList.add("hidden");
  cmbModalMembers.value = "";
  cmbModalMembers.dispatchEvent(new Event("change", { bubbles: true }));
});

tabOlumlu.addEventListener("click", () => {
  tabOlumlu.className =
    "flex-1 text-center py-2 text-sm font-bold rounded-md bg-emerald-600 text-white";
  tabOlumsuz.className =
    "flex-1 text-center py-2 text-sm font-bold rounded-md text-gray-400 hover:text-white";
  areaOlumlu.classList.remove("hidden");
  areaOlumsuz.classList.add("hidden");
  txtDavranisAra.value = "";
  DavranislariFiltrele();
});

tabOlumsuz.addEventListener("click", () => {
  tabOlumsuz.className =
    "flex-1 text-center py-2 text-sm font-bold rounded-md bg-rose-600 text-white";
  tabOlumlu.className =
    "flex-1 text-center py-2 text-sm font-bold rounded-md text-gray-400 hover:text-white";
  areaOlumsuz.classList.remove("hidden");
  areaOlumlu.classList.add("hidden");
  txtDavranisAra.value = "";
  DavranislariFiltrele();
});

document.addEventListener("click", async (e) => {
  const buton = e.target.closest(".btn-davranis");
  if (!buton) return;

  const hedefUye = cmbModalMembers.value;
  if (!hedefUye) {
    HataGoster("Lütfen önce puanlayacağınız üyeyi seçin!", "uyari");
    return;
  }

  const degisimMiktari = parseInt(buton.getAttribute("data-puan"));
  const islemTuru = buton.getAttribute("data-tur");
  const islemNotu = buton.getAttribute("data-not");
  const suAn = new Date()
    .toLocaleString("tr-TR", { hour12: false })
    .replace(",", "");

  const mevcutPuan = parseInt(tumCekilenUyeler[hedefUye]?.puan) || 0;
  const hesaplananYeniPuan = (mevcutPuan + degisimMiktari).toString();

  try {
    const guncelProfilVerisi = {
      ...tumCekilenUyeler[hedefUye],
      puan: hesaplananYeniPuan,
      sonIslem: `${islemTuru} uygulandı. Yeni Puan: ${hesaplananYeniPuan} (${suAn})`,
    };

    // Güvenli SDK güncellemeleri
    await set(
      ref(db, `families/${secilenAile}/members/${hedefUye}`),
      guncelProfilVerisi,
    );

    const yeniLogVerisi = {
      degisim:
        degisimMiktari > 0 ? `+${degisimMiktari}` : degisimMiktari.toString(),
      islemNotu: islemNotu,
      islemTuru: islemTuru,
      islemYapan: secilenUye,
      tarih: suAn,
    };

    await push(ref(db, `logs/${secilenAile}/${hedefUye}`), yeniLogVerisi);
    HataGoster(`${hedefUye} üyesine puan başarıyla gönderildi.`, "basari");
  } catch (error) {
    HataGoster("Veritabanına yazılırken bir sorun çıktı!", "hata");
  }
});

btnLogout.addEventListener("click", async () => {
  activeListeners.forEach((unsub) => {
    if (typeof unsub === "function") unsub();
  });
  await signOut(auth);
  sessionStorage.clear();
  window.location.href = "index.html";
});
