import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc
};

export function toMinutes(value) {
  const [hourStr, minStr] = value.split(":");
  return Number(hourStr) * 60 + Number(minStr);
}

export function calculateWorkedMinutes(start, end, breakMins) {
  const startMinutes = toMinutes(start);
  const endMinutesRaw = toMinutes(end);
  const endMinutes = endMinutesRaw >= startMinutes ? endMinutesRaw : endMinutesRaw + 24 * 60;
  return endMinutes - startMinutes - breakMins;
}

export function formatYen(value) {
  return Number(value).toLocaleString("ja-JP");
}

export function getMonthRange(monthValue) {
  const [yearStr, monthStr] = monthValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDate).padStart(2, "0")}`;
  return { monthStart, monthEnd };
}
