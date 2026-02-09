function login(){

    const username = document.getElementById("user").value;
    const password = document.getElementById("pass").value;

    if(username === "saif2026" && password === "saif2008"){

        localStorage.setItem("vipLogged","true");

        document.getElementById("loginBox").style.display = "none";
        document.getElementById("panel").style.display = "block";

    } else {
        alert("❌ بيانات الدخول غير صحيحة");
    }
}

function logout(){
    localStorage.removeItem("vipLogged");
    location.reload();
}

window.onload = function(){
    if(localStorage.getItem("vipLogged") === "true"){
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("panel").style.display = "block";
    }
}