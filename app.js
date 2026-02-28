import {
  auth,
  db,
  provider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  calculateWorkedMinutes,
  formatYen
} from "./firebase-client.js";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";

const authState = document.getElementById("authState");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const navCard = document.getElementById("navCard");
const entrySection = document.getElementById("entrySection");

const entryForm = document.getElementById("entryForm");
const workDate = document.getElementById("workDate");
const startTime = document.getElementById("startTime");
const endTime = document.getElementById("endTime");
const breakMinutes = document.getElementById("breakMinutes");
const hourlyWage = document.getElementById("hourlyWage");

const previewHours = document.getElementById("previewHours");
const previewIncome = document.getElementById("previewIncome");
const desktopQrCanvas = document.getElementById("desktopQrCanvas");
const desktopQrUrl = document.getElementById("desktopQrUrl");

let currentUser = null;

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
workDate.value = `${currentMonth}-${String(now.getDate()).padStart(2, "0")}`;
setupDesktopQr();

googleLoginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert(`ログイン失敗: ${error.message}`);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    alert(`ログアウト失敗: ${error.message}`);
  }
});

[startTime, endTime, breakMinutes, hourlyWage].forEach((el) => {
  el.addEventListener("input", updatePreview);
});

entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    return;
  }

  const record = {
    date: workDate.value,
    startTime: startTime.value,
    endTime: endTime.value,
    breakMinutes: Number(breakMinutes.value),
    hourlyWage: Number(hourlyWage.value),
    createdAt: serverTimestamp()
  };

  if (!record.date || !record.startTime || !record.endTime || Number.isNaN(record.breakMinutes) || Number.isNaN(record.hourlyWage)) {
    alert("入力値を確認してください。");
    return;
  }

  if (record.breakMinutes < 0 || record.hourlyWage < 0) {
    alert("休憩時間・時給は0以上で入力してください。");
    return;
  }

  const workedMinutes = calculateWorkedMinutes(record.startTime, record.endTime, record.breakMinutes);
  if (workedMinutes <= 0) {
    alert("実働時間が0以下です。入力値を確認してください。");
    return;
  }

  try {
    await addDoc(collection(db, "users", currentUser.uid, "entries"), record);
    await setDoc(doc(db, "users", currentUser.uid), { defaultHourlyWage: record.hourlyWage }, { merge: true });
    alert("保存しました。");
  } catch (error) {
    alert(`保存失敗: ${error.message}`);
  }
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    authState.textContent = "ログインしていません";
    logoutBtn.disabled = true;
    navCard.hidden = true;
    entrySection.hidden = true;
    return;
  }

  authState.textContent = `${user.displayName ?? "ユーザ"} (${user.email ?? ""})`;
  logoutBtn.disabled = false;
  navCard.hidden = false;
  entrySection.hidden = false;

  await loadDefaultWage();
  updatePreview();
});

async function loadDefaultWage() {
  if (!currentUser) {
    return;
  }

  const profileRef = doc(db, "users", currentUser.uid);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    const data = profileSnap.data();
    if (typeof data.defaultHourlyWage === "number") {
      hourlyWage.value = String(data.defaultHourlyWage);
    }
  } else {
    await setDoc(profileRef, { createdAt: serverTimestamp() }, { merge: true });
  }
}

function updatePreview() {
  const start = startTime.value;
  const end = endTime.value;
  const breakMins = Number(breakMinutes.value);
  const wage = Number(hourlyWage.value);

  if (!start || !end || Number.isNaN(breakMins) || Number.isNaN(wage) || breakMins < 0 || wage < 0) {
    previewHours.textContent = "0.00h";
    previewIncome.textContent = "0円";
    return;
  }

  const workedMinutes = calculateWorkedMinutes(start, end, breakMins);
  if (workedMinutes <= 0) {
    previewHours.textContent = "0.00h";
    previewIncome.textContent = "0円";
    return;
  }

  const workedHours = workedMinutes / 60;
  const income = Math.round(workedHours * wage);

  previewHours.textContent = `${workedHours.toFixed(2)}h`;
  previewIncome.textContent = `${formatYen(income)}円`;
}

async function setupDesktopQr() {
  if (!desktopQrCanvas || !desktopQrUrl) {
    return;
  }

  const targetUrl = new URL(window.location.href);
  targetUrl.hash = "";
  const urlText = targetUrl.toString();
  desktopQrUrl.textContent = urlText;

  try {
    await QRCode.toCanvas(desktopQrCanvas, urlText, {
      width: 180,
      margin: 1,
      color: {
        dark: "#1f2937",
        light: "#ffffff"
      }
    });
  } catch (error) {
    desktopQrUrl.textContent = `QR生成失敗: ${error.message}`;
  }
}
