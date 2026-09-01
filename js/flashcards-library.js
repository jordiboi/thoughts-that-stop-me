(()=>{const q=s=>document.querySelector(s),list=q("#study-deck-list"),board=q("#flash-study-board"),dialog=q("#flash-rules-dialog"),title=q("#flash-rules-title"),count=q("#flash-practice-count"),random=q("#flash-random-order"),selector=q("#flash-selector"),mini=q("#flash-mini-grid"),selectionText=q("#flash-selection-count"),tooltip=q("#flash-tooltip");let data={flashcardDecks:[]},deck=null,selected=new Set(),session=[],idx=0,answer=false,menu=null;const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));async function load(){try{data=await(await fetch("../../js/data/studies-data.json",{cache:"no-store"})).json()}catch{}renderDecks()}function decks(){return(data.flashcardDecks||[]).filter(d=>d.published!==false)}function renderDecks(){const ds=decks();list.innerHTML=ds.length?ds.map(d=>`<div class="study-deck-row" data-id="${esc(d.id)}"><button class="study-deck-open ${deck?.id===d.id?"active":""}" type="button"><span class="study-deck-dot" style="background:${esc(d.color||"#777")}"></span><span>${esc(d.name)}</span></button><button class="study-deck-more" type="button" aria-label="Deck options">⋯</button></div>`).join(""):'<p class="category-empty">No published decks yet.</p>'}function choose(id){deck=decks().find(d=>d.id===id);if(!deck)return;selected=new Set(deck.cards.map(c=>c.id));title.textContent=deck.name;count.max=deck.cards.length;count.value=Math.min(10,deck.cards.length)||1;selector.hidden=true;renderMini();renderDecks();dialog.showModal()}list.addEventListener("click",e=>{const row=e.target.closest("[data-id]");if(!row)return;if(e.target.closest(".study-deck-open"))choose(row.dataset.id);if(e.target.closest(".study-deck-more")){menu?.remove();const d=decks().find(x=>x.id===row.dataset.id),m=document.createElement("div");m.className="study-deck-menu";m.innerHTML=`<button type="button" data-open>Open deck</button>${d.pdfPath?`<a href="../../${encodeURI(d.pdfPath)}" download>Download printable PDF</a>`:'<span class="study-menu-disabled">Printable PDF not generated yet</span>'}`;document.body.appendChild(m);const r=e.target.getBoundingClientRect();m.style.left=`${Math.min(r.left,innerWidth-230)}px`;m.style.top=`${r.bottom+4}px`;menu=m;m.addEventListener("click",ev=>{if(ev.target.closest("[data-open]"))choose(d.id)});}});document.addEventListener("click",e=>{if(menu&&!e.target.closest(".study-deck-more")&&!e.target.closest(".study-deck-menu")){menu.remove();menu=null}});function renderMini(){if(!deck)return;mini.innerHTML=deck.cards.map((c,i)=>`<button class="flash-mini-card ${selected.has(c.id)?"selected":""}" data-id="${esc(c.id)}" data-i="${i}" type="button">${String(i+1).padStart(2,"0")}</button>`).join("");selectionText.textContent=`${selected.size} card${selected.size===1?"":"s"} selected`;if(!selector.hidden)count.value=Math.max(1,selected.size)}mini.addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(!b)return;selected.has(b.dataset.id)?selected.delete(b.dataset.id):selected.add(b.dataset.id);renderMini()});let hoveredMini=null,shiftHeld=false,lastPointer={x:0,y:0};
function positionFlashPreview(){
  if(tooltip.hidden)return;
  const rect=tooltip.getBoundingClientRect(),gap=18;
  let left=lastPointer.x+gap,top=lastPointer.y+gap;
  if(left+rect.width>innerWidth-12)left=Math.max(12,lastPointer.x-rect.width-gap);
  if(top+rect.height>innerHeight-12)top=Math.max(12,lastPointer.y-rect.height-gap);
  const dialogRect=dialog.getBoundingClientRect();
  tooltip.style.left=`${left-dialogRect.left}px`;
  tooltip.style.top=`${top-dialogRect.top}px`;
}
function showFlashPreview(){
  if(!shiftHeld||!hoveredMini||!deck){tooltip.hidden=true;return}
  const c=deck.cards[+hoveredMini.dataset.i];
  if(!c){tooltip.hidden=true;return}
  q("#flash-tooltip-q").textContent=c.question;
  tooltip.style.setProperty("--deck-color",deck.color||"#777777");
  tooltip.hidden=false;
  requestAnimationFrame(positionFlashPreview);
}
mini.addEventListener("pointermove",e=>{
  lastPointer={x:e.clientX,y:e.clientY};
  hoveredMini=e.target.closest("[data-i]");
  shiftHeld=e.shiftKey||shiftHeld;
  showFlashPreview();
  positionFlashPreview();
});
mini.addEventListener("pointerover",e=>{
  const b=e.target.closest("[data-i]");
  if(!b)return;
  hoveredMini=b;
  lastPointer={x:e.clientX,y:e.clientY};
  shiftHeld=e.shiftKey||shiftHeld;
  showFlashPreview();
});
mini.addEventListener("pointerout",e=>{
  const leaving=e.target.closest("[data-i]");
  const entering=e.relatedTarget&&e.relatedTarget.closest?e.relatedTarget.closest("[data-i]"):null;
  if(leaving&&leaving!==entering){hoveredMini=entering;tooltip.hidden=true}
});
document.addEventListener("keydown",e=>{if(e.key==="Shift"){shiftHeld=true;showFlashPreview()}});
document.addEventListener("keyup",e=>{if(e.key==="Shift"){shiftHeld=false;tooltip.hidden=true}});
window.addEventListener("blur",()=>{shiftHeld=false;hoveredMini=null;tooltip.hidden=true});q("#flash-rules-close").onclick=q("#flash-cancel-rules").onclick=()=>dialog.close();q("#flash-toggle-selector").onclick=()=>{selector.hidden=!selector.hidden;renderMini()};q("#flash-select-all").onclick=()=>{selected=new Set(deck.cards.map(c=>c.id));renderMini()};q("#flash-clear").onclick=()=>{selected.clear();renderMini()};q("#flash-start").onclick=()=>{let cards=deck.cards.filter(c=>selected.has(c.id));if(random.checked){cards=[...cards];for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]]}}cards=cards.slice(0,Math.min(cards.length,Math.max(1,+count.value||cards.length)));if(!cards.length)return;session=cards;idx=0;answer=false;dialog.close();renderPlayer()};function renderPlayer(){const c=session[idx],hasPrev=idx>0,hasNext=idx<session.length-1;board.innerHTML=`<div class="flash-player"><div class="flash-player-meta"><span>${esc(deck.name)}</span><span>Card ${idx+1} / ${session.length}</span></div><div class="flash-card-row">${hasPrev?'<button class="flash-nav-arrow" data-prev type="button" aria-label="Previous card">&lt;</button>':'<span class="flash-nav-spacer" aria-hidden="true"></span>'}<div class="flash-study-card" style="--deck-color:${esc(deck.color||"#777777")}"><div>${esc(answer?c.answer:c.question)}</div></div>${hasNext?'<button class="flash-nav-arrow" data-next type="button" aria-label="Next card">&gt;</button>':'<span class="flash-nav-spacer" aria-hidden="true"></span>'}</div><div class="flash-player-actions"><button data-flip type="button">Flip</button><button data-rules type="button">Rules</button></div></div>`}board.addEventListener("click",e=>{if(e.target.closest("[data-flip]")){answer=!answer;renderPlayer()}if(e.target.closest("[data-prev]")){if(idx>0){idx--;answer=false;renderPlayer()}}if(e.target.closest("[data-next]")){if(idx<session.length-1){idx++;answer=false;renderPlayer()}}if(e.target.closest("[data-rules]"))dialog.showModal()});load()})();