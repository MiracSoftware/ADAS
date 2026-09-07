// script.js
import {
  auth,
  db,
  dbGet,
  dbListen,
  get,
  push,
  ref,
  remove,
  set,
  signInWithEmailAndPassword,
} from "../assets/js/firebase-config.js";

let activeFamilyKey = null;
let activeMemberId = null;

function FormatTarih(timestamp) {
  if (!timestamp || timestamp === "Süresiz") return "Mevcut Değil";
  if (typeof timestamp === "string" && timestamp.includes("-"))
    return timestamp;
  const d = new Date(timestamp);
  return d.toISOString().replace("T", " ").substring(0, 19);
}

// Login Form Dinleyicisi
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const uName = document.getElementById("adminUser").value.trim();
    const uPass = document.getElementById("adminPass").value.trim();

    if (!uName || !uPass) {
      alert("⚠️ Lütfen Kullanıcı Adı ve Şifre alanlarını doldurun!");
      return;
    }

    // 1. Firebase Auth Oturumu Aç (Veritabanı okuma izni için arka plan oturumu)
    if (!auth.currentUser) {
      try {
        await signInWithEmailAndPassword(auth, "root@adas.com", "MiracOS21");
      } catch (err) {
        console.error("Firebase Auth oturum hatası:", err.message);
        alert(
          "❌ Firebase Kimlik Doğrulama Hatası! Lütfen Auth ayarlarını kontrol edin.",
        );
        return;
      }
    }

    // 2. Doğrulamayı SADECE Veritabanı (admin_credentials) Üzerinden Yap
    try {
      const creds = await dbGet("admin_credentials");

      if (!creds || !creds.username || !creds.password) {
        alert(
          "❌ Veritabanında 'admin_credentials' düğümü veya bilgileri bulunamadı!",
        );
        return;
      }

      // Sadece veritabanındaki bilgilerle karşılaştır
      if (uName === creds.username && uPass === creds.password) {
        document.getElementById("authContainer").classList.add("hidden");
        document.getElementById("panelContainer").classList.remove("hidden");
        SystemInit();
      } else {
        alert("❌ Geçersiz Kullanıcı Adı veya Şifre!");
      }
    } catch (err) {
      console.error("Veri okuma hatası:", err);
      alert(
        "❌ Veritabanı erişim hatası! Lütfen Firebase kurallarını (Rules) kontrol edin.",
      );
    }
  });
}

window.LogOut = function () {
  window.location.reload();
};

function SystemInit() {
  AileleriCanliDinle();
  TalepleriCanliDinle();
}

function TalepleriCanliDinle() {
  dbListen("premium_talepleri", (talepler) => {
    const listContainer = document.getElementById("requestList");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    if (!talepler) {
      listContainer.innerHTML = `<p class="text-slate-500 text-center py-8">Şu an bekleyen talep bulunmuyor.</p>`;
      return;
    }

    Object.keys(talepler).forEach((key) => {
      const t = talepler[key];
      const kartHTML = `
        <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-700 space-y-2 relative shadow-md">
            <div class="flex justify-between items-center">
                <span class="font-bold text-white text-[13px]">${t.aileAdi}</span>
                <span class="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded text-[10px] uppercase font-black">${t.secilenPlan}</span>
            </div>
            <div class="text-[11px] opacity-40"><i class="fa-regular fa-clock"></i> ${t.talepTarihi}</div>
            <div class="grid grid-cols-2 gap-2 pt-1">
                <button onclick="TalepKararaBagla('${key}', '${t.aileAdi}', '${t.secilenPlan}', true)" class="bg-emerald-600 hover:bg-emerald-700 py-1.5 rounded font-bold text-white text-[10px] transition">ONAYLA</button>
                <button onclick="TalepKararaBagla('${key}', '${t.aileAdi}', '${t.secilenPlan}', false)" class="bg-red-950 text-red-400 hover:bg-red-900 hover:text-white py-1.5 rounded font-bold text-[10px] transition">REDDET</button>
            </div>
        </div>
      `;
      listContainer.insertAdjacentHTML("beforeend", kartHTML);
    });
  });
}

window.TalepKararaBagla = async function (
  talepId,
  aileAdi,
  secilenPlan,
  onayDurumu,
) {
  if (!onayDurumu) {
    if (confirm(`${aileAdi} talebini silmek istediğinize emin misiniz?`)) {
      await remove(ref(db, `premium_talepleri/${talepId}`));
    }
    return;
  }

  let gun = 0,
    limit = 1;
  if (secilenPlan === "spec") {
    gun = 10957;
    limit = 10000;
  } else if (secilenPlan === "haftalik") {
    gun = 7;
    limit = 3;
  } else if (secilenPlan === "aylik") {
    gun = 30;
    limit = 6;
  } else if (secilenPlan === "yillik") {
    gun = 365;
    limit = 999;
  }

  const simdi = new Date();
  const bitis = new Date();
  bitis.setDate(simdi.getDate() + gun);

  const subData = {
    isPremium: secilenPlan !== "free",
    planType: secilenPlan,
    startDate: FormatTarih(simdi.getTime()),
    endDate: FormatTarih(bitis.getTime()),
    uyeLimiti: limit,
  };

  try {
    await set(ref(db, `families/${aileAdi}/subscription`), subData);
    await LogYaz(
      aileAdi,
      "Sistem",
      `Premium paket onaylandı: ${secilenPlan.toUpperCase()}`,
    );
    await remove(ref(db, `premium_talepleri/${talepId}`));
  } catch (e) {
    console.error(e);
  }
};

function AileleriCanliDinle() {
  dbListen("families", (aileler) => {
    const tbody = document.getElementById("familyTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!aileler) return;

    Object.keys(aileler).forEach((key) => {
      const sub = aileler[key].subscription || {
        isPremium: false,
        planType: "free",
        uyeLimiti: 1,
        endDate: "Süresiz",
      };
      const tr = document.createElement("tr");
      tr.className =
        activeFamilyKey === key ? "bg-indigo-950/40 text-white" : "";
      tr.innerHTML = `
        <td class="p-3 font-semibold" onclick="SelectFamily('${key}')"><i class="fa-solid fa-folder text-amber-500 mr-1.5"></i> ${key}</td>
        <td class="p-3" onclick="SelectFamily('${key}')"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${sub.isPremium ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-700 text-slate-400"}">${sub.planType.toUpperCase()}</span></td>
        <td class="p-3 opacity-80" onclick="SelectFamily('${key}')">${sub.uyeLimiti} Üye</td>
        <td class="p-3 text-slate-400" onclick="SelectFamily('${key}')">${sub.endDate}</td>
        <td class="p-3 text-right space-x-1">
            <button onclick="EditFamily('${key}', '${sub.planType}', ${sub.uyeLimiti}, '${sub.endDate}')" class="bg-indigo-950 text-indigo-400 p-1.5 rounded hover:bg-indigo-600 hover:text-white transition"><i class="fa-solid fa-pen"></i></button>
            <button onclick="DeleteFamily('${key}')" class="bg-red-950 text-red-400 p-1.5 rounded hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

window.SelectFamily = function (key) {
  activeFamilyKey = key;
  activeMemberId = null;
  document.getElementById("selectedFamilyTitle").textContent = key;
  document.getElementById("subManagementSection").classList.remove("hidden");
  document.getElementById("memberDetailSection").classList.add("hidden");

  UyelereGozKulakOl(key);
  LoglariGozKulakOl(key);
};

function UyelereGozKulakOl(familyKey) {
  dbListen(`families/${familyKey}/members`, (members) => {
    const tbody = document.getElementById("memberTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!members) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Bu aileye kayıtlı bir üye bulunmuyor.</td></tr>`;
      return;
    }

    Object.keys(members).forEach((key) => {
      const m = members[key];
      const gosterilecekIsim = key;
      const gosterilecekID = m.sistemID || "---";
      const gosterilecekYas = m.yas !== undefined ? m.yas : "---";
      const gosterilecekRol = m.rol || "Belirtilmedi";

      let gosterilecekPuan = 0;
      if (m.puan !== undefined) gosterilecekPuan = parseInt(m.puan);
      if (isNaN(gosterilecekPuan)) gosterilecekPuan = 0;

      const tr = document.createElement("tr");
      tr.className =
        activeMemberId === key ? "bg-emerald-950/40 text-white" : "";
      tr.innerHTML = `
        <td class="p-3 font-mono text-emerald-400" onclick="SelectMember('${key}')">${gosterilecekID}</td>
        <td class="p-3 font-semibold text-white" onclick="SelectMember('${key}')">${gosterilecekIsim}</td>
        <td class="p-3 opacity-80" onclick="SelectMember('${key}')">${gosterilecekYas} Yaş (${gosterilecekRol})</td>
        <td class="p-3 font-bold text-amber-400" onclick="SelectMember('${key}')"><i class="fa-solid fa-star text-xs mr-1"></i>${gosterilecekPuan}</td>
        <td class="p-3 text-right space-x-1">
            <button onclick="OpenMemberModal('${key}', '${gosterilecekYas}', '${gosterilecekPuan}', '${gosterilecekID}', '${gosterilecekRol}')" class="bg-slate-700 text-slate-300 p-1.5 rounded hover:bg-indigo-600 hover:text-white transition"><i class="fa-solid fa-user-gear"></i></button>
            <button onclick="DeleteMember('${key}')" class="bg-red-950 text-red-400 p-1.5 rounded hover:bg-red-600 hover:text-white transition"><i class="fa-solid fa-user-minus"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (activeMemberId && members[activeMemberId]) {
      UpdateDetailPanel(activeMemberId, members[activeMemberId]);
    }
  });
}

window.SelectMember = async function (key) {
  activeMemberId = key;
  const m = await dbGet(`families/${activeFamilyKey}/members/${key}`);
  if (m) {
    document.getElementById("memberDetailSection").classList.remove("hidden");
    UpdateDetailPanel(key, m);
  }
};

function UpdateDetailPanel(key, data) {
  const gosterilecekIsim = key;
  const gosterilecekID = data.sistemID || "---";
  const gosterilecekYas = data.yas !== undefined ? data.yas : "---";
  const gosterilecekRol = data.rol || "Belirtilmedi";

  let gosterilecekPuan = 0;
  if (data.puan !== undefined) gosterilecekPuan = parseInt(data.puan);
  if (isNaN(gosterilecekPuan)) gosterilecekPuan = 0;

  document.getElementById("detId").textContent = gosterilecekID;
  document.getElementById("detName").textContent = gosterilecekIsim;
  document.getElementById("detAge").textContent = gosterilecekYas + " Yaş";
  document.getElementById("detPoints").textContent = gosterilecekPuan + " Puan";
  document.getElementById("detRank").textContent = gosterilecekRol;

  const ilkKayit = data.kayitTarihi || FormatTarih(Date.now());
  const sonIslem = data.sonIslem || FormatTarih(Date.now());

  document.getElementById("detFirstReg").textContent = ilkKayit;
  document.getElementById("detLastAction").textContent = sonIslem;
}

window.HizliPuanVer = async function (delta) {
  if (!activeFamilyKey || !activeMemberId) return;

  const currentData = await dbGet(
    `families/${activeFamilyKey}/members/${activeMemberId}`,
  );

  if (currentData) {
    let eskiPuan = 0;
    if (currentData.puan !== undefined) eskiPuan = parseInt(currentData.puan);
    if (isNaN(eskiPuan)) eskiPuan = 0;

    const yeniPuan = Math.max(0, eskiPuan + delta);
    const simdiDuzgun = FormatTarih(Date.now());

    await set(
      ref(db, `families/${activeFamilyKey}/members/${activeMemberId}`),
      {
        ...currentData,
        puan: yeniPuan,
        sonIslem: simdiDuzgun,
      },
    );

    const isaret = delta > 0 ? "+" : "";
    await LogYaz(
      activeFamilyKey,
      "Yönetici",
      `${activeMemberId} puanı güncellendi: ${isaret}${delta} (Yeni Puan: ${yeniPuan})`,
    );
  }
};

function LoglariGozKulakOl(familyKey) {
  dbListen(`families/${familyKey}/logs`, (logs) => {
    const container = document.getElementById("logContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!logs) {
      container.innerHTML = `<p class="text-slate-500 text-center py-8">Kayıtlı işlem geçmişi temiz.</p>`;
      return;
    }

    Object.keys(logs)
      .reverse()
      .slice(0, 20)
      .forEach((key) => {
        const l = logs[key];
        const logHTML = `
          <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
              <div class="flex justify-between opacity-50 mb-0.5">
                  <span>${l.timestamp}</span>
                  <span class="font-bold text-indigo-400">${l.user}</span>
              </div>
              <div class="text-slate-200">${l.action}</div>
          </div>
        `;
        container.insertAdjacentHTML("beforeend", logHTML);
      });
  });
}

async function LogYaz(familyKey, user, action) {
  const timestamp = FormatTarih(Date.now());
  await push(ref(db, `families/${familyKey}/logs`), {
    timestamp,
    user,
    action,
  });
}

window.OpenMemberModal = function (
  key = "",
  yas = "",
  puan = "100",
  sistemID = "",
  rol = "Çocuk",
) {
  document.getElementById("memberForm").reset();

  if (key && typeof key === "string" && key.trim() !== "") {
    document.getElementById("memberModalTitle").textContent =
      "Üye Kimlik Kartını Düzenle";
    document.getElementById("editMemberId").value = key;
    document.getElementById("memberIdent").value =
      sistemID === "---" || !sistemID ? "" : sistemID;
    document.getElementById("memberName").value = key;
    document.getElementById("memberAge").value =
      yas === "---" || !yas ? "" : yas;
    document.getElementById("memberPoints").value = puan;
    document.getElementById("memberRol").value = rol || "Çocuk";
  } else {
    document.getElementById("memberModalTitle").textContent =
      "Aileye Yeni Üye Ekle";
    document.getElementById("editMemberId").value = "";
    document.getElementById("memberIdent").value = "";
    document.getElementById("memberName").value = "";
    document.getElementById("memberAge").value = "";
    document.getElementById("memberPoints").value = "100";
    document.getElementById("memberRol").value = "Çocuk";
  }
  document.getElementById("memberModal").classList.remove("hidden");
};

window.CloseMemberModal = function () {
  document.getElementById("memberModal").classList.add("hidden");
};

document.getElementById("memberForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeFamilyKey) return;

  const editKey = document.getElementById("editMemberId").value;
  const mId = document.getElementById("memberIdent").value.trim();
  const mName = document.getElementById("memberName").value.trim();
  const mAge = parseInt(document.getElementById("memberAge").value) || 0;
  const mPuan = parseInt(document.getElementById("memberPoints").value) || 0;
  const mRol = document.getElementById("memberRol").value;

  if (!mName) {
    alert("Lütfen geçerli bir İsim Soyisim girin.");
    return;
  }

  const simdiDuzgun = FormatTarih(Date.now());

  const veriPaketi = {
    sistemID: mId,
    yas: mAge,
    rol: mRol,
    puan: mPuan,
    sonIslem: simdiDuzgun,
  };

  if (editKey) {
    if (editKey !== mName) {
      await remove(ref(db, `families/${activeFamilyKey}/members/${editKey}`));
    }
    const oldSnap = await get(
      ref(db, `families/${activeFamilyKey}/members/${mName}/kayitTarihi`),
    );
    veriPaketi.kayitTarihi = oldSnap.exists() ? oldSnap.val() : simdiDuzgun;

    await set(
      ref(db, `families/${activeFamilyKey}/members/${mName}`),
      veriPaketi,
    );
    await LogYaz(activeFamilyKey, "Admin", `${mName} bilgileri güncellendi.`);
  } else {
    veriPaketi.kayitTarihi = simdiDuzgun;
    await set(
      ref(db, `families/${activeFamilyKey}/members/${mName}`),
      veriPaketi,
    );
    await LogYaz(
      activeFamilyKey,
      "Admin",
      `Yeni üye kaydedildi: ${mName} (${mId}) - Rol: ${mRol}`,
    );
  }

  if (activeMemberId === editKey || activeMemberId === null) {
    activeMemberId = mName;
  }

  window.CloseMemberModal();
});

window.DeleteMember = async function (memberId) {
  if (confirm(`Bu üyeyi silmek istediğinize emin misiniz?`)) {
    await remove(ref(db, `families/${activeFamilyKey}/members/${memberId}`));
    await LogYaz(activeFamilyKey, "Admin", `${memberId} üyesi silindi.`);
    if (activeMemberId === memberId) {
      document.getElementById("memberDetailSection").classList.add("hidden");
      activeMemberId = null;
    }
  }
};

window.OpenAddModal = function () {
  document.getElementById("crudForm").reset();
  document.getElementById("editKey").value = "";
  document.getElementById("modalFamilyKey").disabled = false;
  document.getElementById("modalTitle").textContent =
    "Yeni Aile Yapısı Tanımla";
  document.getElementById("crudModal").classList.remove("hidden");
};

window.CloseCrudModal = function () {
  document.getElementById("crudModal").classList.add("hidden");
};

window.EditFamily = function (key, plan, limit, end) {
  document.getElementById("editKey").value = key;
  document.getElementById("modalFamilyKey").value = key;
  document.getElementById("modalFamilyKey").disabled = false;
  document.getElementById("modalPlanType").value = plan;
  document.getElementById("modalUyeLimiti").value = limit;
  document.getElementById("modalEndDate").value = end === "Süresiz" ? "" : end;
  document.getElementById("modalTitle").textContent = "Grup Lisansını Güncelle";
  document.getElementById("crudModal").classList.remove("hidden");
};

window.DeleteFamily = async function (key) {
  if (
    confirm(
      `${key} grubu içindeki tüm üyelerle birlikte silinecektir! Emin misiniz?`,
    )
  ) {
    await remove(ref(db, `families/${key}`));
    if (activeFamilyKey === key) {
      document.getElementById("subManagementSection").classList.add("hidden");
      document.getElementById("memberDetailSection").classList.add("hidden");
      activeFamilyKey = null;
    }
  }
};

document.getElementById("crudForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const editKey = document.getElementById("editKey").value;
  const fKey = document.getElementById("modalFamilyKey").value.trim();
  const pType = document.getElementById("modalPlanType").value;
  const uLimit = parseInt(document.getElementById("modalUyeLimiti").value);
  const eDate =
    document.getElementById("modalEndDate").value.trim() || "Süresiz";

  const data = {
    isPremium: pType !== "free",
    planType: pType,
    startDate: FormatTarih(Date.now()),
    endDate: eDate,
    uyeLimiti: uLimit,
  };

  if (editKey && editKey !== fKey) {
    const oldSnapshot = await get(ref(db, `families/${editKey}`));
    const oldData = oldSnapshot.exists() ? oldSnapshot.val() : {};
    oldData.subscription = data;

    await set(ref(db, `families/${fKey}`), oldData);
    await remove(ref(db, `families/${editKey}`));
    activeFamilyKey = fKey;
  } else {
    await set(ref(db, `families/${fKey}/subscription`), data);
  }

  await LogYaz(fKey, "Sistem", `Lisans güncellendi: ${pType.toUpperCase()}`);
  window.CloseCrudModal();
});