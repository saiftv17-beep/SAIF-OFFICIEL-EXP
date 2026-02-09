import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "ضع_هنا",
  authDomain: "ضع_هنا",
  databaseURL: "ضع_هنا",
  projectId: "ضع_هنا",
  storageBucket: "ضع_هنا",
  messagingSenderId: "ضع_هنا",
  appId: "ضع_هنا"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = null;
let trackers = {};

window.login = function(){
    if(user.value==="saif2026" && pass.value==="saif2008"){
        currentUser="saif";
        loginBox.style.display="none";
        panel.style.display="block";
        loadUIDs();
    }
};

window.logout=function(){
    location.reload();
};

async function loadUIDs(){
    const snapshot = await get(ref(db,'users/'+currentUser));
    if(snapshot.exists()){
        const data = snapshot.val();
        for(let uid in data){
            createTracker(uid,data[uid]);
        }
    }
}

window.addUID = async function(){
    const uid = uidInput.value;
    if(!uid) return;

    await set(ref(db,'users/'+currentUser+'/'+uid),{
        totalExp:0,
        lastExp:0
    });

    createTracker(uid,{totalExp:0,lastExp:0});
};

function createTracker(uid,saved){

    const div = document.createElement("div");
    div.className="tracker";
    div.id="tracker_"+uid;

    div.innerHTML=`
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${uid}" class="avatar">
        <div class="tracker-info">
            <h3 id="name_${uid}">Loading...</h3>
            <div id="status_${uid}" class="online">🟢 Online</div>
            <div>Level: <span id="level_${uid}">1</span></div>
            <div>EXP: <span id="exp_${uid}">0</span></div>
            <div>EXP/min: <span id="min_${uid}">0</span></div>
            <div>Total EXP: <span id="total_${uid}">${saved.totalExp}</span></div>
            <div class="progress"><div id="bar_${uid}" class="progress-bar"></div></div>
            <button onclick="deleteUID('${uid}')">❌ حذف</button>
        </div>
    `;

    trackersDiv.appendChild(div);

    startLive(uid,saved);
}

async function startLive(uid,saved){

    let lastExp = saved.lastExp || 0;
    let totalExp = saved.totalExp || 0;

    setInterval(async ()=>{

        const res = await fetch(`https://ch9ayfa-info-v10-production.up.railway.app/get?uid=${uid}`);
        const data = await res.json();

        document.getElementById("name_"+uid).innerText=data.nickname;
        document.getElementById("level_"+uid).innerText=data.level;
        document.getElementById("exp_"+uid).innerText=data.exp;

        let diff = data.exp - lastExp;
        if(diff>0){
            totalExp+=diff;
            document.getElementById("tracker_"+uid).classList.add("glow");
            setTimeout(()=>document.getElementById("tracker_"+uid).classList.remove("glow"),1000);
        }

        document.getElementById("min_"+uid).innerText=diff;
        document.getElementById("total_"+uid).innerText=totalExp;

        let percent=(data.exp%1000)/1000*100;
        document.getElementById("bar_"+uid).style.width=percent+"%";

        lastExp=data.exp;

        await set(ref(db,'users/'+currentUser+'/'+uid),{
            totalExp:totalExp,
            lastExp:lastExp
        });

        let status=document.getElementById("status_"+uid);
        status.className = status.className==="online"?"offline":"online";
        status.innerHTML=status.className==="online"?"🟢 Online":"🔴 Offline";

    },60000);
}

window.deleteUID = async function(uid){
    await set(ref(db,'users/'+currentUser+'/'+uid),null);
    document.getElementById("tracker_"+uid).remove();
};