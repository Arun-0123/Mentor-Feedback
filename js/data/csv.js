/* ═══════════════════════════════════════════
   DATA LOADING — generic CSV fetch/parse
   Wraps a Google Sheets "export?format=csv" fetch + PapaParse so every
   other data-loading module (collegeDataService, hitRatioService,
   trendCalculations) shares one implementation.
═══════════════════════════════════════════ */

/** Builds the public CSV export URL for a Google Sheet tab. */
export function sheetCsvUrl(spreadsheetId,gid){
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

/** Fetches a Google Sheet tab and parses it into an array of row objects (header:true). */
export async function fetchSheetRows(spreadsheetId,gid){
  const resp=await fetch(sheetCsvUrl(spreadsheetId,gid));
  if(!resp.ok)throw new Error(`Fetch failed (HTTP ${resp.status}) for sheet ${spreadsheetId} gid ${gid}`);
  const text=await resp.text();
  return await new Promise((resolve,reject)=>{
    Papa.parse(text,{
      header:true,skipEmptyLines:true,
      complete(res){resolve(res.data);},
      error(err){reject(err);}
    });
  });
}
