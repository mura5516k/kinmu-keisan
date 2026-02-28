import {
  auth,
  db,
  provider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  calculateWorkedMinutes,
  formatYen,
  getMonthRange
} from "./firebase-client.js";

const authState = document.getElementById("authState");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const navCard = document.getElementById("navCard");
const monthlySection = document.getElementById("monthlySection");
const targetMonth = document.getElementById("targetMonth");

const sumDays = document.getElementById("sumDays");
const sumHours = document.getElementById("sumHours");
const sumIncome = document.getElementById("sumIncome");
const entryList = document.getElementById("entryList");

let currentUser = null;

const now = new Date();
targetMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

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

targetMonth.addEventListener("change", async () => {
  if (currentUser) {
    await loadMonthlyEntries();
  }
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    authState.textContent = "ログインしていません";
    logoutBtn.disabled = true;
    navCard.hidden = true;
    monthlySection.hidden = true;
    resetSummary();
    return;
  }

  authState.textContent = `${user.displayName ?? "ユーザ"} (${user.email ?? ""})`;
  logoutBtn.disabled = false;
  navCard.hidden = false;
  monthlySection.hidden = false;

  await loadMonthlyEntries();
});

async function loadMonthlyEntries() {
  if (!currentUser) {
    return;
  }

  const { monthStart, monthEnd } = getMonthRange(targetMonth.value);
  const entriesRef = collection(db, "users", currentUser.uid, "entries");
  const q = query(entriesRef, where("date", ">=", monthStart), where("date", "<=", monthEnd), orderBy("date", "desc"));

  try {
    const snap = await getDocs(q);

    const rows = [];
    let totalMinutes = 0;
    let totalIncome = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const workedMinutes = calculateWorkedMinutes(data.startTime, data.endTime, Number(data.breakMinutes));
      const workedHours = workedMinutes / 60;
      const dayIncome = Math.round(workedHours * Number(data.hourlyWage));

      if (workedMinutes > 0) {
        totalMinutes += workedMinutes;
        totalIncome += dayIncome;
      }

      rows.push({
        id: docSnap.id,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: Number(data.breakMinutes),
        hourlyWage: Number(data.hourlyWage),
        workedHours: workedMinutes > 0 ? workedHours : 0,
        dayIncome: workedMinutes > 0 ? dayIncome : 0
      });
    });

    renderRows(rows);
    sumDays.textContent = `${rows.length}日`;
    sumHours.textContent = `${(totalMinutes / 60).toFixed(2)}h`;
    sumIncome.textContent = `${formatYen(totalIncome)}円`;
  } catch (error) {
    alert(`取得失敗: ${error.message}`);
  }
}

function renderRows(rows) {
  entryList.innerHTML = "";

  if (rows.length === 0) {
    entryList.innerHTML = '<p class="empty">データがありません。</p>';
    return;
  }

  rows.forEach((row) => {
    const article = document.createElement("article");
    article.className = "entry-card";
    article.innerHTML = `
      <div class="entry-head">
        <strong>${row.date}</strong>
        <button class="btn btn-danger" data-id="${row.id}">削除</button>
      </div>
      <dl class="entry-meta">
        <div><dt>勤務</dt><dd>${row.startTime} - ${row.endTime}</dd></div>
        <div><dt>休憩</dt><dd>${row.breakMinutes}分</dd></div>
        <div><dt>時給</dt><dd>${formatYen(row.hourlyWage)}円</dd></div>
        <div><dt>実働</dt><dd>${row.workedHours.toFixed(2)}h</dd></div>
        <div><dt>日収</dt><dd>${formatYen(row.dayIncome)}円</dd></div>
      </dl>
    `;
    entryList.appendChild(article);
  });

  entryList.querySelectorAll("button[data-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const { id } = button.dataset;
      if (!id || !currentUser) {
        return;
      }
      if (!confirm("このレコードを削除しますか？")) {
        return;
      }
      await deleteDoc(doc(db, "users", currentUser.uid, "entries", id));
      await loadMonthlyEntries();
    });
  });
}

function resetSummary() {
  entryList.innerHTML = "";
  sumDays.textContent = "0日";
  sumHours.textContent = "0.00h";
  sumIncome.textContent = "0円";
}
