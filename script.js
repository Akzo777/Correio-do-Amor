import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = { apiKey: "AIzaSyDhAP2RMQ1TQyLzB1N9hs76AVjfqTjB9Pk", authDomain: "correio-91c8e.firebaseapp.com", databaseURL: "https://correio-91c8e-default-rtdb.firebaseio.com", projectId: "correio-91c8e", storageBucket: "correio-91c8e.firebasestorage.app", messagingSenderId: "40461554553", appId: "1:40461554553:web:92720144d48859c8e215a8" };
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let novasCartas=[], cartasLidas=[], cartasEnviadasDela=[], cartaAtualUnica=null, hasPlayedMusic=false, isTyping=false;

window.onload=()=>listenToDatabase();

function listenToDatabase() {
    onValue(ref(db, 'correio_dados'), snapshot => {
        const data = snapshot.val() || {};
        const enviadasObj = data.para_ele || {};
        cartasEnviadasDela = Object.keys(enviadasObj).map(k=>({firebaseKey:k,...enviadasObj[k]}));
        
        const paraElaObj = data.para_ela || {};
        let todas = Object.keys(paraElaObj).map(k=>({firebaseKey:k,...paraElaObj[k]}));
        todas.sort((a,b)=>a.id-b.id);
        
        const idsLidos = data.lidas_ela ? Object.values(data.lidas_ela) : [];
        novasCartas = todas.filter(c=>!idsLidos.includes(c.id));
        cartasLidas = todas.filter(c=>idsLidos.includes(c.id));
        updateUI();
    });
}

function updateUI() {
    const b = document.getElementById('notif-badge');
    if(b){ b.innerText=novasCartas.length; novasCartas.length>0?b.classList.add('show'):b.classList.remove('show'); }
    updateEnviadasUI(); updateLidasUI();
    if(document.getElementById('main-interface').style.display==='flex') renderEnvelope();
}

window.handleMailboxClick = () => {
    const s=document.getElementById('scene'), mb=document.getElementById('music-control');
    if(!s.classList.contains('open-door-state')){
        s.classList.add('open-door-state'); document.getElementById('prompt').innerHTML="✨ Clique novamente na caixa para abrir as abas! 👇"; document.getElementById('close-box-btn').classList.add('visible'); mb.classList.add('visible'); tocarMusica(0.4);
    } else { document.getElementById('scene').classList.add('vanish'); document.getElementById('main-interface').style.display='flex'; renderEnvelope(); }
};

function tocarMusica(v=0.5){ const m=document.getElementById('bg-music'); if(m&&!hasPlayedMusic){ m.volume=v; m.play().then(()=>hasPlayedMusic=true).catch(e=>console.log("Audio blk")); } }
window.toggleMusic=()=>{ const m=document.getElementById('bg-music'), b=document.getElementById('music-control'); if(m.paused){m.play();b.innerHTML="🔊";}else{m.pause();b.innerHTML="🔇";} };
window.closeMailbox=()=>{ 
    document.getElementById('main-interface').style.display='none'; 
    document.getElementById('scene').classList.remove('vanish','open-door-state'); 
    document.getElementById('prompt').innerHTML="Clique na Caixa para Abrir 📬"; 
    document.getElementById('close-box-btn').classList.remove('visible'); 
    
    
    switchTab('novas'); 
};

// Função auxiliar para datas simples (UI)
function formatarDataHora(d,h){ if(!d)return""; const p=d.split('-'); let s=`${p[2]}/${p[1]}/${p[0]}`; if(h)s+=` às ${h}`; return s; }

// --- NOVA FUNÇÃO: Formatar data para a API do OneSignal ---
function formatarDataOneSignal(dataStr, horaStr) {
    const dataAlvo = new Date(`${dataStr}T${horaStr || "00:00"}:00`);
    const pad = (n) => n < 10 ? '0' + n : n;
    const YYYY = dataAlvo.getFullYear(), MM = pad(dataAlvo.getMonth() + 1), DD = pad(dataAlvo.getDate()), HH = pad(dataAlvo.getHours()), mm = pad(dataAlvo.getMinutes()), ss = pad(dataAlvo.getSeconds());
    const offset = -dataAlvo.getTimezoneOffset(); const sign = offset >= 0 ? '+' : '-'; const offH = pad(Math.floor(Math.abs(offset) / 60)); const offM = pad(Math.abs(offset) % 60); const timezone = `GMT${sign}${offH}${offM}`;
    return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss} ${timezone}`;
}

window.showCustomAlert=(t,m,i="⚠️")=>{ const a=document.getElementById('custom-alert-modal'); if(!a)return alert(t+"\n"+m.replace(/<[^>]*>?/gm,'')); document.getElementById('alert-icon').innerText=i; document.getElementById('alert-title').innerText=t; document.getElementById('alert-message').innerHTML=m; a.classList.add('active'); };
window.closeAlertModal=()=>{ document.getElementById('custom-alert-modal').classList.remove('active'); };
window.toggleSendTimeInput=()=>{ const h=document.getElementById('send-has-time').checked; document.getElementById('send-time-group').style.display=h?'flex':'none'; if(!h)document.getElementById('send-time').value=""; };

window.renderEnvelope=()=>{
    const d=document.getElementById('envelope-display'); d.innerHTML="";
    if(novasCartas.length===0){ d.classList.remove('archive-grid'); d.innerHTML=`<div class="empty-msg"><p>🎉 Você já leu todas as cartas!</p><small style="color: var(--pc6); font-weight: normal;">Visite a aba "Lidas" para reler quando quiser.</small></div>`; return; }
    d.classList.add('archive-grid'); const ag=new Date();
    [...novasCartas].sort((a,b)=>new Date((a.data_abertura||0)+`T${a.hora_abertura||"00:00"}:00`)-new Date((b.data_abertura||0)+`T${b.hora_abertura||"00:00"}:00`)).forEach(c=>{
        let t=false; if(c.data_abertura&&new Date(`${c.data_abertura}T${c.hora_abertura||"00:00"}:00`)>ag)t=true;
        const cd=document.createElement('div');
        if(t){ cd.className="mini-envelope locked-envelope"; const av=formatarDataHora(c.data_abertura,c.hora_abertura); cd.onclick=()=>showCustomAlert("Trancada",`Abre em <b>${av}</b> 🔒`,"💌"); cd.innerHTML=`<div style="font-size: 24px; margin-bottom: 5px;">🔒</div><div>${c.titulo}</div><div style="font-size: 10px; color: #FF4B4B; margin-top: 5px;">Abre em: ${av}</div>`; }
        else { cd.className="mini-envelope"; cd.onclick=()=>{cartaAtualUnica=c;openLetterContent(true);}; cd.innerHTML=`<div style="font-size: 24px; margin-bottom: 5px;">${c.selo||'💌'}</div><div>${c.titulo}</div><div style="font-size: 10px; color: var(--primary); margin-top: 5px;">Nova!</div>`; }
        d.appendChild(cd);
    });
};

// --- EFEITO DA MÁQUINA DE ESCREVER COM AUTO-SCROLL E SKIP RÁPIDO ---
function typewriterEffect(id, html, cb) {
    const el = document.getElementById(id); 
    el.innerHTML = ""; 
    el.classList.add('typewriter-cursor'); 
    isTyping = true;
    
    // O container de rolagem é a caixa onde a carta está
    const paperScrollContainer = el.closest('.paper'); 
    let i = 0, isTag = false, buf = "";
    
    function type() {
        if(!isTyping) { 
            el.innerHTML = html; 
            el.classList.remove('typewriter-cursor'); 
            if(paperScrollContainer) paperScrollContainer.scrollTop = paperScrollContainer.scrollHeight;
            if(cb) cb(); 
            return; 
        }
        if(i < html.length) { 
            let c = html.charAt(i); 
            buf += c; 
            el.innerHTML = buf; 
            if(c === '<') isTag = true; 
            if(c === '>') isTag = false; 
            i++; 
            if(paperScrollContainer && !isTag) paperScrollContainer.scrollTop = paperScrollContainer.scrollHeight; // Rola junto com o texto
            setTimeout(type, isTag ? 0 : 15); // Acelerado para 15ms
        } else { 
            isTyping = false; 
            el.classList.remove('typewriter-cursor'); 
            if(cb) cb(); 
        }
    } 
    type();
}

window.openLetterContent=(isNew,isSent=false)=>{
    const o=document.getElementById('letter-overlay'), p=document.getElementById('paper-content'), a=document.getElementById('modal-actions-container');
    const tc = (cartaAtualUnica.tema && cartaAtualUnica.tema !== 'default') ? 'theme-' + cartaAtualUnica.tema : '';    const loved=cartaAtualUnica.loved?'loved':'';
    let react=isSent?'':`<div class="reaction-container" id="reaction-box" style="display:${isNew?'none':'block'};"><button class="btn-suspiro ${loved}" onclick="darSuspiro(this)" title="Amei!">💖</button><p style="font-size:10px;opacity:0.7;">Deixe um suspiro</p></div>`;
    
    // Aplicada a propriedade onclick="isTyping=false" no envelop todo para ela poder tocar e pular a animação.
    p.innerHTML=`<div class="custom-purple-paper ${tc}" style="border-radius: 8px; padding: 10px; cursor: pointer;" onclick="isTyping=false;"><div class="letter-header"><div class="header-item"><span class="header-label">De:</span><span class="header-value">${cartaAtualUnica.remetente}</span></div><div class="header-item"><span class="header-label">Para:</span><span class="header-value">${cartaAtualUnica.destinatario}</span></div></div><div class="letter-body" id="letter-body-content"></div>${react}</div>`;
    a.innerHTML='';
    if(isNew) a.innerHTML=`<button class="action-btn next-btn" id="btn-marcar-lida" onclick="progressLetter()" style="margin:0 auto;display:none;">Guardar com Carinho 📂</button>`;
    else if(isSent) a.innerHTML=`<div style="display:flex;gap:10px;"><button class="action-btn" style="background:var(--pc3);color:var(--text-dark);" onclick="editSentLetter('${cartaAtualUnica.firebaseKey}')">Editar ✏️</button><button class="action-btn" style="background:#FF4B4B;" onclick="deleteSentLetter('${cartaAtualUnica.firebaseKey}')">Excluir 🗑️</button></div>`;
    o.classList.add('active');
    if(isNew){ tocarMusica(0.6); typewriterEffect("letter-body-content",cartaAtualUnica.conteudo,()=>{ document.getElementById("btn-marcar-lida").style.display="block"; const rb=document.getElementById("reaction-box"); if(rb)rb.style.display="block"; }); }
    else { document.getElementById("letter-body-content").innerHTML=cartaAtualUnica.conteudo; }
};

window.darSuspiro=(btn)=>{ if(btn.classList.contains('loved'))return; btn.classList.add('loved'); if(cartaAtualUnica&&cartaAtualUnica.firebaseKey){ update(ref(db,`correio_dados/para_ela/${cartaAtualUnica.firebaseKey}`),{loved:true}); cartaAtualUnica.loved=true; } };
window.closeLetterModal=()=>{ isTyping=false; document.getElementById('letter-overlay').classList.remove('active'); };
window.progressLetter=()=>{ closeLetterModal(); push(ref(db,'correio_dados/lidas_ela'),cartaAtualUnica.id); };

window.updateLidasUI=()=>{
    const d=document.getElementById('lidas-display'); if(cartasLidas.length===0){ d.innerHTML="<p class='empty-msg'>Nenhuma lida.</p>"; return; }
    d.innerHTML=""; cartasLidas.forEach(l=>{
        const m=document.createElement('div'); m.className="mini-envelope"; const li=l.loved?`<span style="position:absolute; top:-5px; right:-5px; font-size:14px;">💖</span>`:'';
        m.innerHTML=`<div style="position:relative; display:inline-block; font-size: 24px; margin-bottom: 5px;">${l.selo||'💌'}${li}</div><div>${l.titulo}</div>`;
        m.onclick=()=>{ cartaAtualUnica=l; openLetterContent(false); }; d.appendChild(m);
    });
};

window.sendLetter=()=>{
    const t=document.getElementById('letter-title').value.trim(), s=document.getElementById('send-selo').value.trim()||"💌", nd=document.getElementById('send-date').value, nh=document.getElementById('send-has-time').checked?document.getElementById('send-time').value:"", r=document.getElementById('sender-name').value.trim(), d=document.getElementById('recipient-name').value.trim(), txt=document.getElementById('write-text').value.trim();
    if(!t||!r||!d||!txt)return alert("Preencha todos os campos!");

    push(ref(db,'correio_dados/para_ele'),{id:Date.now(),titulo:t,remetente:r,destinatario:d,selo:s,data_abertura:nd,hora_abertura:nh,conteudo:txt.replace(/\n/g,'<br>')}).then(()=>{
        
        // --- INÍCIO DA INTEGRAÇÃO COM MAKE E ONESIGNAL DO PAINEL ---
        let dataAgendadaDela = null;
        if (nd) {
            dataAgendadaDela = formatarDataOneSignal(nd, nh);
        }

        const webhookParaEle = "https://hook.us2.make.com/9xcn1j0hd7btzkadwqi0k7wlx4jeh818"; 

        fetch(webhookParaEle, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                titulo: t, 
                data_agendada: dataAgendadaDela 
            })
        })
        .then(() => console.log("Aviso enviado para o painel dele!"))
        .catch(e => console.error("Erro no webhook:", e));
        // --- FIM DA INTEGRAÇÃO ---

        document.getElementById('letter-title').value=""; document.getElementById('sender-name').value=""; document.getElementById('recipient-name').value=""; document.getElementById('write-text').value=""; document.getElementById('send-selo').value=""; document.getElementById('send-date').value=""; document.getElementById('send-time').value=""; document.getElementById('send-has-time').checked=false; toggleSendTimeInput(); switchTab('enviadas');
    }).catch(e=>alert("Erro: "+e.message));
};

window.updateEnviadasUI=()=>{
    const d=document.getElementById('enviadas-display'); if(cartasEnviadasDela.length===0){ d.innerHTML="<p class='empty-msg'>Nenhuma enviada.</p>"; return; }
    d.innerHTML=""; const ag=new Date();
    cartasEnviadasDela.forEach(l=>{
        let tr=false; if(l.data_abertura&&new Date(`${l.data_abertura}T${l.hora_abertura||"00:00"}:00`)>ag)tr=true;
        const m=document.createElement('div');
        if(tr){ m.className="mini-envelope locked-envelope"; m.innerHTML=`<div style="font-size: 24px; margin-bottom: 5px;">🔒</div><div>${l.titulo}</div><div style="font-size: 10px; color: #FF4B4B; margin-top: 5px;">Abre em: ${formatarDataHora(l.data_abertura,l.hora_abertura)}</div>`; }
        else{ m.className="mini-envelope"; m.innerHTML=`<div style="font-size: 24px; margin-bottom: 5px;">${l.selo||'💌'}</div><div>${l.titulo}</div>`; }
        m.onclick=()=>{ cartaAtualUnica=l; openLetterContent(false,true); }; d.appendChild(m);
    });
};

window.editSentLetter=(key)=>{
    const p=document.getElementById('paper-content'), a=document.getElementById('modal-actions-container'), pt=cartaAtualUnica.conteudo.replace(/<br>/g,'\n'), td=cartaAtualUnica.data_abertura||"", th=cartaAtualUnica.hora_abertura||"";
    
    p.innerHTML=`<div class="write-box" style="margin: 0 auto; width: 100%;">
        <h3 style="color: var(--primary); margin-bottom: 15px; text-align: center;">Editando Carta ✏️</h3>
        <div class="input-group"><label>Título:</label><input type="text" id="edit-titulo" value="${cartaAtualUnica.titulo}"></div>
        <div class="input-group">
            <label>Selo:</label>
            <input type="text" id="edit-selo" value="${cartaAtualUnica.selo||'💌'}" maxlength="2" style="width: 100%; text-align: center; font-size: 24px; padding: 10px; border: 2px solid var(--border-color); border-radius: 10px; outline: none; background: white; color: var(--text-dark);">
        </div>
        <div class="input-group"><label>Data:</label><input type="date" id="edit-data" value="${td}" style="width: 100%; border: 2px solid var(--border-color); border-radius: 10px; padding: 12px 16px; color: var(--text-dark); background: white; outline: none;"></div>
        <div class="input-group"><label>Hora:</label><input type="time" id="edit-hora" value="${th}" style="width: 100%; border: 2px solid var(--border-color); border-radius: 10px; padding: 12px 16px; color: var(--text-dark); background: white; outline: none;"></div>
        <div class="input-group"><label>Remetente:</label><input type="text" id="edit-remetente" value="${cartaAtualUnica.remetente}"></div>
        <div class="input-group"><label>Destinatário:</label><input type="text" id="edit-destinatario" value="${cartaAtualUnica.destinatario}"></div>
        <div class="input-group"><label>Mensagem:</label><textarea id="edit-texto">${pt}</textarea></div>
    </div>`;
    
    // Ajustado os botões para ficarem centralizados e com o mesmo padrão
    a.innerHTML=`<div style="display: flex; gap: 10px; width: 100%; max-width: 460px; margin: 0 auto;">
        <button class="action-btn" style="background: var(--border-color); color: var(--text-dark);" onclick="openLetterContent(false, true)">Cancelar</button>
        <button class="action-btn" onclick="saveSentLetter('${key}')">Salvar ✅</button>
    </div>`;
};

window.saveSentLetter=(key)=>{
    const u={ titulo:document.getElementById('edit-titulo').value.trim(), selo:document.getElementById('edit-selo').value.trim()||'💌', data_abertura:document.getElementById('edit-data').value, hora_abertura:document.getElementById('edit-hora').value, remetente:document.getElementById('edit-remetente').value.trim(), destinatario:document.getElementById('edit-destinatario').value.trim(), conteudo:document.getElementById('edit-texto').value.trim().replace(/\n/g,'<br>') };
    if(!u.titulo||!u.remetente||!u.destinatario||!u.conteudo)return alert("Preencha campos básicos!");
    update(ref(db,`correio_dados/para_ele/${key}`),u).then(()=>{cartaAtualUnica={...cartaAtualUnica,...u};openLetterContent(false,true);}).catch(e=>alert("Erro: "+e.message));
};

window.deleteSentLetter=(key)=>{ if(confirm("Apagar permanentemente?"))set(ref(db,`correio_dados/para_ele/${key}`),null).then(()=>closeLetterModal()); };
window.switchTab=(n)=>{ document.querySelectorAll('.tab-content, .tab-btn').forEach(e=>e.classList.remove('active')); document.getElementById(`tab-${n}`).classList.add('active'); document.getElementById(`btn-${n}`).classList.add('active'); };