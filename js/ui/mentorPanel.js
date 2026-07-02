/* ═══════════════════════════════════════════
   MENTOR PERFORMANCE PANEL
   Bayesian mentor table + department stats panel + mentor detail modal.
   Driven by this tab's OWN month filter (state.monthFilters.mentors)
   and the existing department filter (state.deptFilter).
═══════════════════════════════════════════ */
import {$,statusBadge,getStatusColor,deptStyle} from '../utils/helpers.js';
import {state,nextRequestId,isLatestRequest} from '../state/appState.js';
import {getCollegeRowsForSelection} from '../data/collegeDataService.js';
import {
  computeDashboardData,getFilteredMentors,getMentorDeptQs,getMentorDeptRating,
  getMentorDeptResponses,calcDeptBayesian
} from '../calculations/dashboardCalculations.js';
import {
  calcMentorKPIs,mmClassify,mmClassLabel,mmClassStyle,mmKpiBadge,mmKpiBarColor,
  mmInterpretStrength,mmInterpretConcern,mmInterpretTEI,mmInterpretSSI,mmBuildRec,mmVerdictConfig
} from '../calculations/mentorKpiEngine.js';
import {MM_QUESTIONS,Q_LABELS,Q_DEFS,Q_ANALYSIS_TEXT} from '../config/constants.js';
import {renderMonthFilterChips,renderDeptFilterChips} from './filters.js';

export function initMentorFilters(onReload){
  renderMonthFilterChips($('mentorMonthFilterRow'),'mentors',()=>reloadMentors(onReload));
}

export async function reloadMentors(onDone){
  const college=state.currentCollege;
  if(!college)return;
  const reqId=nextRequestId('mentors');
  state.loading.mentors=true;
  try{
    const rows=await getCollegeRowsForSelection(state.monthFilters.mentors,college);
    if(!isLatestRequest('mentors',reqId))return;
    const computed=computeDashboardData(rows);
    state.data.mentors={rows,...computed};
    // Reset dept filter if it no longer exists in the newly loaded month's data.
    if(state.deptFilter!=='all'&&!computed.DEPT_LIST.includes(state.deptFilter)){
      state.deptFilter='all';
    }
    rebuildDeptFilterChips();
    renderMentorTable();
    renderDeptStatsPanel(state.deptFilter);
  }catch(err){
    console.error('Mentor Performance load failed:',err);
    if(isLatestRequest('mentors',reqId)){
      $('mentorTableBody').innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--ink3)">Failed to load data for this month</td></tr>';
    }
  }finally{
    if(isLatestRequest('mentors',reqId))state.loading.mentors=false;
    if(onDone)onDone();
  }
}

function rebuildDeptFilterChips(){
  const bundle=state.data.mentors;
  const fr=$('deptFilterRow');
  if(!bundle||!fr)return;
  renderDeptFilterChips(fr,bundle.DEPT_LIST,val=>{
    renderMentorTable();
    renderDeptStatsPanel(val);
  });
}

/* ═══════════════ DEPT STATS PANEL ═══════════════ */
export function renderDeptStatsPanel(dept){
  const bundle=state.data.mentors;
  const globalBar=$('mentorGlobalSummaryBar');const deptWrap=$('deptStatsPanelWrap');
  if(!bundle)return;
  const {MENTORS,TABLE_DATA,DEPT_STUDENT_COUNT}=bundle;

  if(!dept||dept==='all'){
    globalBar.style.display='block';deptWrap.style.display='none';deptWrap.innerHTML='';
    const thAvg=$('thAvgRating');const thResp=$('thTotalResponses');const fn=$('mentorTableFootnote');
    if(thAvg)thAvg.textContent='Average Rating';if(thResp)thResp.textContent='Total Responses';if(fn)fn.textContent='';
    return;
  }
  globalBar.style.display='none';deptWrap.style.display='block';
  const thAvg=$('thAvgRating');const thResp=$('thTotalResponses');const fn=$('mentorTableFootnote');
  if(thAvg)thAvg.textContent=`Avg Rating (${dept})`;if(thResp)thResp.textContent=`Responses (${dept})`;if(fn)fn.textContent=`* Rating and Responses shown are specific to "${dept}" only.`;

  const deptMentors=MENTORS.filter(m=>m.depts.some(d=>d===dept));
  if(!deptMentors.length){
    deptWrap.innerHTML=`<div class="dept-stats-panel"><div class="dept-stats-header"><div><div class="dept-stats-title">${dept}</div><div class="dept-stats-subtitle">No mentor data available</div></div></div></div>`;
    return;
  }
  const deptEntries=TABLE_DATA.filter(r=>r.dept===dept);const deptRatings=deptEntries.map(r=>r.rating);const deptAvgRating=deptRatings.length>0?deptRatings.reduce((a,b)=>a+b,0)/deptRatings.length:0;const deptSubjects=new Set(deptEntries.map(r=>r.subject));const deptMentorCount=deptMentors.length;const deptStudentResponses=DEPT_STUDENT_COUNT[dept]||0;
  const sortedByDeptRating=[...deptMentors].map(m=>({...m,_deptRating:getMentorDeptRating(m,dept),_deptResponses:getMentorDeptResponses(m,dept)})).sort((a,b)=>b._deptRating-a._deptRating);const topMentor=sortedByDeptRating[0];
  function barColor(r){if(r>=4.3)return'#10b981';if(r>=4.0)return'#c48a00';if(r>=3.5)return'#f59e0b';return'#ef4444';}
  const mentorBarsHTML=sortedByDeptRating.map(m=>{const w=Math.round((m._deptRating/5)*100);const bc=barColor(m._deptRating);return`<div class="dept-bar-item"><div class="dept-bar-name" title="${m.name}">${m.name}</div><div class="dept-bar-outer"><div class="dept-bar-inner" style="width:0%;background:${bc};" data-w="${w}"></div></div><div class="dept-bar-score" style="color:${bc};">${m._deptRating.toFixed(2)}</div><div class="dept-bar-badge">${statusBadge(m._deptRating)}</div></div>`;}).join('');
  const deptQTotals=[{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0}];deptMentors.forEach(m=>{const dqs=m.deptQs[dept]||[{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0},{y:0,n:0}];dqs.forEach((q,i)=>{deptQTotals[i].y+=q.y;deptQTotals[i].n+=q.n;});});
  const qTableRows=MM_QUESTIONS.map((q,i)=>{const d=deptQTotals[i];const tot=d.y+d.n;const yp=tot>0?Math.round(d.y/tot*100):0;const color=yp>=65?'#065f46':yp>=40?'#78350f':'#7f1d1d';return`<tr><td style="font-weight:500;color:var(--ink2);">${Q_LABELS[i]}</td><td style="color:#065f46;font-weight:600;">${d.y}</td><td style="color:#7f1d1d;font-weight:600;">${d.n}</td><td style="font-weight:700;color:${color};">${tot>0?yp+'%':'—'}</td><td style="min-width:120px;"><div class="dept-q-bar-wrap"><div class="dept-q-bar-outer"><div class="dept-q-bar-yes" style="width:0%;" data-w="${yp}"></div></div><span style="font-size:10px;color:var(--ink3);min-width:28px;">${yp}%</span></div></td></tr>`;}).join('');
  deptWrap.innerHTML=`
  <div class="dept-stats-panel">
    <div class="dept-stats-header">
      <div><div class="dept-stats-title">${dept}</div><div class="dept-stats-subtitle">${deptMentorCount} mentor${deptMentorCount!==1?'s':''} · ${deptSubjects.size} subject${deptSubjects.size!==1?'s':''} · ${deptStudentResponses} students responded</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><span style="display:inline-flex;align-items:center;gap:5px;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(245,200,66,0.2);border:1px solid rgba(245,200,66,0.5);color:#fde9a0;">Dept Filter Active</span></div>
    </div>
    <div class="dept-stats-body">
      <div class="dept-kpi-row">
        <div class="dept-kpi-card" style="border-top-color:var(--gold-mid);"><div class="dept-kpi-label">Dept Avg Rating</div><div class="dept-kpi-val">${deptAvgRating.toFixed(2)}</div><div class="dept-kpi-sub">dept responses only</div></div>
        <div class="dept-kpi-card" style="border-top-color:var(--gold-mid);"><div class="dept-kpi-label">Dept Responses</div><div class="dept-kpi-val" style="color:var(--gold-dark);">${deptStudentResponses}</div><div class="dept-kpi-sub">students responded</div></div>
        <div class="dept-kpi-card" style="border-top-color:#c48a00;"><div class="dept-kpi-label">Mentors</div><div class="dept-kpi-val">${deptMentorCount}</div><div class="dept-kpi-sub">${deptSubjects.size} subjects</div></div>
        <div class="dept-kpi-card" style="border-top-color:#f5c842;"><div class="dept-kpi-label">Top in Dept</div><div class="dept-kpi-val" style="color:var(--gold-dark);font-size:20px;">${topMentor.name.length>14?topMentor.name.slice(0,13)+'…':topMentor.name}</div><div class="dept-kpi-sub">${topMentor._deptRating.toFixed(2)} dept avg</div><div style="margin-top:5px;display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:20px;background:var(--gold-light);border:1px solid var(--accent-md);font-size:10px;font-weight:600;color:var(--gold-dark);">Bayesian: ${calcDeptBayesian(MENTORS,topMentor,dept).toFixed(7)}</div></div>
      </div>
      <div>
        <div class="dept-mentor-bar-title">Qualitative Feedback Breakdown — ${dept} Only</div>
        <div style="overflow-x:auto;"><table class="dept-q-table"><thead><tr><th>Question</th><th>Yes</th><th>No</th><th>Yes %</th><th style="min-width:160px;">Trend</th></tr></thead><tbody>${qTableRows}</tbody></table></div>
        <div style="font-size:10.5px;color:var(--ink4);margin-top:6px;">* Counts from feedback rows where department = <strong>${dept}</strong> only.</div>
      </div>
      <div class="dept-mentor-bars">
        <div class="dept-mentor-bar-title">All Mentors in ${dept} — Sorted by Dept-Specific Rating</div>
        <div id="deptMentorBarsInner">${mentorBarsHTML}</div>
        <div style="font-size:10.5px;color:var(--ink4);margin-top:6px;">* Rating shown is each mentor's average from <strong>${dept}</strong> student feedback only.</div>
      </div>
    </div>
  </div>`;
  setTimeout(()=>{document.querySelectorAll('.dept-bar-inner').forEach(bar=>{bar.style.transition='width 0.9s cubic-bezier(.22,1,.36,1)';bar.style.width=bar.getAttribute('data-w')+'%';});document.querySelectorAll('.dept-q-bar-yes').forEach(bar=>{bar.style.transition='width 0.8s cubic-bezier(.22,1,.36,1)';bar.style.width=bar.getAttribute('data-w')+'%';});},80);
}

/* ═══════════════ MENTOR TABLE ═══════════════ */
export function renderMentorTable(){
  const bundle=state.data.mentors;
  if(!bundle)return;
  const {MENTORS}=bundle;
  const list=getFilteredMentors(MENTORS,state.deptFilter);const isDeptActive=state.deptFilter&&state.deptFilter!=='all';
  let displayMean,displayTotal;
  if(isDeptActive){const deptMs=MENTORS.filter(m=>m.depts.some(d=>d===state.deptFilter));let tw=0,tr=0;deptMs.forEach(m=>{const rs=m.deptRatings[state.deptFilter]||[];tw+=rs.reduce((a,b)=>a+b,0);tr+=rs.length;});displayMean=tr>0?tw/tr:0;displayTotal=tr;}
  else{const sumResponses=MENTORS.reduce((s,m)=>s+m.responses,0);const sumAvgXResp=MENTORS.reduce((s,m)=>s+m.avgXResponses,0);displayMean=sumResponses>0?sumAvgXResp/sumResponses:0;displayTotal=sumResponses;}
  $('mtSumGlobalMean').textContent=displayMean>0?displayMean.toFixed(7):'—';$('mtSumTotalResp').textContent=displayTotal||'—';$('mentorTableCountBadge').textContent=list.length>0?`${list.length} mentors`:'No data';
  if(!list.length){$('mentorTableBody').innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--ink3)">No mentors found</td></tr>';return;}
  const deptLabel=isDeptActive?state.deptFilter:null;const rankColors={1:'#f5c842',2:'#e0e0e0',3:'#f0c498'};
  $('mentorTableBody').innerHTML=list.map(m=>{
    const displayRank=m.filteredRank;const rankBg=rankColors[displayRank]||'transparent';const rankColor=displayRank<=3?'#3d2200':'var(--ink3)';const rankBorder=displayRank<=3?'none':'1px solid var(--border2)';
    const displayDept=deptLabel||m.depts.join(', ');const s=deptStyle(deptLabel||m.depts[0]||'');
    const displayRating=isDeptActive?getMentorDeptRating(m,state.deptFilter):m.rating;const displayResponses=isDeptActive?getMentorDeptResponses(m,state.deptFilter):m.responses;const ratingColor=isDeptActive?getStatusColor(displayRating):'var(--gold-dark)';
    return`<tr><td style="text-align:center;"><span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${rankBg};border:${rankBorder};font-size:11px;font-weight:700;color:${rankColor};">${displayRank}</span></td><td><button class="mentor-name-btn" data-mentor="${m.name.replace(/"/g,'&quot;')}" data-dept="${(deptLabel||'').replace(/"/g,'&quot;')}">${m.name}</button></td><td><span class="badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${displayDept}</span></td><td style="text-align:center;"><span style="font-family:var(--font-display);font-size:18px;color:${ratingColor};">${displayRating.toFixed(2)}</span><span style="font-size:11px;color:var(--ink4);">/5</span>${isDeptActive?`<div style="font-size:10px;color:var(--ink4);margin-top:1px;">(${state.deptFilter})</div>`:''}</td><td style="text-align:center;font-family:var(--font-display);font-size:16px;color:var(--ink2);">${displayResponses}${isDeptActive?`<div style="font-size:10px;color:var(--ink4);font-family:var(--font-body);">dept only</div>`:''}</td><td style="text-align:center;"><span style="font-family:var(--font-display);font-size:16px;color:var(--gold-dark);">${isDeptActive?calcDeptBayesian(MENTORS,m,state.deptFilter).toFixed(7):m.bayesianRating.toFixed(7)}</span>${isDeptActive?`<div style="font-size:10px;color:var(--ink4);font-family:var(--font-body);">dept bayesian</div>`:''}</td><td>${statusBadge(displayRating)}</td></tr>`;
  }).join('');
  document.querySelectorAll('.mentor-name-btn').forEach(btn=>{btn.addEventListener('click',function(){openMentorModal(this.getAttribute('data-mentor'),this.getAttribute('data-dept')||null);});});
}

/* ═══════════════ MENTOR MODAL ═══════════════ */
export function openMentorModal(mentorName,dept){
  const bundle=state.data.mentors;
  if(!bundle)return;
  const m=bundle.MENTORS.find(x=>x.name===mentorName);if(!m)return;
  const deptCtx=(dept&&dept!=='all'&&dept!=='')?dept:null;
  const activeQs=deptCtx?getMentorDeptQs(m,deptCtx):m.qs;const activeRating=deptCtx?getMentorDeptRating(m,deptCtx):m.rating;const activeResponses=deptCtx?getMentorDeptResponses(m,deptCtx):m.responses;
  $('mmName').textContent=m.name;$('mmSub').textContent=deptCtx?`${deptCtx} · ${activeResponses} responses in this dept · ${m.subjects} subject(s) total`:m.depts.join(', ')+' · '+m.responses+' responses (all depts) · '+m.subjects+' subject(s)';
  const banner=$('mmDeptScopeBanner');if(deptCtx){banner.style.display='flex';banner.innerHTML=`<span>Showing data for <strong>${deptCtx}</strong> only — ${activeResponses} responses, ${activeRating.toFixed(2)} avg rating in this dept. <em style="opacity:.7;">(Total across all depts: ${m.responses} responses.)</em></span>`;}else{banner.style.display='none';}
  const totalYes=activeQs.reduce((s,q)=>s+q.y,0);const totalAll=activeQs.reduce((s,q)=>s+q.y+q.n,0);const overallYesPct=totalAll>0?Math.round(totalYes/totalAll*100):0;
  $('mmStats').innerHTML=`<div class="mm-qs-card"><div class="mm-qs-label">${deptCtx?'Dept avg rating':'Avg rating'}</div><div class="mm-qs-val">${activeRating.toFixed(2)}</div><div class="mm-qs-sub">${deptCtx?`in ${deptCtx}`:'out of 5'}</div></div><div class="mm-qs-card"><div class="mm-qs-label">${deptCtx?'Dept responses':'Total responses'}</div><div class="mm-qs-val">${activeResponses}</div><div class="mm-qs-sub">${deptCtx?'in this dept':'feedback entries'}</div></div><div class="mm-qs-card"><div class="mm-qs-label">Overall yes rate${deptCtx?' (dept)':''}</div><div class="mm-qs-val" style="color:${overallYesPct>=70?'#065f46':overallYesPct>=50?'#c48a00':'#7f1d1d'};">${overallYesPct}%</div><div class="mm-qs-sub">across 5 questions</div></div>`;
  const sc=calcMentorKPIs(activeQs);const{pcts,strength,concern,tei,ssi}=sc;const si=mmInterpretStrength(strength);const ci=mmInterpretConcern(concern);const ti=mmInterpretTEI(tei);const ssii=mmInterpretSSI(ssi);
  const kpiDefs=[{label:'Strength score',val:Math.round(strength),sub:'out of 100',interp:si,barColor:mmKpiBarColor(si.level)},{label:'Concern score',val:Math.round(concern),sub:'out of 100',interp:ci,barColor:mmKpiBarColor(ci.level)},{label:'Teaching Effectiveness Index',val:Math.round(tei),sub:'teaching effectiveness',interp:ti,barColor:mmKpiBarColor(ti.level)},{label:'Student Satisfaction Index',val:Math.round(ssi),sub:'student satisfaction',interp:ssii,barColor:mmKpiBarColor(ssii.level)}];
  $('mmKpiGrid').innerHTML=kpiDefs.map(k=>`<div class="mm-kpi-card"><div class="mm-kpi-label">${k.label}</div><div class="mm-kpi-val">${k.val}</div><div class="mm-kpi-sub">${k.sub}</div>${mmKpiBadge(k.interp.level,k.interp.label)}<div class="mm-kpi-bar"><div class="mm-kpi-bar-fill" style="width:0%;background:${k.barColor};" data-w="${k.val}"></div></div></div>`).join('');
  const vc=mmVerdictConfig(strength,tei);$('mmVerdict').innerHTML=`<div class="mm-verdict" style="background:${vc.bg};color:${vc.color};border-color:${vc.border};"><span style="font-size:18px;flex-shrink:0;">${vc.icon}</span><span>${vc.text}</span></div><div style="font-size:11px;color:var(--ink3);margin-top:8px;">${si.desc}</div>`;
  $('mmQTitle').textContent=deptCtx?`Question-by-question breakdown — ${deptCtx} only`:'Question-by-question breakdown';
  $('mmQRows').innerHTML=MM_QUESTIONS.map((q,i)=>{const yp=pcts[i];const np=100-yp;const cls=mmClassify(yp);const cs=mmClassStyle(cls);const analysisText=Q_ANALYSIS_TEXT[i][cls];return`<div class="mm-q-row"><div><div class="mm-q-num">Q${i+1} · ${Q_DEFS[i].label}</div><div class="mm-q-label">${q}</div><span class="mm-q-class" style="background:${cs.bg};color:${cs.color};border:1px solid ${cs.border};">${mmClassLabel(cls)} · ${yp}% yes</span><div class="mm-q-analysis">${analysisText}</div></div><div><div class="mm-bar-row"><span class="mm-bar-lbl" style="color:#065f46;">Yes</span><div class="mm-bar-track"><div class="mm-bar-fill" style="width:${yp}%;background:#10b981;"></div></div><span class="mm-bar-pct">${activeQs[i].y} (${yp}%)</span></div><div class="mm-bar-row"><span class="mm-bar-lbl" style="color:#ef4444;">No</span><div class="mm-bar-track"><div class="mm-bar-fill" style="width:${np}%;background:#ef4444;"></div></div><span class="mm-bar-pct">${activeQs[i].n} (${np}%)</span></div><div style="font-size:10px;color:var(--ink4);margin-top:4px;">Weight: Strength ${Q_DEFS[i].w_strength}% · TEI ${Q_DEFS[i].w_tei}%</div></div></div>`;}).join('');
  const strengths=[],weaknesses=[],neutrals=[];pcts.forEach((p,i)=>{const cls=mmClassify(p);const item={label:Q_DEFS[i].label,pct:p,cls};if(cls==='hp'||cls==='mp')strengths.push(item);else if(cls==='mn'||cls==='hn')weaknesses.push(item);else neutrals.push(item);});
  function swItem(item){const cs=mmClassStyle(item.cls);return`<div class="mm-sw-item"><span style="color:var(--ink2);">${item.label}</span><span class="mm-mini-badge" style="background:${cs.bg};color:${cs.color};border:1px solid ${cs.border};">${item.pct}%</span></div>`;}
  $('mmSwGrid').innerHTML=`<div class="mm-sw-card" style="background:#d1fae5;border-color:#6ee7b7;"><div class="mm-sw-title" style="color:#065f46;">Strengths (above 70% yes)</div>${strengths.length?strengths.map(swItem).join(''):`<div style="font-size:12px;color:#065f46;opacity:0.7;">No standout strengths above 70% threshold.</div>`}</div><div class="mm-sw-card" style="background:#fee2e2;border-color:#fca5a5;"><div class="mm-sw-title" style="color:#7f1d1d;">Areas to improve (below 60%)</div>${weaknesses.length?weaknesses.map(swItem).join(''):`<div style="font-size:12px;color:#7f1d1d;opacity:0.7;">No critical weaknesses below 60% threshold.</div>`}</div>`;
  const neutralWrap=$('mmNeutralWrap');if(neutrals.length){neutralWrap.innerHTML=`<div style="padding:10px 14px;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;"><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink3);margin-bottom:8px;">Neutral areas (60–69%)</div><div class="mm-neutral-pills">${neutrals.map(n=>{const cs=mmClassStyle(n.cls);return`<span class="mm-neutral-pill" style="background:${cs.bg};color:${cs.color};border-color:${cs.border};">${n.label} <strong>${n.pct}%</strong></span>`;}).join('')}</div></div>`;}else{neutralWrap.innerHTML='';}
  $('mmRecText').innerHTML=mmBuildRec(strengths,weaknesses);
  $('mentorModalOverlay').classList.add('open');
  requestAnimationFrame(()=>{setTimeout(()=>{document.querySelectorAll('.mm-kpi-bar-fill').forEach(bar=>{bar.style.transition='width 0.9s cubic-bezier(.22,1,.36,1)';bar.style.width=bar.getAttribute('data-w')+'%';});},80);});
}
export function closeMentorModal(){$('mentorModalOverlay').classList.remove('open');}
