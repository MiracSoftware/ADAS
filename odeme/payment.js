// ADAS/odeme/payment.js
function selectPlan(planKey, price) {
  const paymentArea = document.getElementById("paymentArea");
  const selectedBadge = document.getElementById("selectedBadge");
  const inputPlan = document.getElementById("inputPlan");
  const inputFamily = document.getElementById("inputFamily");

  if (paymentArea) {
    paymentArea.classList.remove("hidden");
    paymentArea.style.opacity = "1";
    paymentArea.style.transform = "scale(1)";
  }

  if (inputPlan) inputPlan.value = planKey;
  if (selectedBadge)
    selectedBadge.textContent = `${planKey.toUpperCase()} - ${price} ₺`;

  const sessionFamily = sessionStorage.getItem("secilenAile");
  if (sessionFamily && inputFamily) {
    inputFamily.value = sessionFamily;
  }

  if (paymentArea) {
    paymentArea.scrollIntoView({ behavior: "smooth" });
  }
}

window.selectPlan = selectPlan;

function getFormattedCurrentTimestamp() {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, "0");

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const cardNumberInput = document.getElementById("cardNumber");
  const cardExpiryInput = document.getElementById("cardExpiry");
  const paymentForm = document.getElementById("paymentForm");
  const paymentArea = document.getElementById("paymentArea");

  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", (e) => {
      let cursorPosition = e.target.selectionStart;
      let rawValue = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
      let formattedValue = "";

      for (let i = 0; i < rawValue.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formattedValue += " ";
        }
        formattedValue += rawValue[i];
      }

      e.target.value = formattedValue;

      if (
        e.inputType === "deleteContentBackward" &&
        formattedValue[cursorPosition - 1] === " "
      ) {
        cursorPosition--;
      }
      e.target.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  if (cardExpiryInput) {
    cardExpiryInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/[^0-9]/g, "");

      if (value.length >= 2) {
        let month = parseInt(value.substring(0, 2), 10);
        if (month > 12) month = 12;
        if (month === 0) month = 1;
        value = String(month).padStart(2, "0") + value.substring(2);
      }

      if (value.length > 2) {
        e.target.value = value.substring(0, 2) + "/" + value.substring(2, 4);
      } else {
        e.target.value = value;
      }
    });
  }

  if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const timestampStr = getFormattedCurrentTimestamp();
      const firebasePayload = {
        aileAdi: document.getElementById("inputFamily").value,
        secilenPlan: document.getElementById("inputPlan").value,
        talepTarihi: timestampStr,
        durum: "beklemede",
      };

      const firebaseUrl =
        "https://aile-davranis-analiz-sistemi-default-rtdb.europe-west1.firebasedatabase.app/premium_talepleri.json";

      try {
        const response = await fetch(firebaseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(firebasePayload),
        });

        if (response.ok) {
          alert(
            "🎉 Talep Gönderildi!\nTalebiniz, sistem yönetim birimine 'beklemede' olarak iletildi.",
          );
          paymentForm.reset();
          if (paymentArea) paymentArea.classList.add("hidden");
        } else {
          throw new Error(`Durum kodu: ${response.status}`);
        }
      } catch (error) {
        console.error("Bağlantı Hatası:", error);
        alert(
          "Veritabanına bağlanılamadı! Lütfen internet bağlantınızı kontrol edin.",
        );
      }
    });
  }
});
