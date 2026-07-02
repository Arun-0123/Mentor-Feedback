/* ═══════════════════════════════════════════
   NPS ANALYSIS PANEL
   NPS hero cards, follow-up Yes/No questions, and the Student Voice
   AI summary of Q6/Q7 open-ended responses. Driven by this tab's OWN
   month filter (state.monthFilters.nps).
═══════════════════════════════════════════ */
import {$,getNpsLabel,animateCounter} from '../utils/helpers.js';
import {state,nextRequestId,isLatestRequest} from '../state/appState.js';
import {getCollegeRowsForSelection} from '../data/collegeDataService.js';
import {computeDashboardData} from '../calculations/dashboardCalculations.js';
import {NPS_FOLLOWUP_QUESTIONS,GROQ_API_KEY,GROQ_MODEL} from '../config/constants.js';
import {renderMonthFilterChips} from './filters.js';

let svRunning=false;

export function initNpsFilters(onReload){
  renderMonthFilterChips($('npsMonthFilterRow'),'nps',()=>reloadNps(onReload));
}

export async function reloadNps(onDone){
  const college=state.currentCollege;
  if(!college)return;
  const reqId=nextRequestId('nps');
  state.loading.nps=true;
  try{
    const rows=await getCollegeRowsForSelection(state.monthFilters.nps,college);
    if(!isLatestRequest('nps',reqId))return;
    const computed=computeDashboardData(rows);
    state.data.nps={rows,...computed};
    renderNPSPanel();
  }catch(err){
    console.error('NPS Analysis load failed:',err);
    if(isLatestRequest('nps',reqId)){
      $('npsIndexDesc').textContent='Failed to load data for this month';
    }
  }finally{
    if(isLatestRequest('nps',reqId))state.loading.nps=false;
    if(onDone)onDone();
  }
}

export function renderNPSPanel(){
  const bundle=state.data.nps;
  if(!bundle)return;
  const {promoters,passives,detractors,npsIndex,total}=bundle.NPS_DATA;
  const promoPct=total>0?Math.round(promoters/total*100):0;const passPct=total>0?Math.round(passives/total*100):0;const detrPct=total>0?Math.round(detractors/total*100):0;
  const idxEl=$('npsIndexBig');idxEl.style.color='#f5c842';
  if(npsIndex!==null)animateCounter(idxEl,npsIndex,1400,'');else idxEl.textContent='—';
  $('npsIndexDesc').textContent=total>0?getNpsLabel(npsIndex):'No NPS data available in sheet';
  $('npsTotalBig').textContent=total>0?total:'—';
  $('npsP_count').textContent=total>0?promoters:'—';$('npsN_count').textContent=total>0?passives:'—';$('npsD_count').textContent=total>0?detractors:'—';
  $('npsP_pct').textContent=total>0?`${promoPct}% of respondents`:'—';$('npsN_pct').textContent=total>0?`${passPct}% of respondents`:'—';$('npsD_pct').textContent=total>0?`${detrPct}% of respondents`:'—';
  renderNPSFollowupYesNo(bundle.rows);
  runStudentVoice(bundle.rows);
}

/* ═══════════════ YES/NO FOLLOWUP (Q2-Q5) ═══════════════ */
function renderNPSFollowupYesNo(rows){
  const wrap=$('npsFollowupYesNoGrid');const badge=$('npsFollowupYesNoBadge');
  if(!wrap)return;
  if(!rows||rows.length===0){wrap.innerHTML='<div style="text-align:center;padding:32px;color:var(--ink3);grid-column:1/-1;">No data available.</div>';if(badge)badge.textContent='No data';return;}

  const questionStats={};
  NPS_FOLLOWUP_QUESTIONS.forEach(q=>{questionStats[q.id]={yes:0,no:0,total:0};});

  rows.forEach(row=>{
    NPS_FOLLOWUP_QUESTIONS.forEach(q=>{
      const answer=(row[q.col]||'').trim();
      if(answer==='Yes'){questionStats[q.id].yes++;questionStats[q.id].total++;}
      else if(answer==='No'){questionStats[q.id].no++;questionStats[q.id].total++;}
    });
  });

  const totalResponses=rows.length;
  if(badge)badge.textContent=totalResponses>0?`${totalResponses} total responses`:'No data';

  function palette(p){
    if(p>=70)return{bar:'#1D9E75',statusBg:'#EAF3DE',statusColor:'#3B6D11',statusLabel:'Excellent',pctColor:'#1D9E75'};
    if(p>=50)return{bar:'#BA7517',statusBg:'#FAEEDA',statusColor:'#633806',statusLabel:'Good',pctColor:'#BA7517'};
    return{bar:'#E24B4A',statusBg:'#FCEBEB',statusColor:'#791F1F',statusLabel:'Needs improvement',pctColor:'#E24B4A'};
  }

  wrap.style.gridTemplateColumns='repeat(2,1fr)';
  wrap.style.gap='10px';
  wrap.style.marginTop='4px';

  wrap.innerHTML=NPS_FOLLOWUP_QUESTIONS.map(q=>{
    const stats=questionStats[q.id];
    const total=stats.yes+stats.no;
    const yesPct=total>0?Math.round(stats.yes/total*100):0;
    const noPct=100-yesPct;
    const pal=palette(yesPct);
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px 22px;display:flex;flex-direction:column;gap:12px;box-shadow:var(--shadow-sm);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:600;color:var(--ink);margin-bottom:3px;">${q.label}</div>
          <div style="font-size:12px;color:var(--ink3);line-height:1.45;">${q.question}</div>
        </div>
        <span style="font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px;white-space:nowrap;flex-shrink:0;background:${pal.statusBg};color:${pal.statusColor};">${total>0?pal.statusLabel:'No data'}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:12px;color:var(--ink3);width:26px;flex-shrink:0;">Yes</span>
          <div style="flex:1;height:8px;background:var(--bg2);border-radius:4px;overflow:hidden;">
            <div style="width:0%;height:100%;border-radius:4px;background:${pal.bar};transition:width 0.9s cubic-bezier(.22,1,.36,1);" data-w="${yesPct}" class="nfq-bar-fill"></div>
          </div>
          <span style="font-size:12px;font-weight:500;color:var(--ink);min-width:20px;text-align:right;">${stats.yes}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:12px;color:var(--ink3);width:26px;flex-shrink:0;">No</span>
          <div style="flex:1;height:8px;background:var(--bg2);border-radius:4px;overflow:hidden;">
            <div style="width:0%;height:100%;border-radius:4px;background:var(--border2);transition:width 0.9s cubic-bezier(.22,1,.36,1);" data-w="${noPct}" class="nfq-bar-fill"></div>
          </div>
          <span style="font-size:12px;font-weight:500;color:var(--ink);min-width:20px;text-align:right;">${stats.no}</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border);">
        <div>
          <div style="font-size:24px;font-weight:600;line-height:1;color:${total>0?pal.pctColor:'var(--ink3)'};">${total>0?yesPct+'%':'—'}</div>
          <div style="font-size:11px;color:var(--ink3);margin-top:3px;">${total>0?`positive · ${total} responses`:'no responses found'}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  setTimeout(()=>{
    document.querySelectorAll('.nfq-bar-fill').forEach(el=>{
      el.style.width=el.getAttribute('data-w')+'%';
    });
  },100);
}

/* ═══════════════ STUDENT VOICE ═══════════════ */
function svShow(state){
  $('svIdle').style.display=state==='idle'?'flex':'none';
  $('svLoading').style.display=state==='loading'?'flex':'none';
  $('svResult').style.display=state==='result'?'block':'none';
  $('svError').style.display=state==='error'?'block':'none';
}

export async function runStudentVoice(rowsArg){
  const rows=rowsArg||(state.data.nps&&state.data.nps.rows);
  if(svRunning)return;
  if(!rows||!rows.length){svShow('idle');return;}
  const q6Responses=[];const q7Responses=[];
  rows.forEach(row=>{
    const q6=(row['nps_likes']||row['Q6']||row['q6']||row['Q6_response']||row['q6_response']||row['What do you like about FACE Prep']||row['Q6 - What do you like about the FACE Prep program?']||'').trim();
    const q7=(row['nps_improve']||row['Q7']||row['q7']||row['Q7_response']||row['q7_response']||row['What would you like FACE Prep to improve']||row['Q7 - What is one thing you would like FACE Prep to improve in next year?']||'').trim();
    if(!q6){const k=Object.keys(row).find(k=>k.toLowerCase().includes('q6')||k.toLowerCase().includes('like about'));if(k&&row[k]&&row[k].trim())q6Responses.push(row[k].trim());}else if(q6){q6Responses.push(q6);}
    if(!q7){const k=Object.keys(row).find(k=>k.toLowerCase().includes('q7')||k.toLowerCase().includes('improve'));if(k&&row[k]&&row[k].trim())q7Responses.push(row[k].trim());}else if(q7){q7Responses.push(q7);}
  });
  const validQ6=q6Responses.filter(r=>r&&r.length>2);
  const validQ7=q7Responses.filter(r=>r&&r.length>2);
  if(!validQ6.length&&!validQ7.length){
    const firstRow=rows[0]||{};
    const allKeys=Object.keys(firstRow);
    const q6Key=allKeys.find(k=>/nps_likes|q6|like about|what.*like/i.test(k));
    const q7Key=allKeys.find(k=>/nps_improve|q7|improve|what.*would|one thing/i.test(k));
    if(q6Key)rows.forEach(r=>{if(r[q6Key]&&r[q6Key].trim().length>2)validQ6.push(r[q6Key].trim());});
    if(q7Key)rows.forEach(r=>{if(r[q7Key]&&r[q7Key].trim().length>2)validQ7.push(r[q7Key].trim());});
  }
  if(!validQ6.length&&!validQ7.length){
    $('svBadge').textContent='No Q6/Q7 data';
    svShow('idle');
    const idleMsg=$('svIdle').querySelector('div:last-child');
    if(idleMsg)idleMsg.textContent='No Q6 or Q7 open-ended responses found in the sheet. Make sure columns are named Q6 and Q7.';
    return;
  }
  svRunning=true;
  svShow('loading');
  $('svBadge').textContent=`${validQ6.length} Q6 · ${validQ7.length} Q7`;
  $('svRegenBtn').style.display='none';
  $('svLoadingText').textContent='Analysing student responses with AI…';
  const sample=arr=>arr.length>120?arr.sort(()=>Math.random()-0.5).slice(0,120):arr;
  const q6Sample=sample([...validQ6]);const q7Sample=sample([...validQ7]);
  const collegeName=state.currentCollege?state.currentCollege.name:'this college';
  const prompt=`You are analysing real student feedback from ${collegeName} about the FACE Prep program.\n\nBelow are student responses to two open-ended questions:\n\nQ6 — What do you like about the FACE Prep program? (${q6Sample.length} responses):\n${q6Sample.map((r,i)=>`${i+1}. ${r}`).join('\n')}\n\nQ7 — What is one thing you would like FACE Prep to improve next year? (${q7Sample.length} responses):\n${q7Sample.map((r,i)=>`${i+1}. ${r}`).join('\n')}\n\nAnalyse all responses carefully and return a JSON object with exactly this structure:\n{\n  "likes": ["point 1", "point 2", "point 3", "point 4", "point 5", "point 6"],\n  "improvements": ["point 1", "point 2", "point 3", "point 4", "point 5", "point 6"]\n}\n\nRules:\n- Each array must have 5 to 8 bullet points\n- Each point must be a single clear sentence (15-30 words) capturing a distinct theme from the actual student responses\n- Do NOT invent themes — only summarise what students actually wrote\n- Do NOT include any text outside the JSON object\n- Use plain language, no markdown formatting inside the strings`;
  try{
    const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_API_KEY}`},body:JSON.stringify({model:GROQ_MODEL,messages:[{role:'user',content:prompt}],max_tokens:1000,temperature:0.4})});
    if(!response.ok){const errText=await response.text();throw new Error(`Groq API error ${response.status}: ${errText.slice(0,200)}`);}
    const data=await response.json();const rawText=data.choices?.[0]?.message?.content||'';
    let parsed;
    try{const clean=rawText.replace(/```json|```/g,'').trim();parsed=JSON.parse(clean);}catch(e){const match=rawText.match(/\{[\s\S]*\}/);if(match)parsed=JSON.parse(match[0]);else throw new Error('Could not parse AI response as JSON');}
    const likes=Array.isArray(parsed.likes)?parsed.likes:[];const improvements=Array.isArray(parsed.improvements)?parsed.improvements:[];
    renderStudentVoiceResult(likes,improvements,validQ6.length,validQ7.length);
  }catch(err){
    console.error('Student Voice error:',err);svShow('error');
    $('svError').innerHTML=`<strong>Could not generate analysis</strong><br>${err.message}`;
    $('svRegenBtn').style.display='inline-block';
  }finally{svRunning=false;}
}

function renderStudentVoiceResult(likes,improvements,q6Count,q7Count){
  const grid=$('svGrid');
  function buildCol(items,type){
    const isLikes=type==='likes';
    const title=isLikes?'What students love about FACE Prep':'What students wants to Improve';
    const qLabel=isLikes?`Q6 · ${q6Count} responses`:`Q7 · ${q7Count} responses`;
    const colClass=isLikes?'likes':'improve';
    const accentColor=isLikes?'#065f46':'#78350f';
    const points=items.map(p=>`<div class="sv-point"><span class="sv-point-dot"></span><span class="sv-point-text">${p}</span></div>`).join('');
    return`<div class="sv-col ${colClass}"><div class="sv-col-header"><div style="display:inline-flex;align-items:center;justify-content:center;width:10px;height:10px;border-radius:50%;background:${accentColor};flex-shrink:0;margin-top:2px;"></div><div><div class="sv-col-title">${title}</div><div class="sv-col-sub">${qLabel}</div></div></div>${items.length?points:'<div class="sv-no-data">No clear themes found in the responses.</div>'}</div>`;
  }
  grid.innerHTML=buildCol(likes,'likes')+buildCol(improvements,'improvements');
  const metaEl=$('svMeta');
  if(metaEl)metaEl.textContent=`${q6Count} Q6 responses and ${q7Count} Q7 responses · ${new Date().toLocaleTimeString()}`;
  $('svRegenBtn').style.display='inline-block';
  svShow('result');
}
