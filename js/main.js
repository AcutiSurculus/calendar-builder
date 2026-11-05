// Entry point: one render() that refreshes everything, then first paint
function render(){
  renderWorkspace();
  renderCalendar();
  place();syncPos();updateInfo();
}

const hasSavedProgress=restoreSavedProgress();
syncControls();
render();
if(!hasSavedProgress){
  const [paperWidth,paperHeight]=dims(),size=stageSizeMm();
  S.x=+((paperWidth-size.width)/2).toFixed(1);
  S.y=+((paperHeight-size.height)/2).toFixed(1);
  render();
}
initializeHistory();
saveProgress();
const loadingScreen=$("loadingScreen");
const loadingStartedAt=performance.now();
const showWorkspace=()=>{
  requestAnimationFrame(()=>requestAnimationFrame(()=>loadingScreen.classList.add("is-hidden")));
};
window.setTimeout(showWorkspace,Math.max(0,2000-(performance.now()-loadingStartedAt)));
loadingScreen.addEventListener("transitionend",event=>{
  if(event.target===loadingScreen&&event.propertyName==="opacity")loadingScreen.remove();
});
