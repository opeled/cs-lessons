/* Shared pieces for the recursion lesson: street drawing, route diagrams,
   and a generic recursion-trace engine (generates steps + tree layout from a config). */

/* ---------- street & scooter ---------- */
const BUILD_COLORS=['#9fd3e8','#f7c59f','#b8e0b0','#d9c3f2','#f9d976'];
function scooterSVG(x,y,scale=1){
  return `<g class="scooter" transform="translate(${x},${y}) scale(${scale})">
    <circle cx="-16" cy="0" r="9" fill="#2b2f3a"/><circle cx="-16" cy="0" r="4" fill="#cfd4dd"/>
    <circle cx="18" cy="0" r="9" fill="#2b2f3a"/><circle cx="18" cy="0" r="4" fill="#cfd4dd"/>
    <path d="M-14,-4 L-2,-4 L4,-20 L18,-20 L18,-6" fill="none" stroke="#0aa8d6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="-26" y="-38" width="24" height="21" rx="4" fill="#0aa8d6"/>
    <rect x="-23" y="-32" width="18" height="10" rx="2" fill="#fff" fill-opacity=".95"/>
    <text x="-14" y="-24" text-anchor="middle" font-family="Heebo,Arial,sans-serif" font-weight="900" font-size="7.5" fill="#0aa8d6">WOLT</text>
    <path d="M10,-20 L-4,-20" stroke="#0aa8d6" stroke-width="5" stroke-linecap="round"/>
    <path d="M2,-21 L0,-36 L10,-42" fill="none" stroke="#15233b" stroke-width="4" stroke-linecap="round"/>
    <circle cx="6" cy="-50" r="8" fill="#15233b"/><rect x="-2" y="-50" width="16" height="5" rx="2" fill="#0aa8d6"/>
    <path d="M12,-38 L22,-32" stroke="#15233b" stroke-width="4" stroke-linecap="round"/>
    <path d="M22,-32 L30,-28" stroke="#15233b" stroke-width="4" stroke-linecap="round"/>
    <path d="M28,-30 L20,-18" stroke="#0aa8d6" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}
function buildStreet(container,n){
  const W=560,H=250,ground=200,startX=50,gap=(W-100)/n,bx=i=>startX+i*gap;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s+=`<rect x="0" y="${ground}" width="${W}" height="${H-ground}" fill="#3b4252"/>`;
  s+=`<path d="M0,${ground+22} H${W}" stroke="#f5f5f5" stroke-width="3" stroke-dasharray="18 14"/>`;
  s+=`<rect x="0" y="${ground-8}" width="${W}" height="8" fill="#c9ced8"/>`;
  for(let i=1;i<=n;i++){
    const h=70+((i*37)%50),x=bx(i)-28,c=BUILD_COLORS[(i-1)%BUILD_COLORS.length];
    s+=`<rect x="${x}" y="${ground-8-h}" width="56" height="${h}" rx="3" fill="${c}" stroke="#15233b" stroke-opacity=".25"/>`;
    for(let r=0;r<Math.floor(h/22);r++)for(let k=0;k<2;k++)s+=`<rect x="${x+12+k*22}" y="${ground-8-h+10+r*22}" width="10" height="11" rx="1.5" fill="#fff" fill-opacity=".8"/>`;
    s+=`<rect x="${bx(i)-14}" y="${ground-8-h-24}" width="28" height="22" rx="6" fill="#15233b"/>`;
    s+=`<text x="${bx(i)}" y="${ground-8-h-8}" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="Heebo,sans-serif">${i}</text>`;
  }
  s+=`<text x="${bx(0)}" y="${ground+45}" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="Heebo,sans-serif">0</text>`;
  for(let i=1;i<=n;i++)s+=`<text x="${bx(i)}" y="${ground+45}" text-anchor="middle" font-size="14" fill="#cfd4dd" font-family="Heebo,sans-serif">${i}</text>`;
  s+=`<circle cx="${bx(0)}" cy="${ground-10}" r="5" fill="#e0323c"/>`;
  s+=`<g id="routes-${container.id}"></g>`;
  s+=scooterSVG(bx(0),ground-12,.85);
  s+=`</svg>`;
  container.innerHTML=s;container._bx=bx;container._ground=ground;
}
function arcPath(x1,x2,y,lift){const mx=(x1+x2)/2;return `M${x1},${y} Q${mx},${y-lift} ${x2},${y}`;}
function jumpColor(st){return st===1?'#1f5fd6':st===2?'#e0323c':'#c77a00';}
function showRoute(container,steps){
  const g=container.querySelector(`#routes-${container.id}`),bx=container._bx,y=container._ground-14;
  let pos=0,paths=[];g.innerHTML='';
  steps.forEach(st=>{const a=bx(pos),b=bx(pos+st),lift=st===1?55:st===2?95:130,c=jumpColor(st);
    g.innerHTML+=`<path d="${arcPath(a,b,y,lift)}" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="6 6" opacity=".9"/>
      <text x="${(a+b)/2}" y="${y-lift/2-6}" text-anchor="middle" font-size="16" font-weight="900" fill="${c}" font-family="Heebo,sans-serif">+${st}</text>`;
    paths.push([a,b,lift]);pos+=st;});
  animateScooter(container,paths);
}
function animateScooter(container,segs){
  const sc=container.querySelector('.scooter');if(!sc)return;
  const y=container._ground-12;let i=0;
  if(container._anim)cancelAnimationFrame(container._anim);
  function run(){
    if(i>=segs.length)return;
    const [a,b,lift]=segs[i],t0=performance.now(),dur=700;
    function frame(now){
      const t=Math.min(1,(now-t0)/dur),e=t<.5?2*t*t:-1+(4-2*t)*t;
      sc.setAttribute('transform',`translate(${a+(b-a)*e},${y-4*lift*.6*e*(1-e)}) scale(.85)`);
      if(t<1)container._anim=requestAnimationFrame(frame);else{i++;setTimeout(run,150);}
    }
    container._anim=requestAnimationFrame(frame);
  }
  sc.setAttribute('transform',`translate(${container._bx(0)},${y}) scale(.85)`);setTimeout(run,100);
}
function routeSVG(steps,n=3){
  const W=300,H=74,y=58,x0=22,gap=(W-44)/n,bx=i=>x0+i*gap;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="rm" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#15233b"/></marker></defs>
    <line x1="${bx(0)}" y1="${y}" x2="${bx(n)}" y2="${y}" stroke="#c9ced8" stroke-width="3"/>`;
  let pos=0;const visited=new Set([0]);
  steps.forEach(st=>{const a=bx(pos),b=bx(pos+st),lift=st===1?30:48,c=jumpColor(st);
    s+=`<path d="M${a},${y-9} Q${(a+b)/2},${y-lift-9} ${b-4},${y-10}" fill="none" stroke="${c}" stroke-width="2.5" marker-end="url(#rm)"/>
        <circle cx="${(a+b)/2}" cy="${y-lift/2-12}" r="10" fill="${c}"/><text x="${(a+b)/2}" y="${y-lift/2-8}" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" font-family="Heebo,sans-serif">${st}</text>`;
    pos+=st;visited.add(pos);});
  for(let i=0;i<=n;i++){const v=visited.has(i);
    s+=`<circle cx="${bx(i)}" cy="${y}" r="${v?10:7}" fill="${v?'#15233b':'#fff'}" stroke="#15233b" stroke-width="2"/>
        <text x="${bx(i)}" y="${y+4.5}" text-anchor="middle" font-size="12" font-weight="700" fill="${v?'#fff':'#5b6b85'}" font-family="JetBrains Mono,monospace">${i}</text>`;}
  return s+'</svg>';
}
/* the "last rides" illustration: arcs into building n from n-1 / n-2 (hidden by default when opts.hidden) */
function lastRidesArcs(street,hidden){
  const g=street.querySelector(`#routes-${street.id}`),bx=street._bx,y=street._ground-14,op=hidden?0:1;
  g.innerHTML=`<g class="arc1" opacity="${op}"><path d="${arcPath(bx(3),bx(4),y,55)}" fill="none" stroke="#1f5fd6" stroke-width="4"/>
   <text x="${(bx(3)+bx(4))/2}" y="${y-40}" text-anchor="middle" font-size="14" font-weight="900" fill="#1f5fd6" font-family="Heebo,sans-serif">+1</text>
   <rect x="${bx(3)-46}" y="${y+28}" width="92" height="22" rx="6" fill="#1f5fd6"/><text x="${bx(3)}" y="${y+44}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Heebo,sans-serif">Ways(n−1)</text></g>
   <g class="arc2" opacity="${op}"><path d="${arcPath(bx(2),bx(4),y,120)}" fill="none" stroke="#e0323c" stroke-width="4"/>
   <text x="${(bx(2)+bx(4))/2}" y="${y-98}" text-anchor="middle" font-size="14" font-weight="900" fill="#e0323c" font-family="Heebo,sans-serif">+2</text>
   <rect x="${bx(2)-46}" y="${y+28}" width="92" height="22" rx="6" fill="#e0323c"/><text x="${bx(2)}" y="${y+44}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Heebo,sans-serif">Ways(n−2)</text></g>`;
  street.querySelector('.scooter').setAttribute('transform',`translate(${bx(4)},${y+2}) scale(.85)`);
}

/* ---------- generic recursion trace ----------
   cfg: { name:'Ways', jumps:[1,2], n:4, base:'fib'|'zero', memo:false }
   base 'fib'  : if (n == 1) return 1; if (n == 2) return 2;
   base 'zero' : if (n == 0) return 1; if (n < 0) return 0;
   Produces nodes (with layout) and a list of single "moves" (steps). */
const TRACE_PRESETS={
  ways4:{key:'ways4',label:'Ways(4) – קפיצות 1, 2',name:'Ways',jumps:[1,2],n:4,base:'fib',memo:false},
  ways5:{key:'ways5',label:'Ways5(5) – קפיצות 1, 2, 5',name:'Ways5',jumps:[1,2,5],n:5,base:'zero',memo:true},
};
function genTrace(cfg){
  const nodes=[],steps=[],memoVals=new Map();let idc=0;
  const N=cfg.name,J=cfg.jumps;
  const checksFor=n=>cfg.base==='fib'
    ?[{line:'if (n == 1)',res:n===1,val:1},{line:'if (n == 2)',res:n===2,val:2}]
    :[{line:'if (n == 0)',res:n===0,val:0+1},{line:'if (n < 0)',res:n<0,val:0}];
  const why=(c,n)=>cfg.base==='fib'
    ?(c.res?`${c.line.replace('n',n)} מתקיים: תנאי עצירה, מחזירים ${c.val}.`:`האם ${c.line.slice(4,-1).replace('n',n)}? לא.`)
    :(c.res?(n===0?`n == 0: הגענו בדיוק לבניין היעד, זו דרך אחת. מחזירים 1.`:`n < 0: קפצנו מעבר ליעד, אין כאן דרך. מחזירים 0.`):`האם ${c.line.slice(4,-1).replace('n',n)}? לא.`);
  function visit(n,parent,slot,depth){
    const id='N'+(idc++);
    if(cfg.memo&&memoVals.has(n)){
      const v=memoVals.get(n);
      nodes.push({id,n,parent,slot,depth,kind:'memo',val:v});
      steps.push({t:'memo',id,val:v,text:`${N}(${n}) כבר חושבה קודם במעקב, הערך שלה ${v}. אין צורך לפתוח אותה שוב: מציינים ״חושב כבר״ ומשתמשים בערך.`});
      return v;
    }
    const node={id,n,parent,slot,depth,kind:'node',val:null,checks:[],slots:[]};nodes.push(node);
    steps.push({t:'call',id,text:parent===null?`קוראים ל־${N} עם n = ${n}. נפתחת קריאה חדשה.`:`קריאה רקורסיבית: ${N}(${n}). הקריאה הקודמת ״מחכה״ עד שתחזור תשובה.`});
    const checks=checksFor(n);node.checks=checks.map(c=>c.line);
    for(let i=0;i<checks.length;i++){const c=checks[i];
      steps.push({t:'if',id,line:i,res:c.res,text:`ב־${N}(${n}): ${why(c,n)}`});
      if(c.res){node.kind='base';node.val=c.val;node.hit=i;
        steps.push({t:'ret',id,val:c.val,text:`${N}(${n}) מחזירה ${c.val}${parent!==null?` אל ${N}(${nodes.find(x=>x.id===parent).n})`:''}.`});
        if(cfg.memo)memoVals.set(n,c.val);   // a base case seen once is also "known" from now on
        return c.val;}
    }
    node.slots=J.map((j,k)=>({label:`p${k+1} = ${N}(${n-j})`,val:null}));
    const vals=[];let sum=0;
    J.forEach((j,k)=>{const v=visit(n-j,id,k,depth+1);vals.push(v);sum+=v;node.slots[k].val=v;});
    node.val=sum;
    steps.push({t:'ret',id,val:sum,expr:vals.join(' + '),text:`ל־${N}(${n}) יש את כל הערכים: מחזירה ${J.map((j,k)=>'p'+(k+1)).join(' + ')} = ${vals.join(' + ')} = ${sum}${parent!==null?` אל ${N}(${nodes.find(x=>x.id===parent).n})`:'. זו התשובה הסופית'}.`});
    if(cfg.memo)memoVals.set(n,sum);
    return sum;
  }
  visit(cfg.n,null,null,0);
  return {nodes,steps};
}
/* tidy tree layout (contour based): subtrees at different depths may share x ranges,
   so a long chain with small leaves stays compact. y by depth. */
function layoutTree(nodes,J){
  const W={node:210,base:150,memo:170},GAPX=24,GAPY=50;
  const H={node:40+(2+J+1)*26,base:40+3*26,memo:50};
  const byId=new Map(nodes.map(n=>[n.id,n]));
  nodes.forEach(n=>{n.kids=[];n.boxW=W[n.kind];});
  nodes.forEach(n=>{if(n.parent)byId.get(n.parent).kids.push(n);});
  const root=nodes.find(n=>!n.parent);
  // returns contour: array per relative depth of [minX,maxX] relative to this node's center
  function build(n){
    const half=n.boxW/2;
    if(!n.kids.length){n.rel=0;return [[-half,half]];}
    const cons=n.kids.map(build);
    const offs=[0];let merged=cons[0].map(c=>c.slice());
    for(let i=1;i<n.kids.length;i++){
      const c=cons[i];let shift=-Infinity;
      for(let d=0;d<Math.min(merged.length,c.length);d++)shift=Math.max(shift,merged[d][1]-c[d][0]+GAPX);
      offs.push(shift);
      for(let d=0;d<c.length;d++){const lo=c[d][0]+shift,hi=c[d][1]+shift;if(d<merged.length){merged[d][0]=Math.min(merged[d][0],lo);merged[d][1]=Math.max(merged[d][1],hi);}else merged.push([lo,hi]);}
    }
    const mid=(offs[0]+offs[offs.length-1])/2;           // parent centred over its children
    n.kids.forEach((k,i)=>{k.rel=offs[i]-mid;});
    const cont=[[-half,half]].concat(merged.map(([lo,hi])=>[lo-mid,hi-mid]));
    return cont;
  }
  const cont=build(root);
  const minX=Math.min(...cont.map(c=>c[0])),maxX=Math.max(...cont.map(c=>c[1]));
  const depthH=[];nodes.forEach(n=>{depthH[n.depth]=Math.max(depthH[n.depth]||0,H[n.kind]);});
  const depthY=[];let y=30;depthH.forEach((h,d)=>{depthY[d]=y;y+=h+GAPY;});
  function place(n,cx){n.x=cx-n.boxW/2;n.y=depthY[n.depth];n.kids.forEach(k=>place(k,cx+k.rel));}
  place(root,20-minX);
  return {width:maxX-minX+40,height:y};
}
/* controller bound to a DOM stage */
function makeTrace(dom){ // dom: {stage, arrows, desc, counter, wrapHeight?:number}
  const T={cfg:null,nodes:[],steps:[],step:0,size:{width:900,height:600}};
  const ns='http://www.w3.org/2000/svg';
  function el(id){return dom.stage.querySelector('#node-'+id);}
  T.load=function(cfg){
    T.cfg=cfg;const g=genTrace(cfg);T.nodes=g.nodes;T.steps=g.steps;T.step=0;
    T.size=layoutTree(T.nodes,cfg.jumps.length);
    dom.stage.querySelectorAll('.node,.main-box').forEach(e=>e.remove());
    dom.stage.style.width=T.size.width+'px';dom.stage.style.height=T.size.height+'px';
    const root=T.nodes[0];
    const mb=document.createElement('div');mb.className='main-box';mb.textContent=`Main: ${cfg.name}(${cfg.n})`;mb.style.left=(root.x+root.boxW/2-70)+'px';dom.stage.appendChild(mb);
    T.nodes.forEach(nd=>{
      const d=document.createElement('div');d.className='node '+nd.kind;d.id='node-'+nd.id;d.style.left=nd.x+'px';d.style.top=nd.y+'px';d.style.width=nd.boxW+'px';
      if(nd.kind==='memo'){d.innerHTML=`<div class="memo-line"><span>${cfg.name}(${nd.n}) = ${nd.val}</span><span class="tag-known">חושב כבר</span></div>`;}
      else{d.innerHTML=`<div class="head">${cfg.name}(n = ${nd.n})</div>`+
        nd.checks.map((c,i)=>`<div class="ln" data-l="if${i}"><span>${c}</span><span class="r"></span></div>`).join('')+
        (nd.kind==='node'?nd.slots.map((s,k)=>`<div class="ln" data-l="p${k}"><span>${s.label}</span><span class="r"></span></div>`).join(''):'')+
        `<div class="ln ret" data-l="ret"><span></span><span class="r"></span></div>`;}
      dom.stage.appendChild(d);
    });
    T.render();
  };
  function center(id){const e=el(id);return {x:e.offsetLeft+e.offsetWidth/2,top:e.offsetTop,bottom:e.offsetTop+e.offsetHeight};}
  function line(x1,y1,x2,y2,cls,label){
    const p=document.createElementNS(ns,'line');
    p.setAttribute('x1',x1);p.setAttribute('y1',y1);p.setAttribute('x2',x2);p.setAttribute('y2',y2);
    p.setAttribute('stroke',cls==='call'?'#e0323c':'#1f5fd6');p.setAttribute('stroke-width','3');
    if(cls==='memo')p.setAttribute('stroke-dasharray','6 5');
    p.setAttribute('marker-end',`url(#m-${cls==='call'?'call':'ret'})`);dom.arrows.appendChild(p);
    if(label!==undefined){const t=document.createElementNS(ns,'text');t.setAttribute('x',x1+(x2-x1)*.38+24);t.setAttribute('y',y1+(y2-y1)*.38+7);
      t.setAttribute('fill','#1f5fd6');t.setAttribute('font-size','20');t.setAttribute('font-weight','900');t.setAttribute('font-family','JetBrains Mono,monospace');
      t.setAttribute('text-anchor','middle');t.setAttribute('paint-order','stroke');t.setAttribute('stroke','#fff');t.setAttribute('stroke-width','6');t.textContent=label;dom.arrows.appendChild(t);}
  }
  T.render=function(){
    const J=T.cfg.jumps.length;
    T.nodes.forEach(nd=>{const e=el(nd.id);e.className='node '+nd.kind;e.querySelectorAll('.ln').forEach(l=>{l.className='ln'+(l.dataset.l==='ret'?' ret':'');l.querySelector('.r').textContent='';if(l.dataset.l==='ret')l.firstElementChild.textContent='';});});
    dom.arrows.querySelectorAll('line,text').forEach(e=>e.remove());
    let last=null,activeId=null;const finished=new Set(),pending=[];
    const byId=new Map(T.nodes.map(n=>[n.id,n]));
    const slotOff=(nd)=>{const k=nd.slot,c=J;return (k-(c-1)/2)*44;};
    for(let i=0;i<T.step;i++){
      const s=T.steps[i],nd=byId.get(s.id),e=el(s.id);last=s;e.classList.add('show');
      e.querySelectorAll('.ln.cur').forEach(l=>l.classList.remove('cur'));
      if(s.t==='call'){activeId=s.id;
        if(nd.parent){const pe=el(nd.parent);pe.querySelectorAll('.ln.cur').forEach(l=>l.classList.remove('cur'));pe.querySelector(`[data-l="p${nd.slot}"]`).classList.add('show','cur');pending.push({kind:'call',nd});}
      }else if(s.t==='memo'){
        const pe=el(nd.parent);pe.querySelectorAll('.ln.cur').forEach(l=>l.classList.remove('cur'));
        const pl=pe.querySelector(`[data-l="p${nd.slot}"]`);pl.classList.add('show','cur');pl.querySelector('.r').innerHTML=`<span class="v">→ ${s.val}</span>`;
        finished.add(s.id);pending.push({kind:'call',nd});pending.push({kind:'memo',nd,val:s.val});activeId=nd.parent;
      }else if(s.t==='if'){const l=e.querySelector(`[data-l="if${s.line}"]`);l.classList.add('show','cur');
        l.querySelector('.r').innerHTML=s.res?'<span class="ok">✓</span>':'<span class="x">✗</span>';if(s.res)l.classList.add('stop-hit');activeId=s.id;
      }else if(s.t==='ret'){const r=e.querySelector('[data-l="ret"]');r.classList.add('show','cur');
        if(nd.kind==='base'){r.firstElementChild.textContent='return '+s.val;r.querySelector('.r').textContent='';}
        else{r.firstElementChild.textContent='return '+T.cfg.jumps.map((j,k)=>'p'+(k+1)).join(' + ');r.querySelector('.r').textContent=`= ${s.val}`;}
        finished.add(s.id);
        if(nd.parent){const pe=el(nd.parent),pl=pe.querySelector(`[data-l="p${nd.slot}"]`);pl.querySelector('.r').innerHTML=`<span class="v">→ ${s.val}</span>`;
          pe.querySelectorAll('.ln.cur').forEach(l=>l.classList.remove('cur'));pl.classList.add('cur');pending.push({kind:'ret',nd,val:s.val});activeId=nd.parent;}
        else activeId=null;
      }
    }
    T.nodes.forEach(nd=>{const e=el(nd.id);if(finished.has(nd.id))e.classList.add('done');if(nd.id===activeId)e.classList.add('active');});
    pending.forEach(a=>{const pc=center(a.nd.parent),cc=center(a.nd.id),off=slotOff(a.nd);
      if(a.kind==='call')line(pc.x+off-12,pc.bottom+2,cc.x-12,cc.top-2,'call');
      else line(cc.x+12,cc.top-2,pc.x+off+12,pc.bottom+2,a.kind==='memo'?'memo':'ret',String(a.val));});
    // description
    const d=dom.desc;
    if(!last){d.className='desc';d.innerHTML=`<span class="pill">התחלה</span><span>לחיצה מקדמת מהלך אחד.</span>`;}
    else{let cls=last.t,pill={call:'קריאה רקורסיבית',if:'בדיקת תנאי',ret:'החזרת ערך',memo:'ערך ידוע'}[last.t];
      if(last.t==='if'&&last.res){cls='stop';pill='תנאי עצירה';}
      if(last.t==='ret'&&!byId.get(last.id).parent){cls='done';pill='סיום';}
      d.className='desc '+cls;d.innerHTML=`<span class="pill">${pill}</span><span>${last.text}</span>`+(cls==='done'?`<span class="result">${T.cfg.name}(${T.cfg.n}) = ${last.val}</span>`:'');}
    if(dom.counter)dom.counter.textContent=T.step===0?`${T.steps.length} מהלכים · ${T.nodes.length} כניסות לפעולה`:`מהלך ${T.step} מתוך ${T.steps.length}`;
    T.fit(activeId);
  };
  /* two view modes: "follow" keeps boxes at full size and pans the view to the active call;
     "fit" scales the whole tree into the viewport. fit is used automatically at the end. */
  T.fitAll=false;
  T.fit=function(activeId){
    const wrap=dom.stage.parentElement,availW=wrap.clientWidth-2;
    const wantH=dom.wrapHeight||Math.min(T.size.height,dom.maxHeight||760);
    wrap.style.height=wantH+'px';
    const availH=wrap.clientHeight-2;
    const fitScale=Math.min(1,availW/T.size.width,availH/T.size.height);
    const useFit=T.fitAll||T.step===T.steps.length||fitScale>=0.8;
    const sc=useFit?fitScale:1;
    dom.stage.style.transform=`scale(${sc})`;
    dom.stage.style.left=Math.max(0,(availW-T.size.width*sc)/2)+'px';
    // spacer so the scroll area matches the scaled size
    dom.stage.style.marginBottom=(T.size.height*(sc-1))+'px';
    dom.stage.style.marginRight=(T.size.width*(sc-1))+'px';
    if(useFit){wrap.scrollTo({top:0,left:0,behavior:'smooth'});return;}
    if(activeId){const e=el(activeId);
      const cx=(e.offsetLeft+e.offsetWidth/2)*sc,top=e.offsetTop*sc,bot=(e.offsetTop+e.offsetHeight)*sc;
      const vw=wrap.clientWidth,vh=wrap.clientHeight;
      let left=wrap.scrollLeft,topS=wrap.scrollTop;
      if(cx-vw/2<left||cx+vw/2>left+vw)left=Math.max(0,cx-vw/2);
      if(bot>topS+vh-20)topS=bot-vh+40;else if(top<topS+10)topS=Math.max(0,top-30);
      wrap.scrollTo({top:topS,left,behavior:'smooth'});}
  };
  T.next=()=>{if(T.step<T.steps.length){T.step++;T.render();return true;}return false;};
  T.prev=()=>{if(T.step>0){T.step--;T.render();return true;}return false;};
  T.reset=()=>{T.step=0;T.render();};
  T.all=()=>{T.step=T.steps.length;T.render();};
  T.atEnd=()=>T.step===T.steps.length;
  return T;
}
/* static, fully expanded tree picture (for the complexity slide) */
function staticTree(container,cfg){
  const g=genTrace(cfg),size=layoutTree(g.nodes,cfg.jumps.length);
  const W=size.width,H=size.height;
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">`;
  g.nodes.forEach(nd=>{if(nd.parent){const p=g.nodes.find(x=>x.id===nd.parent);
    s+=`<line x1="${p.x+p.boxW/2}" y1="${p.y+30}" x2="${nd.x+nd.boxW/2}" y2="${nd.y}" stroke="#e0323c" stroke-width="2" opacity=".7"/>`;}});
  g.nodes.forEach(nd=>{const base=nd.kind!=='node';
    s+=`<rect x="${nd.x}" y="${nd.y}" width="${nd.boxW}" height="30" rx="8" fill="${base?(nd.n<0?'#fde8e9':'#e4f6ec'):'#15233b'}" stroke="${base?'#c9ced8':'none'}"/>
        <text x="${nd.x+nd.boxW/2}" y="${nd.y+20}" text-anchor="middle" font-size="15" font-weight="700" fill="${base?'#15233b':'#fff'}" font-family="JetBrains Mono,monospace">${cfg.name}(${nd.n})</text>`;});
  s+='</svg>';container.innerHTML=s;return g.nodes.length;
}
