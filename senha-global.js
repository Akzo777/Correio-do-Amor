// senha-global.js
(function() {
    // 1. A Sua Senha Mestra
    const senhaCorreta = "060526";
    let senhaDigitada = "";

    // 2. Dicionário de Fotos (Sua Galeria)
    const fotosBloqueio = {
        1: "https://akzo777.github.io/Correio-do-Amor/Foto-Bloqueio.jpg",
        2: "LINK_DA_FOTO_2_AQUI",
        3: "LINK_DA_FOTO_3_AQUI",
        4: "LINK_DA_FOTO_4_AQUI",
        5: "LINK_DA_FOTO_5_AQUI",
        6: "LINK_DA_FOTO_6_AQUI",
        7: "LINK_DA_FOTO_7_AQUI",
        8: "LINK_DA_FOTO_8_AQUI",
        9: "LINK_DA_FOTO_9_AQUI",
        10: "LINK_DA_FOTO_10_AQUI"
    };

    // Puxa o número da foto escolhida na tag do script (o padrão é a foto 1 se não informar nada)
    const scriptTag = document.currentScript;
    const fotoEscolhidaNum = scriptTag.getAttribute('data-foto') || 1;
    const fotoAtual = fotosBloqueio[fotoEscolhidaNum] || fotosBloqueio[1];

    // 3. Injetar o Visual (CSS)
    const estilo = document.createElement('style');
    estilo.innerHTML = `
        #tela-bloqueio-global { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: linear-gradient(135deg, #2A0845 0%, #8E2DE2 100%); display: flex; justify-content: center; align-items: center; z-index: 999999; font-family: 'Arial', sans-serif; color: white; }
        .bloqueio-conteudo-global { text-align: center; max-width: 350px; width: 100%; }
        .foto-casal-global { width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 4px solid white; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .pin-visor-global { display: flex; justify-content: center; gap: 15px; margin: 30px 0; }
        .ponto-global { width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; background-color: transparent; transition: background-color 0.2s ease; }
        .ponto-global.ativo { background-color: white; }
        .pin-visor-global.erro { animation: tremer 0.4s ease-in-out; }
        @keyframes tremer { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
        .teclado-global { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 0 20px; }
        .tecla-global { width: 70px; height: 70px; border-radius: 50%; border: none; background: rgba(255, 255, 255, 0.2); color: white; font-size: 24px; cursor: pointer; margin: 0 auto; transition: background 0.2s; backdrop-filter: blur(5px); }
        .tecla-global:active { background: rgba(255, 255, 255, 0.5); }
        .tecla-global.apagar { background: transparent; font-size: 20px; }
    `;
    document.head.appendChild(estilo);

    // 4. Injetar a Estrutura (HTML)
    const divTela = document.createElement('div');
    divTela.id = 'tela-bloqueio-global';
    divTela.innerHTML = `
        <div class="bloqueio-conteudo-global">
            <img src="${fotoAtual}" alt="Nossa Foto" class="foto-casal-global">
            <h2>Digite a Senha</h2>
            <div class="pin-visor-global" id="pin-visor-global">
                <div class="ponto-global"></div><div class="ponto-global"></div><div class="ponto-global"></div>
                <div class="ponto-global"></div><div class="ponto-global"></div><div class="ponto-global"></div>
            </div>
            <div class="teclado-global">
                <button class="tecla-global" onclick="window.digitarSenha(1)">1</button>
                <button class="tecla-global" onclick="window.digitarSenha(2)">2</button>
                <button class="tecla-global" onclick="window.digitarSenha(3)">3</button>
                <button class="tecla-global" onclick="window.digitarSenha(4)">4</button>
                <button class="tecla-global" onclick="window.digitarSenha(5)">5</button>
                <button class="tecla-global" onclick="window.digitarSenha(6)">6</button>
                <button class="tecla-global" onclick="window.digitarSenha(7)">7</button>
                <button class="tecla-global" onclick="window.digitarSenha(8)">8</button>
                <button class="tecla-global" onclick="window.digitarSenha(9)">9</button>
                <button class="tecla-global apagar" onclick="window.limparSenha()">C</button>
                <button class="tecla-global" onclick="window.digitarSenha(0)">0</button>
                <button class="tecla-global apagar" onclick="window.apagarUltimoSenha()">⌫</button>
            </div>
        </div>
    `;
    document.body.prepend(divTela);

    // 5. A Lógica Completa do Teclado
    const visor = document.getElementById('pin-visor-global');
    const pontos = document.querySelectorAll('.ponto-global');

    function atualizarVisor() {
        pontos.forEach((ponto, index) => {
            if (index < senhaDigitada.length) {
                ponto.classList.add('ativo');
            } else {
                ponto.classList.remove('ativo');
            }
        });
    }

    window.digitarSenha = function(numero) {
        if (senhaDigitada.length < 6) {
            senhaDigitada += numero;
            atualizarVisor();
            if (senhaDigitada.length === 6) {
                setTimeout(verificarSenha, 200);
            }
        }
    };

    window.limparSenha = function() {
        senhaDigitada = "";
        atualizarVisor();
    };

    window.apagarUltimoSenha = function() {
        senhaDigitada = senhaDigitada.slice(0, -1);
        atualizarVisor();
    };

    function verificarSenha() {
        if (senhaDigitada === senhaCorreta) {
            divTela.style.transition = "opacity 0.5s ease";
            divTela.style.opacity = "0";
            setTimeout(() => { divTela.style.display = "none"; }, 500);
        } else {
            visor.classList.add('erro');
            setTimeout(() => {
                visor.classList.remove('erro');
                window.limparSenha();
            }, 500);
        }
    }

    document.addEventListener('keydown', function(event) {
        if (divTela.style.display === "none") return;
        if (event.key >= '0' && event.key <= '9') {
            window.digitarSenha(event.key);
        } else if (event.key === 'Backspace') {
            window.apagarUltimoSenha();
        } else if (event.key === 'Escape' || event.key.toLowerCase() === 'c') {
            window.limparSenha();
        }
    });
})();