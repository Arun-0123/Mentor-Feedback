/* ═══════════════════════════════════════════
   UTILITY FUNCTIONS
   Small, dependency-free helpers reused across every panel.
═══════════════════════════════════════════ */

export function $(id){return document.getElementById(id);}

/* ── Number/label formatting for NPS ── */
export function getNpsColor(index){if(index===null)return'#c48a00';if(index>=50)return'#065f46';if(index>=0)return'#c48a00';return'#7f1d1d';}
export function getNpsLabel(index){if(index===null)return'No NPS data in sheet';if(index>=70)return'Excellent · World Class';if(index>=50)return'Excellent';if(index>=30)return'Great';if(index>=0)return'Good';if(index>=-20)return'Needs Improvement';return'Critical';}

/* ── Rating status badges/colors ── */
export function statusBadge(r){if(r>=4.3)return'<span class="badge badge-gold">Excellent</span>';if(r>=4.0)return'<span class="badge badge-green">Good</span>';if(r>=3.5)return'<span class="badge badge-amber">Average</span>';return'<span class="badge badge-rose">Needs work</span>';}
export function getStatusColor(r){if(r>=4.3)return'#10b981';if(r>=4.0)return'#c48a00';if(r>=3.5)return'#f59e0b';return'#ef4444';}
export function deptStyle(d){if(!d)return{color:'#4a2e00',bg:'#fff3cc',border:'#e6b84a'};if(d.includes('BCA'))return{color:'#5c3600',bg:'#fde9a0',border:'#e6b84a'};if(d.includes('BBA'))return{color:'#3d2200',bg:'#f5c842',border:'#c48a00'};return{color:'#4a2e00',bg:'#fff3cc',border:'#e6b84a'};}

/* ── Animated counters / needles (shared by summary + nps panels) ── */
export function animateCounter(el,target,duration,prefix){
  duration=duration||1000;prefix=prefix||'';
  const startTime=performance.now(),isNeg=target<0,absT=Math.abs(target);
  function ease(t){return t*(2-t);}
  function go(now){
    const p=Math.min((now-startTime)/duration,1);
    const cur=Math.round(absT*ease(p));
    el.textContent=prefix+(isNeg?-cur:cur>0?'+'+cur:cur);
    if(p<1)requestAnimationFrame(go);
  }
  requestAnimationFrame(go);
}

/* ── Generic column finder for loosely-structured sheets (hit-ratio sheet) ── */
export function normalizeHeader(key){return(key||'').toLowerCase().replace(/[\s_\-\.\/\(\)#]+/g,'').replace(/[^a-z0-9]/g,'');}
export function findColumn(headers,candidates){
  const normH=headers.map(h=>({raw:h,norm:normalizeHeader(h)}));
  for(const c of candidates){
    const nc=normalizeHeader(c);
    const found=normH.find(h=>h.norm===nc||h.norm.includes(nc));
    if(found)return found.raw;
  }
  return null;
}
