"use strict";
/*
  VIRTUAL INDUSTRIAL AUTOMATION LAB
  Dikembangkan oleh Vergissmeinnicht. (Tyasto Prima Ahmadi)
  Teknik Industri, Universitas Indonesia Mandiri
*/

const APP_PENNAME = "Vergissmeinnicht.";
const APP_AUTHOR = "Tyasto Prima Ahmadi";
const APP_AFFIL = "Teknik Industri, Universitas Indonesia Mandiri";
const APP_CREDIT_LINE = APP_PENNAME + " (" + APP_AUTHOR + ") - " + APP_AFFIL;

/* ==================== TOAST ==================== */
const TOAST_ICONS = { info:"i", success:"✓", warn:"!", error:"✕" };
function showToast(msg, type, duration){
  type = type || "info"; duration = duration || 3500;
  const container = document.getElementById("toast-container");
  if(!container) return;
  const t = document.createElement("div");
  t.className = "toast toast-" + type;
  t.innerHTML = '<div class="toast-icon">' + (TOAST_ICONS[type]||"i") + '</div>'
              + '<div class="toast-msg">' + msg + '</div>';
  container.appendChild(t);
  const all = container.querySelectorAll(".toast");
  if(all.length > 5) all[0].remove();
  void t.offsetWidth; t.classList.add("show");
  let timer = setTimeout(function(){
    t.classList.remove("show");
    setTimeout(function(){ t.remove(); }, 350);
  }, duration);
  t.addEventListener("click", function(){
    clearTimeout(timer); t.classList.remove("show");
    setTimeout(function(){ t.remove(); }, 350);
  });
}

/* ==================== MODAL KONFIRMASI ==================== */
function showConfirm(title, message, onConfirm){
  const c = document.getElementById("modal-container");
  const t = document.getElementById("modal-title");
  const m = document.getElementById("modal-message");
  const no = document.getElementById("modal-cancel");
  const yes = document.getElementById("modal-confirm");
  if(!c) return;
  t.textContent = title; m.textContent = message;
  c.classList.add("show");
  const cleanup = ()=>{
    c.classList.remove("show");
    no.removeEventListener("click", handleNo);
    yes.removeEventListener("click", handleYes);
    document.removeEventListener("keydown", handleKey);
  };
  const handleNo = ()=>cleanup();
  const handleYes = ()=>{ cleanup(); onConfirm(); };
  const handleKey = (e)=>{ if(e.key === "Escape") cleanup(); };
  no.addEventListener("click", handleNo);
  yes.addEventListener("click", handleYes);
  document.addEventListener("keydown", handleKey);
}

/* ==================== MODAL CHOOSER ==================== */
function showChooser(title, description, options){
  const c = document.getElementById("chooser-container");
  const t = document.getElementById("chooser-title");
  const d = document.getElementById("chooser-desc");
  const o = document.getElementById("chooser-options");
  const cancel = document.getElementById("chooser-cancel");
  if(!c) return;
  t.textContent = title;
  d.textContent = description || "";
  o.innerHTML = "";
  options.forEach(function(opt, i){
    const b = document.createElement("button");
    b.className = "chooser-option";
    b.type = "button";
    b.innerHTML = "<b>" + opt.label + "</b><span class='small'>" + opt.description + "</span>";
    b.addEventListener("click", function(){
      cleanup();
      if(opt.onClick) opt.onClick();
    });
    o.appendChild(b);
  });
  c.classList.add("show");
  const cleanup = ()=>{
    c.classList.remove("show");
    document.removeEventListener("keydown", handleKey);
  };
  const handleKey = (e)=>{ if(e.key === "Escape") cleanup(); };
  cancel.addEventListener("click", function once(){ cancel.removeEventListener("click", once); cleanup(); });
  document.addEventListener("keydown", handleKey);
}

/* ==================== UTIL ==================== */
function mulberry32(a){
  return function(){
    a|=0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a>>>15, 1|a);
    t = t + Math.imul(t ^ t>>>7, 61|t) ^ t;
    return ((t ^ t>>>14) >>> 0) / 4294967296;
  };
}
function expRand(rng){ let u=0; while(u===0) u=rng(); return -Math.log(u); }
function sampleErlang(rng, mean, cv){
  if(!(mean>0)) return 0;
  if(cv<=0.01) return mean;
  const k = Math.max(1, Math.round(1/(cv*cv)));
  let s=0; for(let i=0;i<k;i++) s+=expRand(rng);
  return mean*s/k;
}
class Heap{
  constructor(){ this.a=[]; }
  get size(){ return this.a.length; }
  less(x,y){ return x.t<y.t || (x.t===y.t && x.seq<y.seq); }
  push(e){
    const a=this.a; a.push(e); let i=a.length-1;
    while(i>0){ const p=(i-1)>>1; if(this.less(a[i],a[p])){ const tmp=a[i];a[i]=a[p];a[p]=tmp; i=p; } else break; }
  }
  pop(){
    const a=this.a; const top=a[0]; const last=a.pop();
    if(a.length){ a[0]=last; let i=0;
      for(;;){ const l=2*i+1,r=2*i+2; let s=i;
        if(l<a.length && this.less(a[l],a[s])) s=l;
        if(r<a.length && this.less(a[r],a[s])) s=r;
        if(s===i) break; const tmp=a[i];a[i]=a[s];a[s]=tmp; i=s; }
    }
    return top;
  }
}
const NA = "T/A";
const nf = (n,d)=>{ if(d===undefined)d=0;
  if(n===null||n===undefined||!isFinite(n)) return NA;
  return Number(n).toLocaleString("id-ID",{minimumFractionDigits:d,maximumFractionDigits:d});
};
const rp = n => (n===null||n===undefined||!isFinite(n)) ? NA : "Rp " + nf(Math.round(n),0);
const pct = n => (n===null||n===undefined||!isFinite(n)) ? NA : nf(n*100,1)+"%";
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const PALETTE = ["#0ea5e9","#7c3aed","#16a34a","#f59e0b","#dc2626","#ec4899"];

/* ==================== PARAMETER ==================== */
const GROUPS = {
  prod:"Produksi", qual:"Kualitas", rel:"Keandalan",
  eco:"Ekonomi", dem:"Permintaan dan Lingkungan", sim:"Simulasi dan Replikasi"
};
const PARAMS = [
 {k:"operators",g:"prod",l:"Jumlah operator",min:1,max:20,step:1,u:"orang"},
 {k:"operatorRequirement",g:"prod",l:"Kebutuhan operator normal",min:0.2,max:10,step:0.1,u:"orang"},
 {k:"cycleIntake",g:"prod",l:"Waktu siklus pemasukan",min:5,max:180,step:1,u:"detik"},
 {k:"cycleProcess",g:"prod",l:"Waktu siklus pemrosesan utama",min:5,max:240,step:1,u:"detik"},
 {k:"cycleInspect",g:"prod",l:"Waktu siklus inspeksi",min:5,max:180,step:1,u:"detik"},
 {k:"cyclePack",g:"prod",l:"Waktu siklus pengemasan",min:5,max:180,step:1,u:"detik"},
 {k:"conveyorSpeed",g:"prod",l:"Kecepatan konveyor",min:1,max:60,step:0.5,u:"m per menit"},
 {k:"bufferCapacity",g:"prod",l:"Kapasitas penyangga antarstasiun",min:1,max:60,step:1,u:"unit"},
 {k:"plannedHoursPerShift",g:"prod",l:"Waktu operasi per shift",min:1,max:12,step:0.5,u:"jam"},
 {k:"shifts",g:"prod",l:"Jumlah shift per hari",min:1,max:3,step:1,u:"shift"},
 {k:"simDays",g:"prod",l:"Lama periode simulasi",min:1,max:5,step:1,u:"hari"},
 {k:"targetOutput",g:"prod",l:"Target produksi",min:10,max:5000,step:10,u:"unit"},
 {k:"setupTime",g:"prod",l:"Durasi setup per shift",min:0,max:60,step:1,u:"menit"},
 {k:"defectProb",g:"qual",l:"Probabilitas cacat proses",min:0,max:0.4,step:0.005,u:"rasio"},
 {k:"inspectionAccuracy",g:"qual",l:"Akurasi inspeksi",min:0.5,max:1,step:0.01,u:"rasio"},
 {k:"falseAlarmRate",g:"qual",l:"Probabilitas salah tolak",min:0,max:0.2,step:0.005,u:"rasio"},
 {k:"reworkTime",g:"qual",l:"Waktu pengerjaan ulang",min:0,max:60,step:0.5,u:"menit"},
 {k:"repairableProp",g:"qual",l:"Proporsi cacat dapat diperbaiki",min:0,max:1,step:0.01,u:"rasio"},
 {k:"reworkSuccessProb",g:"qual",l:"Keberhasilan pengerjaan ulang",min:0.3,max:1,step:0.01,u:"rasio"},
 {k:"scrapCost",g:"qual",l:"Biaya scrap per unit",min:0,max:200000,step:500,u:"Rupiah"},
 {k:"reworkCost",g:"qual",l:"Biaya rework per unit",min:0,max:100000,step:500,u:"Rupiah"},
 {k:"poorQualityCost",g:"qual",l:"Biaya kualitas buruk per unit lolos",min:0,max:500000,step:1000,u:"Rupiah"},
 {k:"mtbf",g:"rel",l:"MTBF",min:30,max:3000,step:10,u:"menit"},
 {k:"mttr",g:"rel",l:"MTTR",min:1,max:240,step:1,u:"menit"},
 {k:"criticalAvailability",g:"rel",l:"Ketersediaan komponen kritis",min:0.3,max:1,step:0.01,u:"rasio"},
 {k:"laborCostPerHour",g:"eco",l:"Biaya tenaga kerja",min:0,max:200000,step:1000,u:"Rupiah per jam"},
 {k:"materialCostPerUnit",g:"eco",l:"Biaya material per unit",min:0,max:100000,step:500,u:"Rupiah per unit"},
 {k:"energyCostPerHour",g:"eco",l:"Biaya energi",min:0,max:1000000,step:1000,u:"Rupiah per jam"},
 {k:"maintenanceCostPerHour",g:"eco",l:"Biaya pemeliharaan",min:0,max:500000,step:1000,u:"Rupiah per jam"},
 {k:"fixedCostPerPeriod",g:"eco",l:"Biaya tetap per hari",min:0,max:100000000,step:100000,u:"Rupiah per hari"},
 {k:"variableCostPerUnit",g:"eco",l:"Biaya variabel per unit baik",min:0,max:50000,step:250,u:"Rupiah per unit"},
 {k:"initialInvestment",g:"eco",l:"Investasi awal",min:0,max:5000000000,step:1000000,u:"Rupiah"},
 {k:"trainingCost",g:"eco",l:"Biaya pelatihan",min:0,max:1000000000,step:1000000,u:"Rupiah"},
 {k:"transitionCost",g:"eco",l:"Biaya transisi",min:0,max:1000000000,step:1000000,u:"Rupiah"},
 {k:"sellingPrice",g:"eco",l:"Harga jual per unit",min:1000,max:200000,step:500,u:"Rupiah per unit"},
 {k:"workingDaysPerYear",g:"eco",l:"Hari kerja per tahun",min:100,max:365,step:1,u:"hari"},
 {k:"demandRate",g:"dem",l:"Permintaan pelanggan",min:1,max:400,step:1,u:"unit per jam"},
 {k:"demandCV",g:"dem",l:"Variasi kedatangan (CV)",min:0,max:1,step:0.05,u:"rasio"},
 {k:"materialAvailability",g:"dem",l:"Ketersediaan material",min:0.5,max:1,step:0.01,u:"rasio"},
 {k:"processCV",g:"dem",l:"Variasi waktu proses (CV)",min:0,max:0.6,step:0.01,u:"rasio"},
 {k:"targetLeadTime",g:"dem",l:"Target lead time",min:5,max:480,step:5,u:"menit"},
 {k:"seed",g:"sim",l:"Seed bilangan acak",min:1,max:999999,step:1,u:"tanpa satuan"},
 {k:"replications",g:"sim",l:"Jumlah replikasi",min:1,max:30,step:1,u:"kali"}
];
const BASE = {
  plannedHoursPerShift:8, shifts:1, simDays:1, targetOutput:400, setupTime:12,
  conveyorSpeed:12, bufferCapacity:10,
  falseAlarmRate:0.03, reworkTime:6, repairableProp:0.7, reworkSuccessProb:0.9,
  scrapCost:18000, reworkCost:9000, poorQualityCost:35000,
  criticalAvailability:0.95,
  laborCostPerHour:25000, materialCostPerUnit:14000,
  energyCostPerHour:80000, maintenanceCostPerHour:25000,
  fixedCostPerPeriod:5500000, variableCostPerUnit:3000,
  sellingPrice:32000, workingDaysPerYear:300,
  demandRate:95, demandCV:0.3, materialAvailability:0.97,
  processCV:0.15, targetLeadTime:90,
  seed:12345, replications:3
};
const PRESETS = {
  manual: Object.assign({}, BASE, {
    _name:"Sistem Manual", operators:6, operatorRequirement:5,
    cycleIntake:40, cycleProcess:55, cycleInspect:40, cyclePack:45,
    conveyorSpeed:6, bufferCapacity:8,
    defectProb:0.10, inspectionAccuracy:0.78, falseAlarmRate:0.05,
    reworkTime:8, repairableProp:0.65, reworkSuccessProb:0.88,
    mtbf:720, mttr:22,
    initialInvestment:60000000, trainingCost:0, transitionCost:0,
    laborCostPerHour:25000, maintenanceCostPerHour:8000,
    energyCostPerHour:45000, variableCostPerUnit:3500
  }),
  partial: Object.assign({}, BASE, {
    _name:"Otomasi Parsial", operators:4, operatorRequirement:2.5,
    cycleIntake:32, cycleProcess:38, cycleInspect:32, cyclePack:34,
    conveyorSpeed:12, bufferCapacity:10,
    defectProb:0.06, inspectionAccuracy:0.90, falseAlarmRate:0.03,
    reworkTime:5, repairableProp:0.72, reworkSuccessProb:0.92,
    mtbf:480, mttr:26,
    initialInvestment:550000000, trainingCost:25000000, transitionCost:25000000,
    maintenanceCostPerHour:22000, energyCostPerHour:95000, variableCostPerUnit:2800
  }),
  full: Object.assign({}, BASE, {
    _name:"Otomasi Penuh", operators:2, operatorRequirement:1.0,
    cycleIntake:22, cycleProcess:24, cycleInspect:20, cyclePack:22,
    conveyorSpeed:24, bufferCapacity:14,
    defectProb:0.035, inspectionAccuracy:0.97, falseAlarmRate:0.015,
    reworkTime:4, repairableProp:0.75, reworkSuccessProb:0.95,
    mtbf:300, mttr:42,
    initialInvestment:1650000000, trainingCost:40000000, transitionCost:60000000,
    maintenanceCostPerHour:55000, energyCostPerHour:165000, variableCostPerUnit:2500
  })
};
const STATION_NAMES = ["Pemasukan Material","Pemrosesan Utama","Konveyor atau Pemindahan","Inspeksi Kualitas","Pengemasan"];
const CONVEYOR_LENGTH = 6;

/* ==================== SIMULASI ==================== */
function runOneRep(cfg, seed, wantSamples){
  const rng = mulberry32(seed>>>0);
  const T = Math.max(1, cfg.totalMinutes);
  const heap = new Heap();
  let seq = 0, now = 0;
  const transferMin = CONVEYOR_LENGTH / Math.max(0.5, cfg.conveyorSpeed);
  const idealCycles = [cfg.cycleIntake/60, cfg.cycleProcess/60, transferMin, cfg.cycleInspect/60, cfg.cyclePack/60];
  const needsOp = [true, true, false, true, true];
  const opFactor = cfg.operators >= cfg.operatorRequirement
        ? 1 : Math.min(8, cfg.operatorRequirement / Math.max(0.2, cfg.operators));
  const cycles = idealCycles.map((c,i)=> needsOp[i] ? c*opFactor : c);
  const stations = [];
  for(let i=0;i<5;i++){
    stations.push({
      idx:i, name:STATION_NAMES[i], cycle:cycles[i], ideal:idealCycles[i],
      cap: Math.max(1, Math.round(cfg.bufferCapacity)), queue: [],
      servers: [{state:"idle", job:null, endT:0, busyStart:0, busyTime:0, remaining:0, token:0, pausedBy:null, blockedNext:-1}],
      downReason:null, downStart:0, failDown:0, setupDown:0,
      processed:0, waitSum:0, waitCount:0, maxQueue:0,
      queueArea:0, lastQueueT:0, failEnabled: i!==0
    });
  }
  const C = {demand:0, lostBuffer:0, lostMaterial:0, started:0, inspected:0,
             scrap:0, rework:0, good:0, escaped:0, shipped:0, onTime:0,
             leadSum:0, leadSqSum:0, leadCount:0};
  let jobSeq = 0;
  function noteQueue(st){ st.queueArea += st.queue.length*(now - st.lastQueueT); st.lastQueueT = now; }
  function scheduleFailure(st){
    if(!st.failEnabled || !(cfg.mtbf>0)) return;
    heap.push({t: now + Math.max(0.05, expRand(rng)*cfg.mtbf), seq: seq++, type:"FAIL", st});
  }
  function pauseStation(st, reason){
    for(const srv of st.servers){
      if(srv.state==="busy"){
        srv.busyTime += now - srv.busyStart;
        srv.remaining = Math.max(0, srv.endT - now);
        srv.state = "paused"; srv.pausedBy = reason; srv.token++;
      }
    }
  }
  function resumeStation(st, reason){
    for(const srv of st.servers){
      if(srv.state==="paused" && srv.pausedBy===reason){
        srv.state="busy"; srv.busyStart=now; srv.endT = now + srv.remaining; srv.token++;
        heap.push({t:srv.endT, seq:seq++, type:"END", st, srv, job:srv.job, token:srv.token});
      }
    }
  }
  function pump(){
    let guard=0, changed=true;
    while(changed && guard++<3000){
      changed=false;
      for(let i=0;i<5;i++){
        const st = stations[i];
        for(const srv of st.servers){
          if(srv.state==="blocked" && srv.blockedNext>=0){
            const nx = stations[srv.blockedNext];
            if(nx.queue.length < nx.cap){
              const j = srv.job;
              srv.state="idle"; srv.job=null; srv.blockedNext=-1;
              noteQueue(nx); j.enterQueueT = now; nx.queue.push(j);
              if(nx.queue.length>nx.maxQueue) nx.maxQueue = nx.queue.length;
              changed = true;
            }
          }
        }
      }
      for(let i=0;i<5;i++){
        const st = stations[i];
        if(st.downReason) continue;
        for(const srv of st.servers){
          if(srv.state==="idle" && st.queue.length>0){
            noteQueue(st);
            const j = st.queue.shift();
            st.waitSum += now - j.enterQueueT; st.waitCount++;
            srv.state="busy"; srv.job=j; srv.busyStart=now;
            let mean = st.cycle;
            if(i===1 && j.reworked) mean += cfg.reworkTime;
            srv.endT = now + Math.max(0.001, sampleErlang(rng, mean, cfg.processCV));
            srv.token++;
            heap.push({t:srv.endT, seq:seq++, type:"END", st, srv, job:j, token:srv.token});
            changed = true;
          }
        }
      }
    }
  }
  function finishJob(job){
    C.shipped++;
    const conforming = job.reworked ? !!job.reworkSuccess : !job.trueDefective;
    if(conforming) C.good++; else C.escaped++;
    const lead = now - job.arrivalT;
    C.leadSum += lead; C.leadSqSum += lead*lead; C.leadCount++;
    if(lead <= cfg.targetLeadTime) C.onTime++;
  }
  function route(idx, job, srv){
    if(idx===4){ finishJob(job); return; }
    let next=-1;
    if(idx===3){
      C.inspected++;
      if(job.trueDefective){
        if(rng() < cfg.inspectionAccuracy){
          if(rng() < cfg.repairableProp){
            job.reworked = true;
            job.reworkSuccess = rng() < cfg.reworkSuccessProb;
            C.rework++; next = 1;
          } else { C.scrap++; return; }
        } else { next = 4; }
      } else {
        if(rng() < cfg.falseAlarmRate){
          job.reworked = true; job.reworkSuccess = true; C.rework++; next = 1;
        } else { next = 4; }
      }
    } else if(idx===2){ next = job.reworked ? 4 : 3; }
    else { next = idx+1; }
    const nx = stations[next];
    if(nx.queue.length < nx.cap){
      noteQueue(nx); job.enterQueueT = now; nx.queue.push(job);
      if(nx.queue.length>nx.maxQueue) nx.maxQueue = nx.queue.length;
    } else {
      srv.state="blocked"; srv.job=job; srv.blockedNext=next;
    }
  }
  stations.forEach(scheduleFailure);
  function scheduleNextArrival(fromT){
    const mean = 60 / Math.max(1e-6, cfg.demandRate);
    const ia = sampleErlang(rng, mean, cfg.demandCV);
    const t = fromT + Math.max(0.001, ia);
    if(t < T) heap.push({t, seq: seq++, type:"ARRIVE"});
  }
  scheduleNextArrival(0);
  const shiftLen = cfg.plannedHoursPerShift*60;
  const nShifts = Math.max(1, Math.round(cfg.shifts*cfg.simDays));
  if(cfg.setupTime>0){
    for(const st of stations){ st.downReason="setup"; st.downStart=0; }
    heap.push({t: Math.min(cfg.setupTime,T), seq: seq++, type:"SETUP_END"});
  }
  for(let k=1;k<nShifts;k++){
    const tb = k*shiftLen;
    if(tb < T) heap.push({t:tb, seq:seq++, type:"SHIFT_START"});
  }
  const N_SAMPLES = 170;
  const samples = [];
  let nextSampleT = 0;
  function takeSample(){
    samples.push({
      t: now, good: C.good, escaped: C.escaped, scrap: C.scrap, inspected: C.inspected,
      queues: stations.map(s=>s.queue.length),
      busy: stations.map(s=>s.servers.filter(x=>x.state==="busy").length),
      down: stations.map(s=> s.downReason ? 1 : 0),
      downReason: stations.map(s=> s.downReason)
    });
  }
  let guard=0;
  while(heap.size>0 && guard++<3000000){
    const ev = heap.pop();
    if(ev.t > T) break;
    now = ev.t;
    switch(ev.type){
      case "ARRIVE": {
        C.demand++;
        if(rng() > cfg.materialAvailability){ C.lostMaterial++; }
        else {
          const st0 = stations[0];
          if(st0.queue.length < st0.cap){
            const job = { id: ++jobSeq, arrivalT: now, enterQueueT: now,
              trueDefective: rng() < cfg.defectProb, reworked:false, reworkSuccess:false };
            noteQueue(st0); st0.queue.push(job);
            if(st0.queue.length>st0.maxQueue) st0.maxQueue = st0.queue.length;
            C.started++;
          } else { C.lostBuffer++; }
        }
        scheduleNextArrival(now); break;
      }
      case "END": {
        const st = ev.st, srv = ev.srv, job = ev.job;
        if(srv.token !== ev.token) break;
        srv.busyTime += now - srv.busyStart;
        srv.state="idle"; srv.job=null; st.processed++;
        route(st.idx, job, srv); break;
      }
      case "FAIL": {
        const st = ev.st;
        if(st.downReason){ scheduleFailure(st); break; }
        st.downReason="fail"; st.downStart=now;
        pauseStation(st,"fail");
        const mttrEff = Math.max(0.5, cfg.mttr / Math.max(0.15, cfg.criticalAvailability));
        heap.push({t: now + Math.max(0.2, expRand(rng)*mttrEff), seq:seq++, type:"REPAIR", st});
        break;
      }
      case "REPAIR": {
        const st = ev.st;
        if(st.downReason==="fail"){ st.failDown += now - st.downStart; st.downReason=null; }
        resumeStation(st,"fail"); scheduleFailure(st); break;
      }
      case "SETUP_END": {
        for(const st of stations){
          if(st.downReason==="setup"){ st.setupDown += now - st.downStart; st.downReason=null; }
          resumeStation(st,"setup");
        }
        break;
      }
      case "SHIFT_START": {
        for(const st of stations){
          if(!st.downReason){ st.downReason="setup"; st.downStart=now; pauseStation(st,"setup"); }
        }
        if(cfg.setupTime>0) heap.push({t: now + cfg.setupTime, seq:seq++, type:"SETUP_END"});
        else { for(const st of stations){ if(st.downReason==="setup"){ st.downReason=null; } } }
        break;
      }
    }
    pump();
    if(wantSamples && now >= nextSampleT){ takeSample(); nextSampleT = now + T/N_SAMPLES; }
  }
  now = T;
  if(wantSamples){ takeSample(); }
  for(const st of stations){
    noteQueue(st);
    for(const srv of st.servers){
      if(srv.state==="busy") srv.busyTime += now - srv.busyStart;
    }
    if(st.downReason==="fail") st.failDown += now - st.downStart;
    if(st.downReason==="setup") st.setupDown += now - st.downStart;
  }
  const simHours = T/60;
  const stStats = stations.map(st=>{
    const planned = T;
    const operating = Math.max(0.0001, planned - st.setupDown - st.failDown);
    return {
      name: st.name, cycleSec: st.cycle*60, idealCycleSec: st.ideal*60,
      processed: st.processed, busyTime: st.busyTime,
      failDown: st.failDown, setupDown: st.setupDown,
      operatingTime: operating, plannedTime: planned,
      utilization: st.busyTime/operating,
      downtimeRate: (st.failDown+st.setupDown)/planned,
      availability: operating/planned,
      avgQueue: st.queueArea/planned, maxQueue: st.maxQueue,
      waitAvg: st.waitCount>0 ? st.waitSum/st.waitCount : 0
    };
  });
  let bIdx=0;
  for(let i=1;i<5;i++) if(stations[i].cycle > stations[bIdx].cycle) bIdx=i;
  const bn = stStats[bIdx];
  const A = bn.availability;
  const P = bn.operatingTime>0 ? (bn.processed * (bn.idealCycleSec/60)) / bn.operatingTime : 0;
  const Qline = C.inspected>0 ? C.good/C.inspected : 0;
  const OEE = A * Math.max(0,P) * Qline;
  const qualityRate = C.inspected>0 ? C.good/C.inspected : 0;
  const defectRate = 1 - qualityRate;
  const escapeRate = C.inspected>0 ? C.escaped/C.inspected : 0;
  const scrapRate = C.inspected>0 ? C.scrap/C.inspected : 0;
  const reworkRate = C.inspected>0 ? C.rework/C.inspected : 0;
  const leadAvg = C.leadCount>0 ? C.leadSum/C.leadCount : 0;
  const leadVar = C.leadCount>1 ? Math.max(0, C.leadSqSum/C.leadCount - leadAvg*leadAvg) : 0;
  const leadCV = leadAvg>0 ? Math.sqrt(leadVar)/leadAvg : 0;
  const throughput = C.good / simHours;
  const costLabor = cfg.operators * cfg.laborCostPerHour * simHours;
  const costMaterial = cfg.materialCostPerUnit * C.started;
  const costEnergy = cfg.energyCostPerHour * simHours;
  const costMaint = cfg.maintenanceCostPerHour * simHours;
  const costQuality = C.scrap*cfg.scrapCost + C.rework*cfg.reworkCost + C.escaped*cfg.poorQualityCost;
  const costFixed = cfg.fixedCostPerPeriod * cfg.simDays;
  const costVariable = cfg.variableCostPerUnit * C.good;
  const totalCost = costLabor+costMaterial+costEnergy+costMaint+costQuality+costFixed+costVariable;
  const costPerUnit = C.shipped>0 ? totalCost/C.shipped : null;
  const costPerGood = C.good>0 ? totalCost/C.good : null;
  const annualHours = cfg.workingDaysPerYear * cfg.shifts * cfg.plannedHoursPerShift;
  const scale = annualHours / simHours;
  const annualGood = C.good * scale;
  const annualCost = totalCost * scale;
  const annualRevenue = annualGood * cfg.sellingPrice;
  const annualNet = annualRevenue - annualCost;
  const investment = cfg.initialInvestment + cfg.trainingCost + cfg.transitionCost;
  const payback = (investment>0 && annualNet>0) ? investment/annualNet : null;
  const fixedAnnual = cfg.fixedCostPerPeriod*cfg.workingDaysPerYear + costLabor*scale + investment/5;
  const varPerGood = C.good>0 ? ((costMaterial+costEnergy+costMaint+costQuality+costVariable)*scale)/annualGood : null;
  const bep = (varPerGood!==null && cfg.sellingPrice>varPerGood) ? fixedAnnual/(cfg.sellingPrice-varPerGood) : null;
  return {
    seed, simMinutes:T, simHours, opFactor, bottleneck: STATION_NAMES[bIdx],
    demand:C.demand, lostBuffer:C.lostBuffer, lostMaterial:C.lostMaterial,
    started:C.started, inspected:C.inspected, scrap:C.scrap, rework:C.rework,
    good:C.good, escaped:C.escaped, shipped:C.shipped, onTime:C.onTime,
    qualityRate, defectRate, escapeRate, scrapRate, reworkRate,
    fulfillment: C.demand>0 ? Math.min(1, C.good/C.demand) : 0,
    onTimeRate: C.shipped>0 ? C.onTime/C.shipped : 0,
    throughput, leadAvg, leadCV, consistency: 1-Math.min(1, leadCV),
    availability:A, performance:P, qualityOEE:Qline, oee:OEE,
    targetAchievement: cfg.targetOutput>0 ? C.good/cfg.targetOutput : null,
    stations: stStats,
    costLabor, costMaterial, costEnergy, costMaint, costQuality, costFixed, costVariable,
    totalCost, costPerUnit, costPerGood,
    annualHours, annualGood, annualRevenue, annualCost, annualNet,
    investment, payback, bep, varPerGood, fixedAnnual,
    samples: wantSamples ? samples : null
  };
}
function avgDeep(list){
  if(!Array.isArray(list) || list.length === 0) return null;
  const f = list[0];
  if(f === null || f === undefined) return null;
  if(typeof f === "number"){
    let s=0, n=0;
    for(const v of list){ if(typeof v === "number" && isFinite(v)){ s+=v; n++; } }
    return n>0 ? s/n : null;
  }
  if(typeof f === "string" || typeof f === "boolean") return f;
  if(Array.isArray(f)){
    return f.map(function(_, i){
      return avgDeep(list.map(function(r){ return (r && Array.isArray(r)) ? r[i] : null; }));
    });
  }
  if(typeof f === "object"){
    const out = {};
    for(const k in f){
      out[k] = avgDeep(list.map(function(r){ return (r && typeof r === "object") ? r[k] : null; }));
    }
    return out;
  }
  return f;
}
function runExperiment(cfg){
  const R = Math.max(1, Math.round(cfg.replications));
  const reps = [];
  for(let i=0;i<R;i++){ reps.push(runOneRep(cfg, (cfg.seed + i)>>>0, i===0)); }
  const mean = R===1 ? reps[0] : avgDeep(reps);
  mean.reps = reps.map(function(r){
    return { seed:r.seed, good:r.good, escaped:r.escaped, scrap:r.scrap,
      qualityRate:r.qualityRate, throughput:r.throughput, oee:r.oee,
      costPerGood:r.costPerGood, leadAvg:r.leadAvg };
  });
  mean.replicationCount = R;
  mean.samples = reps[0].samples;
  return mean;
}

/* ==================== STATE ==================== */
const state = {
  params: Object.assign({}, PRESETS.manual),
  preset: "manual",
  lastResult: null,
  lastCfg: null,
  runs: [],
  play: {raf:null, playing:false, paused:false},
  cmp: null,
  scenarios: [
    { id:"S1", name:"Skenario A", source:"manual", params:Object.assign({},PRESETS.manual) },
    { id:"S2", name:"Skenario B", source:"partial", params:Object.assign({},PRESETS.partial) },
    { id:"S3", name:"Skenario C", source:"full", params:Object.assign({},PRESETS.full) }
  ],
  weights: {cost:20, quality:20, speed:15, delivery:15, flex:15, consistency:15}
};
function buildConfig(p){
  const cfg = Object.assign({}, p);
  cfg.totalMinutes = p.plannedHoursPerShift*60*p.shifts*p.simDays;
  return cfg;
}
function cfgName(p){ return p._name || "Kustom"; }
function scenarioParamsForRun(sc, seed, reps){
  let base;
  if(sc.source === "current") base = state.params;
  else if(sc.source === "custom") base = sc.params;
  else base = PRESETS[sc.source] || PRESETS.manual;
  return Object.assign({}, base, { seed, replications:reps, _name: sc.name });
}
function scenarioParamsDisplay(sc){
  if(sc.source === "current") return Object.assign({}, state.params);
  if(sc.source === "custom") return Object.assign({}, sc.params);
  return Object.assign({}, PRESETS[sc.source] || PRESETS.manual);
}

/* ==================== FORM LAB ==================== */
function renderParamForm(){
  const host = document.getElementById("paramForm");
  if(!host) return;
  host.innerHTML = "";
  const byGroup = {};
  PARAMS.forEach(p=>{ (byGroup[p.g] = byGroup[p.g]||[]).push(p); });
  Object.keys(GROUPS).forEach(g=>{
    const items = byGroup[g]; if(!items) return;
    const d = document.createElement("details");
    d.className = "param-group"; d.open = true;
    d.innerHTML = '<summary>' + GROUPS[g] + '<span class="small">' + items.length + ' parameter</span></summary>';
    const body = document.createElement("div");
    body.className = "pg-body";
    items.forEach(p=>{
      const row = document.createElement("div");
      row.className = "param";
      row.innerHTML = '<label title="' + p.l + '">' + p.l + '</label>'
        + '<div class="pw"><input type="number" data-pk="' + p.k + '" min="' + p.min
        + '" max="' + p.max + '" step="' + p.step + '" value="' + state.params[p.k] + '"><span class="unit">' + p.u + '</span></div>';
      body.appendChild(row);
    });
    d.appendChild(body); host.appendChild(d);
  });
  host.querySelectorAll("input[data-pk]").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const k = inp.dataset.pk;
      const def = PARAMS.find(x=>x.k===k);
      let v = parseFloat(inp.value);
      if(!isFinite(v)) v = def.min;
      v = clamp(v, def.min, def.max);
      inp.value = v;
      state.params[k] = v;
      state.preset = "custom";
      const chip = document.getElementById("cfgChip");
      if(chip) chip.innerHTML = 'Skenario: <b>Kustom</b>';
    });
  });
}
function applyPreset(key){
  state.params = Object.assign({}, PRESETS[key]);
  state.preset = key;
  renderParamForm();
  const chip = document.getElementById("cfgChip");
  if(chip) chip.innerHTML = 'Skenario: <b>' + PRESETS[key]._name + '</b>';
  document.querySelectorAll("[data-preset]").forEach(function(b){
    b.classList.toggle("active", b.dataset.preset===key);
  });
}

/* ==================== LINI ==================== */
function buildLine(){
  const host = document.getElementById("lineViz"); if(!host) return;
  host.innerHTML = "";
  for(let i=0;i<5;i++){
    const d = document.createElement("div");
    d.className = "stn"; d.id = "stn"+i;
    d.innerHTML = '<div class="badge" style="display:none"></div>'
      + '<div class="nm">' + STATION_NAMES[i] + '</div>'
      + '<div class="meta"><span class="q">Antrean 0</span><span class="cyc">T/A</span></div>'
      + '<div class="bar"><i></i></div>'
      + '<div class="meta"><span class="st">idle</span><span class="pr">0 unit</span></div>';
    host.appendChild(d);
    if(i<4){ const a=document.createElement("div"); a.className="arrow"; a.textContent="→"; host.appendChild(a); }
  }
}
function updateLine(live, result){
  for(let i=0;i<5;i++){
    const el = document.getElementById("stn"+i); if(!el) continue;
    const L = live ? live[i] : null;
    const q = L ? L.q : 0, busy = L ? L.busy : 0, dn = L ? L.down : null;
    el.querySelector(".q").textContent = "Antrean " + q;
    el.querySelector(".cyc").textContent = result ? nf(result.stations[i].cycleSec,1)+" detik" : NA;
    el.querySelector(".pr").textContent = result ? result.stations[i].processed+" unit" : "0 unit";
    const stTxt = dn==="fail" ? "rusak" : dn==="setup" ? "setup" : (busy>0 ? "proses" : "idle");
    el.querySelector(".st").textContent = stTxt;
    el.classList.toggle("down", dn==="fail");
    el.classList.toggle("busy", !dn && busy>0);
    const util = result ? clamp(result.stations[i].utilization,0,1) : 0;
    el.querySelector(".bar>i").style.width = (util*100).toFixed(1)+"%";
    const badge = el.querySelector(".badge");
    if(dn==="fail"){ badge.style.display="block"; badge.className="badge stopped"; badge.textContent="DOWNTIME"; }
    else if(dn==="setup"){ badge.style.display="block"; badge.className="badge setup"; badge.textContent="SETUP"; }
    else if(busy>0){ badge.style.display="block"; badge.className="badge running"; badge.textContent="RUN"; }
    else badge.style.display="none";
  }
}

/* ==================== CHARTS ==================== */
function setupCanvas(cv){
  const dpr = window.devicePixelRatio||1;
  const rect = cv.getBoundingClientRect();
  const w = Math.max(220, rect.width||cv.clientWidth||300);
  const h = Math.max(140, rect.height||cv.clientHeight||200);
  cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr);
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  return {ctx,w,h};
}
function niceMax(v){
  if(!(v>0)) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v/e;
  const step = m<=1?1:m<=2?2:m<=5?5:10;
  return step*e;
}
function fmtY(v){
  if(Math.abs(v) >= 1e9) return (v/1e9).toFixed(1) + "M";
  if(Math.abs(v) >= 1e6) return (v/1e6).toFixed(1) + "Jt";
  if(Math.abs(v) >= 1e3) return (v/1e3).toFixed(0) + "rb";
  return nf(v, v < 10 ? 1 : 0);
}
function drawMultiLine(cv, series, opts){
  if(!cv) return;
  const {ctx,w,h} = setupCanvas(cv);
  const pad = {l:64,r:20,t:14,b:36};
  let yMax = 0; const xMax = opts.xMax||1;
  series.forEach(s=>s.pts.forEach(p=>{ if(p[1]>yMax) yMax=p[1]; }));
  yMax = niceMax(yMax||1);
  // Y grid + labels
  for(let i=0;i<=4;i++){
    const y = pad.t + (h-pad.t-pad.b)*i/4;
    ctx.strokeStyle="#e2e8f0"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
    ctx.fillStyle="#94a3b8"; ctx.font="11px system-ui"; ctx.textAlign="right"; ctx.textBaseline="middle";
    ctx.fillText(fmtY(yMax*(1-i/4)), pad.l-6, y);
  }
  // X grid + labels
  for(let i=0;i<=4;i++){
    const x = pad.l + (w-pad.l-pad.r)*i/4;
    ctx.strokeStyle="#f1f5f9"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,h-pad.b); ctx.stroke();
    ctx.fillStyle="#94a3b8"; ctx.font="11px system-ui"; ctx.textAlign="center"; ctx.textBaseline="top";
    ctx.fillText(nf(xMax*i/4, xMax<20?1:0), x, h-pad.b+4);
  }
  if(opts.xLabel){ ctx.fillStyle="#64748b"; ctx.font="11px system-ui";
    ctx.textAlign="center"; ctx.textBaseline="top"; ctx.fillText(opts.xLabel, (pad.l+w-pad.r)/2, h-pad.b+18); }
  const X = v => pad.l + (w-pad.l-pad.r)*(v/xMax);
  const Y = v => h-pad.b - (h-pad.t-pad.b)*(v/yMax);
  series.forEach(s=>{
    ctx.strokeStyle=s.color; ctx.lineWidth=2; ctx.beginPath();
    let first=true;
    s.pts.forEach(p=>{ const x=X(p[0]),y=Y(p[1]); if(first){ctx.moveTo(x,y);first=false;} else ctx.lineTo(x,y); });
    ctx.stroke();
  });
  let lx = pad.l+4, ly = pad.t+10;
  series.forEach(s=>{
    ctx.fillStyle=s.color; ctx.fillRect(lx,ly-4,10,10);
    ctx.fillStyle="#475569"; ctx.font="11px system-ui"; ctx.textAlign="left"; ctx.textBaseline="middle";
    ctx.fillText(s.name, lx+14, ly+1); ly += 15;
  });
}
function drawBars(cv, cats, series){
  if(!cv) return;
  const {ctx,w,h} = setupCanvas(cv);
  // Padding kiri lebih besar agar sumbu bergeser ke kanan (posisi X positif lebih lebar)
  const pad = {l:72,r:18,t:16,b:52};
  let yMax = 0;
  series.forEach(s=>s.vals.forEach(v=>{ if(v > yMax) yMax = v; }));
  yMax = niceMax(yMax || 1);

  // Y grid horizontal + labels
  for(let i=0;i<=4;i++){
    const y = pad.t + (h-pad.t-pad.b)*i/4;
    ctx.strokeStyle="#e2e8f0"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
    ctx.fillStyle="#94a3b8"; ctx.font="11px system-ui"; ctx.textAlign="right"; ctx.textBaseline="middle";
    ctx.fillText(fmtY(yMax*(1-i/4)), pad.l-6, y);
  }

  const bw = (w - pad.l - pad.r) / cats.length;
  const inner = bw * 0.9;
  const each = inner / Math.max(1, series.length);

  // Garis kisi vertikal tepat di pusat setiap kategori (bukan interval seragam)
  cats.forEach((c,i)=>{
    const cx = pad.l + bw*i + bw/2;
    ctx.strokeStyle="#f1f5f9"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx, pad.t); ctx.lineTo(cx, h-pad.b); ctx.stroke();
  });

  // Draw bars + category labels centered
  cats.forEach((c,i)=>{
    series.forEach((s,j)=>{
      const v = s.vals[i] || 0;
      const bh = (h-pad.t-pad.b) * (v/yMax);
      const x = pad.l + bw*i + (bw-inner)/2 + each*j;
      ctx.fillStyle = s.color;
      ctx.fillRect(x, h-pad.b - bh, Math.max(1, each-2), bh);
    });
    const cx = pad.l + bw*i + bw/2;
    ctx.fillStyle="#64748b"; ctx.font="11.5px system-ui"; ctx.textAlign="center"; ctx.textBaseline="top";
    const label = c.length > 12 ? c.slice(0,11) + "..." : c;
    ctx.fillText(label, cx, h-pad.b+6);
  });

  // Legend
  let lx=pad.l+4, ly=pad.t+10;
  series.forEach(s=>{
    ctx.fillStyle=s.color; ctx.fillRect(lx,ly-4,10,10);
    ctx.fillStyle="#475569"; ctx.font="11px system-ui"; ctx.textAlign="left"; ctx.textBaseline="middle";
    ctx.fillText(s.name, lx+14, ly+1); ly+=15;
  });
}
function drawPie(cv, parts){
  if(!cv) return;
  const {ctx,w,h} = setupCanvas(cv);
  const total = parts.reduce((a,p)=>a+p.v,0) || 1;
  const cx = w*0.36, cy = h/2, r = Math.min(w*0.28,h*0.4);
  let ang = -Math.PI/2;
  parts.forEach(p=>{
    const a = (p.v/total)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,ang+a); ctx.closePath();
    ctx.fillStyle = p.c; ctx.fill(); ang += a;
  });
  ctx.fillStyle="#0f172a"; ctx.beginPath(); ctx.arc(cx,cy,r*0.55,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#fff"; ctx.font="bold 16px system-ui"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(nf(total,0), cx, cy);
  let ly = cy - parts.length*10;
  parts.forEach(p=>{
    ctx.fillStyle=p.c; ctx.fillRect(w*0.66, ly-5, 12, 12);
    ctx.fillStyle="#475569"; ctx.font="12.5px system-ui"; ctx.textAlign="left"; ctx.textBaseline="middle";
    ctx.fillText(p.n+" ("+nf(p.v,0)+")", w*0.66+17, ly+1); ly += 20;
  });
}

/* ==================== KPI ==================== */
function kpiCard(label, value, sub, cls){
  return '<div class="kpi ' + (cls||"") + '"><div class="l">' + label + '</div>'
       + '<div class="v">' + value + '</div><div class="s">' + (sub||"") + '</div></div>';
}
function renderKPIs(r){
  const g = document.getElementById("kpiGrid"); if(!g) return;
  if(!r){ g.innerHTML='<div class="small">Belum ada hasil simulasi.</div>'; return; }
  const Pwarn = r.performance>1.001;
  g.innerHTML = [
    kpiCard("Throughput", nf(r.throughput,1)+" <span style='font-size:12px'>unit per jam</span>", "output baik per jam", "good"),
    kpiCard("Quality Rate", pct(r.qualityRate), "unit baik dibagi diperiksa", r.qualityRate>=0.95?"good":r.qualityRate>=0.9?"warn":"bad"),
    kpiCard("Defect Rate", pct(r.defectRate), "termasuk scrap dan cacat lolos"),
    kpiCard("OEE Lini", pct(r.oee), "Availability kali Performance kali Quality", r.oee>=0.6?"good":r.oee>=0.4?"warn":"bad"),
    kpiCard("Availability", pct(r.availability), "operasi dibagi rencana"),
    kpiCard("Performance", pct(r.performance), Pwarn?"Peringatan: melebihi 100 persen":"keluaran dibagi kapasitas ideal", Pwarn?"bad":""),
    kpiCard("Cost per Unit Baik", rp(r.costPerGood), "biaya operasi periode", (r.costPerGood && r.costPerGood < 32000)?"good":"warn"),
    kpiCard("Lead Time", nf(r.leadAvg,1)+" <span style='font-size:12px'>menit</span>", "rerata masuk sampai selesai"),
    kpiCard("Pemenuhan Permintaan", pct(r.fulfillment), "baik dibagi permintaan", r.fulfillment>0.95?"good":r.fulfillment>0.8?"warn":"bad"),
    kpiCard("On Time Delivery", pct(r.onTimeRate), "selesai dalam target "+nf(state.params.targetLeadTime,0)+" menit"),
    kpiCard("Bottleneck", r.bottleneck, "siklus efektif terpanjang"),
    kpiCard("Payback Period", r.payback===null? "Tidak tercapai" : nf(r.payback,2)+" <span style='font-size:12px'>tahun</span>", r.payback===null?"manfaat bersih nol atau negatif":"investasi dibagi manfaat tahunan", r.payback===null?"bad":(r.payback<3?"good":"warn")),
    kpiCard("Unit Baik", nf(r.good,0), "dari "+nf(r.inspected,0)+" diperiksa"),
    kpiCard("Cacat Lolos", nf(r.escaped,0), "escape rate "+pct(r.escapeRate), r.escaped>0?"warn":""),
    kpiCard("Scrap", nf(r.scrap,0), "scrap rate "+pct(r.scrapRate)),
    kpiCard("Rework", nf(r.rework,0), "rework rate "+pct(r.reworkRate)),
    kpiCard("Pemenuhan Target", r.targetAchievement!==null?pct(r.targetAchievement):NA, "target "+nf(state.params.targetOutput,0)+" unit"),
    kpiCard("Faktor Operator", nf(r.opFactor,2)+" kali", "1,00 berarti cukup", r.opFactor>1.001?"warn":""),
    kpiCard("Biaya Total Periode", rp(r.totalCost), "operasi periode ini"),
    kpiCard("Biaya per Unit", rp(r.costPerUnit), "total biaya dibagi unit keluar")
  ].join("");
}

/* ==================== INSIGHT ==================== */
function generateInsights(r){
  const out = [];
  const add=(cls,txt)=>out.push({cls,txt});
  if(r.opFactor>1.001)
    add("warn", "Kekurangan tenaga kerja: kebutuhan "+nf(state.params.operatorRequirement,1)+" operator, tersedia "+nf(state.params.operators,0)+". Waktu siklus dikalikan "+nf(r.opFactor,2)+" kali.");
  let worst = r.stations[1];
  for(let i=1;i<5;i++) if(r.stations[i].utilization>worst.utilization) worst=r.stations[i];
  if(worst.utilization>0.85)
    add("warn", "Stasiun <b>"+worst.name+"</b> memiliki utilisasi "+pct(worst.utilization)+" sehingga menjadi kandidat bottleneck utama.");
  else if(worst.utilization<0.5)
    add("ok", "Utilisasi tertinggi hanya "+pct(worst.utilization)+" pada "+worst.name+". Lini belum jenuh sehingga kemungkinan dibatasi permintaan.");
  if(r.performance>1.001)
    add("bad", "Performance OEE mencapai "+pct(r.performance)+" atau melebihi 100 persen. Periksa asumsi waktu siklus ideal dan pencatatan output.");
  if(r.lostBuffer>0)
    add("warn", nf(r.lostBuffer,0)+" pesanan hilang karena buffer penuh dengan kapasitas "+nf(state.params.bufferCapacity,0)+" unit.");
  if(r.lostMaterial>0)
    add("warn", nf(r.lostMaterial,0)+" pesanan tidak terpenuhi karena ketidaktersediaan material.");
  if(r.escaped>0)
    add("bad", nf(r.escaped,0)+" unit cacat lolos inspeksi dengan escape rate "+pct(r.escapeRate)+". Setiap unit menimbulkan biaya kualitas buruk sebesar "+rp(state.params.poorQualityCost)+".");
  if(r.scrapRate>0.05)
    add("warn", "Scrap rate "+pct(r.scrapRate)+" cukup tinggi. Biaya kualitas periode ini "+rp(r.costQuality)+".");
  if(r.fulfillment<0.95)
    add("warn", "Pemenuhan permintaan "+pct(r.fulfillment)+" sehingga kapasitas efektif belum menutup permintaan "+nf(state.params.demandRate,0)+" unit per jam.");
  if(r.payback===null)
    add("bad", "Payback period <b>tidak tercapai</b> karena manfaat bersih tahunan "+rp(r.annualNet)+" nol atau negatif.");
  if(r.costPerGood && r.costPerGood > state.params.sellingPrice)
    add("bad", "Biaya per unit baik "+rp(r.costPerGood)+" melampaui harga jual "+rp(state.params.sellingPrice)+".");
  if(r.stations.some(s=>s.maxQueue >= state.params.bufferCapacity))
    add("warn", "Antrean mencapai kapasitas buffer maksimum "+nf(state.params.bufferCapacity,0)+" unit sehingga blocking menahan stasiun hulu.");
  if(out.length===0) add("ok","Tidak ada indikator peringatan pada konfigurasi ini.");
  return out;
}
function renderInsights(r){
  const host = document.getElementById("insights"); if(!host) return;
  if(!r){ host.innerHTML='<div class="small">Belum ada hasil. Jalankan simulasi pada tab Laboratorium terlebih dahulu.</div>'; return; }
  host.innerHTML = generateInsights(r).map(o=>'<div class="insight '+o.cls+'">'+o.txt+'</div>').join("");
}

/* ==================== MAIN CHARTS ==================== */
function drawMainCharts(r, upToT){
  if(!r || !r.samples || !r.samples.length) return;
  const T = r.simMinutes;
  const cut = (upToT===undefined||upToT===null) ? T : upToT;
  const S = r.samples.filter(s=>s.t<=cut);
  if(!S.length) S.push(r.samples[0]);
  drawMultiLine(document.getElementById("chCum"), [
    {name:"Baik", color:"#16a34a", pts:S.map(s=>[s.t,s.good])},
    {name:"Scrap", color:"#dc2626", pts:S.map(s=>[s.t,s.scrap])},
    {name:"Cacat lolos", color:"#f59e0b", pts:S.map(s=>[s.t,s.escaped])}
  ], {xMax:T, xLabel:"waktu simulasi dalam menit"});
  const pts=[]; let prev=null;
  S.forEach(s=>{
    if(prev){ const dt=(s.t-prev.t)/60; if(dt>0) pts.push([s.t,(s.good-prev.good)/dt]); }
    prev=s;
  });
  drawMultiLine(document.getElementById("chRate"),
    [{name:"Output baik (unit per jam)", color:"#0ea5e9", pts}],
    {xMax:T, xLabel:"waktu simulasi dalam menit"});
  drawBars(document.getElementById("chStn"),
    r.stations.map(s=>s.name.split(" ")[0]),
    [
      {name:"Utilisasi persen", color:"#0ea5e9", vals:r.stations.map(s=>clamp(s.utilization,0,1.2)*100)},
      {name:"Downtime persen", color:"#ef4444", vals:r.stations.map(s=>s.downtimeRate*100)}
    ]);
  drawPie(document.getElementById("chPie"), [
    {n:"Produk baik", v:r.good, c:"#16a34a"},
    {n:"Cacat lolos", v:r.escaped, c:"#f59e0b"},
    {n:"Scrap", v:r.scrap, c:"#dc2626"}
  ]);
}

/* ==================== PLAYBACK ==================== */
function stopPlayback(){
  if(state.play.raf) cancelAnimationFrame(state.play.raf);
  state.play.raf=null; state.play.playing=false; state.play.paused=false;
  const p = document.getElementById("btnPause"); if(p) p.disabled = true;
  const s = document.getElementById("btnStop"); if(s) s.disabled = true;
}
function startPlayback(){
  const r = state.lastResult;
  if(!r || !r.samples){ finishPlayback(); return; }
  const animOn = document.getElementById("chkAnim").checked;
  const speed = parseFloat(document.getElementById("speedSel").value)||1;
  if(!animOn){ finishPlayback(); return; }
  stopPlayback();
  state.play.playing = true; state.play.paused=false;
  const btnP = document.getElementById("btnPause");
  if(btnP){ btnP.disabled=false; btnP.textContent="Jeda"; }
  const btnS = document.getElementById("btnStop"); if(btnS) btnS.disabled=false;
  const dur = 9000/speed;
  const T = r.simMinutes;
  const t0 = performance.now();
  function step(ts){
    if(!state.play.playing) return;
    if(state.play.paused){ state.play.raf = requestAnimationFrame(step); return; }
    const frac = clamp((ts - t0)/dur, 0, 1);
    const cur = frac*T;
    renderPlayback(cur);
    if(frac<1) state.play.raf = requestAnimationFrame(step);
    else finishPlayback();
  }
  state.play.raf = requestAnimationFrame(step);
}
function renderPlayback(cur){
  const r = state.lastResult; if(!r) return;
  const T = r.simMinutes;
  const bar = document.getElementById("progBar"); if(bar) bar.style.width = (cur/T*100).toFixed(1)+"%";
  const lab = document.getElementById("progLabel");
  if(lab) lab.textContent = "Waktu simulasi: "+nf(cur,0)+" dari "+nf(T,0)+" menit";
  let s = r.samples[0];
  for(const x of r.samples){ if(x.t<=cur) s=x; else break; }
  const live = s.queues.map((q,i)=>({q, busy:s.busy[i], down:s.downReason[i]}));
  updateLine(live, r);
  ["binGood","binEsc","binScrap","binInsp"].forEach((id,j)=>{
    const el = document.getElementById(id);
    if(el) el.textContent = nf([s.good,s.escaped,s.scrap,s.inspected][j],0);
  });
  drawMainCharts(r, cur);
}
function finishPlayback(){
  const r = state.lastResult; stopPlayback(); if(!r) return;
  const bar = document.getElementById("progBar"); if(bar) bar.style.width="100%";
  const lab = document.getElementById("progLabel");
  if(lab) lab.textContent = "Selesai. "+nf(r.simMinutes,0)+" menit, "+r.replicationCount+" replikasi, seed "+state.lastCfg.seed;
  ["binGood","binEsc","binScrap","binInsp"].forEach((id,j)=>{
    const el = document.getElementById(id);
    if(el) el.textContent = nf([r.good,r.escaped,r.scrap,r.inspected][j],0);
  });
  updateLine(r.stations.map(st=>({q:Math.round(st.avgQueue), busy:0, down:null})), r);
  renderKPIs(r); renderInsights(r); drawMainCharts(r);
}

/* ==================== RUN ==================== */
function doRun(record){
  try {
    const cfg = buildConfig(state.params);
    state.lastCfg = cfg;
    const r = runExperiment(cfg);
    state.lastResult = r;
    const bar = document.getElementById("progBar"); if(bar) bar.style.width="0%";
    const lab = document.getElementById("progLabel");
    if(lab) lab.textContent = "Menghitung "+r.replicationCount+" replikasi...";
    renderKPIs(r); renderInsights(r); drawMainCharts(r, 0);
    if(record !== false){
      state.runs.unshift({
        id: Date.now(), time: new Date().toLocaleString("id-ID"),
        config: cfgName(state.params), seed: cfg.seed, reps: r.replicationCount,
        source: "Laboratorium", res: r
      });
      renderRunTable();
    }
    showToast("Simulasi selesai: "+nf(r.good,0)+" unit baik dari "+nf(r.inspected,0)+" unit diperiksa", "success");
    startPlayback();
  } catch(err){
    console.error("[VIA] Simulation error:", err);
    showToast("<b>Error simulasi</b>" + (err.message || String(err)), "error", 6000);
  }
}

/* ==================== SKENARIO ==================== */
function renderScenarioSlots(){
  const host = document.getElementById("scenarioGrid"); if(!host) return;
  host.innerHTML = state.scenarios.map(sc => {
    const params = scenarioParamsDisplay(sc);
    const sourceLabel = sc.source === "current" ? "Parameter Lab Saat Ini"
      : sc.source === "custom" ? "Kustom"
      : (PRESETS[sc.source] ? PRESETS[sc.source]._name : sc.source);
    const paramRows = PARAMS.map(p =>
      `<div class="param-mini">
        <label title="${p.l}">${p.l}</label>
        <input type="number" data-scid="${sc.id}" data-pk="${p.k}" min="${p.min}" max="${p.max}" step="${p.step}" value="${params[p.k]}">
        <span class="unit">${p.u}</span>
      </div>`
    ).join("");
    const summary = `<b>Siklus proses:</b> ${params.cycleProcess} detik · <b>Operator:</b> ${params.operators} · <b>Cacat:</b> ${(params.defectProb*100).toFixed(1)} persen · <b>Permintaan:</b> ${params.demandRate} unit per jam`;
    return `<div class="scenario-slot">
      <div class="scenario-header">
        <input type="text" class="scenario-name" data-scid="${sc.id}" value="${sc.name}" placeholder="Nama skenario">
        <button class="btn small danger" data-remove="${sc.id}" title="Hapus skenario">Hapus</button>
      </div>
      <label class="small">Sumber parameter</label>
      <select class="scenario-source" data-scid="${sc.id}">
        <option value="manual" ${sc.source==="manual"?"selected":""}>Preset Sistem Manual</option>
        <option value="partial" ${sc.source==="partial"?"selected":""}>Preset Otomasi Parsial</option>
        <option value="full" ${sc.source==="full"?"selected":""}>Preset Otomasi Penuh</option>
        <option value="current" ${sc.source==="current"?"selected":""}>Parameter Lab Saat Ini</option>
        <option value="custom" ${sc.source==="custom"?"selected":""}>Kustom (sudah diubah manual)</option>
      </select>
      <div class="scenario-summary">${summary}<br><span class="small">Sumber saat ini: ${sourceLabel}</span></div>
      <details class="scenario-params-details">
        <summary>Lihat atau ubah semua parameter skenario</summary>
        <div class="param-grid-mini">${paramRows}</div>
      </details>
    </div>`;
  }).join("") + (state.scenarios.length < 6 ? `<button class="btn primary add-scenario" id="btnAddScenario">+ Tambah Skenario (${state.scenarios.length} dari 6)</button>` : `<div class="small">Maksimum 6 skenario telah dicapai.</div>`);

  host.querySelectorAll(".scenario-name").forEach(el=>{
    el.addEventListener("input", ()=>{
      const sc = state.scenarios.find(s=>s.id===el.dataset.scid);
      if(sc) sc.name = el.value || "Skenario tanpa nama";
    });
  });
  host.querySelectorAll(".scenario-source").forEach(el=>{
    el.addEventListener("change", ()=>{
      const sc = state.scenarios.find(s=>s.id===el.dataset.scid);
      if(!sc) return;
      sc.source = el.value;
      if(sc.source !== "current" && sc.source !== "custom" && PRESETS[sc.source]){
        sc.params = Object.assign({}, PRESETS[sc.source]);
      }
      renderScenarioSlots();
    });
  });
  host.querySelectorAll("input[data-pk]").forEach(el=>{
    el.addEventListener("change", ()=>{
      const sc = state.scenarios.find(s=>s.id===el.dataset.scid);
      if(!sc) return;
      const pk = el.dataset.pk;
      const def = PARAMS.find(x=>x.k===pk);
      if(sc.source !== "custom"){
        sc.params = scenarioParamsDisplay(sc);
        sc.source = "custom";
      }
      let v = parseFloat(el.value);
      if(!isFinite(v)) v = def.min;
      v = clamp(v, def.min, def.max);
      el.value = v;
      sc.params[pk] = v;
      const sel = host.querySelector(`.scenario-source[data-scid="${sc.id}"]`);
      if(sel) sel.value = "custom";
      const sum = el.closest(".scenario-slot").querySelector(".scenario-summary");
      if(sum){
        const p2 = scenarioParamsDisplay(sc);
        sum.innerHTML = `<b>Siklus proses:</b> ${p2.cycleProcess} detik · <b>Operator:</b> ${p2.operators} · <b>Cacat:</b> ${(p2.defectProb*100).toFixed(1)} persen · <b>Permintaan:</b> ${p2.demandRate} unit per jam<br><span class="small">Sumber saat ini: Kustom</span>`;
      }
    });
  });
  host.querySelectorAll("[data-remove]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.dataset.remove;
      if(state.scenarios.length <= 2){ showToast("Minimal 2 skenario", "warn"); return; }
      showConfirm("Hapus Skenario", "Skenario yang dihapus tidak bisa dikembalikan. Lanjutkan?", ()=>{
        state.scenarios = state.scenarios.filter(s=>s.id!==id);
        renderScenarioSlots();
        showToast("Skenario dihapus", "info");
      });
    });
  });
  const add = document.getElementById("btnAddScenario");
  if(add) add.addEventListener("click", ()=>{
    if(state.scenarios.length >= 6){ showToast("Maksimum 6 skenario", "warn"); return; }
    const n = state.scenarios.length + 1;
    state.scenarios.push({
      id: "S" + n + "_" + Date.now(),
      name: "Skenario " + String.fromCharCode(64 + n),
      source: "partial",
      params: Object.assign({}, PRESETS.partial)
    });
    renderScenarioSlots();
    showToast("Skenario baru ditambahkan", "success");
  });
}

function runCompare(){
  try {
    const seed = parseInt(document.getElementById("cmpSeed").value)||12345;
    const reps = clamp(parseInt(document.getElementById("cmpRep").value)||3,1,30);
    const results = state.scenarios.map(sc=>{
      const p = scenarioParamsForRun(sc, seed, reps);
      return { id:sc.id, name:sc.name, source:sc.source, params:p, res: runExperiment(buildConfig(p)) };
    });
    state.cmp = results;
    const st = document.getElementById("cmpStatus");
    if(st) st.textContent = "Selesai dengan seed "+seed+" dan "+reps+" replikasi ("+results.length+" skenario)";
    const wrap = document.getElementById("cmpWrap"); if(wrap) wrap.style.display="block";
    renderCmpParams();
    renderCmpTable();
    renderCriteriaExplainer();
    renderWeights();
    recalcScores();
    results.forEach(r=>{
      state.runs.unshift({
        id: Date.now() + Math.random(),
        time: new Date().toLocaleString("id-ID"),
        config: "[Bandingkan] "+r.name,
        seed: r.params.seed, reps: r.res.replicationCount,
        source: "Perbandingan", res: r.res
      });
    });
    renderRunTable();
    showToast("Perbandingan selesai: "+results.length+" skenario, seed "+seed+". Hasil masuk Data dan Laporan.", "success");
  } catch(err){
    console.error("[VIA] Compare error:", err);
    showToast("<b>Error perbandingan</b>" + (err.message || String(err)), "error", 6000);
  }
}
function clearCompare(){
  showConfirm("Bersihkan Perbandingan",
    "Seluruh hasil perbandingan pada tab ini akan dihapus. Data run di tab Data dan Laporan tidak terpengaruh. Lanjutkan?",
    ()=>{
      state.cmp = null;
      const wrap = document.getElementById("cmpWrap"); if(wrap) wrap.style.display="none";
      const st = document.getElementById("cmpStatus"); if(st) st.textContent = "Belum dijalankan";
      ["cmpParams","cmpTable","scoreTable","detailCalc","sensBox","criteriaExplainer"].forEach(id=>{
        const el = document.getElementById(id); if(el) el.innerHTML = "";
      });
      ["chCmp","chScore"].forEach(id=>{
        const cv = document.getElementById(id); if(!cv) return;
        const ctx = cv.getContext("2d"); ctx.clearRect(0,0,cv.width,cv.height);
      });
      showToast("Hasil perbandingan dibersihkan", "success");
    });
}
function renderCmpParams(){
  const c = state.cmp; if(!c || !c.length) return;
  const t = document.getElementById("cmpParams"); if(!t) return;
  const key = [
    ["cycleProcess","Siklus proses (detik)"],
    ["cycleIntake","Siklus pemasukan (detik)"],
    ["cycleInspect","Siklus inspeksi (detik)"],
    ["cyclePack","Siklus pengemasan (detik)"],
    ["operators","Jumlah operator"],
    ["operatorRequirement","Kebutuhan operator"],
    ["defectProb","Probabilitas cacat"],
    ["inspectionAccuracy","Akurasi inspeksi"],
    ["mtbf","MTBF (menit)"],
    ["mttr","MTTR (menit)"],
    ["laborCostPerHour","Biaya tenaga kerja per jam"],
    ["initialInvestment","Investasi awal"]
  ];
  let html = "<thead><tr><th>Parameter Kunci</th>";
  c.forEach(r=>{ html += '<th>'+r.name+'<br><span class="small">Sumber: '+ (r.source==="current"?"Parameter Lab":r.source==="custom"?"Kustom":PRESETS[r.source]._name) +'</span></th>'; });
  html += "</tr></thead><tbody>";
  key.forEach(([k,lab])=>{
    html += "<tr><td>"+lab+"</td>";
    c.forEach(r=>{ html += '<td>'+r.params[k]+'</td>'; });
    html += "</tr>";
  });
  html += "</tbody>";
  t.innerHTML = html;
}
function renderCmpTable(){
  const c = state.cmp; if(!c || !c.length) return;
  const rows = [
    ["Throughput (unit per jam)", r=>nf(r.throughput,1)],
    ["Quality rate", r=>pct(r.qualityRate)],
    ["Defect rate", r=>pct(r.defectRate)],
    ["Cacat lolos inspeksi (unit)", r=>nf(r.escaped,0)],
    ["Scrap (unit)", r=>nf(r.scrap,0)],
    ["Rework (unit)", r=>nf(r.rework,0)],
    ["OEE", r=>pct(r.oee)],
    ["Availability", r=>pct(r.availability)],
    ["Performance", r=>pct(r.performance)],
    ["Lead time rerata (menit)", r=>nf(r.leadAvg,1)],
    ["CV lead time", r=>nf(r.leadCV,2)],
    ["Pemenuhan permintaan", r=>pct(r.fulfillment)],
    ["On time delivery", r=>pct(r.onTimeRate)],
    ["Bottleneck", r=>r.bottleneck],
    ["Biaya total periode", r=>rp(r.totalCost)],
    ["Biaya per unit baik", r=>rp(r.costPerGood)],
    ["Manfaat bersih tahunan", r=>rp(r.annualNet)],
    ["Investasi total", r=>rp(r.investment)],
    ["Payback period", r=>r.payback===null?"Tidak tercapai":nf(r.payback,2)+" tahun"],
    ["Break even volume (unit per tahun)", r=>r.bep===null?"Tidak tercapai":nf(r.bep,0)]
  ];
  let html = "<thead><tr><th>Indikator</th>"+c.map(r=>'<th>'+r.name+'</th>').join("")+"</tr></thead><tbody>";
  rows.forEach(([lab,fn])=>{
    html += "<tr><td>"+lab+"</td>"+c.map(r=>'<td>'+fn(r.res)+'</td>').join("")+"</tr>";
  });
  html += "</tbody>";
  const t = document.getElementById("cmpTable"); if(t) t.innerHTML = html;
  drawBars(document.getElementById("chCmp"),
    ["Throughput","Quality persen","OEE persen","Fulfillment persen","On time persen"],
    c.map((r,i)=>({
      name:r.name,
      color:PALETTE[i % PALETTE.length],
      vals:[r.res.throughput, r.res.qualityRate*100, r.res.oee*100, r.res.fulfillment*100, r.res.onTimeRate*100]
    })));
}
function renderCriteriaExplainer(){
  const host = document.getElementById("criteriaExplainer"); if(!host) return;
  host.innerHTML =
    "<h4>Dari mana nilai perbandingan berasal?</h4>"
    + "<p>Nilai pada tabel di atas berasal dari <b>parameter skenario</b> yang Anda tentukan sendiri di panel Skenario A, B, C, dan seterusnya. Setiap skenario memiliki satu set parameter lengkap (waktu siklus, operator, probabilitas cacat, dan seterusnya) yang dapat dilihat dan diubah pada tombol 'Lihat atau ubah semua parameter skenario'. Simulasi dijalankan untuk setiap skenario dengan seed dan jumlah replikasi yang sama sehingga perbandingan bersifat adil.</p>"
    + "<h4>Apa itu Skor Daya Saing?</h4>"
    + "<p>Skor Daya Saing adalah penilaian multikriteria untuk memeringkat skenario. Enam kriteria diambil dari hasil simulasi, dinormalisasi min max ke skala 0 sampai 100, lalu digabung dengan bobot prioritas menjadi satu angka.</p>"
    + "<h4>Kriteria, sumber nilai, dan arah</h4>"
    + "<table><thead><tr><th>Kriteria</th><th>Sumber nilai</th><th>Arah</th></tr></thead><tbody>"
    + "<tr><td>Biaya per unit baik</td><td>Total biaya operasi dibagi unit baik</td><td>Rendah lebih baik</td></tr>"
    + "<tr><td>Kualitas</td><td>Quality rate (unit baik dibagi diperiksa)</td><td>Tinggi lebih baik</td></tr>"
    + "<tr><td>Kecepatan</td><td>Rerata lead time (menit)</td><td>Rendah lebih baik</td></tr>"
    + "<tr><td>Ketepatan pengiriman</td><td>On time delivery (persen)</td><td>Tinggi lebih baik</td></tr>"
    + "<tr><td>Fleksibilitas</td><td>Pemenuhan permintaan (persen)</td><td>Tinggi lebih baik</td></tr>"
    + "<tr><td>Konsistensi proses</td><td>1 dikurangi CV lead time</td><td>Tinggi lebih baik</td></tr>"
    + "</tbody></table>"
    + "<h4>Cara bobot dan normalisasi bekerja</h4>"
    + "<p><b>Bobot prioritas manajemen</b> mengatur tingkat kepentingan tiap kriteria (total harus 100). <b>Normalisasi min max</b>: nilai terburuk diberi 0, terbaik diberi 100. Untuk kriteria rendah lebih baik, hasil dibalik. <b>Skor akhir</b> = jumlah dari (bobot dibagi total bobot) dikali (nilai ternormalisasi 0 sampai 100).</p>";
}
function renderWeights(){
  const host = document.getElementById("weightsBox"); if(!host) return;
  const labels = {
    cost:"Biaya per unit baik", quality:"Kualitas", speed:"Kecepatan (lead time)",
    delivery:"Ketepatan pengiriman", flex:"Fleksibilitas (pemenuhan)", consistency:"Konsistensi proses"
  };
  host.innerHTML = Object.keys(state.weights).map(k=>(
    '<div class="wbar"><label>'+labels[k]+'</label>'
    + '<input type="range" min="0" max="40" step="1" value="'+state.weights[k]+'" data-w="'+k+'">'
    + '<input type="number" min="0" max="100" step="1" value="'+state.weights[k]+'" data-wn="'+k+'" style="width:66px;text-align:right">'
    + '</div>'
  )).join("") + '<div class="small" id="wSum"></div>';
  host.querySelectorAll("[data-w]").forEach(el=>{
    el.addEventListener("input", ()=>{
      state.weights[el.dataset.w] = +el.value;
      const n = host.querySelector('[data-wn="'+el.dataset.w+'"]');
      if(n) n.value = el.value;
      updateWeightSum();
    });
  });
  host.querySelectorAll("[data-wn]").forEach(el=>{
    el.addEventListener("change", ()=>{
      state.weights[el.dataset.wn] = clamp(+el.value||0,0,100);
      const s = host.querySelector('[data-w="'+el.dataset.wn+'"]');
      if(s) s.value = state.weights[el.dataset.wn];
      updateWeightSum();
    });
  });
  updateWeightSum();
}
function updateWeightSum(){
  const host = document.getElementById("wSum"); if(!host) return;
  const sum = Object.values(state.weights).reduce((a,b)=>a+b,0);
  host.innerHTML = "Total bobot: <b>"+sum+"</b> "
    + (sum===100?'<span class="pill ok">valid</span>':'<span class="pill bad">harus 100</span>');
  if(state.cmp) recalcScores();
}
function normalize(vals, higherBetter){
  const min = Math.min(...vals), max = Math.max(...vals);
  if(max-min < 1e-12) return vals.map(()=>100);
  return vals.map(v=>{
    const t=(v-min)/(max-min);
    return (higherBetter? t : 1-t)*100;
  });
}
function scoreWithWeights(w){
  const c = state.cmp; if(!c || !c.length) return null;
  const crit = {
    cost:        {label:"Biaya per unit baik", vals:c.map(r=>r.res.costPerGood ?? 1e12), hb:false, fmt:v=>rp(v)},
    quality:     {label:"Kualitas", vals:c.map(r=>r.res.qualityRate), hb:true, fmt:v=>pct(v)},
    speed:       {label:"Kecepatan lead time", vals:c.map(r=>r.res.leadAvg), hb:false, fmt:v=>nf(v,1)+" menit"},
    delivery:    {label:"Ketepatan pengiriman", vals:c.map(r=>r.res.onTimeRate), hb:true, fmt:v=>pct(v)},
    flex:        {label:"Fleksibilitas", vals:c.map(r=>r.res.fulfillment), hb:true, fmt:v=>pct(v)},
    consistency: {label:"Konsistensi proses", vals:c.map(r=>r.res.consistency), hb:true, fmt:v=>nf(v,2)}
  };
  const norm = {};
  for(const k in crit) norm[k] = normalize(crit[k].vals, crit[k].hb);
  const totalW = Object.values(w).reduce((a,b)=>a+b,0) || 1;
  const scores = c.map((r,i)=>{
    let sc=0;
    for(const cr in crit) sc += (w[cr]/totalW) * norm[cr][i];
    return sc;
  });
  return {scores, norm, crit};
}
function recalcScores(){
  const c = state.cmp; if(!c || !c.length) return;
  const base = scoreWithWeights(state.weights);
  if(!base) return;
  const rank = c.map((r,i)=>({i, sc:base.scores[i]})).sort((a,b)=>b.sc-a.sc);
  const pos = {}; rank.forEach((x,j)=>pos[x.i]=j+1);
  let html = "<table><thead><tr><th>Alternatif</th><th>Skor</th><th>Peringkat</th></tr></thead><tbody>";
  c.forEach((r,i)=>{
    html += "<tr><td>"+r.name+"</td><td><b>"+nf(base.scores[i],1)+"</b></td><td>"+pos[i]+"</td></tr>";
  });
  html += "</tbody></table>";
  const t = document.getElementById("scoreTable"); if(t) t.innerHTML = html;
  drawBars(document.getElementById("chScore"),
    c.map(r=>r.name.length>12?r.name.slice(0,11)+"...":r.name),
    [{name:"Skor", color:"#7c3aed", vals:base.scores}]);

  const detailHost = document.getElementById("detailCalc");
  if(detailHost){
    let d = "<table><thead><tr><th>Kriteria</th>"
      + c.map(r=>'<th>'+r.name+'</th>').join("")
      + "<th>Bobot</th></tr></thead><tbody>";
    for(const k in base.crit){
      const cr = base.crit[k];
      d += "<tr><td>"+cr.label+"</td>"
        + c.map((r,i)=>'<td>'+cr.fmt(cr.vals[i])
          +'<br><span class="small">normal: '+nf(base.norm[k][i],0)+'</span></td>').join("")
        + "<td>"+state.weights[k]+"</td></tr>";
    }
    d += "</tbody></table>";
    d += '<div class="small" style="margin-top:6px">Angka kecil di bawah nilai mentah adalah hasil normalisasi 0 sampai 100.</div>';
    detailHost.innerHTML = d;
  }

  const crits = Object.keys(state.weights);
  let sens = "<table><thead><tr><th>Kriteria diubah</th><th>Peringkat terbaik</th><th>Stabil</th></tr></thead><tbody>";
  crits.forEach(cr=>{
    const res=[];
    [-0.2, 0.2].forEach(delta=>{
      const w = Object.assign({}, state.weights);
      w[cr] = Math.max(0, w[cr]*(1+delta));
      const sc = scoreWithWeights(w);
      let bi=0; for(let i=1;i<sc.scores.length;i++) if(sc.scores[i]>sc.scores[bi]) bi=i;
      res.push(bi);
    });
    const stable = res[0]===res[1] && res[0]===rank[0].i;
    sens += "<tr><td>"+state.weights[cr]+" "+cr+"</td><td>"+c[res[0]].name+" / "+c[res[1]].name+"</td><td>"
      + (stable?'<span class="pill ok">stabil</span>':'<span class="pill warn">berubah</span>') + "</td></tr>";
  });
  sens += "</tbody></table>";
  sens += '<div class="small" style="margin-top:6px">Perubahan prioritas manajemen dapat mengubah alternatif terbaik.</div>';
  const sb = document.getElementById("sensBox"); if(sb) sb.innerHTML = sens;
}

/* ==================== EKSPERIMEN ==================== */
const EXPERIMENTS = [
  { id:"e1", title:"Eksperimen 1: Pengaruh Otomasi terhadap Produktivitas",
    goal:"Mengukur perubahan output per jam tenaga kerja saat operator dan waktu siklus diubah.",
    question:"Apakah penurunan jumlah operator selalu meningkatkan produktivitas tenaga kerja?",
    vars:{ bebas:["Jumlah operator","Waktu siklus"], terikat:["Throughput","Produktivitas","Cost per Good","Quality"], kontrol:["Permintaan","Seed","Replikasi"] },
    steps:["Terapkan baseline Manual. Catat throughput, operator, dan cost per good.",
      "Turunkan operator ke 4 lalu 3. Amati faktor operator.",
      "Kembalikan, turunkan cycleProcess 20 persen. Amati bottleneck baru.",
      "Bandingkan hasil. Hitung produktivitas = output baik dibagi jam tenaga kerja.",
      "Simpulkan konfigurasi terbaik tanpa mengorbankan kualitas dan biaya."],
    setup:()=>applyPreset("manual") },
  { id:"e2", title:"Eksperimen 2: Pengaruh Otomasi terhadap Kualitas",
    goal:"Menganalisis kualitas, rework, scrap, dan biaya kualitas.",
    question:"Apakah akurasi inspeksi tinggi selalu menurunkan defect rate yang dirasakan pelanggan?",
    vars:{ bebas:["Probabilitas cacat","Akurasi inspeksi","Proporsi repairable"], terikat:["Quality rate","Escape rate","Scrap","Biaya kualitas"], kontrol:["Siklus","Keandalan"] },
    steps:["Baseline Parsial. Catat quality, escape, biaya kualitas.",
      "Naikkan akurasi ke 0,99. Amati escape dan scrap.",
      "Turunkan ke 0,70. Bandingkan cacat lolos.",
      "Proporsi repairable = 0,4. Amati lonjakan scrap.",
      "Simpulkan trade off biaya inspeksi dan kualitas buruk."],
    setup:()=>applyPreset("partial") },
  { id:"e3", title:"Eksperimen 3: Analisis OEE dan Bottleneck",
    goal:"Menentukan komponen OEE yang paling membatasi dan stasiun bottleneck.",
    question:"Apakah bottleneck selalu ditentukan oleh siklus terpanjang, atau dapat berpindah akibat downtime?",
    vars:{ bebas:["Waktu siklus","MTBF","MTTR","Buffer","Setup"], terikat:["Availability","Performance","Quality","OEE","Utilisasi","Antrean"], kontrol:["Permintaan","Kebijakan kualitas"] },
    steps:["Baseline Penuh. Catat A, P, Q, OEE, bottleneck.",
      "MTBF sama dengan 150, MTTR sama dengan 60. Amati komponen A.",
      "Buffer sama dengan 30. Amati utilisasi dan blocking.",
      "Buffer sama dengan 2. Amati antrean dan throughput.",
      "Tentukan komponen OEE paling membatasi."],
    setup:()=>applyPreset("full") },
  { id:"e4", title:"Eksperimen 4: Evaluasi Ekonomi Otomasi",
    goal:"Membandingkan biaya, payback, dan break even tiga konfigurasi.",
    question:"Pada tingkat permintaan berapa otomasi penuh layak secara ekonomi?",
    vars:{ bebas:["Tingkat otomasi","Investasi","Permintaan"], terikat:["Cost per Good","Manfaat bersih","Payback","BEP"], kontrol:["Harga jual","Hari kerja"] },
    steps:["Buka Perbandingan. Jalankan dengan seed dan replikasi sama.",
      "Catat cost per good, manfaat bersih, payback.",
      "Turunkan permintaan ke 50 per jam. Ulangi.",
      "Amati alternatif yang payback tidak tercapai.",
      "Rumuskan rekomendasi berbasis volume."],
    setup:()=>applyPreset("partial") },
  { id:"e5", title:"Eksperimen 5: Analisis Trade off",
    goal:"Mengidentifikasi skenario ketika peningkatan kecepatan justru merugikan.",
    question:"Kapan peningkatan kecepatan produksi justru merugikan kinerja sistem?",
    vars:{ bebas:["Siklus","Probabilitas cacat","Biaya pemeliharaan","MTBF","Operator"], terikat:["OEE","Cost per Good","Quality","Fulfillment"], kontrol:["Permintaan","Harga"] },
    steps:["Baseline Penuh. Turunkan siklus 30 persen sekaligus naikkan defect 0,12.",
      "Naikkan biaya pemeliharaan tiga kali. Amati cost per good.",
      "Operator sama dengan 1. Amati ketergantungan pada satu jalur.",
      "Bandingkan baseline. Identifikasi titik perbaikan merugikan.",
      "Usulkan alternatif terbaik."],
    setup:()=>applyPreset("full") },
  { id:"e6", title:"Eksperimen 6: Eksperimen Terbuka",
    goal:"Merancang eksperimen mandiri lengkap.",
    question:"Tentukan sendiri pertanyaan penelitian Anda.",
    vars:{ bebas:["Tentukan sendiri"], terikat:["Tentukan sendiri"], kontrol:["Tentukan sendiri"] },
    steps:["Rumuskan pertanyaan penelitian.",
      "Tentukan hipotesis, variabel, baseline.",
      "Tentukan replikasi dan seed.",
      "Jalankan minimal 3 skenario, catat di tab Data.",
      "Ekspor CSV, susun analisis dan rekomendasi."],
    setup:()=>{} }
];
function renderExperiments(){
  const host = document.getElementById("expList"); if(!host) return;
  host.innerHTML = EXPERIMENTS.map(e=>
    '<details class="exp" id="exp-'+e.id+'">'
    + '<summary>'+e.title+'<span class="small">buka</span></summary>'
    + '<div class="body">'
    + '<p><b>Tujuan.</b> '+e.goal+'</p>'
    + '<p><b>Rumusan masalah.</b> '+e.question+'</p>'
    + '<p><span class="tag">Bebas</span> '+e.vars.bebas.join(", ")+'</p>'
    + '<p><span class="tag v">Terikat</span> '+e.vars.terikat.join(", ")+'</p>'
    + '<p><span class="tag k">Kontrol</span> '+e.vars.kontrol.join(", ")+'</p>'
    + '<p><b>Langkah kerja.</b></p><ol>'+e.steps.map(s=>'<li>'+s+'</li>').join("")+'</ol>'
    + '<div class="grid2" style="margin-top:8px">'
    + '<div><label class="small"><b>Hipotesis awal</b></label><textarea data-note="'+e.id+'_hip"></textarea></div>'
    + '<div><label class="small"><b>Kesimpulan</b></label><textarea data-note="'+e.id+'_con"></textarea></div>'
    + '</div>'
    + '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">'
    + '<button class="btn primary" data-exp-setup="'+e.id+'">Terapkan Baseline</button>'
    + '<button class="btn" data-exp-run="'+e.id+'">Jalankan dan Catat</button>'
    + '</div>'
    + '<div id="dyn-'+e.id+'" style="margin-top:8px"></div>'
    + '</div></details>').join("");
  host.querySelectorAll("[data-note]").forEach(t=>{
    try{ t.value = localStorage.getItem("via_"+t.dataset.note) || ""; }catch(err){}
    t.addEventListener("input", ()=>{ try{ localStorage.setItem("via_"+t.dataset.note, t.value); }catch(err){} });
  });
  host.querySelectorAll("[data-exp-setup]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const e = EXPERIMENTS.find(x=>x.id===b.dataset.expSetup);
      if(e && e.setup) e.setup();
      switchTab("lab");
      showToast("Baseline skenario diterapkan. Siap menjalankan simulasi.", "info");
    });
  });
  host.querySelectorAll("[data-exp-run]").forEach(b=>{
    b.addEventListener("click", ()=>{
      switchTab("lab");
      doRun(true);
      setTimeout(()=>{ switchTab("exp"); refreshDynamicQuestions(); }, 80);
    });
  });
}
function refreshDynamicQuestions(){
  EXPERIMENTS.forEach(e=>{
    const host = document.getElementById("dyn-"+e.id);
    if(!host || !state.lastResult) return;
    const r = state.lastResult;
    const qs = [];
    if(r.costPerGood && r.costPerGood > state.params.sellingPrice)
      qs.push("Output ada tetapi biaya per unit baik melampaui harga jual. Telusuri komponen biaya dan perubahan kualitas.");
    if(r.escaped>0)
      qs.push(nf(r.escaped,0)+" cacat lolos inspeksi. Apakah kenaikan akurasi akan menurunkan biaya kualitas total, atau justru menaikkan rework dan scrap?");
    if(r.opFactor>1.001)
      qs.push("Faktor operator lebih besar dari 1 karena kekurangan tenaga kerja. Apakah penambahan satu operator lebih murah daripada kehilangan throughput?");
    if(r.performance>1.001)
      qs.push("Performance OEE melebihi 100 persen. Periksa asumsi waktu siklus ideal dan pencatatan output.");
    if(r.payback===null)
      qs.push("Payback tidak tercapai. Komponen biaya mana yang dominan? Pada permintaan berapa investasi mulai layak?");
    if(r.lostBuffer>0)
      qs.push(nf(r.lostBuffer,0)+" pesanan hilang karena buffer penuh. Uji pengaruh kapasitas penyangga terhadap throughput dan lead time.");
    if(!qs.length) qs.push("Hasil tidak memicu peringatan khusus. Ubah satu parameter pada satu waktu dan bandingkan.");
    host.innerHTML = '<div class="okbox"><b>Pertanyaan reflektif dari hasil Anda:</b><ul>'
      + qs.map(q=>'<li>'+q+'</li>').join("") + '</ul></div>';
  });
}

/* ==================== DATA ==================== */
function renderRunTable(){
  const t = document.getElementById("runTable"); if(!t) return;
  const cnt = document.getElementById("dataCount");
  if(cnt) cnt.textContent = state.runs.length + " run";
  if(!state.runs.length){
    t.innerHTML = '<tbody><tr><td class="small">Belum ada run. Jalankan simulasi atau perbandingan.</td></tr></tbody>';
    return;
  }
  let html = "<thead><tr><th>#</th><th>Waktu</th><th>Konfigurasi</th><th>Sumber</th>"
    + "<th>Seed</th><th>Rep</th><th>Throughput</th><th>Quality</th><th>OEE</th>"
    + "<th>Cost per Good</th><th>Lead Time</th><th>Payback</th><th>Bottleneck</th></tr></thead><tbody>";
  state.runs.forEach((run,i)=>{
    const r = run.res;
    html += "<tr><td>"+(state.runs.length-i)+"</td><td class='small'>"+run.time+"</td><td>"+run.config+"</td>"
      + "<td class='small'>"+run.source+"</td>"
      + "<td>"+run.seed+"</td><td>"+run.reps+"</td>"
      + "<td>"+nf(r.throughput,1)+"</td><td>"+pct(r.qualityRate)+"</td>"
      + "<td>"+pct(r.oee)+"</td><td>"+rp(r.costPerGood)+"</td>"
      + "<td>"+nf(r.leadAvg,1)+"</td>"
      + "<td>"+(r.payback===null?NA:nf(r.payback,2))+"</td>"
      + "<td class='small'>"+r.bottleneck+"</td></tr>";
  });
  html += "</tbody>";
  t.innerHTML = html;
}
function download(filename, text, mime){
  const blob = new Blob([text], {type: mime||"text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 300);
}
function csvCreditPrefix(){
  return "# Dikembangkan oleh " + APP_CREDIT_LINE + "\n# Virtual Industrial Automation Laboratory\n";
}
function exportPdfChooser(){
  const hasRuns = state.runs.length > 0;
  const hasLast = !!state.lastResult;
  showChooser(
    "Laporan Simulasi (.pdf)",
    "Pilih jenis laporan PDF yang ingin dicetak atau disimpan. Laporan disajikan secara dinamis berdasarkan masukan dan riwayat eksperimen.",
    [
      {
        label: "Hasil Simulasi Terakhir",
        description: hasLast ? "Laporan lengkap dari satu simulasi terakhir yang dijalankan." : "Belum ada simulasi terakhir.",
        onClick: hasLast ? buildReportLast : ()=>showToast("Jalankan simulasi terlebih dahulu", "warn")
      },
      {
        label: "Rekapitulasi Keseluruhan",
        description: hasRuns ? "Laporan rekapitulasi seluruh riwayat simulasi dan perbandingan yang tercatat." : "Belum ada data untuk dilaporkan.",
        onClick: hasRuns ? buildReportAll : ()=>showToast("Belum ada data untuk dilaporkan", "warn")
      }
    ]
  );
}
function exportDataChooser(){
  const hasRuns = state.runs.length > 0;
  const hasLast = !!state.lastResult;
  showChooser(
    "Ekspor Data (.csv)",
    "Pilih jenis data yang akan diekspor. Semua berkas menggunakan pemisah titik koma dan BOM UTF-8 agar kompatibel dengan Excel berlokal Indonesia.",
    [
      {
        label: "Ringkasan Semua Simulasi",
        description: hasRuns
          ? "Tabel ringkasan " + state.runs.length + " run yang tercatat pada sesi ini. Cocok untuk analisis agregat antar skenario."
          : "Belum ada run yang tercatat. Jalankan simulasi atau perbandingan terlebih dahulu.",
        onClick: hasRuns
          ? exportCSVAll
          : ()=>showToast("Belum ada data simulasi untuk diekspor", "warn")
      },
      {
        label: "Deret Waktu Simulasi Tunggal",
        description: hasLast
          ? "Deret waktu dari simulasi terakhir. Berisi sampel output kumulatif, scrap, cacat lolos, dan antrean per interval waktu."
          : "Belum ada simulasi terakhir. Jalankan satu simulasi pada tab Laboratorium terlebih dahulu.",
        onClick: hasLast
          ? exportCSVTime
          : ()=>showToast("Jalankan simulasi terlebih dahulu pada tab Laboratorium", "warn")
      },
      {
        label: "Konfigurasi Parameter Aktif",
        description: "Daftar seluruh parameter yang sedang aktif beserta satuan dan grupnya. Berguna sebagai dokumentasi konfigurasi yang dapat direproduksi.",
        onClick: exportCSVParams
      }
    ]
  );
}
function exportCSVAll(){
  if(!state.runs.length){ showToast("Belum ada data untuk diekspor", "warn"); return; }
  const head = ["no","waktu","konfigurasi","sumber","seed","replikasi","simulasi_menit",
    "throughput","quality_rate","defect_rate","escape_rate","scrap_rate","rework_rate",
    "oee","availability","performance","quality_oee","lead_time_menit","cv_lead",
    "pemenuhan","on_time","bottleneck","biaya_total","biaya_per_unit","biaya_per_unit_baik",
    "manfaat_bersih_tahunan","investasi","payback_tahun","bep_unit_tahun"];
  const rows = state.runs.map((run,i)=>{
    const r = run.res;
    return [state.runs.length-i, run.time, run.config, run.source, run.seed, run.reps, r.simMinutes,
      r.throughput.toFixed(3), r.qualityRate.toFixed(4), r.defectRate.toFixed(4),
      r.escapeRate.toFixed(4), r.scrapRate.toFixed(4), r.reworkRate.toFixed(4),
      r.oee.toFixed(4), r.availability.toFixed(4), r.performance.toFixed(4), r.qualityOEE.toFixed(4),
      r.leadAvg.toFixed(2), r.leadCV.toFixed(4), r.fulfillment.toFixed(4), r.onTimeRate.toFixed(4),
      r.bottleneck, r.totalCost.toFixed(0), (r.costPerUnit||0).toFixed(0), (r.costPerGood||0).toFixed(0),
      r.annualNet.toFixed(0), r.investment.toFixed(0),
      r.payback===null?"":r.payback.toFixed(3),
      r.bep===null?"":r.bep.toFixed(0)
    ].join(";");
  });
  const stamp = new Date().toISOString().slice(0,10);
  download("VIA_TyastoPrimaAhmadi_ringkasan_"+stamp+".csv",
    "\uFEFF" + csvCreditPrefix() + head.join(";") + "\n" + rows.join("\n"),
    "text/csv;charset=utf-8");
  showToast("Ringkasan semua simulasi diunduh (" + state.runs.length + " run)", "success");
}
function exportCSVTime(){
  const r = state.lastResult;
  if(!r || !r.samples){ showToast("Belum ada deret waktu. Jalankan simulasi dahulu.", "warn"); return; }
  const head = ["t_menit","good_kumulatif","scrap_kumulatif","cacat_lolos_kumulatif","diperiksa_kumulatif",
    "antrean_s0","antrean_s1","antrean_s2","antrean_s3","antrean_s4"];
  const rows = r.samples.map(s=>[s.t.toFixed(2),s.good,s.scrap,s.escaped,s.inspected,...s.queues].join(";"));
  const stamp = new Date().toISOString().slice(0,10);
  download("VIA_TyastoPrimaAhmadi_deret_waktu_"+stamp+".csv",
    "\uFEFF" + csvCreditPrefix() + head.join(";") + "\n" + rows.join("\n"),
    "text/csv;charset=utf-8");
  showToast("Deret waktu simulasi terakhir diunduh", "success");
}
function exportCSVParams(){
  const head = ["grup","parameter","nilai","satuan"];
  const rows = PARAMS.map(p=>[GROUPS[p.g], p.l, state.params[p.k], p.u].join(";"));
  const stamp = new Date().toISOString().slice(0,10);
  download("VIA_TyastoPrimaAhmadi_konfigurasi_"+stamp+".csv",
    "\uFEFF" + csvCreditPrefix() + head.join(";") + "\n" + rows.join("\n"),
    "text/csv;charset=utf-8");
  showToast("Konfigurasi parameter aktif diunduh", "success");
}

/* ==================== LAPORAN ==================== */
function openPrintable(html){
  const w = window.open("", "_blank");
  if(!w){ showToast("Pop up diblokir. Izinkan pop up untuk membuat laporan.", "error", 5000); return; }
  w.document.open(); w.document.write(html); w.document.close();
  showToast("Laporan dibuka di tab baru dan siap dicetak", "success");
}
const REPORT_STYLE = "<style>body{font-family:Georgia,serif;max-width:820px;margin:24px auto;color:#111;line-height:1.55;font-size:12pt}"
  + "h1{font-size:19pt;margin:0 0 6px}h2{font-size:13.5pt;border-bottom:1px solid #999;margin-top:24px;padding-bottom:4px}"
  + "h3{font-size:12pt;margin:16px 0 6px}h4{font-size:11pt;margin:12px 0 4px}"
  + "table{width:100%;border-collapse:collapse;font-size:10pt;margin:8px 0}"
  + "th,td{border:1px solid #bbb;padding:5px 7px;text-align:center;font-variant-numeric:tabular-nums}"
  + "th{background:#eee}.meta{font-size:10pt;color:#555;margin-bottom:12px}"
  + "ul{margin:6px 0 6px 20px}.small{font-size:9.5pt;color:#666}"
  + "code{background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:10pt}"
  + ".credit-block{text-align:center;padding:14px;background:#f8fafc;border-radius:10px;"
  + "margin-bottom:20px;border:1px solid #d9e2ec}"
  + ".credit-block .lbl{font-size:9.5pt;color:#64748b;text-transform:uppercase;letter-spacing:.6px;font-weight:600}"
  + ".credit-block .name{font-size:14pt;font-weight:700;color:#0f172a;margin:5px 0}"
  + ".credit-block .affil{font-size:10.5pt;color:#475569}"
  + "@media print{body{margin:0}h2{page-break-after:avoid}table{page-break-inside:avoid}}</style>"
  + "<script>window.onload=function(){setTimeout(function(){window.print();},500);};</script>";

const CREDIT_BLOCK_HTML = "<div class='credit-block'>"
  + "<div class='lbl'>Disusun dan dikembangkan oleh</div>"
  + "<div class='name'>Vergissmeinnicht.</div>"
  + "<div class='affil'>Tyasto Prima Ahmadi<br>Teknik Industri, Universitas Indonesia Mandiri</div>"
  + "</div>";

function buildReportLast(){
  const r = state.lastResult;
  if(!r){ showToast("Jalankan simulasi terlebih dahulu", "warn"); return; }
  const cfg = state.lastCfg, p = state.params;
  const paramRows = PARAMS.map(x=>"<tr><td>"+x.l+"</td><td>"+p[x.k]+"</td><td>"+x.u+"</td></tr>").join("");
  const stRows = r.stations.map(s=>"<tr><td>"+s.name+"</td><td>"+nf(s.cycleSec,1)+"</td>"
    + "<td>"+pct(s.utilization)+"</td><td>"+pct(s.availability)+"</td>"
    + "<td>"+nf(s.avgQueue,2)+"</td><td>"+nf(s.maxQueue,0)+"</td>"
    + "<td>"+nf(s.processed,0)+"</td></tr>").join("");
  const ins = generateInsights(r).map(o=>"<li>"+o.txt.replace(/<\/?b>/g,"")+"</li>").join("");
  const notes = EXPERIMENTS.map(e=>{
    let hip="",con="";
    try{ hip=localStorage.getItem("via_"+e.id+"_hip")||""; con=localStorage.getItem("via_"+e.id+"_con")||""; }catch(err){}
    if(!hip && !con) return "";
    return "<h4>"+e.title+"</h4><p><b>Hipotesis:</b> "+(hip||"kosong")+"</p><p><b>Kesimpulan:</b> "+(con||"kosong")+"</p>";
  }).join("");
  const html = "<!DOCTYPE html><html lang='id'><head><meta charset='utf-8'>"
    + "<meta name='author' content='Vergissmeinnicht. (Tyasto Prima Ahmadi)'>"
    + "<title>Laporan Hasil Simulasi | Vergissmeinnicht. (Tyasto Prima Ahmadi)</title>"+REPORT_STYLE+"</head><body>"
    + CREDIT_BLOCK_HTML
    + "<h1>Laporan Hasil Simulasi</h1>"
    + "<div class='meta'>Virtual Industrial Automation Laboratory · "+new Date().toLocaleString("id-ID")+" · Data sintetis (bukan data perusahaan nyata)</div>"
    + "<h2>1. Identitas dan Tujuan</h2><p>Mata kuliah Otomasi Industri, S1 Teknik Industri. Laporan ini merangkum satu simulasi terakhir yang dijalankan pada sesi ini.</p>"
    + "<h2>2. Konfigurasi</h2><p>Nama skenario: <b>"+cfgName(p)+"</b>. Seed: <b>"+cfg.seed+"</b>. Replikasi: <b>"+cfg.replicationCount+"</b>. Total waktu simulasi: <b>"+nf(cfg.totalMinutes,0)+" menit</b>.</p>"
    + "<h2>3. Model dan Asumsi</h2><ul>"
    + "<li>Simulasi kejadian diskret dengan antrean FIFO, buffer terbatas, dan mekanisme blocking.</li>"
    + "<li>Waktu proses Erlang. Waktu antar kerusakan dan perbaikan eksponensial.</li>"
    + "<li>Investasi modal tidak dimasukkan ke biaya operasi, hanya untuk payback dan BEP.</li></ul>"
    + "<h2>4. Parameter Lengkap</h2><table><thead><tr><th>Parameter</th><th>Nilai</th><th>Satuan</th></tr></thead><tbody>"+paramRows+"</tbody></table>"
    + "<h2>5. Indikator Kinerja</h2><table><thead><tr><th>Indikator</th><th>Nilai</th></tr></thead><tbody>"
    + "<tr><td>Throughput</td><td>"+nf(r.throughput,2)+" unit per jam</td></tr>"
    + "<tr><td>Quality rate</td><td>"+pct(r.qualityRate)+"</td></tr>"
    + "<tr><td>Defect rate</td><td>"+pct(r.defectRate)+"</td></tr>"
    + "<tr><td>Escape rate</td><td>"+pct(r.escapeRate)+"</td></tr>"
    + "<tr><td>Scrap rate</td><td>"+pct(r.scrapRate)+"</td></tr>"
    + "<tr><td>OEE</td><td>"+pct(r.oee)+"</td></tr>"
    + "<tr><td>Availability</td><td>"+pct(r.availability)+"</td></tr>"
    + "<tr><td>Performance</td><td>"+pct(r.performance)+"</td></tr>"
    + "<tr><td>Lead time rerata</td><td>"+nf(r.leadAvg,2)+" menit</td></tr>"
    + "<tr><td>Pemenuhan permintaan</td><td>"+pct(r.fulfillment)+"</td></tr>"
    + "<tr><td>On time delivery</td><td>"+pct(r.onTimeRate)+"</td></tr>"
    + "<tr><td>Bottleneck</td><td>"+r.bottleneck+"</td></tr>"
    + "</tbody></table>"
    + "<h3>Kinerja per Stasiun</h3><table><thead><tr><th>Stasiun</th><th>Siklus (detik)</th>"
    + "<th>Utilisasi</th><th>Availability</th><th>Antrean rerata</th><th>Antrean maks</th>"
    + "<th>Diproses</th></tr></thead><tbody>"+stRows+"</tbody></table>"
    + "<h2>6. Analisis Ekonomi</h2><table><thead><tr><th>Komponen</th><th>Nilai</th></tr></thead><tbody>"
    + "<tr><td>Biaya tenaga kerja</td><td>"+rp(r.costLabor)+"</td></tr>"
    + "<tr><td>Biaya material</td><td>"+rp(r.costMaterial)+"</td></tr>"
    + "<tr><td>Biaya energi</td><td>"+rp(r.costEnergy)+"</td></tr>"
    + "<tr><td>Biaya pemeliharaan</td><td>"+rp(r.costMaint)+"</td></tr>"
    + "<tr><td>Biaya kualitas</td><td>"+rp(r.costQuality)+"</td></tr>"
    + "<tr><td>Biaya tetap</td><td>"+rp(r.costFixed)+"</td></tr>"
    + "<tr><td>Biaya variabel</td><td>"+rp(r.costVariable)+"</td></tr>"
    + "<tr><td><b>Total biaya</b></td><td><b>"+rp(r.totalCost)+"</b></td></tr>"
    + "<tr><td>Biaya per unit</td><td>"+rp(r.costPerUnit)+"</td></tr>"
    + "<tr><td>Biaya per unit baik</td><td>"+rp(r.costPerGood)+"</td></tr>"
    + "<tr><td>Investasi total</td><td>"+rp(r.investment)+"</td></tr>"
    + "<tr><td>Manfaat bersih tahunan</td><td>"+rp(r.annualNet)+"</td></tr>"
    + "<tr><td>Payback period</td><td>"+(r.payback===null?"Tidak tercapai":nf(r.payback,2)+" tahun")+"</td></tr>"
    + "<tr><td>Break even volume</td><td>"+(r.bep===null?"Tidak tercapai":nf(r.bep,0)+" unit per tahun")+"</td></tr>"
    + "</tbody></table>"
    + "<h2>7. Diagnostik Otomatis</h2><ul>"+ins+"</ul>"
    + (notes ? "<h2>8. Catatan Mahasiswa</h2>"+notes : "")
    + "<h2>"+(notes?"9":"8")+". Keterbatasan</h2><ul>"
    + "<li>Model satu produk dan satu server per stasiun.</li>"
    + "<li>Operator tidak dimodelkan secara individual.</li>"
    + "<li>Investasi tidak diamortisasi ke biaya per unit.</li>"
    + "<li>Data sintetis untuk pembelajaran.</li></ul>"
    + "<h2>"+(notes?"10":"9")+". Kesimpulan</h2><p>Kerangka laporan ini wajib dilengkapi analisis mahasiswa.</p>"
    + "<div class='small' style='text-align:center;margin-top:40px;padding-top:16px;border-top:1px solid #ddd'>"
    + "Laporan dibuat oleh Virtual Industrial Automation Laboratory · "+APP_CREDIT_LINE+"</div>"
    + "</body></html>";
  openPrintable(html);
}

function buildReportAll(){
  if(!state.runs.length){ showToast("Belum ada data untuk dilaporkan", "warn"); return; }
  const nRuns = state.runs.length;
  const sources = state.runs.reduce((acc,r)=>{ acc[r.source]=(acc[r.source]||0)+1; return acc; }, {});
  const sourceTxt = Object.keys(sources).map(k=>k+": "+sources[k]+" run").join(" · ");
  const runsRows = state.runs.slice().reverse().map((run,i)=>{
    const r = run.res;
    return "<tr><td>"+(i+1)+"</td><td>"+run.time+"</td><td>"+run.config+"</td><td>"+run.source+"</td>"
      + "<td>"+run.seed+"</td><td>"+run.reps+"</td>"
      + "<td>"+nf(r.throughput,1)+"</td><td>"+pct(r.qualityRate)+"</td><td>"+pct(r.oee)+"</td>"
      + "<td>"+rp(r.costPerGood)+"</td><td>"+nf(r.leadAvg,1)+"</td>"
      + "<td>"+(r.payback===null?"Tidak tercapai":nf(r.payback,2))+"</td>"
      + "<td>"+r.bottleneck+"</td></tr>";
  }).join("");

  const avg = (fn)=>{
    const vals = state.runs.map(fn).filter(v=>v!==null && v!==undefined && isFinite(v));
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  };
  const bestGood = state.runs.reduce((best,run)=>run.res.good>best.res.good?run:best);
  const bestOEE = state.runs.reduce((best,run)=>run.res.oee>best.res.oee?run:best);
  const bestCost = state.runs.reduce((best,run)=> (run.res.costPerGood&&(!best.res.costPerGood||run.res.costPerGood<best.res.costPerGood))?run:best);
  const bestThroughput = state.runs.reduce((best,run)=>run.res.throughput>best.res.throughput?run:best);

  let cmpSection = "";
  if(state.cmp && state.cmp.length){
    const cmpHtml = (rows)=> {
      let html = "<table><thead><tr><th>Indikator</th>"+state.cmp.map(r=>'<th>'+r.name+'</th>').join("")+"</tr></thead><tbody>";
      // Lewatkan r utuh, bukan r.res
      rows.forEach(([lab,fn])=>{ html += "<tr><td>"+lab+"</td>"+state.cmp.map(r=>'<td>'+fn(r)+'</td>').join("")+"</tr>"; });
      return html+"</tbody></table>";
    };
    const paramRows = [
      ["Siklus proses (detik)", r=>r.params.cycleProcess],
      ["Siklus inspeksi (detik)", r=>r.params.cycleInspect],
      ["Operator", r=>r.params.operators],
      ["Probabilitas cacat", r=>r.params.defectProb],
      ["Akurasi inspeksi", r=>r.params.inspectionAccuracy],
      ["MTBF (menit)", r=>r.params.mtbf],
      ["Investasi awal (Rupiah)", r=>nf(r.params.initialInvestment,0)]
    ];
    const kpiRows = [
      // Tambahkan pemanggilan .res pada setiap baris metrik
      ["Throughput (unit per jam)", r=>nf(r.res.throughput,1)],
      ["Quality rate", r=>pct(r.res.qualityRate)],
      ["OEE", r=>pct(r.res.oee)],
      ["Lead time (menit)", r=>nf(r.res.leadAvg,1)],
      ["Cost per Good (Rupiah)", r=>rp(r.res.costPerGood)],
      ["Payback", r=>r.res.payback===null?"Tidak tercapai":nf(r.res.payback,2)+" tahun"],
      ["Bottleneck", r=>r.res.bottleneck]
    ];
    cmpSection = "<h2>3. Perbandingan Skenario Terakhir</h2>"
      + "<h3>Parameter Kunci per Skenario</h3>"+cmpHtml(paramRows)
      + "<h3>KPI per Skenario</h3>"+cmpHtml(kpiRows);
  }

  const html = "<!DOCTYPE html><html lang='id'><head><meta charset='utf-8'>"
    + "<meta name='author' content='Vergissmeinnicht. (Tyasto Prima Ahmadi)'>"
    + "<title>Laporan Rekapitulasi | Vergissmeinnicht. (Tyasto Prima Ahmadi)</title>"+REPORT_STYLE+"</head><body>"
    + CREDIT_BLOCK_HTML
    + "<h1>Laporan Rekapitulasi Praktikum Otomasi Industri</h1>"
    + "<div class='meta'>Virtual Industrial Automation Laboratory · "+new Date().toLocaleString("id-ID")
    + "<br>Total "+nRuns+" run tercatat. Distribusi sumber: "+sourceTxt
    + "<br>Data sintetis, bukan data perusahaan nyata.</div>"
    + "<h2>1. Identitas dan Tujuan</h2>"
    + "<p>Mata kuliah Otomasi Industri, S1 Teknik Industri. Laporan ini merangkum seluruh run simulasi dan perbandingan yang tercatat pada sesi ini sehingga dapat digunakan sebagai dasar analisis menyeluruh.</p>"
    + "<h2>2. Ringkasan Sesi</h2>"
    + "<table><thead><tr><th>Metrik</th><th>Nilai</th></tr></thead><tbody>"
    + "<tr><td>Total run tercatat</td><td>"+nRuns+"</td></tr>"
    + "<tr><td>Rerata throughput (unit per jam)</td><td>"+nf(avg(r=>r.res.throughput),2)+"</td></tr>"
    + "<tr><td>Rerata quality rate</td><td>"+pct(avg(r=>r.res.qualityRate))+"</td></tr>"
    + "<tr><td>Rerata OEE</td><td>"+pct(avg(r=>r.res.oee))+"</td></tr>"
    + "<tr><td>Rerata cost per good (Rupiah)</td><td>"+rp(avg(r=>r.res.costPerGood))+"</td></tr>"
    + "<tr><td>Rerata lead time (menit)</td><td>"+nf(avg(r=>r.res.leadAvg),2)+"</td></tr>"
    + "<tr><td>Unit baik terbanyak</td><td>"+bestGood.config+" ("+nf(bestGood.res.good,0)+" unit)</td></tr>"
    + "<tr><td>OEE tertinggi</td><td>"+bestOEE.config+" ("+pct(bestOEE.res.oee)+")</td></tr>"
    + "<tr><td>Cost per good terendah</td><td>"+bestCost.config+" ("+rp(bestCost.res.costPerGood)+")</td></tr>"
    + "<tr><td>Throughput tertinggi</td><td>"+bestThroughput.config+" ("+nf(bestThroughput.res.throughput,1)+" unit per jam)</td></tr>"
    + "</tbody></table>"
    + (cmpSection || "")
    + "<h2>"+(cmpSection?"4":"3")+". Daftar Seluruh Run</h2>"
    + "<table><thead><tr><th>No</th><th>Waktu</th><th>Konfigurasi</th><th>Sumber</th>"
    + "<th>Seed</th><th>Rep</th><th>Throughput</th><th>Quality</th><th>OEE</th>"
    + "<th>Cost per Good</th><th>Lead Time</th><th>Payback</th><th>Bottleneck</th></tr></thead><tbody>"
    + runsRows + "</tbody></table>"
    + "<h2>"+(cmpSection?"5":"4")+". Model dan Asumsi</h2><ul>"
    + "<li>Simulasi kejadian diskret dengan antrean FIFO, buffer terbatas, dan mekanisme blocking.</li>"
    + "<li>Waktu proses Erlang. Kerusakan dan perbaikan eksponensial (MTBF dan MTTR).</li>"
    + "<li>Kekurangan operator memperlambat seluruh stasiun yang membutuhkan operator secara proporsional.</li>"
    + "<li>Investasi modal tidak dimasukkan ke biaya operasi periode, hanya dipakai untuk payback dan BEP.</li>"
    + "<li>Setiap hasil perbandingan otomatis masuk ke daftar run dengan sumber Perbandingan.</li></ul>"
    + "<h2>"+(cmpSection?"6":"5")+". Keterbatasan</h2><ul>"
    + "<li>Satu jenis produk dan satu jalur tanpa perakitan multi komponen.</li>"
    + "<li>Operator tidak dimodelkan secara individual.</li>"
    + "<li>Payback dihitung per alternatif terhadap nol, bukan inkremental terhadap baseline.</li>"
    + "<li>Data sintetis dan tidak merepresentasikan perusahaan nyata.</li></ul>"
    + "<h2>"+(cmpSection?"7":"6")+". Kesimpulan dan Rekomendasi</h2>"
    + "<p>Ringkasan ini bersifat kuantitatif dan wajib dilengkapi interpretasi sebab akibat oleh mahasiswa. Gunakan tab Diagnostik dan Modul Eksperimen sebagai panduan analisis.</p>"
    + "<div class='small' style='text-align:center;margin-top:40px;padding-top:16px;border-top:1px solid #ddd'>"
    + "Laporan dibuat oleh Virtual Industrial Automation Laboratory · "+APP_CREDIT_LINE+"</div>"
    + "</body></html>";
  openPrintable(html);
}

/* ==================== PANDUAN ==================== */
function renderGuide(){
  const g = document.getElementById("guideBox"); if(!g) return;
  const formulas = [
    { title:"Produktivitas Tenaga Kerja", num:"Output baik", den:"Operator kali jam operasi", note:"Satuan unit baik per jam tenaga kerja" },
    { title:"Quality Rate", num:"Unit baik", den:"Unit diperiksa", note:"Rasio 0 sampai 1" },
    { title:"Defect Rate", num:"Scrap ditambah cacat lolos", den:"Unit diperiksa", note:"Komplemen quality rate" },
    { title:"Availability", num:"Operating time", den:"Planned production time", note:"Operating time = rencana dikurangi setup dikurangi downtime" },
    { title:"Performance", num:"Total count kali ideal cycle time", den:"Operating time", note:"Diukur pada stasiun bottleneck" },
    { title:"Quality (OEE)", num:"Good count", den:"Total count", note:"Pada tingkat lini" },
    { title:"Cost per Good Unit", num:"Total biaya operasi periode", den:"Jumlah unit baik", note:"Investasi modal tidak termasuk" },
    { title:"Payback Period", num:"Investasi total", den:"Manfaat bersih tahunan", note:"Bila manfaat bersih nol atau negatif, hasil dinyatakan tidak tercapai" },
    { title:"Break Even Volume", num:"Biaya tetap tahunan", den:"Harga jual dikurangi biaya variabel per unit", note:"Satuan unit per tahun" }
  ];
  const fracCards = formulas.map(f=>
    '<div class="formula-card">'
    + '<div class="formula-title">'+f.title+'</div>'
    + '<div class="formula-display">'
    + '<span class="frac"><span class="num">'+f.num+'</span><span class="den">'+f.den+'</span></span>'
    + '</div>'
    + '<div class="formula-note">'+f.note+'</div>'
    + '</div>'
  ).join("");
  g.innerHTML = "<h2>Tentang Aplikasi</h2>"
    + "<div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;margin-bottom:16px'>"
    + "<div style='font-size:11.5px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;font-weight:700'>Laboratorium Virtual Otomasi Industri</div>"
    + "<div style='font-size:20px;font-weight:800;color:#0f172a;margin:6px 0'>Vergissmeinnicht.</div>"
    + "<div style='font-size:13.5px;color:#475569'>Tyasto Prima Ahmadi<br>Teknik Industri, Universitas Indonesia Mandiri</div>"
    + "</div>"
    + "<h2>Cara Menjalankan Aplikasi</h2><ol>"
    + "<li>Pilih preset (Manual, Parsial, Penuh) atau ubah parameter di panel Pengaturan Eksperimen.</li>"
    + "<li>Tekan Terapkan Parameter, lalu Jalankan Simulasi. Simulasi menghitung instan. Animasi hanya memutar ulang hasil.</li>"
    + "<li>Amati KPI, visualisasi data yang diperbesar, dan tab Diagnostik.</li>"
    + "<li>Buka tab Perbandingan Skenario. Setiap skenario memiliki parameter eksplisit yang dapat dilihat dan diubah. Tambah atau hapus skenario sesuai kebutuhan (2 hingga 6 skenario).</li>"
    + "<li>Hasil Laboratorium dan Perbandingan otomatis masuk ke tab Data dan Laporan.</li>"
    + "<li><b>Laporan Simulasi (.pdf)</b> merangkum satu run terakhir atau rekapitulasi keseluruhan simulasi. <b>Ekspor Data (.csv)</b> menyediakan tiga jenis ekspor: ringkasan semua simulasi, deret waktu simulasi tunggal, dan konfigurasi parameter aktif.</li></ol>"
    + "<h2>Rumus Utama</h2><div class='formula-grid'>"+fracCards+"</div>"
    + "<h3>OEE dan Throughput</h3><div class='formula-grid'>"
    + "<div class='formula-card'><div class='formula-title'>OEE</div>"
    + "<div class='formula-display'><span>Availability</span><span class='formula-op'>kali</span><span>Performance</span><span class='formula-op'>kali</span><span>Quality</span></div>"
    + "<div class='formula-note'>Rasio 0 sampai 1</div></div>"
    + "<div class='formula-card'><div class='formula-title'>Throughput</div>"
    + "<div class='formula-display'><span class='frac'><span class='num'>Unit baik</span><span class='den'>Jam operasi</span></span></div>"
    + "<div class='formula-note'>Satuan unit baik per jam</div></div>"
    + "</div>"
    + "<h2>Istilah Tombol dan Menu</h2>"
    + "<ul>"
    + "<li><b>Laporan Simulasi (.pdf):</b> membuka pilihan untuk mencetak dokumen PDF yang merangkum hasil simulasi terakhir atau rekapitulasi seluruh run secara dinamis.</li>"
    + "<li><b>Ekspor Data (.csv):</b> membuka pilihan untuk mengekspor Ringkasan Semua Simulasi, Deret Waktu Simulasi Tunggal, atau Konfigurasi Parameter Aktif. Berkas CSV menyertakan kredit pengembang pada baris pertama.</li>"
    + "<li><b>Bersihkan Perbandingan:</b> menghapus hasil perbandingan pada tab Perbandingan Skenario tanpa mempengaruhi data run di tab Data dan Laporan.</li>"
    + "<li><b>Bersihkan Semua:</b> mengosongkan seluruh tampilan Laboratorium termasuk data run, perbandingan, dan mengembalikan parameter ke preset Manual.</li>"
    + "</ul>"
    + "<h2>Cara Kerja Perbandingan Skenario</h2>"
    + "<p>Setiap skenario memakai satu set parameter lengkap. Sumber parameter dapat dipilih dari dropdown: Preset Manual, Preset Parsial, Preset Penuh, Parameter Lab saat ini, atau Kustom. Bila Anda mengubah satu nilai saja pada panel parameter, sumber otomatis berubah menjadi Kustom. Anda dapat menambah hingga 6 skenario dan menghapus skenario (minimal 2). Skor Daya Saing dihitung otomatis dari enam kriteria hasil simulasi yang dinormalisasi min max, lalu digabung dengan bobot prioritas manajemen. Detail perhitungan ditampilkan per kriteria.</p>"
    + "<h2>Asumsi Model</h2><ul>"
    + "<li>Lima stasiun serial, satu server per stasiun, buffer FIFO terbatas, blocking bila buffer hilir penuh.</li>"
    + "<li>Kedatangan Erlang dengan CV. Pesanan saat buffer penuh dinyatakan hilang.</li>"
    + "<li>Status cacat ditetapkan saat masuk. Keputusan inspeksi di stasiun 4.</li>"
    + "<li>Rework kembali ke stasiun 2 dengan tambahan waktu, lalu langsung ke pengemasan.</li>"
    + "<li>Kerusakan dan perbaikan eksponensial dengan MTBF dan MTTR.</li>"
    + "<li>Setup awal tiap shift. Lini berhenti selama setup.</li>"
    + "<li>Kekurangan operator memperlambat siklus secara proporsional, maksimum 8 kali.</li>"
    + "<li>Investasi modal terpisah dari biaya operasi periode.</li></ul>"
    + "<h2>Pengujian yang Telah Dilakukan</h2><ul>"
    + "<li>Neraca unit: inspected sama dengan good ditambah escaped ditambah scrap.</li>"
    + "<li>Reproduksibilitas: seed dan parameter identik menghasilkan KPI identik.</li>"
    + "<li>Nilai nol menghasilkan T/A dan tidak menampilkan NaN atau Infinity.</li>"
    + "<li>Payback dengan manfaat bersih nol atau negatif ditampilkan sebagai Tidak tercapai.</li>"
    + "<li>Performance di atas 100 persen memicu peringatan eksplisit.</li>"
    + "<li>Reset dan pengulangan bekerja tanpa akumulasi state.</li>"
    + "<li>Ekspor CSV dengan BOM UTF-8 dan pemisah titik koma; ringkasan, deret waktu, dan parameter semuanya berfungsi.</li>"
    + "<li>Replikasi stabil untuk 1 sampai 30 replikasi.</li>"
    + "<li>Laporan Hasil Simulasi dan Laporan Rekapitulasi berfungsi melalui satu menu.</li>"
    + "<li>Konfirmasi hapus data menggunakan modal kustom, bukan dialog peramban.</li>"
    + "<li>Bersihkan Perbandingan berfungsi tanpa mempengaruhi data run.</li></ul>";
}

/* ==================== TABS ==================== */
function switchTab(name){
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active", b.dataset.tab===name));
  document.querySelectorAll(".tab").forEach(s=>s.classList.toggle("active", s.id==="tab-"+name));
  if(name==="exp") refreshDynamicQuestions();
  if(name==="guide") renderGuide();
  if(name==="diag" && state.lastResult) renderInsights(state.lastResult);
}

/* ==================== INIT ==================== */
function init(){
  buildLine();
  applyPreset("manual");
  renderKPIs(null);
  renderExperiments();
  renderScenarioSlots();
  renderWeights();
  renderRunTable();
  renderGuide();

  document.querySelectorAll("nav button").forEach(b=>{
    b.addEventListener("click", ()=>switchTab(b.dataset.tab));
  });
  document.querySelectorAll("[data-preset]").forEach(b=>{
    b.addEventListener("click", ()=>{
      applyPreset(b.dataset.preset);
      showToast("Preset <b>" + PRESETS[b.dataset.preset]._name + "</b> diterapkan", "info");
    });
  });
  const btnApply = document.getElementById("btnApply");
  if(btnApply) btnApply.addEventListener("click", ()=>{
    try {
      const cfg = buildConfig(state.params);
      const chip = document.getElementById("cfgChip");
      if(chip) chip.innerHTML = 'Skenario: <b>'+cfgName(state.params)+'</b>';
      const lab = document.getElementById("progLabel");
      if(lab) lab.textContent = "Parameter diterapkan. Tekan Jalankan Simulasi.";
      showToast("Parameter diterapkan. Total "+nf(cfg.totalMinutes,0)+" menit simulasi.", "success");
    } catch(err){
      console.error(err);
      showToast("<b>Error menerapkan parameter</b>" + err.message, "error", 6000);
    }
  });
  const btnResetParam = document.getElementById("btnResetParam");
  if(btnResetParam) btnResetParam.addEventListener("click", ()=>{
    applyPreset(state.preset==="custom"?"manual":state.preset);
    showToast("Parameter direset ke preset", "info");
  });

  const btnRun = document.getElementById("btnRun");
  if(btnRun) btnRun.addEventListener("click", ()=>{ doRun(true); refreshDynamicQuestions(); });
  const btnPause = document.getElementById("btnPause");
  if(btnPause) btnPause.addEventListener("click", ()=>{
    const P = state.play;
    if(!P.playing) return;
    P.paused = !P.paused;
    btnPause.textContent = P.paused ? "Lanjutkan" : "Jeda";
  });
  const btnStop = document.getElementById("btnStop");
  if(btnStop) btnStop.addEventListener("click", ()=>{ stopPlayback(); finishPlayback(); showToast("Animasi dihentikan", "info"); });

  const btnReset = document.getElementById("btnReset");
  if(btnReset) btnReset.addEventListener("click", ()=>{
    stopPlayback();
    state.lastResult = null; state.lastCfg = null;
    const bar = document.getElementById("progBar"); if(bar) bar.style.width="0%";
    const lab = document.getElementById("progLabel"); if(lab) lab.textContent="Siap. Tekan Jalankan Simulasi.";
    ["binGood","binEsc","binScrap","binInsp"].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent="0"; });
    renderKPIs(null);
    const ins = document.getElementById("insights"); if(ins) ins.innerHTML='<div class="small">Belum ada hasil.</div>';
    updateLine([{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null}], null);
    ["chCum","chRate","chStn","chPie"].forEach(id=>{
      const cv = document.getElementById(id); if(!cv) return;
      const ctx = cv.getContext("2d"); ctx.clearRect(0,0,cv.width,cv.height);
    });
    showToast("Hasil simulasi direset", "info");
  });

  const btnClearAll = document.getElementById("btnClearAll");
  if(btnClearAll) btnClearAll.addEventListener("click", ()=>{
    showConfirm("Bersihkan Semua", "Seluruh tampilan Laboratorium akan dikosongkan: hasil simulasi, data run, dan perbandingan. Pengaturan parameter akan kembali ke preset Manual. Lanjutkan?", ()=>{
      stopPlayback();
      state.lastResult = null; state.lastCfg = null;
      state.runs = [];
      state.params = Object.assign({}, PRESETS.manual);
      state.preset = "manual";
      state.cmp = null;
      renderParamForm();
      const chip = document.getElementById("cfgChip");
      if(chip) chip.innerHTML = 'Skenario: <b>Manual</b>';
      const bar = document.getElementById("progBar"); if(bar) bar.style.width="0%";
      const lab = document.getElementById("progLabel"); if(lab) lab.textContent="Siap. Tekan Jalankan Simulasi.";
      ["binGood","binEsc","binScrap","binInsp"].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent="0"; });
      renderKPIs(null);
      const ins = document.getElementById("insights"); if(ins) ins.innerHTML='<div class="small">Belum ada hasil.</div>';
      updateLine([{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null}], null);
      ["chCum","chRate","chStn","chPie"].forEach(id=>{
        const cv = document.getElementById(id); if(!cv) return;
        const ctx = cv.getContext("2d"); ctx.clearRect(0,0,cv.width,cv.height);
      });
      renderRunTable();
      const wrap = document.getElementById("cmpWrap"); if(wrap) wrap.style.display="none";
      const st = document.getElementById("cmpStatus"); if(st) st.textContent = "Belum dijalankan";
      showToast("Semua tampilan Laboratorium dibersihkan", "success");
    });
  });

  const btnCompare = document.getElementById("btnCompare");
  if(btnCompare) btnCompare.addEventListener("click", runCompare);
  const btnClearCompare = document.getElementById("btnClearCompare");
  if(btnClearCompare) btnClearCompare.addEventListener("click", clearCompare);

  const btnExport = document.getElementById("btnExport");
  if(btnExport) btnExport.addEventListener("click", exportDataChooser);
  const btnReport = document.getElementById("btnReport");
  if(btnReport) btnReport.addEventListener("click", exportPdfChooser);
  const btnClear = document.getElementById("btnClear");
  if(btnClear) btnClear.addEventListener("click", ()=>{
    showConfirm("Hapus Data", "Seluruh data run pada sesi ini akan dihapus permanen. Lanjutkan?", ()=>{
      state.runs = []; renderRunTable();
      showToast("Data run dihapus", "info");
    });
  });

  let rt=null;
  window.addEventListener("resize", ()=>{
    clearTimeout(rt);
    rt = setTimeout(()=>{
      if(state.lastResult) drawMainCharts(state.lastResult);
      if(state.cmp){ renderCmpTable(); recalcScores(); }
    }, 200);
  });

  updateLine([{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null},{q:0,busy:0,down:null}], null);
  console.log("[VIA] Init complete. Author: " + APP_CREDIT_LINE);
}

document.addEventListener("DOMContentLoaded", ()=>{
  try { init(); }
  catch(err){
    console.error("[VIA] Init error:", err);
    showToast("<b>Error inisialisasi</b>" + (err.message || String(err)), "error", 8000);
  }
});
