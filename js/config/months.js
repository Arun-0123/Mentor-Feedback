/* ═══════════════════════════════════════════
   MONTHLY SPREADSHEET REGISTRY  (single source of truth)
   ───────────────────────────────────────────
   Every month of feedback lives in its own Google Spreadsheet, built
   from the same template (one worksheet tab per college — see
   colleges.js for the tab list/gids, which are shared by every month).

   TO ADD A NEW MONTH: add one line below. Nothing else in the codebase
   needs to change — every tab's month filter, the "All" merge, and the
   Trend tab all read from this object automatically.

   Key format: "<Full Month Name> <4-digit Year>", e.g. "January 2026".
   Always include the year so months never become ambiguous across years.
═══════════════════════════════════════════ */
export const MONTHLY_SHEETS = {
  'June 2026': '19HsWARl8RFNZ6nc-bUCBKKEN39JkQVxCBfbNCUSe2_4',
  // 'July 2026': '<spreadsheet id of July 2026 copy>',
};

const MONTH_NAME_ORDER = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseMonthKey(key){
  const [name,yearStr] = key.split(' ');
  const monthIdx = MONTH_NAME_ORDER.indexOf(name);
  const year = parseInt(yearStr,10);
  return {monthIdx,year,sortValue:(isNaN(year)?0:year)*100+(monthIdx<0?0:monthIdx)};
}

/** All configured month keys, sorted chronologically (oldest → newest). */
export function getSortedMonthKeys(){
  return Object.keys(MONTHLY_SHEETS).sort((a,b)=>parseMonthKey(a).sortValue-parseMonthKey(b).sortValue);
}

/** The most recently configured month — used as each tab's default filter. */
export function getLatestMonthKey(){
  const sorted=getSortedMonthKeys();
  return sorted.length?sorted[sorted.length-1]:null;
}

export function getSpreadsheetId(monthKey){
  return MONTHLY_SHEETS[monthKey]||null;
}

export const ALL_MONTHS_KEY='all';
