// Pointer and keyboard editing on the paper: move, nudge, resize, holiday toggle
/* drag to move */
let drag=null;
stage.addEventListener("pointerdown",e=>{
  drag={mx:e.clientX,my:e.clientY,ox:S.x,oy:S.y,moved:false,t:e.target};
  stage.setPointerCapture(e.pointerId);stage.focus({preventScroll:true});
});
stage.addEventListener("pointermove",e=>{
  if(!drag)return;
  const dx=e.clientX-drag.mx,dy=e.clientY-drag.my;
  if(!drag.moved&&Math.hypot(dx,dy)<4)return;
  drag.moved=true;
  let x=drag.ox+dx/Z/PXMM,y=drag.oy+dy/Z/PXMM,cx=0,cy=0;
  const [pw,ph]=dims(),w=stage.offsetWidth/PXMM,h=stage.offsetHeight/PXMM;
  if(S.snap){
    const th=6/Z/PXMM;
    const sn=(v,sz,P)=>{for(const[c,m]of[[(P-sz)/2,1],[S.margin,0],[P-S.margin-sz,0]])if(Math.abs(v-c)<th)return[c,m];return[v,0]};
    [x,cx]=sn(x,w,pw);[y,cy]=sn(y,h,ph);
  }
  S.x=x;S.y=y;place();syncPos();
  $("gv").style.display=cx?"block":"none";$("gv").style.left=pw/2*PXMM+"px";
  $("gh").style.display=cy?"block":"none";$("gh").style.top=ph/2*PXMM+"px";
});
function endDrag(e){
  if(!drag)return;
  if(!drag.moved){
    const d=drag.t.closest&&drag.t.closest("[data-d]");
    if(d){const key=(S.month+1)+"-"+d.dataset.d;HOL.has(key)?HOL.delete(key):HOL.add(key);recordHistory();render()}
  }else recordHistory();
  drag=null;$("gv").style.display=$("gh").style.display="none";
}
stage.addEventListener("pointerup",endDrag);
stage.addEventListener("pointercancel",()=>{
  if(drag&&drag.moved)recordHistory();
  drag=null;$("gv").style.display=$("gh").style.display="none";
});
stage.addEventListener("keydown",e=>{
  const s=e.shiftKey?10:1,mv={ArrowLeft:[-s,0],ArrowRight:[s,0],ArrowUp:[0,-s],ArrowDown:[0,s]}[e.key];
  if(!mv)return;e.preventDefault();S.x+=mv[0];S.y+=mv[1];place();syncPos();
  recordHistory(`nudge:${e.key}:${e.shiftKey}`);
});
stage.addEventListener("keyup",e=>{
  if(e.key.startsWith("Arrow"))finishHistoryGroup();
});

function scaledShape(start,factor){
  S.width=Math.max(30,start.width*factor);
  const applied=S.width/start.width;
  S.gapX=start.gapX*applied;S.gapY=start.gapY*applied;S.boxHeight=start.boxHeight*applied;
  S.rad=start.rad*applied;S.bw=start.bw*applied;
}
function scaledWidth(start,factor){
  S.width=Math.max(30,start.width*factor);
  const applied=S.width/start.width;
  S.gapX=start.gapX*applied;S.gapY=start.gapY;S.boxHeight=start.boxHeight;
  S.rad=start.rad*applied;S.bw=start.bw*applied;S.scaleY=start.scaleY;
}

/* Mid-edge handles resize only the axis they sit on. */
document.querySelectorAll(".resize-handle[data-edge]").forEach(handle=>{
  handle.addEventListener("pointerdown",e=>{
    e.preventDefault();e.stopPropagation();
    const edge=handle.dataset.edge,sx=e.clientX,sy=e.clientY;
    const bounds0=stageBoundsMm(),start={width:S.width,gapX:S.gapX,gapY:S.gapY,boxHeight:S.boxHeight,rad:S.rad,bw:S.bw,scaleY:S.scaleY};
    const centerX=bounds0.left+bounds0.width/2,centerY=bounds0.top+bounds0.height/2;
    handle.setPointerCapture(e.pointerId);
    const move=ev=>{
      if(edge==="e"||edge==="w"){
        const signed=(ev.clientX-sx)/Z/PXMM*(edge==="e"?1:-1);
        scaledWidth(start,Math.max(30,bounds0.width+signed)/bounds0.width);
      }else{
        const signed=(ev.clientY-sy)/Z/PXMM*(edge==="s"?1:-1);
        const targetHeight=Math.max(30,bounds0.height+signed);
        S.scaleY=Math.max(0.1,Math.min(10,start.scaleY*targetHeight/bounds0.height));
      }
      render();
      let bounds=stageBoundsMm();
      if(edge==="e"||edge==="w"){
        S.scaleY=Math.max(0.1,Math.min(10,start.scaleY*bounds0.height/bounds.height));
        render();
        bounds=stageBoundsMm();
      }
      if(ev.altKey){
        S.x+=centerX-(bounds.left+bounds.width/2);
        S.y+=centerY-(bounds.top+bounds.height/2);
      }else if(edge==="e")S.x+=bounds0.left-bounds.left;
      else if(edge==="w")S.x+=bounds0.left+bounds0.width-(bounds.left+bounds.width);
      else if(edge==="s")S.y+=bounds0.top-bounds.top;
      else S.y+=bounds0.top+bounds0.height-(bounds.top+bounds.height);
      place();syncPos();
    };
    const end=()=>{
      recordHistory();
      handle.removeEventListener("pointermove",move);
      handle.removeEventListener("pointerup",end);
      handle.removeEventListener("pointercancel",end);
      handle.removeEventListener("lostpointercapture",end);
    };
    handle.addEventListener("pointermove",move);
    handle.addEventListener("pointerup",end);
    handle.addEventListener("pointercancel",end);
    handle.addEventListener("lostpointercapture",end);
  });
});

/* Drag corners with proportional or free transforms. */
document.querySelectorAll(".resize-handle[data-corner]").forEach(handle=>{
  handle.addEventListener("pointerdown",e=>{
    e.preventDefault();e.stopPropagation();
    const corner=handle.dataset.corner;
    const sx=e.clientX,sy=e.clientY;
    const bounds0=stageBoundsMm(),w0=bounds0.width,h0=bounds0.height;
    const start={width:S.width,gapX:S.gapX,gapY:S.gapY,boxHeight:S.boxHeight,rad:S.rad,bw:S.bw,scaleY:S.scaleY};
    const right=corner.endsWith("e"),bottom=corner.startsWith("s");
    const oppositeX=bounds0.left+(right?0:w0),oppositeY=bounds0.top+(bottom?0:h0);
    const centerX=bounds0.left+w0/2,centerY=bounds0.top+h0/2,aspect=h0/w0;
    handle.setPointerCapture(e.pointerId);
    const move=ev=>{
      const rawX=(ev.clientX-sx)/Z/PXMM,rawY=(ev.clientY-sy)/Z/PXMM;
      const dx=rawX*(right?1:-1),dy=rawY*(bottom?1:-1);
      if(ev.shiftKey){
        const nextWidth=Math.max(30,w0+dx),targetHeight=Math.max(30,h0+dy);
        scaledWidth(start,nextWidth/w0);
        render();
        const provisionalHeight=stageSizeMm().height;
        S.scaleY=Math.max(0.1,Math.min(10,start.scaleY*targetHeight/provisionalHeight));
      }else{
        const delta=(dx+dy*aspect)/(1+aspect*aspect);
        scaledShape(start,Math.max(30,w0+delta)/w0);
      }
      render();
      const bounds=stageBoundsMm();
      if(ev.altKey){
        S.x+=centerX-(bounds.left+bounds.width/2);S.y+=centerY-(bounds.top+bounds.height/2);
      }else{
        const targetLeft=right?bounds0.left:oppositeX-bounds.width;
        const targetTop=bottom?bounds0.top:oppositeY-bounds.height;
        S.x+=targetLeft-bounds.left;S.y+=targetTop-bounds.top;
      }
      place();syncPos();
    };
    const end=()=>{
      recordHistory();
      handle.removeEventListener("pointermove",move);
      handle.removeEventListener("pointerup",end);
      handle.removeEventListener("pointercancel",end);
      handle.removeEventListener("lostpointercapture",end);
    };
    handle.addEventListener("pointermove",move);
    handle.addEventListener("pointerup",end);
    handle.addEventListener("pointercancel",end);
    handle.addEventListener("lostpointercapture",end);
  });
});
