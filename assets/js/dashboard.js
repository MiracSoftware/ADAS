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
        cmbModalMembers.innerHTML =
          '<option value="" disabled selected>-- Üye Seçiniz --</option>';
        Object.keys(tumCekilenUyeler).forEach((uyeAdi) => {
          if (uyeAdi !== secilenUye) {
            const option = document.createElement("option");
            option.value = uyeAdi;
            option.textContent = uyeAdi;
            cmbModalMembers.appendChild(option);
          }
        });
        if (eskiSecim && tumCekilenUyeler[eskiSecim]) {
          cmbModalMembers.value = eskiSecim;
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
  tbodyLogs.innerHTML = "";
  if (!logVerisi || Object.keys(logVerisi).length === 0) {
    tbodyLogs.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 italic text-xs sm:text-sm">Henüz bir işlem geçmişiniz bulunmuyor.</td></tr>`;
    lblLogCount.textContent = "0 Kayıt";
    return;
  }
  const siraliDizi = Object.values(logVerisi).sort((a, b) =>
    (b.tarih || "").localeCompare(a.tarih || ""),
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
