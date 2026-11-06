/* Shared engine for "what does the operation do" lessons:
   a linear-recursion trace (call frames over a list / array), with
   step-by-step replay, a data-structure drawing and Hebrew step descriptions.

   Lesson code supplies a `sim(values, R)` that records the run:
     const id = R.call(label, parentId, parentLineIdx, {focus}, text)
     const li = R.line(id, codeText, {kind:'if'|'sub'|'inner', res, eval, val, focus, focus2, range, text})
     R.ret(id, codeText, value, {focus}, text)
   kind 'if'    : a condition (✓/✗, optional eval text such as "3 < 5")
   kind 'sub'   : a recursive call that is traced (its frame appears below; value fills in on return)
   kind 'inner' : a call we do NOT trace ("אין צורך לעקוב") – its value appears at once */

function makeRecorder(){
  const R={frames:[],steps:[],_id:0,byId:new Map()};
  R._pending=[];
  const push=step=>{if(R._pending.length){step.also=R._pending;R._pending=[];}R.steps.push(step);return step;};
  R.call=function(label,parent,parentLi,hl,text){
    const id='F'+(R._id++),depth=parent?R.byId.get(parent).depth+1:0;
    const f={id,label,parent,parentLi,depth,lines:[],val:null,retCode:''};
    R.frames.push(f);R.byId.set(id,f);
    push({t:'call',id,hl:hl||{},text});return id;};
  /* o.silent:'prev' shows the line together with the previous step, 'next' with the next step (no step of its own) */
  R.line=function(id,code,o){
    const f=R.byId.get(id),li=f.lines.length;f.lines.push({code,kind:o.kind});
    const a={li,kind:o.kind,res:o.res,eval:o.eval,val:o.val};
    if(o.silent==='prev'){const prev=R.steps[R.steps.length-1];(prev.also=prev.also||[]).push(a);return li;}
    if(o.silent==='next'){R._pending.push(a);return li;}
    push({t:o.kind,id,li,res:o.res,eval:o.eval,val:o.val,hl:{focus:o.focus,focus2:o.focus2,range:o.range},text:o.text});return li;};
  R.ret=function(id,code,val,hl,text){
    const f=R.byId.get(id);f.val=val;f.retCode=code;
    push({t:'ret',id,val,hl:hl||{},text});};
  return R;
}

/* ---------- drawings ---------- */
function drawList(container,vals,hl={}){
  const n=vals.length,W=Math.max(420,70+n*86+60),H=96,y=30;
  const inR=(i)=>hl.range&&i>=hl.range[0]&&i<=hl.range[1];
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px;height:auto;display:block;direction:ltr">
   <defs><marker id="lm-${container.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15233b"/></marker></defs>
   <text x="22" y="${y+25}" font-family="JetBrains Mono,monospace" font-size="15" font-weight="700" fill="#5b6b85">lst</text>
   <line x1="52" y1="${y+20}" x2="68" y2="${y+20}" stroke="#15233b" stroke-width="2.5" marker-end="url(#lm-${container.id})"/>`;
  for(let i=0;i<n;i++){const x=70+i*86;
    const f=hl.focus===i,f2=hl.focus2===i,r=inR(i);
    const fill=f?'#fff3b0':r?'#e3f5fb':'#fff',stroke=f?'#c77a00':f2?'#1f5fd6':r?'#0aa8d6':'#15233b';
    s+=`<rect x="${x}" y="${y}" width="56" height="40" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${f||f2?3:2}"/>
        <text x="${x+28}" y="${y+27}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="19" font-weight="700" fill="#15233b">${vals[i]}</text>
        <text x="${x+28}" y="${y+60}" text-anchor="middle" font-family="Heebo,sans-serif" font-size="12" fill="#7c8aa3">${i+1}</text>
        <line x1="${x+56}" y1="${y+20}" x2="${x+84}" y2="${y+20}" stroke="#15233b" stroke-width="2.5" marker-end="url(#lm-${container.id})"/>`;}
  s+=`<text x="${70+n*86+4}" y="${y+25}" font-family="JetBrains Mono,monospace" font-size="15" fill="#5b6b85">null</text></svg>`;
  container.innerHTML=s;
}
function drawArray(container,vals,hl={}){
  const n=vals.length,cw=54,W=Math.max(360,40+n*cw+40),H=92,y=22,x0=40;
  const inR=(i)=>hl.range&&i>=hl.range[0]&&i<=hl.range[1];
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:${W}px;height:auto;display:block;direction:ltr">
   <text x="4" y="${y+28}" font-family="JetBrains Mono,monospace" font-size="15" font-weight="700" fill="#5b6b85">arr</text>`;
  for(let i=0;i<n;i++){const x=x0+i*cw,f=hl.focus===i,f2=hl.focus2===i,r=inR(i);
    const fill=f?'#fff3b0':f2?'#e6eefc':r?'#e3f5fb':'#fff',stroke=f?'#c77a00':f2?'#1f5fd6':'#15233b';
    s+=`<rect x="${x}" y="${y}" width="${cw}" height="42" fill="${fill}" stroke="${stroke}" stroke-width="${f||f2?3:1.5}"/>
        <text x="${x+cw/2}" y="${y+28}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="19" font-weight="700" fill="#15233b">${vals[i]}</text>
        <text x="${x+cw/2}" y="${y+62}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="13" fill="#7c8aa3">${i}</text>`;}
  s+='</svg>';container.innerHTML=s;
}

/* ---------- replay controller ----------
   dom: {frames, arrows, struct, desc, counter, scrollBox?}  draw: drawList | drawArray */
function makeLinearTrace(dom,draw){
  const T={R:null,step:0,vals:[],sim:null};
  const ns='http://www.w3.org/2000/svg';
  const el=id=>dom.frames.querySelector('#'+dom.frames.id+'-'+id);
  T.load=function(vals,sim){
    T.vals=vals;T.sim=sim;T.R=makeRecorder();T.result=sim(vals,T.R);T.step=0;
    dom.frames.querySelectorAll('.frame').forEach(e=>e.remove());
    T.R.frames.forEach(f=>{const d=document.createElement('div');d.className='frame';d.id=dom.frames.id+'-'+f.id;d.style.marginLeft=(f.depth*26)+'px';
      d.innerHTML=`<div class="head">${f.label}</div>`+f.lines.map((l,i)=>`<div class="ln" data-l="${i}"><span class="code">${l.code}</span><span class="r"></span></div>`).join('')+`<div class="ln ret" data-l="ret"><span class="code"></span><span class="r"></span></div>`;
      dom.frames.appendChild(d);});
    T.render();
  };
  T.render=function(){
    const R=T.R;if(!R)return;
    R.frames.forEach(f=>{const e=el(f.id);e.className='frame';e.querySelectorAll('.ln').forEach(l=>{l.className='ln'+(l.dataset.l==='ret'?' ret':'');l.querySelector('.r').innerHTML='';if(l.dataset.l==='ret')l.querySelector('.code').textContent='';});});
    let last=null,active=null;const shown=[];
    for(let i=0;i<T.step;i++){const s=R.steps[i],f=R.byId.get(s.id),e=el(s.id);last=s;
      e.querySelectorAll('.ln.cur').forEach(l=>l.classList.remove('cur'));
      if(s.t==='call'){e.classList.add('show');shown.push(f);active=s.id;
        if(f.parent){const pe=el(f.parent);pe.querySelectorAll('.ln.cur').forEach(l=>l.classList.remove('cur'));pe.querySelector(`[data-l="${f.parentLi}"]`).classList.add('show','cur');}}
      else if(s.t==='if'){const l=e.querySelector(`[data-l="${s.li}"]`);l.classList.add('show','cur');
        l.querySelector('.r').innerHTML=(s.eval?`<span class="ev">${s.eval}</span> `:'')+(s.res?'<span class="ok">✓</span>':'<span class="x">✗</span>');if(s.res)l.classList.add('stop-hit');active=s.id;}
      else if(s.t==='sub'){const l=e.querySelector(`[data-l="${s.li}"]`);l.classList.add('show','cur');active=s.id;}
      else if(s.t==='inner'){const l=e.querySelector(`[data-l="${s.li}"]`);l.classList.add('show','cur','inner');l.querySelector('.r').innerHTML=`<span class="v">→ ${s.val}</span>`;active=s.id;}
      else if(s.t==='ret'){const r=e.querySelector('[data-l="ret"]');r.classList.add('show','cur');r.querySelector('.code').textContent=f.retCode;
        r.querySelector('.r').innerHTML=`<span class="v">= ${s.val}</span>`;e.classList.add('done');
        if(f.parent){const pe=el(f.parent),pl=pe.querySelector(`[data-l="${f.parentLi}"]`);pl.querySelector('.r').innerHTML=`<span class="v">→ ${s.val}</span>`;pe.querySelectorAll('.ln.cur').forEach(l=>l.classList.remove('cur'));pl.classList.add('cur');active=f.parent;}
        else active=null;}
      if(s.also)s.also.forEach(a=>{const l=e.querySelector(`[data-l="${a.li}"]`);l.classList.add('show');
        if(a.kind==='if'){l.querySelector('.r').innerHTML=(a.eval?`<span class="ev">${a.eval}</span> `:'')+(a.res?'<span class="ok">✓</span>':'<span class="x">✗</span>');if(a.res)l.classList.add('stop-hit');}
        else if(a.kind==='inner'){l.classList.add('inner');l.querySelector('.r').innerHTML=`<span class="v">→ ${a.val}</span>`;}});
    }
    R.frames.forEach(f=>{if(f.id===active)el(f.id).classList.add('active');});
    // connectors
    dom.arrows.querySelectorAll('path').forEach(p=>p.remove());
    // a blue marker for return arrows, created once next to the red one
    if(!dom.arrows.querySelector('#'+dom.arrows.dataset.marker+'-ret')){const defs=dom.arrows.querySelector('defs');
      const m=document.createElementNS(ns,'marker');m.id=dom.arrows.dataset.marker+'-ret';m.setAttribute('viewBox','0 0 10 10');m.setAttribute('refX','9');m.setAttribute('refY','5');m.setAttribute('markerWidth','7');m.setAttribute('markerHeight','7');m.setAttribute('orient','auto');
      const t=document.createElementNS(ns,'path');t.setAttribute('d','M0,0 L10,5 L0,10 z');t.setAttribute('fill','#1f5fd6');m.appendChild(t);defs.appendChild(m);}
    dom.arrows.querySelectorAll('text').forEach(t=>t.remove());
    shown.forEach(f=>{if(!f.parent)return;const pe=el(f.parent),pl=pe.querySelector(`[data-l="${f.parentLi}"]`),ce=el(f.id);
      const px=pe.offsetLeft+14,py=pl.offsetTop+pe.offsetTop+pl.offsetHeight,cy=ce.offsetTop+18,cx=ce.offsetLeft;
      const p=document.createElementNS(ns,'path');p.setAttribute('d',`M${px},${py} V${cy} H${cx-2}`);p.setAttribute('fill','none');p.setAttribute('stroke','#e0323c');p.setAttribute('stroke-width','2.5');
      p.setAttribute('marker-end','url(#'+dom.arrows.dataset.marker+')');dom.arrows.appendChild(p);
      // return arrow: from the child's return line back up to the parent's call line, with the value
      if(ce.classList.contains('done')){const rl=ce.querySelector('[data-l="ret"]');const ry=ce.offsetTop+rl.offsetTop+rl.offsetHeight/2,bx=pe.offsetLeft+4;
        const q=document.createElementNS(ns,'path');q.setAttribute('d',`M${cx-2},${ry} H${bx} V${py+2}`);q.setAttribute('fill','none');q.setAttribute('stroke','#1f5fd6');q.setAttribute('stroke-width','2.5');
        q.setAttribute('marker-end','url(#'+dom.arrows.dataset.marker+'-ret)');dom.arrows.appendChild(q);
        const t=document.createElementNS(ns,'text');t.setAttribute('x',bx-6);t.setAttribute('y',(py+ry)/2+6);t.setAttribute('text-anchor','end');t.setAttribute('fill','#1f5fd6');t.setAttribute('font-size','16');t.setAttribute('font-weight','900');t.setAttribute('font-family','JetBrains Mono,monospace');
        t.setAttribute('paint-order','stroke');t.setAttribute('stroke','#fff');t.setAttribute('stroke-width','5');t.textContent=String(f.val);dom.arrows.appendChild(t);}});
    dom.arrows.setAttribute('width',dom.frames.scrollWidth);dom.arrows.setAttribute('height',dom.frames.scrollHeight);
    // structure + description
    draw(dom.struct,T.vals,last?last.hl:{});
    const d=dom.desc;
    if(!last){d.className='desc';d.innerHTML=`<span class="pill">התחלה</span><span>לחיצה מקדמת מהלך אחד.</span>`;}
    else{let cls=last.t,pill={call:'קריאה',if:'בדיקת תנאי',ret:'החזרת ערך',sub:'קריאה רקורסיבית',inner:'ערך ידוע'}[last.t];
      if(last.t==='if'&&last.res){cls='stop';pill='תנאי עצירה';}
      if(last.t==='sub'){cls='call';}
      const root=!R.byId.get(last.id).parent;
      if(last.t==='ret'&&root){cls='done';pill='סיום';}
      d.className='desc '+cls;d.innerHTML=`<span class="pill">${pill}</span><span>${last.text||''}</span>`+(cls==='done'?`<span class="result">${R.frames[0].label.split('(')[0]} = ${last.val}</span>`:'');}
    if(dom.counter)dom.counter.textContent=T.step===0?`${R.steps.length} מהלכים · ${R.frames.length} כניסות לפעולה`:`מהלך ${T.step} מתוך ${R.steps.length}`;
    const box=dom.scrollBox||dom.frames.parentElement;
    if(active){const e=el(active),top=e.offsetTop,bot=top+e.offsetHeight;
      if(bot>box.scrollTop+box.clientHeight-10)box.scrollTo({top:bot-box.clientHeight+24,behavior:'smooth'});
      else if(top<box.scrollTop)box.scrollTo({top:Math.max(0,top-12),behavior:'smooth'});}
    else if(last&&last.t==='ret')box.scrollTo({top:0,behavior:'smooth'});
  };
  T.next=()=>{if(T.R&&T.step<T.R.steps.length){T.step++;T.render();return true;}return false;};
  T.prev=()=>{if(T.step>0){T.step--;T.render();return true;}return false;};
  T.reset=()=>{T.step=0;T.render();};
  T.all=()=>{T.step=T.R.steps.length;T.render();};
  T.atEnd=()=>T.R&&T.step===T.R.steps.length;
  return T;
}

/* parse "3, 5, 8" → [3,5,8]; returns null when invalid */
function parseValues(str,min=1,max=10){
  const parts=str.split(/[,\s،]+/).filter(Boolean);
  if(parts.length<min||parts.length>max)return null;
  const v=parts.map(Number);if(v.some(x=>!Number.isInteger(x)||Math.abs(x)>999))return null;return v;
}
/* wire the standard control row (next/prev/reset/all + custom values) to a trace */
function wireControls(root,trace,opts){
  const q=s=>root.querySelector(s);
  const on=(k,fn)=>{const b=q(`[data-t="${k}"]`);if(b)b.onclick=fn;};
  on('next',()=>trace.next());on('prev',()=>trace.prev());on('reset',()=>trace.reset());on('all',()=>trace.all());
  const inp=q('[data-t="vals"]'),run=q('[data-t="run"]'),err=q('[data-t="err"]');
  if(inp&&run){const go=()=>{const v=parseValues(inp.value,opts.min||1,opts.max||10);if(!v){err.textContent='כתבו בין '+(opts.min||1)+' ל־'+(opts.max||10)+' מספרים שלמים, מופרדים בפסיקים.';return;}err.textContent='';trace.load(v,opts.sim);if(opts.onLoad)opts.onLoad(v);};
    run.onclick=go;inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go();}});}
  root.querySelectorAll('[data-vals]').forEach(b=>b.onclick=()=>{const v=b.dataset.vals.split(',').map(Number);if(inp)inp.value=v.join(', ');trace.load(v,opts.sim);if(opts.onLoad)opts.onLoad(v);});
}
