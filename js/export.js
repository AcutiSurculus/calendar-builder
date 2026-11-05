// PNG export: exact paper size, dpi tag, download
/* export: exact paper size + dpi tag */
function crc32(b){let c;const t=crc32.t||(crc32.t=Array.from({length:256},(_,n)=>{c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0}));let r=-1;for(const x of b)r=t[(r^x)&255]^(r>>>8);return(r^-1)>>>0}
async function tagDpi(blob,dpi){
  const buf=new Uint8Array(await blob.arrayBuffer()),ppm=Math.round(dpi/0.0254),ch=new Uint8Array(21),v=new DataView(ch.buffer);
  v.setUint32(0,9);ch.set([112,72,89,115],4);v.setUint32(8,ppm);v.setUint32(12,ppm);ch[16]=1;v.setUint32(17,crc32(ch.subarray(4,17)));
  const out=new Uint8Array(buf.length+21);out.set(buf.subarray(0,33));out.set(ch,33);out.set(buf.subarray(33),54);
  return new Blob([out],{type:"image/png"});
}
$("export").onclick=async()=>{
  const msg=$("msg"),allMonths=$("exportAll").value==="all",includeTitle=$("exportTitle").checked;
  msg.textContent=allMonths?"Preparing all months…":"Preparing image…";
  try{
    await document.fonts.ready;
    const months=allMonths?Array.from({length:12},(_,i)=>i):[S.month],files=[];
    for(let i=0;i<months.length;i++){
      const month=months[i];
      if(allMonths)msg.textContent=`Preparing month ${i+1} of 12…`;
      const blob=await exportMonth(month,S.year,includeTitle);
      files.push({name:pngFilename(month,S.year),data:new Uint8Array(await blob.arrayBuffer())});
    }
    if(allMonths){
      await saveFile(createZip(files),`calendar-${S.year}-${S.paper.toLowerCase()}-${S.orient}.zip`);
    }else{
      await saveFile(new Blob([files[0].data],{type:"image/png"}),files[0].name);
    }
    msg.textContent="Saved!";
  }catch(err){
    msg.textContent=err&&err.code==="declined"?"Download cancelled.":"Couldn’t export: "+((err&&err.message)||"unknown error");
  }
};
$("exportAll").addEventListener("change",()=>{
  $("export").textContent=$("exportAll").value==="all"?"Download ZIP":"Download PNG";
});

async function exportMonth(month,year,includeTitle){
  const [pw,ph]=dims(),dpi=S.scale*96;
  const raw=await html2canvas($("paperPreview"),{backgroundColor:null,scale:S.scale,
    onclone:d=>{
      const scaler=d.getElementById("scaler");
      scaler.style.transform="none";scaler.style.boxShadow="none";
      renderCalendarContent(d.getElementById("stage"),month,year,includeTitle);
    }});
  const cv=document.createElement("canvas");cv.width=Math.round(pw/25.4*dpi);cv.height=Math.round(ph/25.4*dpi);
  const ctx=cv.getContext("2d");
  if(!ctx)throw new Error("Couldn’t create an export canvas.");
  ctx.imageSmoothingQuality="high";ctx.drawImage(raw,0,0,cv.width,cv.height);
  const png=await new Promise(resolve=>cv.toBlob(resolve,"image/png"));
  if(!png)throw new Error("Couldn’t encode the PNG image.");
  return tagDpi(png,dpi);
}

function pngFilename(month,year){
  return `calendar-${year}-${String(month+1).padStart(2,"0")}-${MONTHS[month].toLowerCase()}-${S.paper.toLowerCase()}-${S.orient}.png`;
}

function createZip(files){
  const encoder=new TextEncoder(),local=[],central=[];
  let offset=0;
  const now=new Date(),time=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1);
  const date=((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  for(const file of files){
    const name=encoder.encode(file.name),crc=crc32(file.data),size=file.data.length;
    const header=new Uint8Array(30+name.length),v=new DataView(header.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);
    v.setUint16(8,0,true);v.setUint16(10,time,true);v.setUint16(12,date,true);
    v.setUint32(14,crc,true);v.setUint32(18,size,true);v.setUint32(22,size,true);
    v.setUint16(26,name.length,true);header.set(name,30);local.push(header,file.data);

    const entry=new Uint8Array(46+name.length),c=new DataView(entry.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);
    c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,time,true);c.setUint16(14,date,true);
    c.setUint32(16,crc,true);c.setUint32(20,size,true);c.setUint32(24,size,true);
    c.setUint16(28,name.length,true);c.setUint32(42,offset,true);entry.set(name,46);central.push(entry);
    offset+=header.length+size;
  }
  const centralSize=central.reduce((sum,entry)=>sum+entry.length,0);
  const end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
  e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  return new Blob([...local,...central,end],{type:"application/zip"});
}

// Saves via a normal browser download (works on any host).
// Inside Claude artifacts the platform "downloads" capability is used instead.
async function saveFile(blob,filename){
  const dl=window.claude?await window.claude.use("downloads"):null;
  if(dl)return dl.save({filename,data:blob});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
