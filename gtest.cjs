const fs=require("fs");const {JSDOM}=require("jsdom");
const src=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
const errors=[];
const mk=f=>({request:async({method})=>method==="eth_requestAccounts"?["0x12ab000000000000000000000000000000face01"]:null,on(){}});
const dom=new JSDOM(src,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://blueroom.app/",
  beforeParse(w){ w.ethereum=mk(); w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}};
    w.localStorage.clear(); w.addEventListener("eip6963:requestProvider",()=>{}); }});
const w=dom.window,d=w.document; w.addEventListener("error",e=>errors.push(""+(e.message||e.error))); w.addEventListener("unhandledrejection",()=>{});
const tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await tick(150);
  // connect via the always-visible MetaMask row
  d.querySelector("#connectBtn").click(); await tick(80);
  const mm=[...d.querySelectorAll("#walletList .wopt")].find(b=>/MetaMask/.test(b.textContent)); mm&&mm.click(); await tick(400);
  const lvlRowShown=d.querySelector("#lvlRow").style.display!=="none";
  const lvlText0=d.querySelector("#lvlText").textContent;
  const streakChip0=d.querySelector("#streakChip").textContent.trim();
  // send several messages to gain XP
  for(let i=0;i<6;i++){ d.querySelector("#msgInput").value="gm "+i; d.querySelector("#sendBtn").click(); await tick(15); }
  const lvlXp=d.querySelector("#lvlXp").textContent;
  // daily check-in via header chip (cta)
  d.querySelector("#streakChip").click(); await tick(60);
  const confetti=d.querySelectorAll(".confetti").length;
  const streakChip1=d.querySelector("#streakChip").textContent.trim();
  // profile shows level card + check-in done
  d.querySelector('.navi[data-view="profile"]').click(); await tick(40);
  const lvlCard=d.querySelectorAll("#profileWrap .lvlcard").length;
  const checkBtn=d.querySelector("#checkInBtn"); const doneState=checkBtn?checkBtn.textContent.trim():"n/a";
  console.log("level row shown:",lvlRowShown,"| start:",lvlText0,"| streak chip(before):",streakChip0);
  console.log("xp after 6 msgs:",lvlXp,"| confetti on check-in:",confetti,"| streak chip(after):",streakChip1);
  console.log("profile level card:",lvlCard,"| check-in btn:",doneState);
  console.log("page errors:",errors.length?errors:"NONE");
  const ok=lvlRowShown && /Lv 1/.test(lvlText0) && /gm/.test(streakChip0) && confetti>0 && /1 day/.test(streakChip1) && lvlCard===1 && /Done/.test(doneState) && !errors.length;
  console.log(ok?"OK — XP + levels + streak check-in all working":"FAIL");
  w.close();process.exit(0);
})();
