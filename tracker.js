import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ضع بيانات Firebase الخاصة بك هنا
const firebaseConfig = {
  apiKey: "PUT_YOURS",
  authDomain: "PUT_YOURS",
  databaseURL: "PUT_YOURS",
  projectId: "PUT_YOURS",
  storageBucket: "PUT_YOURS",
  messagingSenderId: "PUT_YOURS",
  appId: "PUT_YOURS"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = "saif"; // ثابت بعد تسجيل الدخول

/* إضافة UID للتتبع */
window.addUID = async function(){
    const uid = document.getElementById("uidInput").value;
    if(!uid) return alert("❌ أدخل UID!");

    // حفظ UID في Firebase مع قيم أولية
    await set(ref(db,'users/'+currentUser+'/'+uid),{
        totalExp:0,
        lastExp:0
    });

    createTracker(uid,{totalExp:0,lastExp:0});
};

/* تحميل جميع UID المحفوظة */
async function loadUIDs(){
    const snapshot = await get(ref(db,'users/'+currentUser));
    if(snapshot.exists()){
        const data = snapshot.val();
        for(let uid in data){
            createTracker(uid,data[uid]);
        }
    }
}

/* إذا كان المستخدم مسجل دخول سابقًا */
if(localStorage.getItem("vipLogged")==="true"){
    loadUIDs();
}

/* إنشاء بطاقة التتبع */
function createTracker(uid,saved){
    const div = document.createElement("div");
    div.className="tracker";
    div.id="tracker_"+uid;

    div.innerHTML=`
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${uid}" class="avatar">
        <div class="tracker-info">
            <h3 id="name_${uid}">جارِ التحميل...</h3>
            <div>UID: <span id="uid_${uid}">${uid}</span></div>
            <div id="status_${uid}" class="online">🟢 Online</div>
            <div>Level: <span id="level_${uid}">0</span></div>
            <div>EXP: <span id="exp_${uid}">0</span></div>
            <div>EXP/min: <span id="min_${uid}">0</span></div>
            <div>Total EXP: <span id="total_${uid}">${saved.totalExp}</span></div>
            <div class="progress"><div id="bar_${uid}" class="progress-bar"></div></div>
            <button onclick="deleteUID('${uid}')">❌ حذف</button>
        </div>
    `;

    document.getElementById("trackers").appendChild(div);
    startLive(uid,saved);
}

/* متابعة UID مباشرة */
async function startLive(uid,saved){

    let lastExp = saved.lastExp || 0;
    let totalExp = saved.totalExp || 0;

    setInterval(async ()=>{

        try {
            const res = await fetch(`https://ch9ayfa-info-v10-production.up.railway.app/get?uid=${uid}`);
            const json = await res.json();

            const info = json.data.basicInfo;

            // عرض الاسم والبيانات
            document.getElementById("name_"+uid).innerText = info.nickname;
            document.getElementById("level_"+uid).innerText = info.level;
            document.getElementById("exp_"+uid).innerText = info.exp;

            // حساب الزيادة
            let diff = info.exp - lastExp;
            if(diff>0){
                totalExp+=diff;
                document.getElementById("tracker_"+uid).classList.add("glow");
                setTimeout(()=>document.getElementById("tracker_"+uid).classList.remove("glow"),1000);
            }

            document.getElementById("min_"+uid).innerText = diff>0?diff:0;
            document.getElementById("total_"+uid).innerText = totalExp;

            // شريط التقدم من لفل إلى لفل التالي
            let requiredExp = 1000 + info.level*500; // تقديري
            let currentBaseExp = info.exp - (info.exp % requiredExp);
            let percent = (info.exp - currentBaseExp) / requiredExp * 100;
            if(percent>100) percent=100;
            if(percent<0) percent=0;
            document.getElementById("bar_"+uid).style.width = percent+"%";

            lastExp = info.exp;

            // حفظ دائم في Firebase
            await set(ref(db,'users/'+currentUser+'/'+uid),{
                totalExp:totalExp,
                lastExp:lastExp
            });

            // Online/Offline مؤشرات
            let status=document.getElementById("status_"+uid);
            status.className = status.className==="online"?"offline":"online";
            status.innerHTML = status.className==="online"?"🟢 Online":"🔴 Offline";

        } catch(e){
            console.error("خطأ في تتبع UID:",uid,e);
        }

    },60000); // تحديث كل دقيقة
}

/* حذف UID */
window.deleteUID = async function(uid){
    await remove(ref(db,'users/'+currentUser+'/'+uid));
    document.getElementById("tracker_"+uid).remove();
}