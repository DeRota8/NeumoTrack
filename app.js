(() => {
  'use strict';
  const STORAGE_KEY = 'neumotrack.demo.v2';
  const CLOUD_CACHE_KEY = 'neumotrack.cloud.v9.cache';
  const CLOUD_CONFIG_KEY = 'neumotrack.cloud.v9.config';
  let cloudConfig = null;
  let cloudRevision = 0;
  let cloudOnline = false;
  let pendingCloudWrite = null;
  let cloudBusy = false;
  const icons = {
    home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
    settings: '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M 8.632 3.87 L 10.08 3.412 L 10.02 0.773 L 13.98 0.773 L 13.92 3.412 L 15.368 3.87 L 15.368 3.87 L 16.715 4.57 L 18.539 2.662 L 21.338 5.461 L 19.43 7.285 L 20.13 8.632 L 20.13 8.632 L 20.588 10.08 L 23.227 10.02 L 23.227 13.98 L 20.588 13.92 L 20.13 15.368 L 20.13 15.368 L 19.43 16.715 L 21.338 18.539 L 18.539 21.338 L 16.715 19.43 L 15.368 20.13 L 15.368 20.13 L 13.92 20.588 L 13.98 23.227 L 10.02 23.227 L 10.08 20.588 L 8.632 20.13 L 8.632 20.13 L 7.285 19.43 L 5.461 21.338 L 2.662 18.539 L 4.57 16.715 L 3.87 15.368 L 3.87 15.368 L 3.412 13.92 L 0.773 13.98 L 0.773 10.02 L 3.412 10.08 L 3.87 8.632 L 3.87 8.632 L 4.57 7.285 L 2.662 5.461 L 5.461 2.662 L 7.285 4.57 L 8.632 3.87 Z M 15.2 12 A 3.2 3.2 0 1 0 8.8 12 A 3.2 3.2 0 1 0 15.2 12 Z"/>',
  };
  function navSvg(key){return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${icons[key]}</svg>`;}
  const catSvg = {
    tests:`<circle cx="48" cy="43" r="33" fill="none" stroke="currentColor" stroke-width="6" opacity=".28"/><path d="M20 47a28 28 0 0 1 56 0" fill="none" stroke="currentColor" stroke-width="6"/><path d="M30 69h36l8 11H22z" fill="currentColor" opacity=".8"/><circle cx="48" cy="48" r="11" fill="currentColor" opacity=".45"/><path d="M46 17h6" stroke="currentColor" stroke-width="5"/>`,
    transplant:`<path d="M49 16v35" stroke="currentColor" stroke-width="8" fill="none"/><path d="M43 45C31 29 19 29 13 44c-6 16-6 35 7 36 13 1 23-16 23-29z" fill="currentColor" opacity=".82"/><path d="M55 45c12-16 24-16 30-1 6 16 6 35-7 36-13 1-23-16-23-29z" fill="currentColor" opacity=".82"/><path d="M68 64c-8-10-21 1-9 13l9 9 9-9c12-12-1-23-9-13z" fill="#f98f94" stroke="white" stroke-width="3"/>`,
    committee:`<circle cx="46" cy="30" r="12" fill="currentColor"/><circle cx="20" cy="38" r="10" fill="currentColor" opacity=".73"/><circle cx="75" cy="38" r="10" fill="currentColor" opacity=".73"/><path d="M25 74c0-20 9-30 22-30s23 10 23 30v8H25z" fill="currentColor"/><path d="M5 74c0-17 7-26 19-26l5 3c-8 11-10 19-9 29H5zm89 0c0-17-7-26-19-26l-5 3c8 11 10 19 9 29h15z" fill="currentColor" opacity=".65"/>`,
    referrals:`<circle cx="34" cy="25" r="13" fill="currentColor" opacity=".85"/><path d="M7 79V65c0-19 10-29 26-29s26 10 26 29v14z" fill="currentColor" opacity=".72"/><path d="M68 38h23m-10-9 10 9-10 9M68 64h23m-10-9 10 9-10 9" fill="none" stroke="currentColor" stroke-width="6"/><path d="M28 55v15m-8-8h16" stroke="white" stroke-width="5"/>`,
    medication:`<g transform="rotate(38 42 45)"><rect x="27" y="9" width="28" height="70" rx="14" fill="none" stroke="currentColor" stroke-width="7"/><path d="M27 44h28" stroke="currentColor" stroke-width="5"/><path d="M29 47h24v15a12 12 0 0 1-24 0z" fill="currentColor" opacity=".63"/></g><circle cx="76" cy="68" r="20" fill="currentColor" opacity=".8"/><path d="m65 83 23-29" stroke="white" stroke-width="4"/>`,
    other:`<rect x="20" y="10" width="58" height="76" rx="8" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="5"/><path d="M31 34h35M31 48h35M31 62h25" stroke="currentColor" stroke-width="6"/>`
  };
  const CATEGORIES = [
    {id:'tests',label:'Pruebas complementarias',short:'Pruebas',central:'Prueba',icon:'tests'},
    {id:'transplant',label:'Trasplante pulmonar',short:'Trasplante',central:'Situación',icon:'transplant'},
    {id:'committee',label:'Comité multidisciplinar',short:'Comité',central:'Estado',icon:'committee'},
    {id:'referrals',label:'Interconsultas y derivaciones',short:'Interconsultas',central:'Especialidad',icon:'referrals'},
    {id:'medication',label:'Medicación',short:'Medicación',central:'Fármaco',icon:'medication'},
    {id:'other',label:'Otros',short:'Otros',central:'Asunto',icon:'other'}
  ];
  const DEFAULT_OPTIONS = {
    testsPrimary:['TAC de tórax','PET-TAC','Espirometría','PFR completas','Test de marcha de 6 minutos','Broncoscopia','Lavado broncoalveolar (BAL)','EBUS','Criobiopsia pulmonar','Biopsia pulmonar quirúrgica','Analítica','Ecocardiograma','Cultivos','Otras'],
    testsSituation:['Pendiente de solicitar','Solicitada, pendiente de cita','Citada, pendiente de realización','Realizada, pendiente de resultado','Resultado disponible, pendiente de revisión','Revisada y entregado resultado','Finalizada','Cancelada'],
    transplantSituation:['Pendiente de valoración','Rechazado temporalmente','Rechazado definitivamente','Inicia estudio pretrasplante','Seguimiento pretrasplante','Incluido en lista activa','Trasplantado'],
    committeeReason:['Discusión diagnóstica','Valoración radiológica','Valoración anatomopatológica','Decisión terapéutica','Reevaluación por progresión de la enfermedad','Otros'],
    committeeState:['Pendiente de presentar','Presentado'],
    referralsSpecialty:['Cardiología','Reumatología','Medicina Interna','Cirugía Torácica','Otorrinolaringología','Enfermedades Infecciosas','Medicina Preventiva','Rehabilitación','Otras'],
    referralsSituation:['Pendiente de solicitar','Solicitada, pendiente de cita','Citada, pendiente de valoración','Valorado','Finalizada'],
    medicationDrug:['Nintedanib','Pirfenidona','Nerandomilast','Micofenolato mofetilo','Azatioprina','Metotrexato','Rituximab','Prednisona','Ensayo clínico','Otros'],
    medicationSituation:['Pendiente de prescripción','Pendiente de inicio','En tratamiento','Pendiente de modificación','Suspendido','Finalizado'],
    otherSituation:['Pendiente','En curso','Resuelto'],
    pendingType:['Tengo que hacer','Estoy esperando']
  };
  const KEY_OPTIONS_LABELS = {testsPrimary:'Pruebas complementarias',testsSituation:'Situación de la prueba',transplantSituation:'Situación del trasplante',committeeReason:'Motivo de derivación al comité',committeeState:'Estado del comité',referralsSpecialty:'Especialidades',referralsSituation:'Situación de la derivación',medicationDrug:'Fármacos',medicationSituation:'Situación de medicación',otherSituation:'Situación de Otros',pendingType:'Tarea'};
  const FIELDS = {
    tests:[
      {name:'primary',label:'Prueba principal',type:'autocomplete',list:'testsPrimary',required:true,other:'Otras'},
      {name:'situation',label:'Situación de la prueba',type:'select',list:'testsSituation'},
      {name:'pendingType',label:'Tarea',type:'select',list:'pendingType'},
      {name:'dateAppointment',label:'Fecha de cita',type:'date',dynamic:'cita'},
      {name:'dateReview',label:'Fecha próxima revisión',type:'date'},
      {name:'observations',label:'Observaciones',type:'textarea',wide:true}
    ],
    transplant:[
      {name:'primary',label:'Situación del paciente',type:'select',list:'transplantSituation',required:true},
      {name:'dateSituation',label:'Fecha de la situación',type:'date'},
      {name:'pendingType',label:'Tarea',type:'select',list:'pendingType'},
      {name:'dateReview',label:'Fecha próxima revisión',type:'date'},
      {name:'observations',label:'Observaciones',type:'textarea',wide:true}
    ],
    committee:[
      {name:'primary',label:'Motivo de derivación',type:'select',list:'committeeReason',required:true,other:'Otros'},
      {name:'situation',label:'Estado',type:'select',list:'committeeState'},
      {name:'dateCommittee',label:'Fecha del comité',type:'date'},
      {name:'dateReview',label:'Fecha próxima revisión',type:'date'},
      {name:'observations',label:'Observaciones',type:'textarea',wide:true}
    ],
    referrals:[
      {name:'primary',label:'Especialidad',type:'autocomplete',list:'referralsSpecialty',required:true,other:'Otras'},
      {name:'situation',label:'Situación de la derivación',type:'select',list:'referralsSituation'},
      {name:'dateReferral',label:'Fecha de derivación',type:'date'},
      {name:'dateReview',label:'Fecha próxima revisión',type:'date'},
      {name:'observations',label:'Observaciones',type:'textarea',wide:true}
    ],
    medication:[
      {name:'primary',label:'Fármaco',type:'autocomplete',list:'medicationDrug',required:true,other:'Otros'},
      {name:'situation',label:'Situación',type:'select',list:'medicationSituation'},
      {name:'dateSituation',label:'Fecha de la situación',type:'date'},
      {name:'dateReview',label:'Fecha próxima revisión',type:'date'},
      {name:'observations',label:'Observaciones',type:'textarea',wide:true}
    ],
    other:[
      {name:'primary',label:'Asunto',type:'text',required:true},
      {name:'situation',label:'Situación',type:'select',list:'otherSituation'},
      {name:'dateReview',label:'Fecha próxima revisión',type:'date'},
      {name:'observations',label:'Observaciones',type:'textarea',wide:true}
    ]
  };
  const $screen = document.getElementById('screen');
  const $nav = document.getElementById('bottomNav');
  const $modal = document.getElementById('modal-root');
  const $toast = document.getElementById('toast');
  let database = null;
  let route = {name:'home'};
  let history = [];
  let formBaseline = '';
  let editingForm = false;
  let toastTimer;
  let saveStorageError = false;
  function uid(){return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id-'+Date.now()+'-'+Math.random().toString(36).slice(2);}
  function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  function dateShift(days){const parts=today().split('-').map(Number);const d=new Date(parts[0],parts[1]-1,parts[2]+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  function fmtDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return '—';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`;}
  function dateTone(v){return v && v<today()?'overdue':v===today()?'due-today':'';}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function clean(s){return String(s??'').trim();}
  function norm(s){return clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');}
  function sexIcon(p){
    const sex=p.sex==='Hombre'?'male':p.sex==='Mujer'?'female':'unknown';
    return `<span class="sex-avatar ${sex}" aria-label="${sex==='male'?'Hombre':sex==='female'?'Mujer':'Sexo no indicado'}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.5" r="3.2"/><path d="M5.1 20c0-4.15 2.75-6.5 6.9-6.5s6.9 2.35 6.9 6.5"/></svg></span>`;
  }
  function ageBadge(p){const age=p.age==null?'':String(p.age).trim();return /^\d{1,3}$/.test(age)?`<span class="patient-age">${esc(age)} años</span>`:'';}
  function patientName(p){return `${p.name} ${p.surname}`.trim();}
  function category(id){return CATEGORIES.find(c=>c.id===id) || CATEGORIES[0];}
  function byName(a,b){return patientName(a).localeCompare(patientName(b),'es');}
  function makeData(patientId,cat,primary,situation,dateReview,observations='',more={}){return {id:uid(),patientId,category:cat,data:{primary,situation,dateReview,observations,...more},active:true,finishedAt:null,rev:1};}
  function seed(){
    const patients=[
      ['Antonio','García López','AN0000000001','Fibrosis pulmonar progresiva','600 000 001',''],
      ['María','García Ruiz','AN0000000002','EPID en estudio','600 000 002',''],
      ['José','Martín Pérez','AN0000000003','Fibrosis pulmonar idiopática','',''],
      ['Carmen','López Sánchez','AN0000000004','Neumonitis por hipersensibilidad','',''],
      ['Lucía','Romero Díaz','AN0000000005','Bronquiectasias','',''],
      ['Pedro','Sánchez Ruiz','AN0000000006','Sarcoidosis','',''],
      ['Ana','Torres Martínez','AN0000000007','EPID pendiente de filiación','',''],
      ['Miguel','Navarro Ortiz','AN0000000008','EPOC grave','','']
    ].map(([name,surname,nuhsa,judgement,phone,observations],i)=>({id:uid(),name,surname,nuhsa,judgement,phone,observations,sex:['Hombre','Mujer','Hombre','Mujer','Mujer','Hombre','Mujer','Hombre'][i],age:String([67,59,71,53,46,64,60,69][i]),rev:1}));
    const id=i=>patients[i].id;
    const tasks=[
      makeData(id(0),'tests','TAC de tórax','Realizada, pendiente de resultado',dateShift(-4),'Revisar el resultado antes de la próxima consulta.'),
      makeData(id(1),'tests','Espirometría','Citada, pendiente de realización',dateShift(0),'',{dateAppointment:dateShift(3)}),
      makeData(id(2),'tests','PFR completas','Solicitada, pendiente de cita',dateShift(9),''),
      makeData(id(0),'transplant','Pendiente de valoración','',dateShift(3),'Contactar con el centro para confirmar la valoración.',{dateSituation:dateShift(-24),pendingType:'Estoy esperando'}),
      makeData(id(2),'transplant','Incluido en lista activa','',dateShift(15),'',{dateSituation:dateShift(-20),pendingType:'Estoy esperando'}),
      makeData(id(6),'committee','Discusión diagnóstica','Pendiente de presentar',dateShift(1),'',{dateCommittee:dateShift(12)}),
      makeData(id(3),'committee','Decisión terapéutica','Presentado',dateShift(8),'Pendiente de consensuar el plan de tratamiento.'),
      makeData(id(1),'referrals','Reumatología','Solicitada, pendiente de cita',dateShift(4),'',{dateReferral:dateShift(-9)}),
      makeData(id(4),'referrals','Cardiología','Valorado',dateShift(18),''),
      makeData(id(0),'medication','Nintedanib','En tratamiento',dateShift(5),'Evaluar tolerancia digestiva.'),
      makeData(id(5),'medication','Ensayo clínico','Pendiente de inicio',dateShift(22),'Posible candidato. Revisar criterios de inclusión.'),
      makeData(id(7),'other','Preparar informe','Pendiente',dateShift(-1),'Informe pendiente de finalizar.'),
      makeData(id(4),'other','Llamar al paciente','En curso','','')
    ];
    const done=makeData(id(7),'tests','Broncoscopia','Finalizada','', 'Resultado revisado.');done.active=false;done.finishedAt=dateShift(-3);tasks.push(done);
    const done2=makeData(id(5),'committee','Valoración radiológica','Presentado','', 'Caso ya presentado.');done2.active=false;done2.finishedAt=dateShift(-6);tasks.push(done2);
    return {version:1,patients,tasks,options:JSON.parse(JSON.stringify(DEFAULT_OPTIONS))};
  }
  function newEmptyDb(){return {version:1,patients:[],tasks:[],options:JSON.parse(JSON.stringify(DEFAULT_OPTIONS))};}
  function storageKey(){return cloudConfig ? CLOUD_CACHE_KEY : STORAGE_KEY;}
  function readStored(){try{const raw=localStorage.getItem(storageKey());return raw?JSON.parse(raw):null;}catch(e){return null;}}
  function writeStored(data){try{localStorage.setItem(storageKey(),JSON.stringify(data));saveStorageError=false;return true;}catch(e){saveStorageError=true;return false;}}
  function ensureOptions(data){if(!data.options)data.options=JSON.parse(JSON.stringify(DEFAULT_OPTIONS));Object.entries(DEFAULT_OPTIONS).forEach(([k,v])=>{if(!Array.isArray(data.options[k]))data.options[k]=v.slice();});return data;}
  function isValidCloudUrl(url){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url);}
  function getCloudAt(config){
    return new Promise((resolve,reject)=>{
      const callback='NeumoTrack_cb_'+uid().replace(/[^a-zA-Z0-9]/g,'').slice(0,36);
      const script=document.createElement('script');let done=false;
      const clear=()=>{if(done)return;done=true;clearTimeout(timer);delete window[callback];script.remove();};
      const timer=setTimeout(()=>{clear();reject(Error('No responde Google Apps Script.'))},20000);
      window[callback]=answer=>{clear();if(!answer?.ok)return reject(Error(answer?.error||'Error de conexión.'));resolve(answer);};
      script.onerror=()=>{clear();reject(Error('No se pudo abrir la dirección de Apps Script.'))};
      script.src=config.url+'?action=get&callback='+encodeURIComponent(callback)+'&token='+encodeURIComponent(config.token)+'&nocache='+Date.now();
      document.head.appendChild(script);
    });
  }
  function applyCloudSnapshot(answer){
    if(!answer?.data||!Array.isArray(answer.data.patients)||!Array.isArray(answer.data.tasks))throw Error('Respuesta de datos no válida.');
    const fresh=ensureOptions(answer.data);if(!writeStored(fresh))throw Error('No se pudo actualizar la copia local.');
    cloudRevision=Number(answer.revision)||0;database=fresh;cloudOnline=true;return fresh;
  }
  async function refreshCloud(){
    if(!cloudConfig)return true;
    try{const response=await getCloudAt(cloudConfig);
      if(pendingCloudWrite){
        if((response.operations||[]).includes(pendingCloudWrite.operationId)||response.lastOperationId===pendingCloudWrite.operationId)pendingCloudWrite=null;
        else if(response.revision!==pendingCloudWrite.baseRevision)pendingCloudWrite=null;
        else{toast('Guardado pendiente de confirmar. No se han perdido los cambios.');return false;}
      }
      applyCloudSnapshot(response);return true;}
    catch(err){cloudOnline=false;toast('No se pudo sincronizar: '+err.message);return false;}
  }
  async function connectCloud(){
    const url=$screen.querySelector('#sync-url')?.value.trim().replace(/\/\s*$/,'')||'';
    const token=$screen.querySelector('#sync-token')?.value.trim()||'';
    if(!isValidCloudUrl(url)||!token){toast('Introduce la URL /exec y la clave de conexión.');return;}
    if(cloudBusy)return;cloudBusy=true;
    try{
      const config={url,token},answer=await getCloudAt(config);
      if(!answer?.data||!Array.isArray(answer.data.patients))throw Error('La conexión no devolvió una agenda válida.');
      cloudConfig=config;localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify(config));
      applyCloudSnapshot(answer);history=[];route={name:'home'};render();toast('Agenda compartida conectada.');
    }catch(err){toast('No se pudo conectar: '+err.message);}
    finally{cloudBusy=false;}
  }
  async function disconnectCloud(){
    if(!cloudConfig)return;
    if(pendingCloudWrite){toast('Hay un guardado pendiente de verificar.');return;}
    const yes=await promptModal('Volver al modo local','Dejarás de utilizar temporalmente la agenda compartida. La agenda local anterior seguirá conservada en este dispositivo.',[{label:'Cancelar',kind:'ghost',value:false},{label:'Usar modo local',kind:'primary',value:true}]);
    if(!yes)return;
    localStorage.removeItem(CLOUD_CONFIG_KEY);cloudConfig=null;cloudRevision=0;cloudOnline=false;
    database=readStored()||seed();writeStored(database);history=[];route={name:'home'};render();toast('Modo local activado.');
  }
  async function uploadLocalCloud(){
    if(!cloudConfig||!cloudOnline)return toast('Primero conecta la agenda compartida.');
    if(cloudRevision!==0||database.patients.length||database.tasks.length)return toast('La agenda compartida no está vacía. No se sustituirá.');
    const existing=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(!existing||!Array.isArray(existing.patients))return toast('No hay datos locales para importar.');
    const yes=await promptModal('Subir datos locales','Se copiarán los pacientes y tareas de prueba de este dispositivo a la agenda compartida vacía. ¿Continuar?', [{label:'Cancelar',kind:'ghost',value:false},{label:'Subir datos',kind:'primary',value:true}]);
    if(!yes)return;
    if(await persistDb(existing)){render();toast('Datos locales transferidos a la agenda compartida.');}
  }
  function initialize(){
    try{cloudConfig=JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||'null');if(cloudConfig&&!isValidCloudUrl(cloudConfig.url))cloudConfig=null;}
    catch(e){cloudConfig=null;}
    database=readStored();
    if(!database||!Array.isArray(database.patients)||!Array.isArray(database.tasks)){database=cloudConfig?newEmptyDb():seed();writeStored(database);}
    ensureOptions(database);render();
    if(cloudConfig)refreshCloud().then(ok=>{if(ok&&!hasDirty())render();});
  }
  function toast(message){clearTimeout(toastTimer);$toast.textContent=message;$toast.classList.add('show');toastTimer=setTimeout(()=>$toast.classList.remove('show'),3400);}
  function promptModal(title,message,actions=[{label:'Cancelar',kind:'ghost',value:false},{label:'Confirmar',kind:'primary',value:true}],opts={}){
    return new Promise(resolve=>{
      $modal.innerHTML=`<div class="modal-overlay" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2><p>${esc(message)}</p>${opts.phrase?`<label class="field"><span style="font-size:13px;font-weight:700;margin-bottom:7px">Escribe ELIMINAR para confirmar:</span><input class="search-input" id="confirmPhrase" autocomplete="off" aria-label="Escribe ELIMINAR"></label>`:''}<div class="button-row">${actions.map((a,i)=>`<button type="button" data-modal-index="${i}" class="btn ${a.kind==='danger'?'btn-danger':a.kind==='primary'?'btn-primary':'btn-ghost'}" ${opts.phrase&&a.value===true?'disabled':''}>${esc(a.label)}</button>`).join('')}</div></div></div>`;
      const cleanup=()=>{$modal.innerHTML='';$modal.removeEventListener('click',clickHandler);document.removeEventListener('keydown',escapeHandler);};
      const escapeHandler=e=>{if(e.key==='Escape'){cleanup();resolve(false);}};
      document.addEventListener('keydown',escapeHandler);
      if(opts.phrase){const inp=$modal.querySelector('#confirmPhrase');inp.addEventListener('input',()=>{for(const b of $modal.querySelectorAll('[data-modal-index]')){const a=actions[Number(b.dataset.modalIndex)];if(a.value===true)b.disabled=inp.value.trim()!=='ELIMINAR';}});}
      const clickHandler=e=>{const btn=e.target.closest('[data-modal-index]');if(!btn)return;const a=actions[Number(btn.dataset.modalIndex)];cleanup();resolve(a.value);};$modal.addEventListener('click',clickHandler);
      $modal.querySelector('button')?.focus();
    });
  }
  function showNavigation(){return !['taskForm','patientEdit','newPatient'].includes(route.name);}
  function hasDirty(){if(!editingForm)return false;const f=$screen.querySelector('form#data-form');return Boolean(f&&JSON.stringify(formValues(f))!==formBaseline);}
  async function go(next,{push=true,force=false}={}){
    if(!force&&hasDirty()){const okay=await promptModal('Cambios sin guardar','Has modificado el formulario. ¿Quieres salir sin guardar?', [{label:'Seguir editando',kind:'ghost',value:false},{label:'Salir sin guardar',kind:'danger',value:true}]);if(!okay)return false;}
    if(cloudConfig&&!['config','configDetail'].includes(next.name)){if(!await refreshCloud())return false;}
    if(next.name==='taskForm'&&next.taskId){const fresh=database.tasks.find(t=>t.id===next.taskId);if(!fresh){toast('La tarea se ha eliminado en otro dispositivo.');return false;}next.taskRev=fresh.rev;}
    if(next.name==='patientEdit'){const fresh=database.patients.find(p=>p.id===next.patientId);if(!fresh){toast('La ficha se ha eliminado en otro dispositivo.');return false;}next.rev=fresh.rev;}
    if(push)history.push({...route});route={...next};editingForm=false;render();window.scrollTo(0,0);return true;
  }
  async function back(){const last=history[history.length-1]||{name:'home'};if(await go(last,{push:false}))history.pop();}
  function navMarkup(){const entries=[['home','Inicio','home'],['new','Nuevo','plus'],['search','Buscar','search'],['config','Configuración','settings']];return entries.map(([id,label,ico])=>`<button type="button" class="nav-btn ${route.name===id||route.name==='chooseCategory'&&id==='new'?'active':''}" data-go="${id}" aria-label="${label}">${ico==='plus'?`<span class="nav-plus">${navSvg(ico)}</span>`:navSvg(ico)}<span>${label}</span></button>`).join('');}
  function brandMarkup(){return `<header class="brandline"><div class="brand-copy"><h1 class="brandtext">Neumo<span class="accent">Track</span></h1><p class="subtitle">Tu agenda de Neumología</p></div></header>`;}
  function bannerMarkup(){return `<div class="demo-note"><b>VERSIÓN DE PRUEBA</b><span>Solo datos ficticios · Guardado local en este navegador · Sin conexión a Google Sheets</span></div>`;}
  function pageHead(title,subtitle=''){return `<div class="page-head"><button type="button" class="page-back" data-action="back" aria-label="Volver">‹</button><div class="head-stack"><h1 class="page-title">${esc(title)}</h1>${subtitle?`<div class="page-subtitle">${esc(subtitle)}</div>`:''}</div></div>`;}
  function catCard(c,number){return `<button class="category-card cat-${c.id}" type="button" data-open-category="${c.id}" aria-label="${esc(c.label)}, ${number} pacientes activos"><span class="count" aria-hidden="true">${number}</span><span class="pictogram" aria-hidden="true"><img src="./assets/${c.icon}.png" alt="" draggable="false"></span><span class="card-bottom"><span class="card-title">${esc(c.label)}</span><span class="card-arrow" aria-hidden="true">›</span></span></button>`;}
  function renderHome(){const count=c=>database.tasks.filter(t=>t.category===c.id&&t.active).length;return `${brandMarkup()}<div class="category-grid">${CATEGORIES.map(c=>catCard(c,count(c))).join('')}</div><p class="footer-meta"><span class="demo-dot"></span> ${cloudConfig?(cloudOnline?'AGENDA COMPARTIDA · Sincronizada al entrar y guardar':'AGENDA COMPARTIDA · Sin conexión'):'MODO LOCAL · Datos de prueba'}</p>`;}
  function sortedTasks(cat,tab){const tasks=database.tasks.filter(t=>t.category===cat && (tab==='active'?t.active:!t.active));const getP=t=>database.patients.find(p=>p.id===t.patientId);return tasks.sort((a,b)=>tab==='active'?((a.data.dateReview||'9999-99-99').localeCompare(b.data.dateReview||'9999-99-99') || patientName(getP(a)||{name:'',surname:''}).localeCompare(patientName(getP(b)||{name:'',surname:''}),'es')):((b.finishedAt||'').localeCompare(a.finishedAt||'')|| patientName(getP(a)||{name:'',surname:''}).localeCompare(patientName(getP(b)||{name:'',surname:''}),'es')));}
  function catRows(tasks,tab,filter=''){const shown=tasks.filter(t=>{const p=database.patients.find(p=>p.id===t.patientId);return p&&norm(`${patientName(p)} ${p.nuhsa} ${displayPrimary(t)}`).includes(norm(filter));});if(!shown.length)return `<div class="empty-state"><div class="symbol">${tab==='active'?'📭':'📂'}</div><strong>No hay pacientes ${tab==='active'?'activos':'finalizados'}</strong><span>${filter?'Prueba otra búsqueda.':'En este apartado no hay registros que mostrar.'}</span></div>`;return shown.map(t=>{const p=database.patients.find(p=>p.id===t.patientId);const date=tab==='active'?t.data.dateReview:t.finishedAt;return `<button type="button" class="patient-row" data-task="${t.id}"><span class="patient-name">${esc(patientName(p))}</span><span class="primary-info">${esc(displayPrimary(t)||'—')}</span><span class="rev-date ${tab==='active'?dateTone(date):''}">${fmtDate(date)}</span><span class="mobile-detail" aria-hidden="true">›</span></button>`;}).join('');}
  function displayPrimary(t){if(t.category==='committee')return t.data.situation||'—';if(['Otros','Otras'].includes(t.data.primary)&&t.data.otherDetail)return t.data.otherDetail;return t.data.primary||'—';}
  function renderCategory(){const c=category(route.category),tab=route.tab||'active';const allA=sortedTasks(c.id,'active');const allF=sortedTasks(c.id,'finished');const current=tab==='active'?allA:allF;return `${pageHead(c.label)}<div class="section"><div class="section-head"><h2>Pacientes</h2></div><div class="tabs"><button type="button" class="tab-btn ${tab==='active'?'active':''}" data-cat-tab="active">Activos (${allA.length})</button><button type="button" class="tab-btn ${tab==='finished'?'active':''}" data-cat-tab="finished">Finalizados (${allF.length})</button></div><div class="table-head"><span>Nombre</span><span>${esc(c.central)}</span><span style="text-align:right">${tab==='active'?'Próxima revisión':'Finalización'}</span></div><div id="cat-rows">${catRows(current,tab)}</div></div>`;}
  function renderNew(){return `${pageHead('Nuevo','Elige dónde quieres añadir una tarea')}<div class="section"><div class="subheading">Selecciona el apartado</div><div class="category-choice">${CATEGORIES.map(c=>`<button type="button" class="choice cat-${c.id}" data-pick-cat="${c.id}"><span class="choice-ico"><img src="./assets/${c.icon}.png" alt=""></span><span class="choice-label">${esc(c.label)}</span><span class="choice-arrow">›</span></button>`).join('')}</div></div>`;}
  function lookupRows(query){const filtered=database.patients.filter(p=>norm(`${patientName(p)} ${p.nuhsa}`).includes(norm(query))).sort(byName);if(!filtered.length)return `<div class="empty-state"><strong>No se han encontrado pacientes</strong><span>Puedes crear un paciente nuevo.</span></div>`;return `<div class="results-head"><span>Nombre y apellidos</span><span>NUHSA</span><span>Activas</span></div>${filtered.map(p=>`<button class="result-row" data-select-patient="${p.id}"><span class="rn">${esc(patientName(p))}</span><span class="rnu">${esc(p.nuhsa)}</span><span class="number"><span class="pill">${database.tasks.filter(t=>t.active&&t.patientId===p.id).length}</span></span></button>`).join('')}`;}
  function renderPatientLookup(){return `${pageHead('Seleccionar paciente',category(route.category).label)}<div class="section"><div class="section-head"><div><h2>¿A qué paciente corresponde?</h2><p>Busca antes de crear una ficha para evitar duplicados</p></div></div><input class="search-input" id="lookup-search" type="search" autocomplete="off" placeholder="Nombre, apellidos o NUHSA…" value="${esc(route.query||'')}"><div id="lookup-results">${lookupRows(route.query||'')}</div><div class="button-row"><button class="btn btn-primary" data-action="new-patient">＋ Crear nuevo paciente</button></div></div>`;}
  function renderSearch(){return `${pageHead('Buscar','Todos los pacientes registrados')}<div class="section"><div class="section-head"><div><h2>Buscar pacientes</h2><p>Incluye pacientes sin tareas activas y pacientes finalizados</p></div></div><input class="search-input" id="global-lookup" type="search" placeholder="Nombre, apellidos o NUHSA…" autocomplete="off" value="${esc(route.query||'')}"><div id="lookup-results">${lookupRows(route.query||'')}</div></div>`;}
  function patientInfo(p){const info=[['Sexo',p.sex||'—'],['Edad',p.age!==undefined&&p.age!==''?`${p.age} años`:'—'],['NUHSA',p.nuhsa],['Juicio clínico',p.judgement||'—'],['Teléfono de contacto',p.phone||'—'],['Observaciones generales',p.observations||'—']];return `<div class="info-grid">${info.map(([title,val])=>`<div class="info-item ${['Juicio clínico','Observaciones generales'].includes(title)?'full':''}"><div class="label">${title}</div><div class="value">${esc(val)}</div></div>`).join('')}</div>`;}
  function renderPatient(){const p=database.patients.find(p=>p.id===route.patientId);if(!p)return `<div>Paciente no encontrado</div>`;const active=database.tasks.filter(t=>t.patientId===p.id&&t.active).sort((a,b)=>CATEGORIES.findIndex(c=>c.id===a.category)-CATEGORIES.findIndex(c=>c.id===b.category));const finished=database.tasks.filter(t=>t.patientId===p.id&&!t.active);return `${pageHead(patientName(p),'Ficha general del paciente')}<div class="section"><div class="section-head"><h2>Datos generales</h2><button class="btn btn-soft" type="button" data-edit-patient="${p.id}">✎ Editar datos</button></div>${patientInfo(p)}</div><div class="section"><div class="section-head"><div><h2>Tareas activas</h2><p>${active.length} ${active.length===1?'apartado activo':'apartados activos'}</p></div></div>${active.length?`<div class="compact-tasks">${active.map(t=>`<button class="compact-task" data-task="${t.id}"><strong>${esc(category(t.category).label)}</strong><span>${esc(displayPrimary(t))}</span><em>›</em></button>`).join('')}</div>`:`<div class="empty-state" style="padding:15px 0 26px"><strong>No tiene tareas activas</strong></div>`}<div class="button-row" style="justify-content:space-between"><button class="btn btn-primary" data-add-patient-task="${p.id}">＋ Añadir tarea</button>${finished.length?`<button class="btn btn-ghost" data-show-patient-finished="${p.id}">Ver tareas finalizadas (${finished.length})</button>`:''}</div></div><div class="button-row"><button class="btn btn-danger" data-delete-patient="${p.id}">🗑 Eliminar paciente</button></div>`;}
  function renderPatientFinished(){const p=database.patients.find(p=>p.id===route.patientId);const t=database.tasks.filter(t=>t.patientId===p.id&&!t.active).sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt));return `${pageHead('Tareas finalizadas',patientName(p))}<div class="section">${t.length?t.map(task=>`<button type="button" class="compact-task" style="width:100%;text-align:left;border:0;border-bottom:1px solid #e8eef3;background:white;padding:15px 0;display:flex;align-items:center;gap:15px;color:#1a395c" data-task="${task.id}"><strong style="min-width:30%">${esc(category(task.category).label)}</strong><span style="flex:1">${esc(displayPrimary(task))}</span><small>${fmtDate(task.finishedAt)}</small><b>›</b></button>`).join(''):`<div class="empty-state">No hay tareas finalizadas.</div>`}</div>`;}
  function patientFields(p={}){
    const basic=[['name','Nombre',true],['surname','Apellidos',true],['nuhsa','NUHSA',true]];
    const basicMarkup=basic.map(([n,label,required])=>`<div class="field"><label for="p-${n}">${label}<span class="required">*</span></label><input id="p-${n}" name="${n}" type="text" value="${esc(p[n]||'')}" required ${n==='nuhsa'?'autocomplete="off"':''}></div>`).join('');
    return `<div class="field-grid">${basicMarkup}
      <fieldset class="field sex-field"><legend>Sexo</legend><div class="sex-choices">
        <label class="sex-choice sex-choice-m"><input type="radio" name="sex" value="Hombre" ${p.sex==='Hombre'?'checked':''}><span>${sexIcon({sex:'Hombre'})} Hombre</span></label>
        <label class="sex-choice sex-choice-f"><input type="radio" name="sex" value="Mujer" ${p.sex==='Mujer'?'checked':''}><span>${sexIcon({sex:'Mujer'})} Mujer</span></label>
      </div></fieldset>
      <div class="field"><label for="p-age">Edad</label><input id="p-age" name="age" type="number" min="0" max="120" step="1" inputmode="numeric" placeholder="Años" value="${esc(p.age??'')}"></div>
      <div class="field wide"><label for="p-judgement">Juicio clínico</label><textarea id="p-judgement" name="judgement" rows="3" style="min-height:92px">${esc(p.judgement||'')}</textarea></div>
      <div class="field"><label for="p-phone">Teléfono de contacto</label><input id="p-phone" name="phone" type="tel" value="${esc(p.phone||'')}"></div>
      <div class="field wide"><label for="p-observations">Observaciones generales</label><textarea id="p-observations" name="observations" rows="6" style="min-height:150px">${esc(p.observations||'')}</textarea></div>
    </div>`;
  }
  function renderNewPatient(){return `${pageHead('Nuevo paciente',category(route.category).label)}<div class="section"><div class="section-head"><h2>Datos generales</h2><span class="pill">* Obligatorio</span></div><form id="data-form" novalidate>${patientFields()}<div class="button-row end-actions"><button class="btn btn-primary" type="submit">💾 Guardar y continuar</button></div></form></div>`;}
  function renderPatientEdit(){const p=database.patients.find(p=>p.id===route.patientId);return `${pageHead('Editar paciente',patientName(p))}<div class="section"><form id="data-form" novalidate>${patientFields(p)}<div class="button-row end-actions"><button class="btn btn-primary" type="submit">💾 Guardar cambios</button></div></form></div>`;}
  function listOptions(name,current=''){let choices=(database.options[name]||[]).slice();if(current&&!choices.includes(current))choices.push(current);return choices;}
  function fieldMarkup(f,d,disabled){const v=d[f.name]||'';let field='';if(f.type==='select'){field=`<select name="${f.name}" id="field-${f.name}" ${disabled?'disabled':''} ${f.required?'required':''}><option value="">Seleccionar ${f.name==='primary'?'opción':f.label.toLowerCase()}…</option>${listOptions(f.list,v).map(s=>`<option value="${esc(s)}" ${s===v?'selected':''}>${esc(s)}</option>`).join('')}</select>`;}
    else if(f.type==='autocomplete'){
      // The HTML datalist is not reliably exposed as a tappable menu in iPhone Safari.
      // A native-looking searchable combobox works both with touch and keyboard.
      field=`<div class="nt-combo" data-combo>
        <div class="nt-combo-control">
          <input id="field-${f.name}" name="${f.name}" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Escribe o selecciona…" value="${esc(v)}" aria-autocomplete="list" aria-expanded="false" aria-controls="nt-options-${f.name}" ${disabled?'disabled':''} ${f.required?'required':''}>
          <button type="button" class="nt-combo-toggle" data-combo-toggle aria-label="Mostrar opciones de ${esc(f.label)}" ${disabled?'disabled':''}><span aria-hidden="true">⌄</span></button>
        </div>
        <div id="nt-options-${f.name}" class="nt-combo-options hidden" role="listbox" aria-label="Opciones de ${esc(f.label)}">
          ${listOptions(f.list,v).map(s=>`<button type="button" role="option" data-combo-value="${esc(s)}" aria-selected="${s===v?'true':'false'}">${esc(s)}</button>`).join('')}
          <p class="nt-combo-empty hidden">No está en el listado. Puedes escribirla directamente.</p>
          <p class="nt-combo-hint">También puedes escribir una opción diferente.</p>
        </div>
      </div>`;
    }
    else if(f.type==='date'){field=`<input id="field-${f.name}" name="${f.name}" type="date" value="${esc(v)}" ${disabled?'disabled':''}>`;}
    else if(f.type==='textarea'){field=`<textarea name="${f.name}" id="field-${f.name}" rows="6" placeholder="Escribe aquí tus anotaciones…" ${disabled?'disabled':''}>${esc(v)}</textarea>`;}
    else field=`<input id="field-${f.name}" name="${f.name}" type="text" value="${esc(v)}" placeholder="Escribe el asunto…" ${disabled?'disabled':''}>`;
    return `<div class="field ${f.wide?'wide':''}" ${f.dynamic?'data-dynamic="'+f.dynamic+'"':''}><label for="field-${f.name}">${esc(f.label)}${f.required?'<span class="required">*</span>':''}</label>${field}${f.other?`<div class="field hidden" data-other-detail style="margin-top:9px"><label for="field-otherDetail">Especificar ${esc(f.label.toLowerCase())}</label><input type="text" name="otherDetail" id="field-otherDetail" value="${esc(d.otherDetail||'')}" ${disabled?'disabled':''} placeholder="Escribe aquí la opción…"></div>`:''}</div>`;
  }
  function closeCombos(except=null){
    for(const combo of $screen.querySelectorAll('[data-combo]')){
      if(combo===except)continue;
      combo.classList.remove('open');
      combo.querySelector('.nt-combo-options')?.classList.add('hidden');
      combo.querySelector('input')?.setAttribute('aria-expanded','false');
    }
  }
  function updateComboFilter(combo,query='',showAll=false){
    const target=norm(query);
    let count=0;
    for(const option of combo.querySelectorAll('[data-combo-value]')){
      const visible=showAll || !target || norm(option.dataset.comboValue).includes(target);
      option.classList.toggle('hidden',!visible);
      if(visible)count++;
    }
    combo.querySelector('.nt-combo-empty')?.classList.toggle('hidden',count>0);
  }
  function openCombo(combo,{all=false}={}){
    if(!combo)return;
    closeCombos(combo);
    combo.classList.add('open');
    combo.querySelector('.nt-combo-options')?.classList.remove('hidden');
    const input=combo.querySelector('input');
    input?.setAttribute('aria-expanded','true');
    updateComboFilter(combo,input?.value||'',all);
  }
  function chooseCombo(combo,value){
    const input=combo.querySelector('input');
    if(!input||input.disabled)return;
    input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    closeCombos();
  }
  function showOther(form){const w=form.querySelector('[data-other-detail]');if(!w)return;const v=form.elements.primary?.value||'';w.classList.toggle('hidden',!['Otros','Otras'].includes(v));}
  function showDateAppointment(form){const el=form.querySelector('[data-dynamic="cita"]');if(!el)return;const situation=form.elements.situation?.value||'';const value=form.elements.dateAppointment?.value||'';el.classList.toggle('hidden',!(situation.startsWith('Citada,')||situation.startsWith('Realizada,')||situation.startsWith('Resultado')||situation.startsWith('Revisada')||Boolean(value)));}
  function renderTaskForm(){const p=database.patients.find(p=>p.id===route.patientId);const task=route.taskId?database.tasks.find(t=>t.id===route.taskId):null;if(!p)return '<div>Paciente no encontrado</div>';const cat=category(route.category);const d=task?.data||{};const done=Boolean(task&&!task.active);return `${pageHead(cat.label)}<div class="patient-head-card">${sexIcon(p)}<div class="patient-head-content"><div class="patient-title-row"><button class="name-link" data-open-patient="${p.id}" type="button">${esc(patientName(p))} ↗</button>${ageBadge(p)}</div><div class="small">NUHSA: ${esc(p.nuhsa)}</div>${p.judgement?`<div class="patient-judgement">${esc(p.judgement)}</div>`:''}</div></div>${done?`<div class="warning-box">Tarea finalizada el ${fmtDate(task.finishedAt)}. Para modificarla, primero debes reactivarla.</div>`:''}<div class="section"><form id="data-form" novalidate><div class="field-grid">${FIELDS[cat.id].map(f=>fieldMarkup(f,d,done)).join('')}</div>${done?`<div class="button-row end-actions"><button class="btn btn-primary" type="button" data-reactivate="${task.id}">↻ Reactivar</button><button class="btn btn-danger" type="button" data-delete-task="${task.id}">🗑 Eliminar</button></div>`:`<div class="button-row end-actions"><button class="btn btn-primary" type="submit">💾 Guardar</button>${task?`<button class="btn btn-success" type="button" data-finish-task="${task.id}">✓ Finalizar</button><button class="btn btn-danger" type="button" data-delete-task="${task.id}">🗑 Eliminar</button>`:''}</div>`}</form></div>`;}
  function renderConfig(){const items=[['sync','🔄','Sincronización','Estado de conexión y actualización de datos'],['options','📋','Personalizar desplegables','Modificar las opciones disponibles'],['backup','💾','Copia de seguridad','Exportar e importar datos ficticios'],['access','🔐','Acceso y seguridad','Información sobre la protección de datos'],['about','ℹ️','Acerca de NeumoTrack','Versión y detalles técnicos']];return `${pageHead('Configuración','Preferencias de NeumoTrack')}<div class="section">${items.map(([id,icon,title,desc])=>`<button type="button" class="config-entry" data-config="${id}"><span class="entry-ico">${icon}</span><span class="entry-label"><strong>${title}</strong><small>${desc}</small></span><span class="chev">›</span></button>`).join('')}</div>`;}
  function renderConfigDetail(){let content='';switch(route.section){
    case 'sync':content=`<div class="section"><h2>🔄 Sincronización</h2>
    <div class="warning-box">Estado: <b>${cloudConfig?(cloudOnline?'Conectada a Google Sheets':'Conectada, pendiente de comprobar conexión'):'Modo local (sin sincronización)'}</b></div>
    ${cloudConfig?`<p>La agenda se actualiza al entrar en cada pantalla y al guardar. Si no se puede confirmar un guardado, los datos del formulario permanecen para que puedas reintentarlo.</p><div class="button-row"><button class="btn btn-primary" data-action="sync-refresh">↻ Actualizar ahora</button><button class="btn btn-soft" data-action="sync-upload-local">Subir mis datos locales a una agenda compartida vacía</button><button class="btn btn-ghost" data-action="sync-disconnect">Desconectar</button></div><p class="muted">Conectado a: ${esc(cloudConfig.url)}</p>`:
    `<p>Conecta el mismo Google Apps Script desde el iPhone y el ordenador. La agenda compartida comienza vacía; los datos de prueba guardados en este dispositivo no se suben automáticamente.</p><div class="field"><label for="sync-url">URL de Apps Script (termina en /exec)</label><input id="sync-url" type="url" placeholder="https://script.google.com/macros/s/…/exec" autocapitalize="none" spellcheck="false"></div><div class="field"><label for="sync-token">Clave de conexión</label><input id="sync-token" type="password" autocomplete="off" placeholder="Tu clave definida en Apps Script"></div><div class="button-row"><button class="btn btn-primary" data-action="sync-connect">Conectar agenda</button></div>`}
    </div>`;break;
    case 'options':content=`<div class="section"><h2>Personalizar desplegables</h2><p class="secondary-info">Puedes añadir o quitar opciones en este prototipo. Las opciones guardadas en tareas existentes no se eliminan de esas tareas.</p><div class="field" style="max-width:520px"><label for="option-key">Lista que deseas modificar</label><select id="option-key">${Object.entries(KEY_OPTIONS_LABELS).map(([k,v])=>`<option value="${k}" ${k===(route.optionKey||'testsPrimary')?'selected':''}>${esc(v)}</option>`).join('')}</select></div><div id="option-list">${configOptionList(route.optionKey||'testsPrimary')}</div><form id="option-add-form" class="config-add"><input class="search-input" id="option-new" placeholder="Añadir opción…" aria-label="Nueva opción" required><button class="btn btn-primary" type="submit">Añadir</button></form></div>`;break;
    case 'backup':content=`<div class="section"><h2>💾 Copia de seguridad</h2><p>Exporta un archivo JSON con los pacientes ficticios y sus tareas, o recupera una copia anterior.</p><div class="warning-box">Es una copia local de demostración. No contiene mecanismos de seguridad para almacenar datos clínicos reales.</div><div class="button-row" style="justify-content:flex-start"><button class="btn btn-primary" type="button" data-action="export">↓ Exportar JSON</button><button class="btn btn-soft" type="button" data-action="import">↑ Importar JSON</button></div></div>`;break;
    case 'access':content=`<div class="section"><h2>🔐 Acceso y seguridad</h2><p>La configuración de acceso de Google Apps Script se gestiona en la cuenta que aloja la hoja compartida.</p></div>`;break;
    case 'about':content=`<div class="section"><h2>ℹ️ Acerca de NeumoTrack</h2><p><strong>NeumoTrack v9 · Sincronización opcional</strong></p><p>Tu agenda de Neumología.</p><p>Interfaz PWA para iPhone y ordenador, con seis categorías y navegación adaptativa. Datos de prueba: almacenamiento local o compartido cuando se configura Google Sheets.</p><p class="muted">La conexión con Google Sheets se configura desde Sincronización.</p></div>`;break;
  }return `${pageHead(KEY_OPTIONS_LABELS[route.section]||({sync:'Sincronización',options:'Personalizar desplegables',backup:'Copia de seguridad',access:'Acceso y seguridad',about:'Acerca de NeumoTrack'})[route.section]||'Configuración')}${content}`;}
  function configOptionList(key){return `<div class="option-list">${(database.options[key]||[]).map((x,i)=>`<span class="opt-tag">${esc(x)}<button type="button" data-remove-option="${i}" title="Quitar opción" aria-label="Quitar ${esc(x)}">×</button></span>`).join('')}</div>`;}
  function render(){const isForm=['taskForm','patientEdit','newPatient'].includes(route.name);$screen.classList.toggle('form-screen',isForm);$nav.classList.toggle('hidden',isForm);$nav.innerHTML=navMarkup();let html='';switch(route.name){
    case 'home':html=renderHome();break;case 'category':html=renderCategory();break;case 'new':html=renderNew();break;
    case 'patientLookup':html=renderPatientLookup();break;case 'search':html=renderSearch();break;
    case 'patientDetail':html=renderPatient();break;case 'patientFinished':html=renderPatientFinished();break;
    case 'newPatient':html=renderNewPatient();break;case 'patientEdit':html=renderPatientEdit();break;
    case 'taskForm':html=renderTaskForm();break;case 'config':html=renderConfig();break;case 'configDetail':html=renderConfigDetail();break;
    default:html=renderHome();
  }$screen.innerHTML=html;const form=$screen.querySelector('#data-form');editingForm=Boolean(form&&!($screen.querySelector('[data-reactivate]')));if(form){showDateAppointment(form);showOther(form);formBaseline=JSON.stringify(formValues(form));}else formBaseline='';}
  function formValues(form){const result={};for(const el of form.querySelectorAll('[name]')){if(el.disabled)continue;if((el.type==='radio'||el.type==='checkbox')&&!el.checked)continue;result[el.name]=el.type==='date'?el.value:clean(el.value);}if(form.querySelector('[name=sex]')&&!('sex' in result))result.sex='';return result;}
  function isValidTask(vals,cat){const principal=FIELDS[cat].find(f=>f.required);if(!clean(vals[principal.name])){toast(`Completa el campo obligatorio: ${principal.label}.`);$screen.querySelector(`[name="${principal.name}"]`)?.focus();return false;}if(['Otras','Otros'].includes(vals.primary)&&!clean(vals.otherDetail)){toast('Especifica la opción elegida en Otros.');$screen.querySelector('[name="otherDetail"]')?.focus();return false;}return true;}
  function validatePatient(vals,oldId){if(!vals.name||!vals.surname||!vals.nuhsa){toast('Nombre, apellidos y NUHSA son obligatorios.');return false;}if(vals.age!==''&&(!/^\d{1,3}$/.test(vals.age)||Number(vals.age)>120)){toast('Introduce una edad válida entre 0 y 120 años.');$screen.querySelector('[name=age]')?.focus();return false;}const exists=database.patients.find(p=>norm(p.nuhsa)===norm(vals.nuhsa) && p.id!==oldId);if(exists){promptModal('Paciente ya registrado',`Ya existe una ficha con ese NUHSA: ${patientName(exists)}.`,[{label:'Cerrar',kind:'ghost',value:false},{label:'Abrir ficha existente',kind:'primary',value:true}]).then(yes=>{if(yes)go({name:'patientDetail',patientId:exists.id},{force:true});});return false;}return true;}
  async function persistDb(next){
    if(!cloudConfig){const ok=writeStored(next);if(ok)database=next;else toast('No se pudo guardar en este navegador.');return ok;}
    if(cloudBusy){toast('Espera a que termine la sincronización.');return false;}
    if(pendingCloudWrite){
      try{
        const result=await getCloudAt(cloudConfig);
        const previouslySaved=(result.operations||[]).includes(pendingCloudWrite.operationId)||result.lastOperationId===pendingCloudWrite.operationId;
        const conflict=result.revision!==pendingCloudWrite.baseRevision;
        if(previouslySaved||conflict){pendingCloudWrite=null;applyCloudSnapshot(result);toast(previouslySaved?'Se ha confirmado el guardado anterior. Vuelve a abrir la ficha para comprobarlo.':'La agenda cambió en otro dispositivo. Revisa tus datos.');return false;}
        pendingCloudWrite=null;cloudOnline=true; // Operación anterior no confirmada: un nuevo guardado mantiene el bloqueo por revisión en servidor.
      }catch(e){toast('No se ha podido comprobar el guardado pendiente.');return false;}
    }
    cloudBusy=true;
    try{
      if(!cloudOnline){toast('Sin conexión con la agenda compartida. No se han perdido tus cambios.');return false;}
      const current=await getCloudAt(cloudConfig);
      if(current.revision!==cloudRevision){applyCloudSnapshot(current);toast('La agenda ha cambiado en otro dispositivo. Tus cambios siguen en el formulario; vuelve a revisarlos.');return false;}
      const operationId=uid();const baseRevision=cloudRevision;
      pendingCloudWrite={operationId,baseRevision};
      try{
        await fetch(cloudConfig.url,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action:'save',token:cloudConfig.token,operationId,baseRevision,data:next}),redirect:'follow'});
      }catch(e){/* El POST puede haberse procesado aunque el navegador informe de un fallo. Se verifica por lectura. */}
      let last=null;
      for(let attempt=0;attempt<6;attempt++){
        try{last=await getCloudAt(cloudConfig);
          if((last.operations||[]).includes(operationId)||last.lastOperationId===operationId){
            applyCloudSnapshot(last);pendingCloudWrite=null;return true;
          }
          if(last.revision!==baseRevision){applyCloudSnapshot(last);pendingCloudWrite=null;toast('Otro dispositivo modificó la agenda. No se han sobrescrito tus cambios.');return false;}
        }catch(e){}
        await new Promise(resolve=>setTimeout(resolve,1200));
      }
      // Mantener ID para evitar repetir una operación cuyo resultado se desconoce.
      cloudOnline=false;toast('No se pudo confirmar el guardado. Tus cambios permanecen en pantalla.');return false;
    }catch(err){cloudOnline=false;toast('No se pudo guardar: '+err.message);return false;}
    finally{cloudBusy=false;}
  }
  function latestDb(){return readStored()||database;}
  async function savePatient(form){const vals=formValues(form);if(!validatePatient(vals,route.name==='patientEdit'?route.patientId:null))return;const next=latestDb();const duplicate=next.patients.find(p=>norm(p.nuhsa)===norm(vals.nuhsa)&&p.id!==(route.name==='patientEdit'?route.patientId:null));if(duplicate){toast('Este NUHSA ya está registrado.');return;}
    if(route.name==='newPatient'){const patient={...vals,id:uid(),rev:1};next.patients.push(patient);if(!await persistDb(next))return;editingForm=false;await go({name:'taskForm',category:route.category,patientId:patient.id},{force:true});toast('Paciente creado. Completa su primera tarea.');}
    else{const existing=next.patients.find(p=>p.id===route.patientId);if(!existing)return toast('La ficha ya no existe.');if(existing.rev!==route.rev && typeof route.rev==='number')return toast('Esta ficha fue modificada en otra pestaña. Vuelve a cargarla.');Object.assign(existing,vals,{rev:(existing.rev||1)+1});if(!await persistDb(next))return;editingForm=false;await go({name:'patientDetail',patientId:existing.id},{force:true});toast('Datos del paciente guardados.');}
  }
  function taskConflict(next){const task=next.tasks.find(t=>t.id===route.taskId);if(route.taskId&&(!task||task.rev!==route.taskRev))return true;return false;}
  async function conflictMessage(){await promptModal('Cambios más recientes','Este formulario ha cambiado desde que lo abriste, posiblemente en otra pestaña. No se han sobrescrito los cambios. Puedes revisarlos antes de guardar.',[{label:'Seguir editando',kind:'ghost',value:false},{label:'Actualizar ficha',kind:'primary',value:true}]).then(refresh=>{if(refresh){database=latestDb();go({...route,taskRev:database.tasks.find(t=>t.id===route.taskId)?.rev},{force:true,push:false});}});}
  async function commitTask(finalize){const form=$screen.querySelector('#data-form');if(!form)return;const vals=formValues(form);if(!isValidTask(vals,route.category))return;
    const current=latestDb();if(taskConflict(current)){await conflictMessage();return;}
    const existing=current.tasks.find(t=>t.id===route.taskId);
    if(existing){existing.data={...existing.data,...vals};existing.rev=(existing.rev||1)+1;if(finalize){existing.active=false;existing.finishedAt=today();}}
    else {const other=current.tasks.find(t=>t.patientId===route.patientId&&t.category===route.category);if(other){toast('El paciente ya tiene un registro en este apartado.');return;}current.tasks.push({id:uid(),patientId:route.patientId,category:route.category,data:vals,active:!finalize,finishedAt:finalize?today():null,rev:1});}
    if(!await persistDb(current))return;editingForm=false;await go({name:'category',category:route.category,tab:finalize?'finished':'active'},{force:true});toast(finalize?'Tarea finalizada correctamente.':'Guardado correctamente.');}
  async function finishTask(){if(!isValidTask(formValues($screen.querySelector('#data-form')),route.category))return;const yes=await promptModal('Finalizar esta tarea','Se guardarán los cambios realizados y la tarea pasará a Finalizados. ¿Quieres continuar?', [{label:'Cancelar',kind:'ghost',value:false},{label:'Finalizar',kind:'primary',value:true}]);if(yes)await commitTask(true);}
  async function deleteTask(taskId){const t=database.tasks.find(t=>t.id===taskId);if(!t)return;const yes=await promptModal('Eliminar tarea','Se eliminará este registro de '+category(t.category).label+'. La ficha general del paciente y los demás apartados se conservarán. ¿Confirmas la eliminación?', [{label:'Cancelar',kind:'ghost',value:false},{label:'Eliminar',kind:'danger',value:true}]);if(!yes)return;const next=latestDb();const target=next.tasks.find(x=>x.id===taskId);if(!target){toast('La tarea ya se ha eliminado.');return;}if(target.rev!==route.taskRev){await conflictMessage();return;}next.tasks=next.tasks.filter(x=>x.id!==taskId);if(!await persistDb(next))return;editingForm=false;await go({name:'category',category:t.category,tab:t.active?'active':'finished'},{force:true});toast('Tarea eliminada.');}
  async function reactivateTask(id){const t=database.tasks.find(t=>t.id===id);if(!t)return;const yes=await promptModal('Reactivar tarea','Se recuperará este registro. La situación/estado y la fecha de próxima revisión quedarán vacíos; las observaciones y los demás datos se conservarán.',[{label:'Cancelar',kind:'ghost',value:false},{label:'Reactivar',kind:'primary',value:true}]);if(!yes)return;const next=latestDb();const task=next.tasks.find(x=>x.id===id);if(!task)return toast('La tarea ya no existe.');if(next.tasks.some(x=>x.id!==id&&x.patientId===task.patientId&&x.category===task.category&&x.active)){toast('Ya existe otra tarea activa en ese apartado.');return;}task.active=true;task.finishedAt=null;task.data.dateReview='';if(task.category==='transplant')task.data.primary='';else task.data.situation='';task.rev=(task.rev||1)+1;if(!await persistDb(next))return;editingForm=false;await go({name:'category',category:task.category,tab:'active'},{force:true});toast('Tarea reactivada. Selecciona la nueva situación.');}
  async function deletePatient(id){const p=database.patients.find(p=>p.id===id);if(!p)return;const count=database.tasks.filter(t=>t.patientId===id).length;const yes=await promptModal('Eliminar paciente por completo',`Se borrará definitivamente la ficha de ${patientName(p)} y sus ${count} tarea(s), tanto activas como finalizadas, en TODOS los apartados. Esta acción no se puede deshacer desde NeumoTrack.`,[{label:'Cancelar',kind:'ghost',value:false},{label:'Eliminar paciente',kind:'danger',value:true}],{phrase:true});if(!yes)return;const next=latestDb();next.patients=next.patients.filter(p=>p.id!==id);next.tasks=next.tasks.filter(t=>t.patientId!==id);if(!await persistDb(next))return;await go({name:'search'},{force:true});toast('Paciente y tareas eliminados.');}
  async function selectPatientForCategory(id,cat){const t=database.tasks.find(t=>t.patientId===id&&t.category===cat);if(!t)return go({name:'taskForm',patientId:id,category:cat});if(t.active)return go({name:'taskForm',patientId:id,category:cat,taskId:t.id,taskRev:t.rev});const yes=await promptModal('Tarea ya finalizada',`Este paciente tiene una tarea finalizada en ${category(cat).label}. ¿Quieres abrirla para revisarla y, si lo deseas, reactivarla?`,[{label:'Cancelar',kind:'ghost',value:false},{label:'Abrir ficha existente',kind:'primary',value:true}]);if(yes)go({name:'taskForm',patientId:id,category:cat,taskId:t.id,taskRev:t.rev});}
  function downloadJson(){const blob=new Blob([JSON.stringify({app:'NeumoTrack',demo:true,exportedAt:new Date().toISOString(),data:database},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=`NeumoTrack_DEMO_${today()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Copia de prueba exportada.');}
  async function readImport(file){if(cloudConfig){toast('Desconecta la agenda compartida antes de importar un archivo local.');return;}try{const raw=JSON.parse(await file.text());const imp=raw.data;if(raw.app!=='NeumoTrack'||raw.demo!==true||!imp||!Array.isArray(imp.patients)||!Array.isArray(imp.tasks))throw Error('Archivo no válido para este prototipo.');if(imp.patients.length>50000||imp.tasks.length>100000)throw Error('Archivo demasiado grande.');if(new Set(imp.patients.map(p=>norm(p.nuhsa))).size!==imp.patients.length)throw Error('El archivo contiene NUHSA duplicados.');if(imp.tasks.some(t=>!imp.patients.some(p=>p.id===t.patientId)||!CATEGORIES.some(c=>c.id===t.category)))throw Error('El archivo contiene tareas inválidas.');const yes=await promptModal('Importar copia de seguridad','Se reemplazarán todos los datos ficticios guardados en este navegador con el contenido del archivo. ¿Quieres continuar?',[{label:'Cancelar',kind:'ghost',value:false},{label:'Importar copia',kind:'primary',value:true}]);if(!yes)return;imp.options=imp.options||JSON.parse(JSON.stringify(DEFAULT_OPTIONS));if(!await persistDb(imp))return;history=[];go({name:'home'},{force:true,push:false});toast('Copia de demostración importada.');}catch(e){toast(`Error al importar: ${e.message}`);}}
  function updateLookup(input){route.query=input.value;const target=$screen.querySelector('#lookup-results');if(target)target.innerHTML=lookupRows(route.query);}
  function updateCatFilter(input){route.filter=input.value;const target=$screen.querySelector('#cat-rows');if(target)target.innerHTML=catRows(sortedTasks(route.category,route.tab||'active'),route.tab||'active',route.filter);}
  $nav.addEventListener('click',e=>{const btn=e.target.closest('[data-go]');if(btn)go({name:btn.dataset.go});});
  $screen.addEventListener('click',async e=>{
    const el=e.target.closest('button');if(!el)return;
    if(el.dataset.comboToggle!==undefined){
      const combo=el.closest('[data-combo]');
      if(combo.classList.contains('open'))closeCombos();else openCombo(combo,{all:true});
      return;
    }
    if(el.dataset.comboValue!==undefined){chooseCombo(el.closest('[data-combo]'),el.dataset.comboValue);return;}
    if(el.dataset.action==='back'){await back();return;}
    if(el.dataset.openCategory){go({name:'category',category:el.dataset.openCategory,tab:'active'});return;}
    if(el.dataset.pickCat){if(route.patientId)selectPatientForCategory(route.patientId,el.dataset.pickCat);else go({name:'patientLookup',category:el.dataset.pickCat});return;}
    if(el.dataset.addCat){go({name:'patientLookup',category:el.dataset.addCat});return;}
    if(el.dataset.catTab){go({...route,tab:el.dataset.catTab,filter:''},{push:false});return;}
    if(el.dataset.task){const t=database.tasks.find(t=>t.id===el.dataset.task);if(t)go({name:'taskForm',category:t.category,patientId:t.patientId,taskId:t.id,taskRev:t.rev});return;}
    if(el.dataset.selectPatient){if(route.name==='patientLookup')selectPatientForCategory(el.dataset.selectPatient,route.category);else go({name:'patientDetail',patientId:el.dataset.selectPatient});return;}
    if(el.dataset.action==='new-patient'){go({name:'newPatient',category:route.category});return;}
    if(el.dataset.openPatient){go({name:'patientDetail',patientId:el.dataset.openPatient});return;}
    if(el.dataset.editPatient){const p=database.patients.find(p=>p.id===el.dataset.editPatient);go({name:'patientEdit',patientId:el.dataset.editPatient,rev:p.rev});return;}
    if(el.dataset.addPatientTask){go({name:'new',patientId:el.dataset.addPatientTask});return;}
    if(el.dataset.showPatientFinished){go({name:'patientFinished',patientId:el.dataset.showPatientFinished});return;}
    if(el.dataset.finishTask){await finishTask();return;}
    if(el.dataset.deleteTask){await deleteTask(el.dataset.deleteTask);return;}
    if(el.dataset.reactivate){await reactivateTask(el.dataset.reactivate);return;}
    if(el.dataset.deletePatient){await deletePatient(el.dataset.deletePatient);return;}
    if(el.dataset.config){go({name:'configDetail',section:el.dataset.config});return;}
    if(el.dataset.action==='sync-connect'){await connectCloud();return;}
    if(el.dataset.action==='sync-disconnect'){await disconnectCloud();return;}
    if(el.dataset.action==='sync-refresh'){if(await refreshCloud()){render();toast('Agenda compartida actualizada.');}return;}
    if(el.dataset.action==='sync-upload-local'){await uploadLocalCloud();return;}
    if(el.dataset.action==='export'){downloadJson();return;}
    if(el.dataset.action==='import'){document.getElementById('import-file').click();return;}
    if(el.dataset.removeOption!==undefined){const key=route.optionKey||'testsPrimary';const index=Number(el.dataset.removeOption);if(!Number.isInteger(index))return;const yes=await promptModal('Quitar opción',`La opción «${database.options[key][index]}» dejará de aparecer en este desplegable. Los datos guardados de las tareas existentes no cambiarán.`,[{label:'Cancelar',kind:'ghost',value:false},{label:'Quitar',kind:'danger',value:true}]);if(yes){const next=latestDb();next.options[key].splice(index,1);if(await persistDb(next))render();}return;}
  });
  $screen.addEventListener('input',e=>{
    if(e.target.id==='global-lookup'||e.target.id==='lookup-search'){updateLookup(e.target);return;}
    if(e.target.id==='cat-filter'){updateCatFilter(e.target);return;}
    const combo=e.target.closest('[data-combo]');
    if(combo){openCombo(combo);}
    if(e.target.name==='situation'&&route.category==='tests'){showDateAppointment(e.target.closest('form'));}if(e.target.name==='primary'&&route.name==='taskForm'){showOther(e.target.closest('form'));}
  });
  $screen.addEventListener('change',e=>{
    if(e.target.name==='situation'&&route.category==='tests')showDateAppointment(e.target.closest('form'));if(e.target.name==='primary'&&route.name==='taskForm')showOther(e.target.closest('form'));
    if(e.target.id==='option-key'){route.optionKey=e.target.value;$screen.querySelector('#option-list').innerHTML=configOptionList(route.optionKey);}
  });
  $screen.addEventListener('focusin',e=>{
    const combo=e.target.closest('[data-combo]');
    if(combo&&e.target.matches('input'))openCombo(combo);
  });
  $screen.addEventListener('keydown',e=>{
    const input=e.target.closest('[data-combo] input');
    if(!input)return;
    const combo=input.closest('[data-combo]');
    if(e.key==='Escape'){e.preventDefault();closeCombos();return;}
    if(e.key==='ArrowDown'){
      e.preventDefault();openCombo(combo,{all:!combo.classList.contains('open')});
      const first=[...combo.querySelectorAll('[data-combo-value]')].find(x=>!x.classList.contains('hidden'));
      first?.focus();return;
    }
    if(e.key==='Enter'&&combo.classList.contains('open')){
      const opts=[...combo.querySelectorAll('[data-combo-value]')].filter(x=>!x.classList.contains('hidden'));
      if(opts.length===1){e.preventDefault();chooseCombo(combo,opts[0].dataset.comboValue);}
    }
  });
  $screen.addEventListener('keydown',e=>{
    const option=e.target.closest('[data-combo-value]');
    if(option&&e.key==='Escape'){e.preventDefault();closeCombos();option.closest('[data-combo]').querySelector('input')?.focus();}
  });
  document.addEventListener('pointerdown',e=>{
    if(!e.target.closest('[data-combo]'))closeCombos();
  });
  $screen.addEventListener('submit',async e=>{
    if(e.target.id==='data-form'){e.preventDefault();if(route.name==='newPatient'||route.name==='patientEdit')await savePatient(e.target);else if(route.name==='taskForm')await commitTask(false);return;}
    if(e.target.id==='option-add-form'){e.preventDefault();const key=route.optionKey||'testsPrimary';const v=clean($screen.querySelector('#option-new').value);if(!v)return;if(database.options[key].some(s=>norm(s)===norm(v))){toast('Esa opción ya existe.');return;}const next=latestDb();next.options[key].push(v);if(await persistDb(next)){render();toast('Opción añadida.');}return;}
  });
  document.getElementById('import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(file)await readImport(file);e.target.value='';});
  window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY)return;if(!hasDirty()){database=readStored()||database;render();}else toast('Hay cambios en otra pestaña; revisaremos al guardar.');});
  initialize();
})();
