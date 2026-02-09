import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

let currentUser = null;

/* LOGIN */
window.login = function(){
    const username = document.getElementById("user").value;
    const password = document.getElementById("pass").value;

    if(username==="saif2026" && password==="saif2008"){
        currentUser="saif";
        document.getElementById("loginBox").style.display="none";
        document.getElementById("panel").style.display="block";
        loadUIDs();
    }else{
        alert("❌ خطأ في البيانات");
    }
}

window.logout = function(){
    location.reload();
}

/* LOAD SAVED UIDS */
async function loadUIDs(){
    const snapshot = await get(ref(db,'users/'+currentUser));
    if(snapshot.exists()){
        const data = snapshot.val();
        for(let uid in data){
            createTracker(uid,data[uid]);
        }
    }
}

/* ADD UID */
window.addUID = async function(){
    const uid = document.getElementById("uidInput").value;
    if(!uid) return;

    await set(ref(db,'users/'+currentUser+'/'+uid),{
        totalExp:0,
        lastExp:0
    });

    createTracker(uid,{totalExp:0,lastExp:0});
}

/* CREATE CARD */
function createTracker(uid,saved){

    const div = document.createElement("div");
    div.className="tracker";
    div.id="tracker_"+uid;

    div.innerHTML=`
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${uid}" class="avatar">
        <div class="tracker-info">
            <h3 id="name_${uid}">Loading...</h3>
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

/* LIVE UPDATE */
async function startLive(uid,saved){

    let lastExp = saved.lastExp || 0;
    let totalExp = saved.totalExp || 0;

    setInterval(async ()=>{

        const res = await fetch(`https://ch9ayfa-info-v10-production.up.railway.app/get?uid=${uid}`);
        const json = await res.json();

        const info = json.data.basicInfo;

        document.getElementById("name_"+uid).innerText = info.nickname;
        document.getElementById("level_"+uid).innerText = info.level;
        document.getElementById("exp_"+uid).innerText = info.exp;

        let diff = info.exp - lastExp;

        if(diff>0){
            totalExp+=diff;
            document.getElementById("tracker_"+uid).classList.add("glow");
            setTimeout(()=>document.getElementById("tracker_"+uid).classList.remove("glow"),1000);
        }

        document.getElementById("min_"+uid).innerText = diff>0?diff:0;
        document.getElementById("total_"+uid).innerText = totalExp;

        let percent = (info.exp % 1000) / 1000 * 100;
        document.getElementById("bar_"+uid).style.width = percent+"%";

        lastExp = info.exp;

        await set(ref(db,'users/'+currentUser+'/'+uid),{
            totalExp:totalExp,
            lastExp:lastExp
        });

        let status=document.getElementById("status_"+uid);
        if(status.className==="online"){
            status.className="offline";
            status.innerHTML="🔴 Offline";
        }else{
            status.className="online";
            status.innerHTML="🟢 Online";
        }

    },60000);
}

/* DELETE */
window.deleteUID = async function(uid){
    await remove(ref(db,'users/'+currentUser+'/'+uid));
    document.getElementById("tracker_"+uid).remove();
}