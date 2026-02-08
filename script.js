// ==========================
// Toggle Dark / Light Mode
// ==========================
function toggleTheme(){
    if(document.body.style.backgroundColor === "white"){
        // العودة للوضع الداكن
        document.documentElement.style.setProperty('--bg-color','#121212');
        document.documentElement.style.setProperty('--card-color','#1e1e1e');
        document.documentElement.style.setProperty('--text-color','#ffffff');
    } else {
        // الوضع الفاتح
        document.documentElement.style.setProperty('--bg-color','#ffffff');
        document.documentElement.style.setProperty('--card-color','#f2f2f2');
        document.documentElement.style.setProperty('--text-color','#000000');
    }
}

// ==========================
// Login Function
// ==========================
function login(){
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const msg = document.getElementById('loginMsg');

    if(user==="saif2026" && pass==="saif2008"){
        document.getElementById('loginDiv').style.display="none";
        document.getElementById('trackerDiv').style.display="block";
        loadGlobalTrackers();
    } else {
        msg.textContent="يوزر أو كلمة سر خاطئة!";
    }
}

// ==========================
// حساب EXP المطلوب للفل التالي
// ==========================
function getRequiredExp(level){
    return 1000 + (level * 500);
}

// ==========================
// Global Trackers Array
// ==========================
let trackers = [];

// Load trackers from Firebase DB
async function loadGlobalTrackers() {
    const snapshot = await get(child(ref(db), 'trackers'));
    if(snapshot.exists()){
        trackers = Object.values(snapshot.val());
        loadTrackers();
    }
}

// ==========================
// إضافة UID للتتبع
// ==========================
async function addTracker(){
    const uid = document.getElementById('uidInput').value.trim();
    if(!uid) return alert("ادخل UID!");
    if(trackers.find(t=>t.uid===uid)) return alert("تم تتبع هذا الحساب مسبقاً");

    const tracker = {
        uid: uid,
        nickname: "جارِ التحميل...",
        level: 0,
        exp: 0,
        oldExp: 0,
        oldLevel: 0,
        online: true
    };

    trackers.push(tracker);
    await set(ref(db, 'trackers/' + uid), tracker); // حفظ في Firebase
    loadTrackers();
    document.getElementById('uidInput').value = "";
}

// ==========================
// حذف UID من التتبع
// ==========================
async function deleteTracker(uid){
    trackers = trackers.filter(t=>t.uid!==uid);
    await set(ref(db, 'trackers/' + uid), null); // حذف من Firebase
    loadTrackers();
}

// ==========================
// تحميل وتتبع الحسابات
// ==========================
function loadTrackers(){
    const trackersDiv = document.getElementById("trackers");
    trackersDiv.innerHTML="";

    trackers.forEach(tracker=>{
        let div=document.createElement("div");
        div.className="tracker";
        div.id="tracker_"+tracker.uid;

        div.innerHTML=`
            <h3>UID: ${tracker.uid} <span id="status_${tracker.uid}" class="${tracker.online?'online':'offline'}">${tracker.online?'Online':'Offline'}</span></h3>
            <p>الاسم: <span id="name_${tracker.uid}">${tracker.nickname}</span></p>
            <p>Level: <span id="level_${tracker.uid}">${tracker.level}</span></p>
            <p>EXP: <span id="exp_${tracker.uid}">${tracker.exp}</span></p>
            <p>زيادة EXP: <span id="diffExp_${tracker.uid}">0</span></p>
            <p>زيادة Level: <span id="diffLevel_${tracker.uid}">0</span></p>
            <div class="progress">
                <div class="progress-bar" id="bar_${tracker.uid}"></div>
            </div>
            <button onclick="deleteTracker('${tracker.uid}')">❌ حذف التتبع</button>
        `;
        trackersDiv.appendChild(div);

        startLiveTracking(tracker);
    });
}

// ==========================
// التتبع الحي لكل حساب
// ==========================
function startLiveTracking(tracker){
    if(tracker.interval) clearInterval(tracker.interval);
    tracker.interval = setInterval(async ()=>{
        try {
            const res = await fetch(`https://ch9ayfa-info-v10-production.up.railway.app/get?uid=${tracker.uid}`);
            const data = await res.json();
            const info = data.data.basicInfo;

            tracker.nickname = info.nickname;
            const oldExp = tracker.exp;
            const oldLevel = tracker.level;

            tracker.exp = info.exp;
            tracker.level = info.level;

            // Online / Offline حقيقي حسب وجود البيانات
            tracker.online = data && data.data && data.data.basicInfo ? true : false;

            // تحديث DOM
            document.getElementById("name_"+tracker.uid).textContent = tracker.nickname;
            document.getElementById("level_"+tracker.uid).textContent = tracker.level;
            document.getElementById("exp_"+tracker.uid).textContent = tracker.exp;
            document.getElementById("diffExp_"+tracker.uid).textContent = tracker.exp - oldExp;
            document.getElementById("diffLevel_"+tracker.uid).textContent = tracker.level - oldLevel;
            document.getElementById("status_"+tracker.uid).textContent = tracker.online?'Online':'Offline';
            document.getElementById("status_"+tracker.uid).className = tracker.online?'online':'offline';

            // تحديث شريط التقدم بين كل لفل
            const requiredExp = getRequiredExp(tracker.level);
            const currentLevelBaseExp = tracker.exp - (tracker.exp % requiredExp);
            let percent = ((tracker.exp - currentLevelBaseExp) / requiredExp) * 100;
            if(percent>100) percent=100;
            if(percent<0) percent=0;
            document.getElementById("bar_"+tracker.uid).style.width = percent + "%";

            // حفظ تلقائي في Firebase
            await set(ref(db, 'trackers/' + tracker.uid), tracker);

        } catch(err){
            tracker.online = false;
            document.getElementById("status_"+tracker.uid).textContent = "Offline";
            document.getElementById("status_"+tracker.uid).className = "offline";
        }
    }, 60000); // كل 60 ثانية
}
</script>
</body>
</html>