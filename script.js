let trackers = JSON.parse(localStorage.getItem("trackers")) || [];

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

if(localStorage.getItem("loggedIn")==="true"){
    loginBox.classList.add("hidden");
    panel.classList.remove("hidden");
    loadTrackers();
}

function logout(){
    localStorage.removeItem("loggedIn");
    location.reload();
}

function toggleTheme(){
    document.body.classList.toggle("light");
    localStorage.setItem("theme",
        document.body.classList.contains("light")?"light":"dark");
}

if(localStorage.getItem("theme")==="light"){
    document.body.classList.add("light");
}

function addTracker(){
    let uid=newUid.value;
    if(!uid) return;

    if(trackers.find(t=>t.uid===uid)) return alert("مضاف مسبقاً");

    trackers.push({
        uid:uid,
        oldExp:0,
        oldLevel:0,
        lastUpdate:Date.now()
    });

    saveTrackers();
    loadTrackers();
    newUid.value="";
}

function deleteTracker(uid){
    trackers=trackers.filter(t=>t.uid!==uid);
    saveTrackers();
    loadTrackers();
}

function saveTrackers(){
    localStorage.setItem("trackers",JSON.stringify(trackers));
}

function loadTrackers(){
    trackersDiv.innerHTML="";

    trackers.forEach(tracker=>{
        let div=document.createElement("div");
        div.className="tracker";
        div.id="tracker_"+tracker.uid;

        div.innerHTML=`
            <b>UID:</b> ${tracker.uid}
            <p>الاسم: <span id="name_${tracker.uid}">...</span></p>
            <p>Level: <span id="level_${tracker.uid}">0</span></p>
            <p>EXP: <span id="exp_${tracker.uid}">0</span></p>
            <p>زيادة EXP: <span id="diffExp_${tracker.uid}">0</span></p>
            <p>زيادة Level: <span id="diffLevel_${tracker.uid}">0</span></p>
            <div class="progress">
                <div class="progress-bar" id="bar_${tracker.uid}"></div>
            </div>
            <button onclick="deleteTracker('${tracker.uid}')">حذف التتبع</button>
        `;

        trackersDiv.appendChild(div);

        fetchData(tracker);
        setInterval(()=>fetchData(tracker),60000);
    });
}

function fetchData(tracker){
    fetch(`https://ch9ayfa-info-v10-production.up.railway.app/get?uid=${tracker.uid}`)
    .then(res=>res.json())
    .then(data=>{

        if(!data.data || !data.data.basicInfo) return;

        let info=data.data.basicInfo;

        document.getElementById("name_"+tracker.uid).innerText=info.nickname;
        document.getElementById("level_"+tracker.uid).innerText=info.level;
        document.getElementById("exp_"+tracker.uid).innerText=info.exp;

        let percent=(info.exp%100000)/1000;
        document.getElementById("bar_"+tracker.uid).style.width=percent+"%";

        if(tracker.oldExp!==0){
            document.getElementById("diffExp_"+tracker.uid)
            .innerText=info.exp-tracker.oldExp;

            document.getElementById("diffLevel_"+tracker.uid)
            .innerText=info.level-tracker.oldLevel;
        }

        tracker.oldExp=info.exp;
        tracker.oldLevel=info.level;
        tracker.lastUpdate=Date.now();
        saveTrackers();
    })
    .catch(err=>console.log("error"));
}