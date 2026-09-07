import {
  auth,
  db,
  dbGet,
  ref,
  set,
  signInAnonymously,
} from "./firebase-config.js";
import { EngineToastGoster } from "./theme-engine.js";

const resetForm = document.getElementById("resetForm");
const selectedFamily = sessionStorage.getItem("sifirlamaAile");
const selectedMember = sessionStorage.getItem("sifirlamaUye");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

if (!selectedFamily || !selectedMember) {
  EngineToastGoster("Önce giriş ekranından aile ve üye seçiniz.", "uyari");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 900);
}

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!selectedFamily || !selectedMember) return;

  const memberCount = Number(
    document.getElementById("answerMemberCount").value,
  );
  const siblingCount = Number(
    document.getElementById("answerSiblingCount").value,
  );
  const motherAnswer = normalize(document.getElementById("answerMother").value);
  const fatherAnswer = normalize(document.getElementById("answerFather").value);
  const newPassword = document.getElementById("newPassword").value.trim();

  try {
    const family = await dbGet(`families/${selectedFamily}`);
    const member = family?.members?.[selectedMember];
    if (!family || !member) {
      EngineToastGoster("Seçilen aile veya üye bulunamadı.", "hata");
      return;
    }

    const members = family.members || {};
    const children = Object.values(members).filter((item) => {
      const role = normalize(item.rol || item.role || item.status);
      return (
        role.includes("çocuk") ||
        role.includes("cocuk") ||
        role.includes("child")
      );
    });
    const mother = Object.keys(members).find((name) =>
      normalize(
        members[name]?.rol || members[name]?.role || members[name]?.status,
      ).includes("anne"),
    );
    const father = Object.keys(members).find((name) =>
      normalize(
        members[name]?.rol || members[name]?.role || members[name]?.status,
      ).includes("baba"),
    );

    const valid =
      memberCount === Object.keys(members).length &&
      siblingCount === children.length &&
      mother &&
      normalize(mother) === motherAnswer &&
      father &&
      normalize(father) === fatherAnswer &&
      newPassword.length > 0;

    if (!valid) {
      EngineToastGoster("Verilen aile bilgileri doğrulanamadı.", "hata");
      return;
    }

    await signInAnonymously(auth);
    await set(ref(db, `families/${selectedFamily}/members/${selectedMember}`), {
      ...member,
      sistemID: newPassword,
    });

    sessionStorage.removeItem("sifirlamaAile");
    sessionStorage.removeItem("sifirlamaUye");
    EngineToastGoster(
      "Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz.",
      "basari",
    );
    setTimeout(() => {
      window.location.href = "index.html";
    }, 900);
  } catch (error) {
    console.error("Şifre sıfırlama Firebase hatası:", error);
    EngineToastGoster(
      error?.code === "auth/operation-not-allowed"
        ? "Firebase Console'da Anonymous giriş etkinleştirilmeli."
        : "Şifre güncellenemedi.",
      "hata",
    );
  }
});
