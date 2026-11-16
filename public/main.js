var Q=[
{q:"Při vstupu do místnosti má každý člen stacku přidělený sektor. Proč?",o:["Aby se všichni dívali stejným směrem","Aby se sektory nepřekrývaly, nezůstala slepá místa a nehrozila střelba do vlastních","Aby velitel věděl, kdo půjde první","Je to jen formalita bez praktického významu"],c:1},
{q:"Co je „fatal funnel“?",o:["Zúžený prostor (dveře, chodba), kde jste nejvíc zranitelní, proto se tam nezastavuje","Typ taktické vesty","Povel k zahájení palby","Formace vozidel při eskortě"],c:0},
{q:"Podezřelý s nožem stojí 10 m od tebe, nepostupuje a nikdo jiný není v ohrožení. Nejvhodnější postup?",o:["Okamžitě použít střelnou zbraň","Rozběhnout se k němu a zadržet ho","Udržet vzdálenost a krytí, vydávat verbální příkazy a vyžádat méně smrtící prostředky","Odjet a nechat to jiné hlídce"],c:2},
{q:"Při jednání s rukojmím pachatel žádá vozidlo a volný odchod. Co je tvoje role jako člena zásahové skupiny?",o:["Slíbit mu, co chce, aby se uklidnil","Vyjednávat sám, protože jsem nejblíž","Držet pozici, hlásit změny a nechat vyjednávání určenému vyjednavači","Vstoupit dovnitř dřív, než stihne odjet"],c:2},
{q:"Padl velitel týmu uprostřed akce. Co se stane?",o:["Akce se okamžitě ruší","Velení převezme určený zástupce (nebo nejvyšší hodnost), oznámí to rádiem a tým pokračuje podle plánu","Každý jedná na vlastní pěst","Čeká se, až se velitel vrátí do hry"],c:1},
{q:"Kolega ti přes Discord prozradí, kde se podezřelý skrývá, ale IC to nevíš. Co uděláš?",o:["Použiji informaci, vždyť je pravdivá","Informaci IC nevyužiji, postupuji podle toho, co postava reálně ví","Řeknu to ostatním přes vysílačku jako vlastní zjištění","Zruším zásah"],c:1},
{q:"Jaká priorita platí při zásahu?",o:["Podezřelý, tým, civilisté, majetek","Majetek, civilisté, tým, podezřelý","Tým, podezřelý, majetek, civilisté","Životy civilistů a rukojmích, životy týmu, podezřelý, majetek"],c:3},
{q:"Která vysílačková zpráva je nejlepší?",o:["„Tady jsem, vidím tam nějakého týpka.“","„Alpha 2, kontakt, 1 podezřelý, černá mikina, sever budovy, ozbrojen pistolí.“","„Všichni pozor, něco se tu děje, pojďte sem!“","„Alpha 2, tady je to hrozný, nevím co mám dělat.“"],c:1},
{q:"Po akci vidíš, že kolega svou chybou málem ohrozil civilistu. Co je správné?",o:["Mlčet, aby neměl problémy","Veřejně ho zesměšnit před týmem","Věcně to uvést na debriefingu, zaměřit se na poučení a ne na obviňování","Vyřešit to s ním ve hře násilím"],c:2},
{q:"Po smrti postavy při zásahu (NLR) platí, že:",o:["Se můžeš okamžitě vrátit do stejné akce a pomoct týmu","Se do akce nevracíš a nepoužíváš informace, které jsi během ní získal","Informace předáš týmu přes Discord","Pravidlo platí jen pro civilisty"],c:1},
{q:"Co by měl obsahovat briefing před zásahem?",o:["Jen cíl a čas zahájení","Cíl, známé hrozby, role členů, komunikační plán a záložní postup včetně signálu k přerušení","Jen seznam vybavení","Briefing se dělá až po akci"],c:1},
{q:"Tvůj tým pronásleduje vozidlo a civilista vběhne do cesty. Co je správné?",o:["Pokračovat v pronásledování, podezřelý je priorita","Zpomalit nebo ukončit pronásledování, pokud hrozí riziko pro civilisty, a informovat velitele","Vystřelit na vozidlo, aby zastavilo","Vypnout vysílačku"],c:1},
{q:"Co je nutné před použitím omračujícího granátu (flashbang) při vstupu do budovy?",o:["Nic, použije se hned","Pouze oznámit „granát“ nahlas","Povolení velitele, hlasité upozornění týmu a ověření, že v dosahu nejsou rukojmí nebo civilisté","Vyčkat, až podezřelý vyjde sám"],c:2},
{q:"Jak držíš zbraň při pohybu ve stacku, když ještě nemáš identifikovaný cíl?",o:["Hlaveň ve směru svého sektoru nebo dolů, prst mimo spoušť","Hlaveň namířená před sebe, prst na spoušti","Zbraň v pouzdře","Hlaveň nahoru, prst na spoušti"],c:0},
{q:"Jaký je hlavní účel vnějšího perimetru?",o:["Poskytnout týmu místo k odpočinku","Zajistit parkování vozidel","Natáčet zásah pro dokumentaci","Zabránit úniku podezřelých a vstupu civilistů či nepovolaných osob do prostoru"],c:3},
{q:"Podezřelý se vzdává a zvedá ruce, ale dva členy týmu na něj křičí protichůdné příkazy. Co je správné?",o:["Nechat to být, však se domluví","Určit jediný hlas, který vydává příkazy, ostatním dát pokyn ztišit se a krýt","Začít křičet taky, aby to slyšel","Zatím neudělat nic"],c:1}
];
var t=document.getElementById("test");
Q.forEach(function(x,i){var d=document.createElement("div");d.className="q";var h="<p>"+(i+1)+". "+x.q+"</p>";
x.o.forEach(function(o,j){h+='<label class="opt"><input type="radio" name="q'+i+'" value="'+j+'"><span>'+o+'</span></label>';});
d.innerHTML=h;t.appendChild(d);});
function v(id){return document.getElementById(id).value.trim();}
document.getElementById("go").onclick=function(){
var err=document.getElementById("err");err.textContent="";
if(!v("ic")||!v("dc")||!v("age")||!v("rank")||!v("a1")){err.textContent="Vyplň povinná pole přihlášky (označená *).";return;}
var pts=0,ans=[];
for(var i=0;i<Q.length;i++){var s=document.querySelector('input[name="q'+i+'"]:checked');
if(!s){err.textContent="Odpověz na všechny otázky (chybí č. "+(i+1)+").";return;}
var j=+s.value;if(j===Q[i].c)pts++;ans.push((i+1)+". "+String.fromCharCode(65+j)+(j===Q[i].c?" ✔":" ✘"));}
var pct=Math.round(pts/Q.length*100),ok=pct>=70;
document.getElementById("score").innerHTML="Skóre: <b class='"+(ok?"pass":"fail")+"'>"+pts+"/"+Q.length+" ("+pct+" %) – "+(ok?"splněno":"nesplněno")+"</b>";
document.getElementById("out").textContent="NÁBOR S.R.T. – LSSD\n\nIC jméno: "+v("ic")+"\nDiscord: "+v("dc")+"\nVěk: "+v("age")+"\nHodnost/odznak: "+v("rank")+"\n\nMotivace: "+v("a1")+"\n\nZkušenosti: "+(v("a2")||"-")+"\n\nDostupnost: "+(v("a4")||"-")+"\n\nTEST: "+pts+"/"+Q.length+" ("+pct+" %)\n"+ans.join("  ");
var T=document.getElementById("out").textContent;saveApp({ic:v("ic"),dc:v("dc"),pct:pct,ok:ok,at:new Date().toISOString(),text:T});var r=document.getElementById("res");r.style.display="block";r.scrollIntoView({behavior:"smooth"});};
document.getElementById("copy").onclick=function(){var txt=document.getElementById("out").textContent,m=document.getElementById("cm");
function fb(){var a=document.createElement("textarea");a.value=txt;document.body.appendChild(a);a.select();try{document.execCommand("copy");m.textContent="Zkopírováno ✔";}catch(e){m.textContent="Označ text a zkopíruj ručně.";}document.body.removeChild(a);}
if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){m.textContent="Zkopírováno ✔";},fb);}else fb();};


function saveApp(o){var m=document.getElementById("saveinfo");m.textContent="Odesílám…";
fetch("/api/apply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ic:o.ic,dc:o.dc,pct:o.pct,ok:o.ok,text:o.text})})
.then(function(r){if(!r.ok)throw 0;m.innerHTML="<b class='pass'>✔ Přihláška byla odeslána velení.</b>";})
.catch(function(){m.textContent="Odeslání se nepodařilo. Použij tlačítko Zkopírovat a pošli výsledek ručně.";});}
fetch("/api/me").then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(d){
var u=d.user,b=document.getElementById("navauth");b.textContent="";
var w=document.createElement("span");w.className="nu";
if(u.avatar){var i=document.createElement("img");i.src=u.avatar;i.alt="";w.appendChild(i);}
var n=document.createElement("strong");n.textContent=u.name;w.appendChild(n);b.appendChild(w);
var o=document.createElement("a");o.href="#";o.textContent="Odhlásit";
o.onclick=function(e){e.preventDefault();fetch("/auth/logout",{method:"POST"}).then(function(){location.reload();});};
b.appendChild(o);}).catch(function(){});
(function(){var els=document.querySelectorAll("section.w");
if(!("IntersectionObserver" in window)){return;}
var io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target);}});},{threshold:.08});
els.forEach(function(el){el.classList.add("rv");io.observe(el);});})();
