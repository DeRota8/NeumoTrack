(() => {
  'use strict';
  // Local-only access gate. This does not encrypt the NeumoTrack localStorage database.
  const AUTH_KEY = 'neumotrack.auth.v11';
  const INACTIVITY_MS = 5 * 60 * 1000;
  const ITERATIONS = 220000;
  const $host = document.getElementById('auth-root');
  const $app = document.getElementById('app');
  let unlocked = false;
  let initialized = false;
  let onInitialUnlock = null;
  let backgroundSince = 0;
  function readAuth(){try{const data=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');return data?.username&&data?.salt&&data?.hash?data:null;}catch{return null;}}
  const bytesToBase64 = arr=>btoa(String.fromCharCode(...new Uint8Array(arr)));
  const base64ToBytes = str=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
  async function derive(password,salt,iterations=ITERATIONS){
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    return bytesToBase64(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:base64ToBytes(salt),iterations},key,256));
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function view(kind){
    unlocked=false;
    $app.hidden=true;
    const isSetup=kind==='setup';
    $host.innerHTML=`<section class="auth-card" aria-label="Acceso a NeumoTrack"><div class="auth-brand"><img src="./icons/apple-touch-icon.png?v=11.1" alt=""><h1>Neumo<span>Track</span></h1><p>Tu agenda de Neumología</p></div><h2 class="auth-title">${isSetup?'Crear acceso':'Acceso'}</h2><form class="auth-form" id="auth-form" autocomplete="on" method="post"><div class="auth-field"><label for="login-username">Usuario</label><input id="login-username" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" enterkeyhint="next" required></div><div class="auth-field"><label for="login-password">Contraseña</label><input id="login-password" name="password" type="password" autocomplete="${isSetup?'new-password':'current-password'}" minlength="${isSetup?'8':'1'}" enterkeyhint="go" required></div>${isSetup?`<div class="auth-field"><label for="login-confirm">Repetir contraseña</label><input id="login-confirm" name="confirm-password" type="password" autocomplete="new-password" minlength="8" required></div>`:''}<button type="submit" class="auth-action">${isSetup?'Crear acceso':'Entrar'}</button><p class="auth-feedback" id="auth-feedback" role="alert"></p></form></section>`;
    const f=$host.querySelector('#auth-form');
    f.addEventListener('submit', async evt=>{
      evt.preventDefault();
      if(!f.reportValidity())return;
      const btn=f.querySelector('button[type=submit]');btn.disabled=true;
      const feedback=$host.querySelector('#auth-feedback');feedback.textContent='';
      try{
        const username=f.elements.username.value.trim();
        const password=f.elements.password.value;
        if(isSetup){
          if(!username || password.length<8)throw Error('Introduce un usuario y una contraseña de al menos 8 caracteres.');
          if(password!==f.elements['confirm-password'].value)throw Error('Las contraseñas no coinciden.');
          const salt=bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
          const hash=await derive(password,salt);
          localStorage.setItem(AUTH_KEY,JSON.stringify({username,salt,hash,iterations:ITERATIONS}));
        }else{
          const data=readAuth();
          if(!data)throw Error('No hay credenciales configuradas.');
          const hash=await derive(password,data.salt,data.iterations||ITERATIONS);
          if(username!==data.username || hash!==data.hash)throw Error('Usuario o contraseña incorrectos.');
        }
        unlock();
      }catch(e){feedback.textContent=e.name==='NotSupportedError'?'Tu navegador no admite esta función.':(e.message||'No se ha podido acceder.');}
      finally{btn.disabled=false;}
    });
  }
  function unlock(){
    unlocked=true;$host.innerHTML='';$app.hidden=false;
    if(!initialized){initialized=true;onInitialUnlock?.();}
  }
  function gate(callback){onInitialUnlock=callback;view(readAuth()?'login':'setup');}
  function lock(){if(!unlocked)return;view('login');}
  async function changeCredentials(username,currentPassword,newPassword,confirm){
    const a=readAuth();
    if(!a)return {ok:false,error:'No hay acceso configurado.'};
    if(!username.trim())return {ok:false,error:'Introduce el usuario.'};
    if(newPassword.length<8)return {ok:false,error:'La nueva contraseña debe tener al menos 8 caracteres.'};
    if(newPassword!==confirm)return {ok:false,error:'Las contraseñas nuevas no coinciden.'};
    try{
      const currentHash=await derive(currentPassword,a.salt,a.iterations||ITERATIONS);
      if(currentHash!==a.hash)return {ok:false,error:'La contraseña actual no es correcta.'};
      const salt=bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
      const hash=await derive(newPassword,salt);
      localStorage.setItem(AUTH_KEY,JSON.stringify({username:username.trim(),salt,hash,iterations:ITERATIONS}));
      return {ok:true};
    }catch(e){return {ok:false,error:e.message||'No se han podido guardar las credenciales.'};}
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){backgroundSince=Date.now();}
    else if(unlocked && backgroundSince && Date.now()-backgroundSince>=INACTIVITY_MS){lock();backgroundSince=0;}
  });
  window.addEventListener('pagehide',()=>{backgroundSince=Date.now();});
  window.NeumoAuth={gate,lock,changeCredentials,getUsername:()=>readAuth()?.username||''};
})();
