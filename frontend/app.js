// After deployment, paste the contract address and ABI below.
// The ABI is intentionally included here so the frontend can run without a build step.
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function recordCount() view returns (uint256)",
  "function authorizedProvider(address) view returns (bool)",
  "function setProviderAuthorization(address provider, bool authorized)",
  "function addMedicalRecord(string patientId,string patientName,string diagnosis,string treatment,string doctorName) returns (uint256)",
  "function getMedicalRecord(uint256 id) view returns (tuple(uint256 id,string patientId,string patientName,string diagnosis,string treatment,string doctorName,uint256 timestamp,address addedBy,bool exists))",
  "event MedicalRecordAdded(uint256 indexed id,string patientId,address indexed addedBy,uint256 timestamp)",
  "error NotOwner()",
  "error NotAuthorized()",
  "error RecordNotFound()",
  "error EmptyRequiredField()"
];

const RPC_URL = "http://127.0.0.1:8545";

const LOCAL_ACCOUNTS = [
  {
    name: "Account #0 — Owner (Admin)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    key: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  },
  {
    name: "Account #1 — Dr. Sarah (Provider)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
  },
  {
    name: "Account #2 — Guest (Unauthorized)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    key: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
  }
];

const SAMPLE_RECORDS = [
  {
    patientId: "PAT-1024",
    patientName: "Alice Walker (Fictional)",
    diagnosis: "Acute Bronchitis (Demo)",
    treatment: "Amoxicillin 500mg, Rest, Hydration",
    doctorName: "Dr. Sarah Adams, MD"
  },
  {
    patientId: "PAT-2089",
    patientName: "Bob Miller (Fictional)",
    diagnosis: "Type 2 Diabetes Routine Check (Demo)",
    treatment: "Metformin 850mg, Diet Plan, Low Carb",
    doctorName: "Dr. Gregory House, MD"
  },
  {
    patientId: "PAT-3310",
    patientName: "Clara Smith (Fictional)",
    diagnosis: "Hypertension Stage 1 (Demo)",
    treatment: "Amlodipine 5mg, Low Sodium Diet",
    doctorName: "Dr. Meredith Grey, MD"
  }
];

let sampleIndex = 0;
let provider, signer, contract, account;
const $ = (id) => document.getElementById(id);
const short = (value) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function logActivity(title, detail, meta = "") {
  const log = $("activityLog");
  if (!log) return;
  if (log.querySelector(".muted")) log.innerHTML = "";
  const item = document.createElement("div");
  item.className = "activity-item";
  item.innerHTML = `<div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div><small>${escapeHtml(meta || new Date().toLocaleTimeString())}</small>`;
  log.prepend(item);
}

function setStatus(text, connected = false) {
  const el = $("connectionStatus");
  if (!el) return;
  el.innerHTML = `<i></i> ${escapeHtml(text)}`;
  el.classList.toggle("connected", connected);
}

function requireContract() {
  if (!contract || !signer) throw new Error("Local blockchain connection is not ready. Make sure 'npm run node' is running.");
}

async function refreshDashboard() {
  if (!contract || !account) return;
  try {
    const count = await contract.recordCount();
    $("recordCount").textContent = count.toString();
    $("accountShort").textContent = short(account);
    const allowed = await contract.authorizedProvider(account);
    const owner = await contract.owner();
    const isOwner = owner.toLowerCase() === account.toLowerCase();
    $("providerStatus").textContent = isOwner ? "Owner (Full Admin)" : (allowed ? "Authorized Provider" : "Not Authorized (Read Only)");
    $("providerStatus").style.color = isOwner || allowed ? "#1c654b" : "#a43e36";
    $("networkLabel").textContent = "Hardhat Local (Chain 31337)";
  } catch (err) {
    console.error("Dashboard refresh error:", err);
  }
}

async function selectLocalAccount(index) {
  const acc = LOCAL_ACCOUNTS[index] || LOCAL_ACCOUNTS[0];
  provider = new ethers.JsonRpcProvider(RPC_URL);
  signer = new ethers.Wallet(acc.key, provider);
  account = acc.address;
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  setStatus(`${short(account)}`, true);
  logActivity("Switched Account", `${acc.name} (${account})`, "WALLET");
  await refreshDashboard();
}

// Account Switcher event
const accountSelector = $("accountSelector");
if (accountSelector) {
  accountSelector.addEventListener("change", async (e) => {
    try {
      await selectLocalAccount(Number(e.target.value));
    } catch (err) {
      logActivity("Account switch error", err.message, "ERROR");
    }
  });
}

// Autofill Sample Data
const autofillBtn = $("autofillBtn");
if (autofillBtn) {
  autofillBtn.addEventListener("click", () => {
    const s = SAMPLE_RECORDS[sampleIndex % SAMPLE_RECORDS.length];
    sampleIndex++;
    $("f_patientId").value = s.patientId;
    $("f_patientName").value = s.patientName;
    $("f_diagnosis").value = s.diagnosis;
    $("f_treatment").value = s.treatment;
    $("f_doctorName").value = s.doctorName;
    logActivity("Autofilled form", `Loaded fictional record for ${s.patientName}`, "FORM");
  });
}

// View Latest Record Button
const viewLatestBtn = $("viewLatestBtn");
if (viewLatestBtn) {
  viewLatestBtn.addEventListener("click", async () => {
    try {
      requireContract();
      const count = await contract.recordCount();
      if (count === 0n) {
        logActivity("No records yet", "Register a record first.", "INFO");
        return;
      }
      $("lookupIdInput").value = count.toString();
      $("lookupForm").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    } catch (e) {
      logActivity("Lookup error", e.message, "ERROR");
    }
  });
}

// Quick Paste Provider Addresses
const fillAccount1Btn = $("fillAccount1Btn");
if (fillAccount1Btn) {
  fillAccount1Btn.addEventListener("click", () => {
    $("providerAddressInput").value = LOCAL_ACCOUNTS[1].address;
  });
}
const fillAccount2Btn = $("fillAccount2Btn");
if (fillAccount2Btn) {
  fillAccount2Btn.addEventListener("click", () => {
    $("providerAddressInput").value = LOCAL_ACCOUNTS[2].address;
  });
}

// Register Record Form
const recordForm = $("recordForm");
recordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = recordForm;
  const submitBtn = form.querySelector("button[type=submit]");
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.textContent = "Writing to blockchain…";

  try {
    requireContract();
    const data = Object.fromEntries(new FormData(form).entries());
    logActivity("Submitting transaction", `Adding patient ${data.patientName}…`, "PENDING");
    
    // Fetch latest fresh nonce from local node
    const nonce = await provider.getTransactionCount(account, "pending");
    const tx = await contract.addMedicalRecord(
      data.patientId.trim(),
      data.patientName.trim(),
      data.diagnosis.trim(),
      data.treatment.trim(),
      data.doctorName.trim(),
      { nonce }
    );
    const receipt = await tx.wait();
    form.reset();
    await refreshDashboard();
    logActivity("Medical record added!", `Mined in block #${receipt.blockNumber}. Tx: ${short(receipt.hash)}`, "CONFIRMED");
  } catch (e) {
    const msg = e.reason || e.shortMessage || e.message;
    logActivity("Could not add record", msg, "ERROR");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});

// Lookup Record Form
const lookupForm = $("lookupForm");
lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = lookupForm;
  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true;

  try {
    requireContract();
    const rawId = new FormData(form).get("recordId");
    if (!rawId || Number(rawId) <= 0) {
      $("recordResult").className = "result-empty";
      $("recordResult").innerHTML = `<div class="empty-icon" style="color:#a43e36">✕</div><strong>Invalid ID</strong><span>Record IDs start at 1.</span>`;
      logActivity("Lookup error", "Enter a record ID of 1 or greater.", "WARNING");
      return;
    }

    const id = BigInt(rawId);
    const count = await contract.recordCount();

    if (count === 0n) {
      $("recordResult").className = "result-empty";
      $("recordResult").innerHTML = `<div class="empty-icon">↳</div><strong>No Records on Chain Yet</strong><span>Register a record in panel 01 first.</span>`;
      logActivity("No records yet", "The registry currently has 0 records.", "INFO");
      return;
    }

    if (id > count) {
      $("recordResult").className = "result-empty";
      $("recordResult").innerHTML = `<div class="empty-icon" style="color:#a43e36">✕</div><strong>Record #${id} Not Found</strong><span>Only <b>${count}</b> record${count === 1n ? '' : 's'} registered on-chain so far. Try an ID between 1 and ${count}.</span>`;
      logActivity("Record not found", `Record #${id} does not exist. Current valid range is 1 to ${count}.`, "INFO");
      return;
    }

    logActivity("Querying blockchain", `Looking up record #${id}…`, "READ");
    const r = await contract.getMedicalRecord(id);
    const timestamp = new Date(Number(r.timestamp) * 1000).toLocaleString();
    $("recordResult").className = "result-empty";
    $("recordResult").innerHTML = `<div class="record-data"><h3>Record #${escapeHtml(r.id.toString())}</h3>
      ${row("Patient reference", r.patientId)}${row("Patient name", r.patientName)}
      ${row("Diagnosis", r.diagnosis)}${row("Treatment", r.treatment)}
      ${row("Doctor / provider", r.doctorName)}${row("Added at", timestamp)}
      ${row("Added by wallet", r.addedBy)}</div>`;
    logActivity("Record retrieved", `Record #${id} (${r.patientName}) read successfully.`, "READ");
  } catch (e) {
    const errorMsg = e.errorName === "RecordNotFound" || e.data === "0x3e07f1a1"
      ? `Record #${id} does not exist on the blockchain.`
      : (e.reason || e.shortMessage || e.message);
    $("recordResult").className = "result-empty";
    $("recordResult").innerHTML = `<div class="empty-icon" style="color:#a43e36">✕</div><strong>Lookup Failed</strong><span>${escapeHtml(errorMsg)}</span>`;
    logActivity("Lookup failed", errorMsg, "ERROR");
  } finally {
    submitBtn.disabled = false;
  }
});

function row(label, value) {
  return `<div class="data-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

// Access Control Form
const accessForm = $("accessForm");
accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = accessForm;
  const submitter = event.submitter;
  const authorized = submitter.value === "true";
  const submitBtn = submitter;
  submitBtn.disabled = true;

  try {
    requireContract();
    const address = new FormData(form).get("providerAddress").trim();
    if (!ethers.isAddress(address)) throw new Error("Enter a valid EVM wallet address.");
    logActivity("Updating permission", `${authorized ? "Authorizing" : "Revoking"} ${short(address)}…`, "PENDING");
    const nonce = await provider.getTransactionCount(account, "pending");
    const tx = await contract.setProviderAuthorization(address, authorized, { nonce });
    await tx.wait();
    form.reset();
    await refreshDashboard();
    logActivity("Access updated!", `${short(address)} is now ${authorized ? "authorized" : "revoked"}.`, "CONFIRMED");
  } catch (e) {
    logActivity("Access update failed", e.reason || e.shortMessage || e.message, "ERROR");
  } finally {
    submitBtn.disabled = false;
  }
});

// Refresh Dashboard Button
$("refreshBtn").addEventListener("click", async () => {
  try {
    requireContract();
    await refreshDashboard();
    logActivity("Dashboard refreshed", "Latest record count and permissions loaded.", "REFRESH");
  } catch (e) {
    logActivity("Refresh failed", e.message, "ERROR");
  }
});

// Auto-connect to Local Node on page load
window.addEventListener("DOMContentLoaded", async () => {
  try {
    await selectLocalAccount(0);
    logActivity("Ready", "Connected to local node at http://127.0.0.1:8545", "SYSTEM");
  } catch (e) {
    console.error("Auto-connect failed:", e);
    setStatus("Local node offline", false);
    logActivity("Connection notice", "Ensure 'npm run node' is running in your terminal.", "WARNING");
  }
});
