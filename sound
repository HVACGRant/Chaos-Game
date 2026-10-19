// ============================================================
//  CHAOS - sound.js  |  shared synth sound effects (no audio files)
//  Used by solo (index.html) and online (play.html).
//  Mute is remembered in localStorage ('chaosMuted').
// ============================================================
const sfx = {
    ctx:null,
    muted:(function(){ try{ return localStorage.getItem('chaosMuted')==='1'; }catch(e){ return false; } })(),
    _ac(){
        if(this.muted) return null;
        try{
            if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)();
            if(this.ctx.state==='suspended') this.ctx.resume();
            return this.ctx;
        }catch(e){ return null; }
    },
    // one tone: frequency, start offset(s), duration(s), wave, volume, optional glide-to frequency
    _note(freq,start,dur,type,vol,glideTo){
        const ac=this.ctx; if(!ac) return;
        const o=ac.createOscillator(),g=ac.createGain();
        o.type=type||'sine'; o.frequency.value=freq; o.connect(g); g.connect(ac.destination);
        const t=ac.currentTime+start;
        if(glideTo) o.frequency.exponentialRampToValueAtTime(glideTo,t+dur);
        g.gain.setValueAtTime(0.0001,t);
        g.gain.exponentialRampToValueAtTime(vol||0.18,t+0.015);
        g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
        o.start(t); o.stop(t+dur+0.03);
    },
    _noise(start,dur,vol){
        const ac=this.ctx; if(!ac) return;
        const len=Math.floor(ac.sampleRate*dur), buf=ac.createBuffer(1,len,ac.sampleRate), d=buf.getChannelData(0);
        for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
        const s=ac.createBufferSource(), g=ac.createGain();
        s.buffer=buf; s.connect(g); g.connect(ac.destination);
        g.gain.value=vol||0.12; s.start(ac.currentTime+start);
    },
    _seq(list,type,dur,vol){ list.forEach(([f,s])=>this._note(f,s,dur,type,vol)); },

    // ---- the sound set ----
    chime(){   if(!this._ac()) return; this._seq([[784,0],[1047,0.09],[1319,0.18]],'triangle',0.32,0.16); },
    roll(){    if(!this._ac()) return; for(let i=0;i<7;i++) this._noise(i*0.075,0.05,0.10); },         // dice rattle
    step(){    if(!this._ac()) return; this._note(420+Math.random()*60,0,0.06,'square',0.05); },       // token hop
    cash(){    if(!this._ac()) return; this._seq([[988,0],[1319,0.08],[1568,0.16]],'triangle',0.22,0.16); },
    payday(){  if(!this._ac()) return; this._seq([[523,0],[659,0.08],[784,0.16],[1047,0.24],[1319,0.34]],'triangle',0.28,0.15); },
    lap(){     if(!this._ac()) return; this._seq([[659,0],[784,0.1],[988,0.2],[1319,0.32]],'square',0.2,0.09); },
    good(){    if(!this._ac()) return; this._seq([[660,0],[880,0.1]],'triangle',0.22,0.17); },
    bad(){     if(!this._ac()) return; this._note(300,0,0.45,'sawtooth',0.13,110); },
    upgrade(){ if(!this._ac()) return; this._seq([[392,0],[523,0.1],[659,0.2],[784,0.3],[1047,0.42]],'triangle',0.3,0.16); },
    locked(){  if(!this._ac()) return; this._seq([[220,0],[196,0.12]],'square',0.16,0.1); },
    jail(){    if(!this._ac()) return; this._noise(0,0.18,0.18); this._note(180,0.05,0.5,'square',0.14,70); this._note(120,0.4,0.5,'square',0.12,60); },
    siren(){   if(!this._ac()) return; for(let i=0;i<4;i++) this._note(i%2?700:950,i*0.18,0.18,'square',0.09); },
    jailbreak(){ if(!this._ac()) return; this._seq([[392,0],[523,0.09],[659,0.18],[784,0.27],[1047,0.38],[1319,0.5]],'sawtooth',0.22,0.12); },
    steal(){   if(!this._ac()) return; this._seq([[1200,0],[900,0.08],[1200,0.16],[1500,0.24]],'square',0.12,0.09); },
    caught(){  if(!this._ac()) return; this.siren(); },
    safe(){    if(!this._ac()) return; this._seq([[523,0],[784,0.1],[1047,0.2]],'triangle',0.25,0.16); },
    yourTurn(){ if(!this._ac()) return; this._seq([[880,0],[1175,0.14]],'sine',0.28,0.2); try{ if(navigator.vibrate) navigator.vibrate([120,60,120]); }catch(e){} },
    fanfare(){ if(!this._ac()) return; this._seq([[523,0],[659,0.13],[784,0.26],[1047,0.42],[784,0.62],[1047,0.75],[1319,0.9]],'sawtooth',0.5,0.14); },
    click(){   if(!this._ac()) return; this._note(600,0,0.05,'square',0.05); },

    toggle(){
        this.muted=!this.muted;
        try{ localStorage.setItem('chaosMuted', this.muted?'1':'0'); }catch(e){}
        if(!this.muted) this.chime();
        document.querySelectorAll('.sfx-mute-btn,#rsMuteBtn').forEach(b=>{ b.textContent=this.muted?'🔇':'🔊'; });
    },
    // floating mute button (top-right) so sound can be turned off on any screen
    addButton(){
        if(document.getElementById('sfxMuteFloat')) return;
        const b=document.createElement('button');
        b.id='sfxMuteFloat'; b.className='sfx-mute-btn'; b.title='Sound on/off'; b.textContent=this.muted?'🔇':'🔊';
        b.style.cssText='position:fixed;top:8px;right:8px;z-index:9999;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(20,20,35,.85);color:#fff;font-size:18px;cursor:pointer;padding:0;line-height:1;';
        b.onclick=()=>this.toggle();
        document.body.appendChild(b);
    }
};
// browsers only allow audio after a tap - unlock on first touch/click
['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,function once(){ sfx._ac(); document.removeEventListener(ev,once); },{once:true}));
document.addEventListener('DOMContentLoaded',()=>sfx.addButton());
