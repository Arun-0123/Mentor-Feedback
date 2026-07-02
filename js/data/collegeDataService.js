/* ═══════════════════════════════════════════
   DATA LOADING — per-college, per-month feedback rows
   ───────────────────────────────────────────
   This is the single place that knows how to turn a (month, college)
   pair into raw feedback rows. Every panel (Summary / Mentor
   Performance / NPS Analysis) — and the "All" merge — goes through
   here, so:
     • a given month+college is only ever fetched once per session
       (in-flight requests are de-duped by sharing the same Promise)
     • "All" simply fans out to every configured month and concatenates
       the raw rows, then callers recompute every metric from the
       merged set (never averaging pre-calculated monthly numbers)
═══════════════════════════════════════════ */
import {fetchSheetRows} from './csv.js';
import {getSortedMonthKeys,getSpreadsheetId,ALL_MONTHS_KEY} from '../config/months.js';

/* key: `${monthKey}::${collegeName}` → Promise<rows[]> */
const rowsCache=new Map();

function cacheKey(monthKey,college){return `${monthKey}::${college.name}`;}

/** Rows for one specific month + college. Cached and de-duped. */
export function getCollegeMonthRows(monthKey,college){
  const key=cacheKey(monthKey,college);
  if(rowsCache.has(key))return rowsCache.get(key);
  const spreadsheetId=getSpreadsheetId(monthKey);
  if(!spreadsheetId){
    const err=Promise.reject(new Error(`No spreadsheet configured for ${monthKey}`));
    err.catch(()=>{});
    return err;
  }
  const promise=fetchSheetRows(spreadsheetId,college.gid).catch(err=>{
    rowsCache.delete(key); // allow retry on next call
    throw err;
  });
  rowsCache.set(key,promise);
  return promise;
}

/**
 * Rows for a tab's month-filter selection: either one specific month,
 * or ALL_MONTHS_KEY which merges every configured month's raw rows into
 * a single combined dataset (missing/failed months are skipped, not fatal).
 */
export async function getCollegeRowsForSelection(monthSelection,college){
  if(monthSelection===ALL_MONTHS_KEY){
    const months=getSortedMonthKeys();
    const settled=await Promise.allSettled(months.map(m=>getCollegeMonthRows(m,college)));
    return settled.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
  }
  return getCollegeMonthRows(monthSelection,college);
}

/** Clears every cached row set — used by the Refresh button. */
export function clearCollegeDataCache(){
  rowsCache.clear();
}
