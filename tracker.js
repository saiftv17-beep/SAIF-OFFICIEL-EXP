import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCAj1-O4RBQPP5GOHm9M4JdGey7tgdl7-E",
  authDomain: "vip-tracker-saif.firebaseapp.com",
  databaseURL: "https://vip-tracker-saif-default-rtdb.firebaseio.com",
  projectId: "vip-tracker-saif",
  storageBucket: "vip-tracker-saif.appspot.com",
  messagingSenderId: "877224293250",
  appId: "1:877224293250:web:ecf000a1d6961b948d559b"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =======================
// تسجيل الدخول
// =======================
const USERS = { "saif2026":"saif2008" };
let currentUser = null;
let trackers = [];

window.login = function(){
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if(USERS[username] && USERS[username] === password){
    currentUser = username;
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("trackerPanel").style.display = "block";
    loadTrackersFromFirebase();
  } else alert("اسم المستخدم أو كلمة المرور خاطئة!");
}

// تبديل الوضع الداكن/الفاتح
window.toggleTheme = function(){
  if(document.body.style.background === "rgb(18, 18, 18)"){
    document.body.style.background = "#f0f0f0";
    document.body.style.color = "#000";
    document.querySelectorAll(".tracker").forEach(t=>t.style.background="#fff");
  }else{
    document.body.style.background = "#121212";
    document.body.style.color = "#fff";
    document.querySelectorAll(".tracker").forEach(t=>t.style.background="#1e1e1e");
  }
}

// =======================
// إضافة UID للتتبع
// =======================
window.addTracker = async function(){
  const uid = document.getElementById("uidInput").value.trim();
  if(!uid || trackers.includes(uid)) return;
  trackers.push(uid);
  const userRef = ref(db,"users/"+currentUser+"/trackers/"+uid);
  await set(userRef,{exp:0,level:1,startExp:0,totalExp:0,minuteExp:0,online:true,nickname:""});
  createTracker(uid);
  document.getElementById("uidInput").value="";
}

// =======================
// حذف UID
// =======================
window.deleteTracker = async function(uid){
  trackers = trackers.filter(u=>u!==uid);
  await set(ref(db,"users/"+currentUser+"/trackers"),Object.fromEntries(trackers.map(u=>[u,{}])));
  document.getElementById("tracker_"+uid).remove();
}

// =======================
// إنشاء بطاقة UID
// =======================
function createTracker(uid){
  const trackersDiv = document.getElementById("trackers");
  const div = document.createElement("div");
  div.className = "tracker";
  div.id = "tracker_" + uid;
  div.innerHTML = `
    <img src="https://i.ibb.co/2s3Q3Vs/avatar.png" class="avatar" alt="avatar">
    <div class="tracker-info">
      <h4 id="nickname_${uid}">جارِ التحميل...</h4>
      <div id="status_${uid}" class="online">🟢 Online</div>
      <div>Level: <span id="level_${uid}">1</span></div>
      <div>EXP: <span id="exp_${uid}">0</span></div>
      <div>EXP/min: <span id="minuteExp_${uid}">0</span></div>
      <div>Total EXP since start: <span id="totalExp_${uid}">0</span></div>
      <div class="progress"><div class="progress-bar" id="bar_${uid}"></div></div>
      <button onclick="deleteTracker('${uid}')">حذف التتبع</button>
    </div>
  `;
  trackersDiv.appendChild(div);
  startLive(uid);
}

// =======================
// تحميل البيانات عند تسجيل الدخول
// =======================
async function loadTrackersFromFirebase(){
  const snap = await get(ref(db,"users/"+currentUser+"/trackers"));
  if(snap.exists()){
    const data = snap.val();
    trackers = Object.keys(data);
    trackers.forEach(uid => createTracker(uid));
  }
}

// =======================
// API الحقيقي + تحديث EXP
// =======================
async function fetchPlayer(uid){
  try{
    const res = await fetch("https://ch9ayfa-info-v10-production.up.railway.app/get?uid="+uid);
    const data = await res.json();
    return data.data.basicInfo;
  }catch(e){ return null; }
}

// EXP المطلوب لكل لفل
function requiredExp(level){ return 1000 + (level*500); }

// =======================
// التتبع المباشر لكل UID
// =======================
async function startLive(uid){
  const userRef = ref(db,"users/"+currentUser+"/trackers/"+uid);
  let oldExp = 0;

  async function updateLive(){
    const info = await fetchPlayer(uid);
    if(!info) return;
    const snap = await get(userRef);
    let tracker = snap.val();

    // أول مرة تبدأ التتبع
    if(!tracker.startExp) tracker.startExp = info.exp;
    if(!tracker.totalExp) tracker.totalExp = 0;

    // حساب زيادة EXP منذ أول التتبع
    let gained = info.exp - tracker.startExp;
    tracker.totalExp = gained;

    // EXP في الدقيقة
    tracker.minuteExp = gained - (tracker.lastGained||0);
    tracker.lastGained = gained;

    // تحديث بيانات Firebase
    tracker.level = info.level;
    tracker.exp = info.exp;
    tracker.nickname = info.nickname;

    await update(userRef,{
      exp: tracker.exp,
      level: tracker.level,
      startExp: tracker.startExp,
      totalExp: tracker.totalExp,
      minuteExp: tracker.minuteExp,
      online: tracker.online,
      nickname: tracker.nickname,
      lastGained: tracker.lastGained
    });

    // عرض البيانات
    document.getElementById("nickname_"+uid).innerText = tracker.nickname;
    document.getElementById("level_"+uid).innerText = tracker.level;
    document.getElementById("exp_"+uid).innerText = tracker.exp;
    document.getElementById("minuteExp_"+uid).innerText = tracker.minuteExp;
    document.getElementById("totalExp_"+uid).innerText = tracker.totalExp;

    // شريط التقدم للفل التالي
    let percent = (tracker.exp % requiredExp(tracker.level)) / requiredExp(tracker.level) * 100;
    if(percent>100) percent=100;
    if(percent<0) percent=0;
    document.getElementById("bar_"+uid).style.width = percent+"%";

    // Online/Offline
    const statusEl = document.getElementById("status_"+uid);
    if(tracker.online){
      statusEl.innerText = "🟢 Online";
      statusEl.className = "online";
    }else{
      statusEl.innerText = "🔴 Offline";
      statusEl.className = "offline";
    }
  }

  updateLive(); // تحديث مباشر أول مرة
  setInterval(updateLive,60000); // تحديث كل دقيقة
}