/* ═══════════════════════════════════════════
   DATA LOADING — dedicated Hit Ratio sheet
   Hit Ratio is maintained in a standalone Google Sheet (one row per
   college) rather than derived from the monthly raw feedback rows —
   see constants.js for why. Fetched once per session and cached.
═══════════════════════════════════════════ */
import {fetchSheetRows} from './csv.js';
import {HIT_RATIO_SHEET_ID,HIT_RATIO_GID} from '../config/constants.js';
import {findColumn} from '../utils/helpers.js';

let hitRatioPromise=null; // Map<collegeName, hitRatioPercent|null>

async function loadHitRatioMap(){
  const rows=await fetchSheetRows(HIT_RATIO_SHEET_ID,HIT_RATIO_GID);
  const map=new Map();
  if(!rows.length)return map;
  const headers=Object.keys(rows[0]);
  const colCollege=findColumn(headers,['college name','college','institution','name']);
  const colHit=findColumn(headers,['hit ratio','hit rate','hitratio','hitrate','response rate']);
  if(!colCollege)return map;
  rows.forEach(row=>{
    const college=(row[colCollege]||'').trim();
    if(!college)return;
    let hit=colHit?parseFloat((row[colHit]||'').toString().replace(/[^0-9.]/g,'')):null;
    if(hit===undefined||isNaN(hit))hit=null;
    map.set(college,hit);
  });
  return map;
}

function getHitRatioMap(){
  if(!hitRatioPromise){
    hitRatioPromise=loadHitRatioMap().catch(err=>{
      hitRatioPromise=null; // allow retry
      throw err;
    });
  }
  return hitRatioPromise;
}

/** Returns the Hit Ratio percentage (number) for a college, or null if unavailable. */
export async function getHitRatio(collegeName){
  try{
    const map=await getHitRatioMap();
    return map.has(collegeName)?map.get(collegeName):null;
  }catch(err){
    console.error('Hit ratio load failed:',err);
    return null;
  }
}

export function clearHitRatioCache(){
  hitRatioPromise=null;
}
