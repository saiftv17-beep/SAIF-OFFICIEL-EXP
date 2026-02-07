// ===================================
// 1️⃣ تحميل الحسابات من التخزين
// ===================================
let trackers = JSON.parse(localStorage.getItem("trackers")) || [];

// ===================================
// 2️⃣ تسجيل الدخول
// ===================================
function login(){
    if(username.value==="saif2026" && password.value==="saif2008"){
        localStorage.setItem("loggedIn","true");
        loginBox.classList.add("hidden");
        panel.classList.remove("hidden");
        loadTrackers();
    }else{
        loginError.innerText="بيانات غير صحيحة";
    }
}

// ===================================
// 3️⃣ تسجيل خروج
// ===================================
function logout(){
    localStorage.removeItem("loggedIn");
    location.reload();
}

// ===================================
// 4️⃣ تفعيل الوضع الداكن/الفاتح
// ===================================
function toggleTheme(){
    document.body.classList.toggle("light");
    localStorage.setItem("theme",
        document.body.classList.contains("light")?"light":"dark");
}

if(localStorage.getItem("theme")==="light"){
    document.body.classList.add("light");
}

// ===================================
// 5️⃣ عند فتح الصفحة
// ===================================
if(localStorage.getItem("loggedIn")==="true"){
    loginBox.classList.add("hidden");
    panel.classList.remove("hidden");
    loadTrackers();
}

// ===================================
// 6️⃣ إضافة حساب جديد
// ===================================
function addTracker(){

    const uid = document.getElementById("newUid").value.trim();
    if(!uid) return alert("أدخل UID");

    if(trackers.find(t=>t.uid===uid)){
        return alert("هذا الحساب مضاف مسبقاً");
    }

    trackers.push({
        uid: uid,
        oldExp: 0,
        oldLevel: 0,
        lastUpdate: Date.now(),
        lastStatusCheck: 0
    });

    saveTrackers();
    loadTrackers();
    newUid.value="";
}

// ===================================
// 7️⃣ حذف التتبع
// ===================================
function deleteTracker(uid){

    let tracker = trackers.find(t=>t.uid===uid);
    if(tracker && tracker._interval) clearInterval(tracker._interval);

    trackers = trackers.filter(t=>t.uid!==uid);
    saveTrackers();
    loadTrackers();
}

// ===================================
// 8️⃣ حفظ الحسابات
// ===================================
function saveTrackers(){
    localStorage.setItem("trackers", JSON.stringify(trackers));
}

// ===================================
// 9️⃣ تحميل الحسابات وعرضها
// ===================================
function loadTrackers(){

    const trackersDiv = document.getElementById("trackers");
    trackersDiv.innerHTML="";

    trackers.forEach(tracker=>{

        let div=document.createElement("div");
        div.className="tracker";
        div.id="tracker_"+tracker.uid;

        div.innerHTML=`
            <h3>UID: ${tracker.uid}</h3>
            <p>الاسم: <span id="name_${tracker.uid}">جارِ التحميل...</span></p>
            <p>Level: <span id="level_${tracker.uid}">0</span></p>
            <p>EXP: <span id="exp_${tracker.uid}">0</span></p>
            <p>زيادة EXP: <span id="diffExp_${tracker.uid}">0</span></p>
            <p>زيادة Level: <span id="diffLevel_${tracker.uid}">0</span></p>
            <p>التحديث بعد: <span id="timer_${tracker.uid}">30</span> ثانية</p>

            <div class="progress">
                <div class="progress-bar" id="bar_${tracker.uid}"></div>
            </div>

            <button onclick="deleteTracker('${tracker.uid}')">
                ❌ حذف التتبع
            </button>
        `;

        trackersDiv.appendChild(div);

        startLiveTracking(tracker);

    });
}

// ===================================
// 10️⃣ تتبع حي لكل حساب
// ===================================
function startLiveTracking(tracker){

    const UPDATE_EXP_INTERVAL = 30; // تحديث EXP و Level كل 30 ثانية
    const STATUS_INTERVAL = 60; // تحديث Online/Offline كل 60 ثانية

    let lastUpdate = tracker.lastUpdate || Date.now();
    let lastStatus = tracker.lastStatusCheck || 0;
    let now = Date.now();

    let secondsPassed = Math.floor((now - lastUpdate)/1000);
    let remaining = UPDATE_EXP_INTERVAL - secondsPassed;

    if(remaining <= 0){
        fetchData(tracker);
        tracker.lastUpdate = Date.now();
        saveTrackers();
        remaining = UPDATE_EXP_INTERVAL;
    }

    document.getElementById("timer_"+tracker.uid).innerText = remaining;

    // عداد تنازلي وتحديث دوري
    tracker._interval = setInterval(()=>{

        remaining--;
        document.getElementById("timer_"+tracker.uid).innerText = remaining;

        // تحديث EXP و Level كل 30 ثانية
        if(remaining <= 0){
            fetchData(tracker, false); // false → تحديث EXP فقط
            tracker.lastUpdate = Date.now();
            saveTrackers();
            remaining = UPDATE_EXP_INTERVAL;
        }

        // تحديث Online/Offline كل 60 ثانية
        let secondsSinceStatus = Math.floor((Date.now() - lastStatus)/1000);
        if(secondsSinceStatus >= STATUS_INTERVAL){
            fetchData(tracker, true); // true → تحديث الحالة فقط
            tracker.lastStatusCheck = Date.now();
            saveTrackers();
        }

    },1000);
}

// ===================================
// 11️⃣ جلب البيانات من API
// ===================================
function fetchData(tracker, updateStatusOnly=false){

    fetch(`https://ch9ayfa-info-v10-production.up.railway.app/get?uid=${tracker.uid}`)
    .then(res=>res.json())
    .then(data=>{
        const nameEl = document.getElementById("name_"+tracker.uid);

        if(!data.data || !data.data.basicInfo){
            nameEl.innerHTML = `لا يوجد بيانات <span style="color:red;">● Offline</span>`;
            if(!updateStatusOnly){
                document.getElementById("level_"+tracker.uid).innerText="0";
                document.getElementById("exp_"+tracker.uid).innerText="0";
                document.getElementById("diffExp_"+tracker.uid).innerText="0";
                document.getElementById("diffLevel_"+tracker.uid).innerText="0";
                document.getElementById("bar_"+tracker.uid).style.width="0%";
            }
            document.getElementById("soundOnline").play();
            return;
        }

        let info = data.data.basicInfo;

        // تحديث Online/Offline
        if(updateStatusOnly){
            nameEl.innerHTML = `${info.nickname || "غير معروف"} <span style="color:green;">● Online</span>`;
            return;
        }

        // تحديث الاسم مع مؤشر Online
        nameEl.innerHTML = `${info.nickname || "غير معروف"} <span style="color:green;">● Online</span>`;

        // تحديث المستوى و EXP
        let levelEl = document.getElementById("level_"+tracker.uid);
        let expEl = document.getElementById("exp_"+tracker.uid);
        let diffExpEl = document.getElementById("diffExp_"+tracker.uid);
        let diffLevelEl = document.getElementById("diffLevel_"+tracker.uid);
        let barEl = document.getElementById("bar_"+tracker.uid);

        // حساب الفرق
        if(tracker.oldExp !== 0){
            let diffExp = info.exp - tracker.oldExp;
            let diffLevel = info.level - tracker.oldLevel;

            diffExpEl.innerText = diffExp > 0 ? "+"+diffExp : diffExp;
            diffLevelEl.innerText = diffLevel > 0 ? "+"+diffLevel : diffLevel;

            // تشغيل صوت عند زيادة
            if(diffExp > 0 || diffLevel > 0){
                document.getElementById("soundExp").play();
            }
        }

        levelEl.innerText = info.level;
        expEl.innerText = info.exp;

        // تحديث شريط التقدم
        let percent = (info.exp % 100000)/1000;
        barEl.style.width = percent + "%";

        // تحديث القيم القديمة والحفظ
        tracker.oldExp = info.exp;
        tracker.oldLevel = info.level;
        tracker.lastUpdate = Date.now();

        saveTrackers();

    })
    .catch(err=>{
        const nameEl = document.getElementById("name_"+tracker.uid);
        nameEl.innerHTML = `خطأ في الاتصال <span style="color:red;">● Offline</span>`;
        document.getElementById("soundOnline").play();
    });
}