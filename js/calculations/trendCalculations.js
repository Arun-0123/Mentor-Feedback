/* ═══════════════════════════════════════════
   TREND OVER TIME — calculations
   ───────────────────────────────────────────
   Left functionally unchanged from the previous implementation: sources
   real history from a college's dedicated trend sheet when one is
   configured (DEDICATED_TREND_SHEETS), otherwise falls back to a cycle
   column in the raw sheet if present, otherwise a simulated preview
   trend seeded from that college's current numbers. This tab is
   intentionally independent of the new per-tab month filters / monthly
   spreadsheet registry.
═══════════════════════════════════════════ */
import {fetchSheetRows} from '../data/csv.js';
import {DEDICATED_TREND_SHEETS} from '../config/colleges.js';
import {FIXED_CYCLES,MONTH_ALIAS_MAP} from '../config/constants.js';
import {computeNpsData} from './dashboardCalculations.js';

const MONTH_ORDER={'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12};
function parseCycleDate(c){const parts=c.split(' ');return(parseInt(parts[1])||0)*100+(MONTH_ORDER[parts[0]]||0);}

/** Loads a college's dedicated trend sheet (tries each configured gid until one has data). */
export async function loadDedicatedTrendSheet(collegeName){
  const config=DEDICATED_TREND_SHEETS[collegeName];
  if(!config)return null;
  const {sheetId,gids}=config;
  for(const gid of gids){
    try{
      const rows=await fetchSheetRows(sheetId,gid);
      if(rows&&rows.length>0)return processDedicatedTrendData(rows);
    }catch(e){console.warn(`Trend GID ${gid} failed:`,e);}
  }
  return null;
}

export function processDedicatedTrendData(rows){
  if(!rows||!rows.length)return null;
  const keys=Object.keys(rows[0]).map(k=>k.trim().toLowerCase());const rawKeys=Object.keys(rows[0]);
  function findCol(...candidates){for(const c of candidates){const norm=c.replace(/[\s_-]/g,'').toLowerCase();const idx=keys.findIndex(k=>k===c||k.replace(/[\s_-]/g,'')===norm);if(idx>=0)return rawKeys[idx];}return null;}
  const colMonth=findCol('month','cycle','period','term','batch');const colResponses=findCol('no. of responses','no.ofresponses','noofresponses','responses','total_responses','count','actual_responses');const colStudents=findCol('no. of students','no.ofstudents','noofstudents','students','total_students');const colRating=findCol('average rating','avg rating','avg_rating','averagerating','rating');const colNps=findCol('nps score','nps_score','nps index','nps_index','nps','npsscore');const colHitRatio=findCol('hit rate','hit_rate','hitrate','hit ratio','hit_ratio','hitratio');const colPromoters=findCol('no. of promoters','no.ofpromoters','noofpromoters','promoters','promoter_count');const colPassives=findCol('no. of neutral','no.ofneutral','noofneutral','neutral','passives','passive_count');const colDetractors=findCol('no. of detractors','no.ofdetractors','noofdetractors','detractors','detractor_count');const colMentors=findCol('mentors','mentor_count','mentorcount','mentor count','mentors_count');const colExpected=findCol('expected_responses','expectedresponses','expected','target','target_responses');
  const cycleStats={};const cycles=[];
  rows.forEach(row=>{
    if(!colMonth)return;const rawMonth=(row[colMonth]||'').trim();if(!rawMonth)return;
    const cycleName=MONTH_ALIAS_MAP[rawMonth.toLowerCase()]||rawMonth;
    if(cycles.indexOf(cycleName)===-1)cycles.push(cycleName);
    const pv=s=>{if(!s||!row[s])return null;const v=parseFloat(row[s].toString().replace('%','').trim());return isNaN(v)?null:v;};
    const iv=s=>{if(!s||!row[s])return null;const v=parseInt(row[s].toString().replace('%','').trim(),10);return isNaN(v)?null:v;};
    const responses=iv(colResponses);const ratingAvg=pv(colRating);const npsIndex=colNps?iv(colNps):null;const expected=iv(colExpected);
    let hitRatio=pv(colHitRatio);if(hitRatio===null&&responses!==null&&expected!==null&&expected>0)hitRatio=parseFloat(((responses/expected)*100).toFixed(1));
    const mentorCount=iv(colMentors);const students=iv(colStudents);
    const promoterCount=iv(colPromoters);const passiveCount=iv(colPassives);const detractorCount=iv(colDetractors);
    const totalForPct=(promoterCount||0)+(passiveCount||0)+(detractorCount||0);
    let promoterPct=totalForPct>0?parseFloat(((promoterCount/totalForPct)*100).toFixed(1)):null;
    let passivePct=totalForPct>0?parseFloat(((passiveCount/totalForPct)*100).toFixed(1)):null;
    let detractorPct=totalForPct>0?parseFloat(((detractorCount/totalForPct)*100).toFixed(1)):null;
    let finalNps=npsIndex;if(finalNps!==null&&Math.abs(finalNps)<=1)finalNps=Math.round(finalNps*100);
    cycleStats[cycleName]={cycle:cycleName,responses:responses||0,students:students||0,ratingAvg,npsIndex:finalNps,hitRatio,promoterPct,passivePct,detractorPct,promoterCount:promoterCount||0,passiveCount:passiveCount||0,detractorCount:detractorCount||0,mentorCount:mentorCount||0,mentorRatings:{}};
  });
  const sortedCycles=[...cycles].sort((a,b)=>parseCycleDate(a)-parseCycleDate(b));
  return {cycles:sortedCycles,hasCycleCol:true,hasDedicatedSheet:true,cycleStats,mentorCycleStats:{}};
}

/** Extracts a per-cycle grouping of ratings/NPS/mentors from raw rows (for the non-dedicated-sheet path). */
export function buildCycleMapFromRows(rows){
  const cycleColNames=['cycle','batch','term','semester','month','period'];
  let cycleCol=null;
  if(rows.length>0){const keys=Object.keys(rows[0]);cycleCol=keys.find(k=>cycleColNames.includes(k.toLowerCase().trim()))||null;}
  const hasCycle=!!cycleCol;const cycleMap={};
  rows.forEach(row=>{
    let cycleName='—';
    if(hasCycle){const raw=(row[cycleCol]||'').trim();cycleName=raw||'Unknown';const mapped=MONTH_ALIAS_MAP[cycleName.toLowerCase()];if(mapped)cycleName=mapped;}
    if(!cycleMap[cycleName])cycleMap[cycleName]={ratings:[],npsScores:[],mentors:{}};
    const npsRaw=row['nps_score']||row['NPS Score']||row['nps score']||row['NPSScore']||'';
    const npsVal=parseInt(npsRaw,10);
    if(!isNaN(npsVal)&&npsVal>=1&&npsVal<=10){cycleMap[cycleName].npsScores.push(npsVal);}
    for(let i=1;i<=7;i++){
      const sn=row[`subject${i}_Name`],mn=row[`subject${i}_Mentor`],rt=parseFloat(row[`subject${i}_Rating`]);
      if(sn&&mn&&!isNaN(rt)&&rt>0){
        cycleMap[cycleName].ratings.push(rt);
        if(!cycleMap[cycleName].mentors[mn])cycleMap[cycleName].mentors[mn]=[];
        cycleMap[cycleName].mentors[mn].push(rt);
      }
    }
  });
  return {cycleMap,hasCycle};
}

/**
 * Builds TREND_DATA from a cycle map, either using real cycle data found
 * in the sheet, or (if no cycle column exists) a simulated preview trend
 * seeded from the college's current computed numbers.
 */
export function computeTrendData(cycleMap,hasCycle,totalRows,seed){
  const {TABLE_DATA=[],NPS_DATA={total:0,npsIndex:null,promoters:0,passives:0},MENTORS=[]}=seed||{};
  let cycleStats={};let cycles=[];
  if(hasCycle){
    const rawCycles=Object.keys(cycleMap).filter(c=>c!=='Unknown'&&c!=='—');
    cycles=[...rawCycles].sort((a,b)=>parseCycleDate(a)-parseCycleDate(b));if(cycleMap['Unknown'])cycles.push('Unknown');
    cycles.forEach(c=>{
      const d=cycleMap[c];
      const ratingAvg=d.ratings.length>0?d.ratings.reduce((s,v)=>s+v,0)/d.ratings.length:null;
      const nps=computeNpsData(d.npsScores);
      const mCount=Object.keys(d.mentors).length;
      const mentorRatings={};Object.entries(d.mentors).forEach(([mn,rs])=>{mentorRatings[mn]=rs.reduce((s,v)=>s+v,0)/rs.length;});
      cycleStats[c]={cycle:c,responses:d.ratings.length,ratingAvg:ratingAvg?parseFloat(ratingAvg.toFixed(2)):null,npsIndex:nps.npsIndex,hitRatio:null,promoterPct:nps.total>0?Math.round(nps.promoters/nps.total*100):null,passivePct:nps.total>0?Math.round(nps.passives/nps.total*100):null,detractorPct:nps.total>0?Math.round(nps.detractors/nps.total*100):null,mentorCount:mCount,mentorRatings};
    });
    return {cycles,hasCycleCol:true,hasDedicatedSheet:false,cycleStats};
  }
  cycles=[...FIXED_CYCLES];
  const globalAvg=TABLE_DATA.length>0?TABLE_DATA.reduce((s,r)=>s+r.rating,0)/TABLE_DATA.length:4.0;
  const globalNps=NPS_DATA.npsIndex!==null?NPS_DATA.npsIndex:30;
  const globalResp=Math.max(totalRows,10);
  const globalPromPct=NPS_DATA.total>0?Math.round(NPS_DATA.promoters/NPS_DATA.total*100):40;
  const globalPassPct=NPS_DATA.total>0?Math.round(NPS_DATA.passives/NPS_DATA.total*100):30;
  cycles.forEach((c,idx)=>{
    const isLast=idx===cycles.length-1;const progress=idx/(cycles.length-1);const trend=progress*0.15;
    function jitter(base,amp){return parseFloat((base+trend+Math.sin(idx*1.37)*amp+(Math.random()-0.5)*amp*0.25).toFixed(2));}
    const rA=isLast?parseFloat(globalAvg.toFixed(2)):Math.min(5,Math.max(1,jitter(globalAvg,0.18)));
    const nI=isLast?globalNps:Math.min(100,Math.max(-100,Math.round(jitter(globalNps,7))));
    const resp=isLast?globalResp:Math.max(10,Math.round(jitter(globalResp,globalResp*0.12)));
    const prom=isLast?globalPromPct:Math.min(100,Math.max(0,Math.round(jitter(globalPromPct,5))));
    const pass=isLast?globalPassPct:Math.min(100,Math.max(0,Math.round(jitter(globalPassPct,4))));
    const detr=Math.max(0,100-prom-pass);
    const mCount=MENTORS.length>0?Math.max(1,Math.round(MENTORS.length*(0.82+idx*0.025))):5;
    const mentorRatings={};MENTORS.forEach(m=>{mentorRatings[m.name]=isLast?m.rating:Math.min(5,Math.max(1,parseFloat((m.rating+jitter(0,0.25)).toFixed(2))));});
    cycleStats[c]={cycle:c,responses:resp,ratingAvg:rA,npsIndex:nI,hitRatio:null,promoterPct:prom,passivePct:pass,detractorPct:detr,mentorCount:mCount,mentorRatings};
  });
  return {cycles,hasCycleCol:false,hasDedicatedSheet:false,cycleStats};
}
