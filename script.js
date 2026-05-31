import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDhAP2RMQ1TQyLzB1N9hs76AVjfqTjB9Pk",
  authDomain: "correio-91c8e.firebaseapp.com",
  databaseURL: "https://correio-91c8e-default-rtdb.firebaseio.com",
  projectId: "correio-91c8e",
  storageBucket: "correio-91c8e.firebasestorage.app",
  messagingSenderId: "40461554553",
  appId: "1:40461554553:web:92720144d48859c8e215a8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let novasCartas = [], cartasLidas = [], cartasEnviadasDela = [], cartaAtualUnica = null;
let hasPlayedMusic = false;

window.onload = function() { listenToDatabase(); };

function listenToDatabase() {
  const dbRef = ref(db, 'correio_dados');
  onValue(dbRef, (snapshot) => {
    const data = snapshot.val() || {};
    cartasEnviadasDela = data.enviadas ? Object.keys(data.enviadas).map(key => ({ firebaseKey: key, ...data.enviadas[key] })) : [];
    
    let todas = data.cartas_originais ? Object.values(data.cartas_originais) : [];
    todas.sort((a, b) => a.id - b.id);

    const idsLidos = data.ids_lidos ? Object.values(data.ids_lidos) : [];
    novasCartas = todas.filter(c => !idsLidos.includes(c.id));
    cartasLidas = todas.filter(c => idsLidos.includes(c.id));
    
    updateUI();
  });
}

function updateUI() {
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.innerText = novasCartas.length;
    novasCartas.length > 0 ? badge.classList.add('show') : badge.classList.remove('show');
  }
  updateEnviadasUI();
  updateLidasUI();
  if (document.getElementById('main-interface').style.display === 'flex') renderEnvelope();
}

window.handleMailboxClick = function(event) {
  const scene = document.getElementById('scene');
  const music = document.getElementById('bg-music');
  const musicBtn = document.getElementById('music-control');
  
  if (!scene.classList.contains('open-door-state')) {
    scene.classList.add('open-door-state');
    document.getElementById('prompt').innerHTML = "✨ Clique novamente na caixa para abrir as abas! 👇";
    document.getElementById('close-box-btn').classList.add('visible');
    
    musicBtn.classList.add('visible');
    if (music) {
      music.volume = 0.4;
      music.play().catch(e => console.log("Navegador bloqueou o áudio. O botão manual está disponível."));
      musicBtn.innerHTML = "🔊";
    }
  } else {
    goToInterface();
  }
}

window.toggleMusic = function() {
  const music = document.getElementById('bg-music');
  const btn = document.getElementById('music-control');
  
  if (music.paused) {
    music.play();
    btn.innerHTML = "🔊";
  } else {
    music.pause();
    btn.innerHTML = "🔇";
  }
}

window.goToInterface = function() {
  const scene = document.getElementById('scene');
  scene.classList.add('vanish');
  document.getElementById('main-interface').style.display = 'flex';
  renderEnvelope();
}

window.closeMailbox = function() {
  const scene = document.getElementById('scene');
  document.getElementById('main-interface').style.display = 'none';
  scene.classList.remove('vanish');
  scene.classList.remove('open-door-state');
  document.getElementById('prompt').innerHTML = "Clique na Caixa de Correio para Abrir 📬";
  document.getElementById('close-box-btn').classList.remove('visible');
}

function formatarData(dataISO) {
  if (!dataISO) return "";
  const partes = dataISO.split('-');
  if(partes.length < 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

window.showCustomAlert = function(title, message, icon = "⚠️") {
  const alertModal = document.getElementById('custom-alert-modal');
  if(!alertModal) {
    alert(title + "\n\n" + message.replace(/<[^>]*>?/gm, ''));
    return;
  }
  document.getElementById('alert-icon').innerText = icon;
  document.getElementById('alert-title').innerText = title;
  document.getElementById('alert-message').innerHTML = message;
  alertModal.classList.add('active');
}

window.closeAlertModal = function() {
  const alertModal = document.getElementById('custom-alert-modal');
  if(alertModal) alertModal.classList.remove('active');
}

window.renderEnvelope = function() {
  const display = document.getElementById('envelope-display');
  display.innerHTML = "";

  if (novasCartas.length === 0) {
    display.classList.remove('archive-grid');
    display.innerHTML = `<div class="empty-msg"><p>🎉 Você já leu todas as cartas!</p><small style="color: var(--pc6); font-weight: normal;">Visite a aba "Lidas" para reler quando quiser.</small></div>`;
    return;
  }

  display.classList.add('archive-grid');
  
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  const cartasOrdenadas = [...novasCartas].sort((a, b) => new Date(a.data_abertura || 0) - new Date(b.data_abertura || 0));

  cartasOrdenadas.forEach(carta => {
    let isTrancada = false;
    if (carta.data_abertura) {
      const dataAbertura = new Date(carta.data_abertura + "T00:00:00");
      if (dataAbertura > hoje) isTrancada = true;
    }

    const card = document.createElement('div');
    if (isTrancada) {
      card.className = "mini-envelope locked-envelope";
      card.onclick = () => showCustomAlert("Selo Mágico Intacto", `Esta carta está viajando pelo tempo e só poderá ser aberta no dia <b>${formatarData(carta.data_abertura)}</b>.<br><br>Controle a ansiedade! 🔒`, "💌");
      card.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 5px;">🔒</div>
        <div>${carta.titulo}</div>
        <div style="font-size: 10px; color: #FF4B4B; margin-top: 5px;">Abre em: ${formatarData(carta.data_abertura)}</div>
      `;
    } else {
      card.className = "mini-envelope";
      card.onclick = () => { cartaAtualUnica = carta; openLetterContent(true); };
      // O SEGREDO ESTÁ AQUI: Usa o selo que você escolheu no painel, ou a carta como padrão
      card.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 5px;">${carta.selo || '💌'}</div>
        <div>${carta.titulo}</div>
        <div style="font-size: 10px; color: var(--primary); margin-top: 5px;">Nova!</div>
      `;
    }
    display.appendChild(card);
  });
}

window.openLetterContent = function(isNewDeck, isSentLetter = false) {
  const overlay = document.getElementById('letter-overlay');
  const paper = document.getElementById('paper-content');
  const actionsContainer = document.getElementById('modal-actions-container');
  
  paper.innerHTML = `
    <div class="custom-purple-paper">
      <div class="letter-header">
        <div class="header-item"><span class="header-label">De:</span><span class="header-value">${cartaAtualUnica.remetente}</span></div>
        <div class="header-item"><span class="header-label">Para:</span><span class="header-value">${cartaAtualUnica.destinatario}</span></div>
      </div>
      <div class="letter-body">${cartaAtualUnica.conteudo}</div>
    </div>
  `;
  
  actionsContainer.innerHTML = ''; 
  if (isNewDeck) {
    actionsContainer.innerHTML = `<button class="action-btn next-btn" onclick="progressLetter()" style="margin: 0 auto;">Marcar como Lida ✅</button>`;
  } else if (isSentLetter) {
    actionsContainer.innerHTML = `
      <div style="display: flex; gap: 10px;">
        <button class="action-btn" style="background: var(--pc3); color: var(--text-dark);" onclick="editSentLetter('${cartaAtualUnica.firebaseKey}')">Editar ✏️</button>
        <button class="action-btn" style="background: #FF4B4B;" onclick="deleteSentLetter('${cartaAtualUnica.firebaseKey}')">Excluir 🗑️</button>
      </div>
    `;
  }
  overlay.classList.add('active');
  
  if (!hasPlayedMusic && isNewDeck) {
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
      bgMusic.volume = 0.5;
      bgMusic.play().catch(e => console.log("Música bloqueada pelo navegador", e));
      hasPlayedMusic = true;
    }
  }
}

window.closeLetterModal = function() {
  document.getElementById('letter-overlay').classList.remove('active');
}

window.progressLetter = function() {
  closeLetterModal();
  push(ref(db, 'correio_dados/ids_lidos'), cartaAtualUnica.id);
}

window.updateLidasUI = function() {
  const display = document.getElementById('lidas-display');
  if (cartasLidas.length === 0) { display.innerHTML = "<p class='empty-msg'>Nenhuma carta lida ainda.</p>"; return; }
  display.innerHTML = "";
  cartasLidas.forEach(letter => {
    const mini = document.createElement('div');
    mini.className = "mini-envelope";
    // MANTÉM O SELO ORIGINAL NA ABA DE LIDAS
    mini.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 5px;">${letter.selo || '💌'}</div>
      <div>${letter.titulo}</div>
    `;
    mini.onclick = () => { cartaAtualUnica = letter; openLetterContent(false); };
    display.appendChild(mini);
  });
}

window.sendLetter = function() {
  const title = document.getElementById('letter-title').value.trim();
  let seloEscolhido = document.getElementById('send-selo').value.trim(); // Pega o que ela digitou
  const senderName = document.getElementById('sender-name').value.trim();
  const recipientName = document.getElementById('recipient-name').value.trim();
  const text = document.getElementById('write-text').value.trim();
  
  if (!title || !senderName || !recipientName || !text) {
    return alert("Por favor, preencha todos os campos, incluindo o Título, antes de enviar!");
  }
  
  // Trava de segurança: Se ela esquecer o selo, colocamos o padrão.
  if (!seloEscolhido) {
    seloEscolhido = "💌";
  }

  const novaCartaDela = {
    id: Date.now(),
    titulo: title,
    remetente: senderName,
    destinatario: recipientName,
    selo: seloEscolhido, // Salva o emoji que ela escolheu
    conteudo: text.replace(/\n/g, '<br>')
  };

  push(ref(db, 'correio_dados/enviadas'), novaCartaDela).then(() => {
    // Limpa os campos após o envio
    document.getElementById('letter-title').value = "";
    document.getElementById('sender-name').value = "";
    document.getElementById('recipient-name').value = "";
    document.getElementById('write-text').value = ""; 
    document.getElementById('send-selo').value = ""; // Limpa o emoji
    
    switchTab('enviadas');
  }).catch((error) => alert("Erro ao conectar ao servidor: " + error.message));
}

window.updateEnviadasUI = function() {
  const display = document.getElementById('enviadas-display');
  if (cartasEnviadasDela.length === 0) { display.innerHTML = "<p class='empty-msg'>Nenhuma carta enviada por você ainda.</p>"; return; }
  
  display.innerHTML = "";
  cartasEnviadasDela.forEach(letter => {
    const mini = document.createElement('div');
    mini.className = "mini-envelope";
    // MANTÉM O SELO ORIGINAL NA ABA DE ENVIADAS
    mini.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 5px;">${letter.selo || '💌'}</div>
      <div>${letter.titulo}</div>
    `;
    mini.onclick = () => { cartaAtualUnica = letter; openLetterContent(false, true); };
    display.appendChild(mini);
  });
}

window.editSentLetter = function(firebaseKey) {
  const paper = document.getElementById('paper-content');
  const actionsContainer = document.getElementById('modal-actions-container');
  const plainText = cartaAtualUnica.conteudo.replace(/<br>/g, '\n');

  // Adicionamos o campo de texto para o emoji/selo
  paper.innerHTML = `
    <div class="write-box" style="margin: 0; max-width: 100%;">
      <h3 style="color: var(--primary); margin-bottom: 10px; text-align: center;">Editando Carta ✏️</h3>
      <div class="input-group"><label>Título:</label><input type="text" id="edit-titulo" value="${cartaAtualUnica.titulo}"></div>
      <div class="input-group"><label>Selo (Emoji):</label><input type="text" id="edit-selo" value="${cartaAtualUnica.selo || '💌'}" maxlength="2" style="text-align: center; font-size: 20px;"></div>
      <div class="input-group"><label>Remetente:</label><input type="text" id="edit-remetente" value="${cartaAtualUnica.remetente}"></div>
      <div class="input-group"><label>Destinatário:</label><input type="text" id="edit-destinatario" value="${cartaAtualUnica.destinatario}"></div>
      <div class="input-group"><label>Mensagem:</label><textarea id="edit-texto" style="height: 160px;">${plainText}</textarea></div>
    </div>
  `;

  actionsContainer.innerHTML = `
    <div style="display: flex; gap: 10px;">
        <button class="action-btn" style="background: var(--pc3); color: var(--text-dark);" onclick="openLetterContent(false, true)">Cancelar</button>
        <button class="action-btn" onclick="saveSentLetter('${firebaseKey}')">Salvar ✅</button>
    </div>
  `;
}

window.saveSentLetter = function(firebaseKey) {
  const nTit = document.getElementById('edit-titulo').value.trim();
  const nSelo = document.getElementById('edit-selo').value.trim() || '💌';
  const nRem = document.getElementById('edit-remetente').value.trim();
  const nDes = document.getElementById('edit-destinatario').value.trim();
  const nTex = document.getElementById('edit-texto').value.trim();

  if (!nTit || !nRem || !nDes || !nTex) return alert("Todos os campos devem ser preenchidos!");

  // Incluímos o nSelo no objeto de atualização
  const updates = { 
    titulo: nTit, 
    selo: nSelo, 
    remetente: nRem, 
    destinatario: nDes, 
    conteudo: nTex.replace(/\n/g, '<br>') 
  };

  update(ref(db, `correio_dados/enviadas/${firebaseKey}`), updates).then(() => {
    cartaAtualUnica = { ...cartaAtualUnica, ...updates };
    openLetterContent(false, true); 
  }).catch(err => alert("Erro ao salvar: " + err.message));
}

window.deleteSentLetter = function(firebaseKey) {
  if (confirm("Tem certeza que deseja apagar esta carta permanentemente?")) {
    set(ref(db, `correio_dados/enviadas/${firebaseKey}`), null).then(() => {
      closeLetterModal();
    });
  }
}

window.switchTab = function(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`btn-${tabName}`).classList.add('active');
}