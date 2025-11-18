
const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");

if (hamburger) {
  hamburger.addEventListener("click", () => sidebar.classList.toggle("active"));

  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      sidebar.classList.remove("active");
    }
  });
}


const BASE_URL = "https://harley-referral-app.onrender.com/api/form";


async function fetchDashboardData() {

  const username = localStorage.getItem("username");
  if (!username) return window.location.href = "login.html";

  try {
    const endpoint = `${BASE_URL}/dashboard/${encodeURIComponent(username)}`;
    console.log("Fetching dashboard from:", endpoint);
    const res = await fetch(endpoint);
    if (!res.ok) {
      console.error("Dashboard fetch failed, status:", res.status, res.statusText);
      throw new Error("Failed to fetch dashboard");
    }

    const data = await res.json();

    console.log(data)

  const userNameEl = document.getElementById("userName");
  if (userNameEl) userNameEl.textContent = data.name || userNameEl.textContent;

  const referralLinkEl = document.getElementById("referralLink");
  if (referralLinkEl) referralLinkEl.value = data.referralLink || referralLinkEl.value;

    
    const referralsEls = Array.from(document.querySelectorAll(".referrals-count"));
    if (referralsEls.length > 0) {
      
      referralsEls[0].textContent = (data.filledReferrals ?? referralsEls[0].textContent);
    }
    if (referralsEls.length > 1) {
     
      referralsEls[1].textContent = (data.totalReferrals ?? referralsEls[1].textContent);
    }

  
    populateReferralTable(data.referrals || []);

  } catch (err) {
    console.error("Error fetching dashboard:", err);
    window.location.href = "login.html";
  }
}


function populateReferralTable(referrals) {
  const tableBody = document.querySelector("tbody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  referrals.forEach((ref, i) => {
    const statusColor = ref.status === "filled" ? "green" :
                        ref.status === "pending" ? "orange" : "red";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${ref.name}</td>
      <td>${ref.email}</td>
      <td style="color:${statusColor}; font-weight:600;">${ref.status}</td>
    `;
    tableBody.appendChild(tr);
  });
}


function copyReferralLink() {
  const referralInput = document.getElementById("referralLink");
  referralInput.select();
  referralInput.setSelectionRange(0, 99999);

  console.log(referralInput)

  navigator.clipboard.writeText(referralInput.value)
    .then(() => {
      const copyBtn = document.querySelector(".copy-btn");
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      copyBtn.style.backgroundColor = "#2e7d32";
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.backgroundColor = "#d32f2f";
      }, 2000);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchDashboardData(); 


  let interval = setInterval(fetchDashboardData, 10000);

  window.addEventListener("beforeunload", () => clearInterval(interval));


  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(interval); 
    } else {
      interval = setInterval(fetchDashboardData, 10000); 
    }
  });
});
