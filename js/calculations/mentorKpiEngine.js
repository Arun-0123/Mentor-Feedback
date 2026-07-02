/* ═══════════════════════════════════════════
   MENTOR MODAL — KPI ENGINE
   Strength / Concern / TEI / SSI scoring used by the mentor detail modal.
═══════════════════════════════════════════ */

export function mmClassify(pct){if(pct>=90)return'hp';if(pct>=80)return'mp';if(pct>=70)return'n';if(pct>=60)return'mn';return'hn';}
export function mmClassLabel(cls){return{hp:'High positive',mp:'Moderate positive',n:'Neutral',mn:'Moderate negative',hn:'High negative'}[cls];}
export function mmClassStyle(cls){const m={hp:{bg:'#d1fae5',color:'#065f46',border:'#6ee7b7'},mp:{bg:'#dbeafe',color:'#1e40af',border:'#93c5fd'},n:{bg:'var(--bg2)',color:'var(--ink3)',border:'var(--border2)'},mn:{bg:'#fef3c7',color:'#78350f',border:'#fcd34d'},hn:{bg:'#fee2e2',color:'#7f1d1d',border:'#fca5a5'}};return m[cls]||m.n;}
export function mmKpiBadge(level,label){const m={excellent:{bg:'#d1fae5',color:'#065f46',border:'#6ee7b7'},good:{bg:'#fde9a0',color:'#5c3600',border:'#e6b84a'},average:{bg:'#fef3c7',color:'#78350f',border:'#fcd34d'},concern:{bg:'#fee2e2',color:'#7f1d1d',border:'#fca5a5'}};const s=m[level]||m.average;return`<span class="mm-kpi-badge" style="background:${s.bg};color:${s.color};border:1px solid ${s.border};">${label}</span>`;}
export function mmKpiBarColor(level){return{excellent:'#10b981',good:'#c48a00',average:'#f59e0b',concern:'#ef4444'}[level]||'#c48a00';}
export function mmInterpretStrength(s){if(s>=90)return{level:'excellent',label:'Exceptional',desc:'Exceptional mentor performance with consistently strong student feedback across all teaching parameters.'};if(s>=80)return{level:'excellent',label:'Strong',desc:'Strong mentor performance with positive student perception and minor improvement areas.'};if(s>=70)return{level:'good',label:'Stable',desc:'Stable mentor performance with moderate student satisfaction and scope for enhancement.'};if(s>=60)return{level:'average',label:'Needs attention',desc:'Multiple improvement areas identified in teaching effectiveness and student engagement.'};return{level:'concern',label:'Critical',desc:'Critical teaching performance concerns requiring immediate intervention and mentoring support.'};}
export function mmInterpretConcern(s){if(s<=10)return{level:'excellent',label:'Minimal'};if(s<=20)return{level:'good',label:'Minor'};if(s<=30)return{level:'average',label:'Noticeable'};if(s<=40)return{level:'average',label:'Significant'};return{level:'concern',label:'Critical'};}
export function mmInterpretTEI(s){if(s>=90)return{level:'excellent',label:'Exceptional'};if(s>=80)return{level:'excellent',label:'Highly effective'};if(s>=70)return{level:'good',label:'Satisfactory'};if(s>=60)return{level:'average',label:'Needs improvement'};return{level:'concern',label:'Major concerns'};}
export function mmInterpretSSI(s){if(s>=90)return{level:'excellent',label:'Highly satisfied'};if(s>=80)return{level:'excellent',label:'Strongly satisfied'};if(s>=70)return{level:'good',label:'Moderately satisfied'};if(s>=60)return{level:'average',label:'Below expectations'};return{level:'concern',label:'Significantly dissatisfied'};}

/** Strength/Concern/TEI/SSI scores from a mentor's 5 yes/no question tallies. */
export function calcMentorKPIs(qs){
  const pcts=qs.map(q=>{const t=q.y+q.n;return t>0?Math.round(q.y/t*100):0;});
  const[p1,p2,p3,p4,p5]=pcts;
  const strength=(p1*25+p2*10+p3*30+p4*20+p5*15)/100;
  const concern=((100-p1)*25+(100-p2)*10+(100-p3)*30+(100-p4)*20+(100-p5)*15)/100;
  const tei=(p1*30+p3*35+p4*25+p5*10)/100;
  const ssi=(p1+p2+p3+p4+p5)/5;
  return{pcts,strength,concern,tei,ssi};
}

export function mmBuildRec(strengths,weaknesses){
  const wc=weaknesses.length,sc=strengths.length;
  if(wc>=3)return'Priority coaching needed. More than half the feedback dimensions fall below 60% positive. A structured mentoring improvement plan is strongly recommended.';
  if(wc===2)return`Two clear focus areas: <strong>${weaknesses.map(w=>w.label).join('</strong> and <strong>')}</strong>. Targeted workshops or peer observation sessions could address both.`;
  if(wc===1)return`One improvement area identified: <strong>${weaknesses[0].label}</strong>. Focused feedback sessions and peer mentoring should resolve this.`;
  if(sc>=4)return'Exceptional performer across nearly all dimensions. Consider nominating as peer mentor or faculty trainer to share best practices.';
  if(sc>=2)return'Strong in several key areas. Encourage continued growth in neutral dimensions through self-reflection and student dialogue.';
  return'Performance is stable with room for growth. Encourage ongoing structured student interaction and periodic self-assessment.';
}

export function mmVerdictConfig(strength,tei){
  if(strength>=80&&tei>=80)return{icon:'✦',bg:'#d1fae5',color:'#065f46',border:'#6ee7b7',text:'Strong overall performer. Students report consistently positive experiences across teaching effectiveness, engagement, and support dimensions.'};
  if(strength>=70&&tei>=70)return{icon:'◆',bg:'#fef3c7',color:'#78350f',border:'#fcd34d',text:'Solid performer with good teaching fundamentals. Targeted improvements in weaker dimensions could elevate overall impact.'};
  if(strength>=60)return{icon:'◇',bg:'#fef3c7',color:'#78350f',border:'#fcd34d',text:'Average performance with notable improvement opportunities. Students have identified specific areas requiring focused attention.'};
  return{icon:'▲',bg:'#fee2e2',color:'#7f1d1d',border:'#fca5a5',text:'Critical performance concerns identified. Immediate mentoring intervention is recommended based on student feedback.'};
}
