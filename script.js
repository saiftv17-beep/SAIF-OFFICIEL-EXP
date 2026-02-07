// تحميل الحسابات من التخزين
let trackers = JSON.parse(localStorage.getItem("trackers")) || [];

// تسجيل الدخول
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

// تسجيل خروج
function logout(){
    localStorage.removeItem("loggedIn");
    location.reload();
}

// عند فتح الصفحة
if(localStorage.getItem("loggedIn")==="true"){
    loginBox.classList.add("hidden");
    panel.classList.remove("hidden");
    loadTrackers();
}

// إضافة حساب جديد
function addTracker(){

    const uid = document.getElementById("newUid").value.trim();
    if(!uid) return alert("أدخل UID");

    if(trackers.find(t=>t.uid===uid)){
        return alert("هذا الحساب مضاف مسبقاً");
    }

    trackers.push({
        uid: uid,
        oldExp: 0,
        oldLevel: 0
    });

    saveTrackers();
    loadTrackers();
    newUid.value="";
}

// حذف التتبع
function deleteTracker(uid){

    trackers = trackers.filter(t=>t.uid!==uid);
    saveTrackers();
    loadTrackers();
}

// حفظ في التخزين
function saveTrackers(){
    localStorage.setItem("trackers", JSON.stringify(trackers));
}

// تحميل الحسابات وعرضها
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

            <div class="progress">
                <div class="progress-bar" id="bar_${tracker.uid}"></div>
            </div>

            <button onclick="deleteTracker('${tracker.uid}')">
                ❌ حذف التتبع
            </button>
        `;

        trackersDiv.appendChild(div);

        // أول تحميل
        fetchData(tracker);

        // تحديث كل دقيقة (واحد فقط لكل حساب)
        if(!tracker._interval){
            tracker._interval = setInterval(()=>{
                fetchData(tracker);
            },60000);
        }

    });
}

// جلب البيانات من API
function fetchData(tracker){

    fetch(`https://ch9ayfa-info-v10-production.up.railway.app/get?uid=${tracker.uid}`)
    .then(res=>res.json())
    .then(data=>{

        if(!data.data || !data.data.basicInfo){
            document.getElementById("name_"+tracker.uid).innerText="لا يوجد بيانات";
            return;
        }

        let info = data.data.basicInfo;

        // عرض البيانات
        document.getElementById("name_"+tracker.uid).innerText = info.nickname || "غير معروف";
        document.getElementById("level_"+tracker.uid).innerText = info.level;
        document.getElementById("exp_"+tracker.uid).innerText = info.exp;

        // حساب النسبة (تقريبية)
        let percent = (info.exp % 100000) / 1000;
        document.getElementById("bar_"+tracker.uid).style.width = percent + "%";

        // حساب الفرق
        if(tracker.oldExp !== 0){

            let diffExp = info.exp - tracker.oldExp;
            let diffLevel = info.level - tracker.oldLevel;

            document.getElementById("diffExp_"+tracker.uid).innerText = diffExp > 0 ? "+"+diffExp : diffExp;
            document.getElementById("diffLevel_"+tracker.uid).innerText = diffLevel > 0 ? "+"+diffLevel : diffLevel;

        }

        // تحديث القيم القديمة
        tracker.oldExp = info.exp;
        tracker.oldLevel = info.level;

        saveTrackers();

    })
    .catch(err=>{
        document.getElementById("name_"+tracker.uid).innerText="خطأ في الاتصال";
    });

}