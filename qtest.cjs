const fs=require("fs");const {JSDOM}=require("jsdom");
const src=fs.readFileSync("index.html","utf8").replace('<script type="module">','<script>');
const errors=[];
const mk=()=>({request:async({method})=>method==="eth_requestAccounts"?["0x12ab000000000000000000000000000000face01"]:null,on(){}});
const dom=new JSDOM(src,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://blueroom.app/",
  beforeParse(w){ w.ethereum=mk(); w.HTMLElement.prototype.getBoundingClientRect=()=>({left:10,top:10,width:40,height:40,right:50,bottom:50}); if(!w.navigator.clipboard)w.navigator.clipboard={writeText(){}}; w.localStorage.clear(); }});
const w=dom.window,d=w.document; w.addEventListener("error",e=>errors.push(""+(e.message||e.error))); w.addEventListener("unhandledrejection",()=>{});
const tick=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await tick(150);
  d.querySelector("#connectBtn").click(); await tick(80);
  const mm=[...d.querySelectorAll("#walletList .wopt")].find(b=>/MetaMask/.test(b.textContent)); mm&&mm.click(); await tick(300);
  d.querySelector('.navi[data-view="quests"]').click(); await tick(40);
  const cards=d.querySelectorAll('#questsWrap .card');
  const onboardRows=cards[0]?cards[0].querySelectorAll('.qrow').length:0;
  const missionRows=cards[1]?cards[1].querySelectorAll('.qrow').length:0;
  console.log("cards:",cards.length,"| onboarding rows:",onboardRows,"| mission rows:",missionRows,"| errors:",errors.length?errors:"NONE");
  console.log((cards.length===2 && onboardRows===5 && missionRows===3 && !errors.length)?"OK — quests render correctly (5 onboarding + 3 daily)":"FAIL");
  w.close();process.exit(0);
})();
