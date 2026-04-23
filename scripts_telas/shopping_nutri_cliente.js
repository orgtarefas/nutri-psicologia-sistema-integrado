import { FuncoesCompartilhadas } from './0_home.js';
import { criarNavegador } from './0_complementos_menu_navegacao.js';
import { 
    db, collection, addDoc, getDocs, query, where, 
    doc, updateDoc, getDoc, setDoc 
} from '../0_firebase_api_config.js';

export class ShoppingNutriCliente {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.navegador = criarNavegador(userInfo);
        
        // Dados do usuário
        this.userPontos = 0;
        this.userNivel = 1;
        this.userExperiencia = 0;
        
        // Itens disponíveis
        this.itensDisponiveis = [];
        
        // Histórico de transações
        this.historicoTransacoes = [];
        
        // Status da roleta diária
        this.roletaDisponivel = true;
        this.ultimaRoleta = null;
        
        // Desafios diários
        this.desafiosDiarios = [];
        
        // Conteúdo gamificado
        this.configGamificacao = null;
        
        // Variáveis da roleta
        this.roletaCanvas = null;
        this.roletaCtx = null;
        this.roletaAnguloAtual = 0;
        this.roletaGirando = false;
        this.roletaAnimacaoId = null;
        this.roletaPremios = [];
        this.roletaCores = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8C471', '#A9DFBF'
        ];
    }

    async render() {
        const app = document.getElementById('app');
        await this.carregarDadosUsuario();
        await this.carregarItensDisponiveis();
        await this.carregarHistorico();
        await this.carregarConfigGamificacao();
        await this.verificarRoletaDiaria();
        await this.carregarDesafiosDiarios();
        
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.inicializarRoleta();
    }

    renderHTML() {
        const experienciaParaProxNivel = this.userNivel * 100;
        const progressoExp = (this.userExperiencia / experienciaParaProxNivel) * 100;
        
        // Configurar prêmios da roleta
        this.roletaPremios = this.configGamificacao?.roleta_premios || [5, 10, 15, 20, 25, 50, 100];
        
        return `
            <div class="home-container" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
                <div class="header" style="background: rgba(0,0,0,0.2);">
                    <div class="header-logo">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="header-logo-img" style="filter: brightness(0) invert(1);">
                        <h1 style="font-size: 20px;">🛍️ Shopping Nutri</h1>
                    </div>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <button class="logout-btn" id="backToHomeBtn" style="background: rgba(255,255,255,0.2);">← Voltar</button>
                    </div>
                </div>

                <div class="content" style="padding: 20px;">
                    <!-- CARD DE PONTOS E NÍVEL -->
                    <div class="points-card" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); border-radius: 24px; padding: 24px; margin-bottom: 24px; color: white;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                            <div>
                                <div style="font-size: 14px; opacity: 0.9;">⭐ SEUS PONTOS</div>
                                <div style="font-size: 48px; font-weight: bold;">${this.userPontos}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9;">🏆 NÍVEL</div>
                                <div style="font-size: 36px; font-weight: bold;">${this.userNivel}</div>
                            </div>
                            <div style="flex: 1; max-width: 200px;">
                                <div style="font-size: 12px; margin-bottom: 8px;">📈 Progresso para Nível ${this.userNivel + 1}</div>
                                <div style="background: rgba(255,255,255,0.3); border-radius: 10px; overflow: hidden; height: 8px;">
                                    <div style="background: white; width: ${progressoExp}%; height: 100%; border-radius: 10px;"></div>
                                </div>
                                <div style="font-size: 12px; margin-top: 5px;">${this.userExperiencia}/${experienciaParaProxNivel} XP</div>
                            </div>
                        </div>
                    </div>

                    <!-- ROLETA ANIMADA -->
                    <div class="roleta-container" style="background: white; border-radius: 24px; padding: 24px; margin-bottom: 24px; text-align: center;">
                        <h3 style="margin-bottom: 20px; color: #1a237e;">🎡 Roleta da Sorte</h3>
                        <p style="margin-bottom: 20px; color: #666;">Gire a roleta uma vez por dia e ganhe pontos incríveis!</p>
                        
                        <div style="position: relative; display: inline-block;">
                            <canvas id="roletaCanvas" width="400" height="400" style="max-width: 100%; height: auto; border-radius: 50%; box-shadow: 0 10px 30px rgba(0,0,0,0.2);"></canvas>
                            
                            <!-- Ponteiro fixo -->
                            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 40px solid #f97316; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3)); z-index: 10;">
                            </div>
                            
                            <!-- Botão girar central -->
                            <button id="girarRoletaBtn" class="roleta-girar-btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); color: white; border: none; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 20; transition: all 0.3s;" ${!this.roletaDisponivel ? 'disabled style="opacity:0.5;"' : ''}>
                                ${this.roletaDisponivel ? 'GIRAR' : '✓'}
                            </button>
                        </div>
                        
                        ${!this.roletaDisponivel ? '<p style="margin-top: 20px; color: #10b981;">✅ Você já girou a roleta hoje! Volte amanhã para mais pontos!</p>' : ''}
                    </div>

                    <!-- DESAFIOS DIÁRIOS -->
                    <div class="desafios-section" style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin-bottom: 16px;">⭐ Desafios Diários</h3>
                        <div id="desafiosList">
                            ${this.renderDesafios()}
                        </div>
                    </div>

                    <!-- LOJA DE ITENS -->
                    <div class="loja-section" style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin-bottom: 16px;">🛍️ Trocar Pontos por Recompensas</h3>
                        <div id="itensLoja" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                            ${this.renderItensLoja()}
                        </div>
                    </div>

                    <!-- HISTÓRICO -->
                    <div class="historico-section" style="background: white; border-radius: 20px; padding: 20px;">
                        <h3 style="margin-bottom: 16px;">📜 Histórico de Transações</h3>
                        <div id="historicoList" style="max-height: 300px; overflow-y: auto;">
                            ${this.renderHistorico()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL RESULTADO DA ROLETA -->
            <div id="resultadoRoletaModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 400px; text-align: center;">
                    <span class="close">&times;</span>
                    <div id="resultadoIcone" style="font-size: 64px; margin: 20px 0;">🎉</div>
                    <h3 id="resultadoTitulo" style="color: #f97316;">Parabéns!</h3>
                    <p id="resultadoMensagem" style="font-size: 18px; margin: 20px 0;"></p>
                    <button id="fecharResultadoBtn" class="btn-primary" style="margin-top: 20px;">Continuar</button>
                </div>
            </div>

            <!-- MODAL ENVIO DE FOTO -->
            <div id="fotoModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 500px;">
                    <span class="close">&times;</span>
                    <h3>📸 Enviar Foto de Progresso</h3>
                    <form id="fotoForm">
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>📝 Descrição da Foto</label>
                            <textarea id="fotoDescricao" class="form-control" rows="2" placeholder="Ex: Minha evolução do mês..." style="padding: 12px; border-radius: 12px;"></textarea>
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>🖼️ Selecione a Foto</label>
                            <input type="file" id="fotoArquivo" accept="image/*" class="form-control" style="padding: 10px;">
                        </div>
                        <button type="submit" class="btn-primary" style="width: 100%;">📤 Enviar e Ganhar Pontos</button>
                    </form>
                </div>
            </div>

            <!-- MODAL CONFIRMAÇÃO DE TROCA -->
            <div id="trocaModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 400px;">
                    <span class="close">&times;</span>
                    <h3 id="trocaModalTitulo">Confirmar Troca</h3>
                    <p id="trocaModalDescricao"></p>
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button id="cancelarTrocaBtn" class="btn-secondary" style="flex: 1;">Cancelar</button>
                        <button id="confirmarTrocaBtn" class="btn-primary" style="flex: 1;">Confirmar Troca</button>
                    </div>
                </div>
            </div>
        `;
    }

    inicializarRoleta() {
        this.roletaCanvas = document.getElementById('roletaCanvas');
        if (!this.roletaCanvas) return;
        
        this.roletaCtx = this.roletaCanvas.getContext('2d');
        this.desenharRoleta();
        
        // Ajustar tamanho para responsividade
        const resizeRoleta = () => {
            const container = this.roletaCanvas.parentElement;
            const size = Math.min(container.clientWidth, 400);
            this.roletaCanvas.width = size;
            this.roletaCanvas.height = size;
            this.desenharRoleta();
        };
        
        window.addEventListener('resize', resizeRoleta);
        resizeRoleta();
    }

    desenharRoleta() {
        if (!this.roletaCtx || !this.roletaCanvas) return;
        
        const width = this.roletaCanvas.width;
        const height = this.roletaCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width / 2 - 10;
        
        this.roletaCtx.clearRect(0, 0, width, height);
        
        const numSegments = this.roletaPremios.length;
        const anglePerSegment = (Math.PI * 2) / numSegments;
        
        for (let i = 0; i < numSegments; i++) {
            const startAngle = this.roletaAnguloAtual + i * anglePerSegment;
            const endAngle = startAngle + anglePerSegment;
            
            // Desenhar segmento
            this.roletaCtx.beginPath();
            this.roletaCtx.moveTo(centerX, centerY);
            this.roletaCtx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.roletaCtx.closePath();
            
            // Cor do segmento
            this.roletaCtx.fillStyle = this.roletaCores[i % this.roletaCores.length];
            this.roletaCtx.fill();
            
            // Borda branca
            this.roletaCtx.strokeStyle = 'white';
            this.roletaCtx.lineWidth = 2;
            this.roletaCtx.stroke();
            
            // Desenhar texto do prêmio
            this.roletaCtx.save();
            this.roletaCtx.translate(centerX, centerY);
            this.roletaCtx.rotate(startAngle + anglePerSegment / 2);
            this.roletaCtx.textAlign = 'center';
            this.roletaCtx.textBaseline = 'middle';
            this.roletaCtx.font = `bold ${Math.max(12, radius / 10)}px "Segoe UI"`;
            this.roletaCtx.fillStyle = '#333';
            
            const premio = this.roletaPremios[i];
            const texto = `${premio} pts`;
            this.roletaCtx.fillText(texto, radius * 0.65, 0);
            this.roletaCtx.restore();
        }
        
        // Desenhar círculo central
        this.roletaCtx.beginPath();
        this.roletaCtx.arc(centerX, centerY, radius * 0.12, 0, Math.PI * 2);
        this.roletaCtx.fillStyle = '#f97316';
        this.roletaCtx.fill();
        this.roletaCtx.strokeStyle = 'white';
        this.roletaCtx.lineWidth = 3;
        this.roletaCtx.stroke();
        
        // Desenhar círculo interno decorativo
        this.roletaCtx.beginPath();
        this.roletaCtx.arc(centerX, centerY, radius * 0.08, 0, Math.PI * 2);
        this.roletaCtx.fillStyle = '#ea580c';
        this.roletaCtx.fill();
    }

    async girarRoleta() {
        if (!this.roletaDisponivel) {
            alert('❌ Você já girou a roleta hoje! Volte amanhã para mais pontos!');
            return;
        }
        
        if (this.roletaGirando) return;
        
        this.roletaGirando = true;
        const girarBtn = document.getElementById('girarRoletaBtn');
        if (girarBtn) girarBtn.disabled = true;
        
        // Número de rotações completas (5-10 voltas)
        const voltasCompletas = 5 + Math.random() * 5;
        const anguloFinal = this.roletaAnguloAtual + (Math.PI * 2 * voltasCompletas);
        const duracao = 3000; // 3 segundos
        const inicio = performance.now();
        const anguloInicial = this.roletaAnguloAtual;
        
        // Escolher prêmio aleatório
        const premioIndex = Math.floor(Math.random() * this.roletaPremios.length);
        const premioGanho = this.roletaPremios[premioIndex];
        
        // Calcular ângulo de parada (o ponteiro está no topo = -90 graus)
        // O segmento que está no topo após a rotação será o prêmio
        const anguloPorSegmento = (Math.PI * 2) / this.roletaPremios.length;
        // O ponteiro está em -PI/2 (topo). O segmento que deve estar lá é o índice do prêmio
        const anguloAlvo = (-Math.PI / 2) - (premioIndex * anguloPorSegmento) - (anguloPorSegmento / 2);
        
        // Ajustar para o ângulo alvo dentro do range
        let rotacaoNecessaria = anguloAlvo - (this.roletaAnguloAtual % (Math.PI * 2));
        while (rotacaoNecessaria > Math.PI) rotacaoNecessaria -= Math.PI * 2;
        while (rotacaoNecessaria < -Math.PI) rotacaoNecessaria += Math.PI * 2;
        
        const anguloDestino = this.roletaAnguloAtual + (Math.PI * 2 * voltasCompletas) + rotacaoNecessaria;
        
        const animar = (agora) => {
            const elapsed = agora - inicio;
            const progresso = Math.min(1, elapsed / duracao);
            
            // Easing cúbico: desaceleração suave
            const easeOut = 1 - Math.pow(1 - progresso, 3);
            const anguloAtual = anguloInicial + (anguloDestino - anguloInicial) * easeOut;
            
            this.roletaAnguloAtual = anguloAtual;
            this.desenharRoleta();
            
            if (progresso < 1) {
                this.roletaAnimacaoId = requestAnimationFrame(animar);
            } else {
                // Animação concluída
                this.roletaGirando = false;
                if (girarBtn) girarBtn.disabled = false;
                
                // Registrar o giro e dar os pontos
                this.finalizarGiroRoleta(premioGanho);
            }
        };
        
        if (this.roletaAnimacaoId) {
            cancelAnimationFrame(this.roletaAnimacaoId);
        }
        this.roletaAnimacaoId = requestAnimationFrame(animar);
    }

    async finalizarGiroRoleta(premioGanho) {
        try {
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            
            // Verifica se o documento existe
            let userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await this.criarDocumentoUsuario();
                userDoc = await getDoc(userRef);
            }
            
            // Verifica novamente se já girou hoje (segurança)
            const ultimaRoleta = userDoc.data()?.ultima_roleta;
            if (ultimaRoleta) {
                const hoje = new Date().toISOString().split('T')[0];
                const ultimaRoletaData = ultimaRoleta.split('T')[0];
                if (hoje === ultimaRoletaData) {
                    alert('Você já girou a roleta hoje!');
                    this.roletaGirando = false;
                    return;
                }
            }
            
            await updateDoc(userRef, {
                ultima_roleta: new Date().toISOString()
            });
            
            await this.adicionarPontos(premioGanho, `🎡 Roleta da Sorte - Ganhou ${premioGanho} pontos`, 'ganho');
            
            this.roletaDisponivel = false;
            
            // Mostrar modal com resultado
            this.mostrarResultadoRoleta(premioGanho);
            
            // Desabilitar botão girar
            const girarBtn = document.getElementById('girarRoletaBtn');
            if (girarBtn) {
                girarBtn.disabled = true;
                girarBtn.textContent = '✓';
                girarBtn.style.opacity = '0.5';
            }
            
            await this.carregarHistorico();
            
        } catch (error) {
            console.error("Erro ao finalizar giro da roleta:", error);
            alert('❌ Erro ao processar o giro. Tente novamente.');
            this.roletaGirando = false;
        }
    }

    mostrarResultadoRoleta(premio) {
        const modal = document.getElementById('resultadoRoletaModal');
        const icone = document.getElementById('resultadoIcone');
        const titulo = document.getElementById('resultadoTitulo');
        const mensagem = document.getElementById('resultadoMensagem');
        
        if (premio >= 50) {
            icone.innerHTML = '🎉🎊🏆';
            titulo.textContent = '🎉 JACKPOT! 🎉';
            mensagem.innerHTML = `Parabéns! Você ganhou <strong style="font-size: 24px; color: #f97316;">${premio} pontos</strong> na Roleta da Sorte!<br><br>Continue assim! 🌟`;
        } else if (premio >= 25) {
            icone.innerHTML = '🎉✨';
            titulo.textContent = 'Parabéns!';
            mensagem.innerHTML = `Você ganhou <strong style="font-size: 24px; color: #f97316;">${premio} pontos</strong> na Roleta da Sorte!<br><br>Boa sorte amanhã! 🍀`;
        } else {
            icone.innerHTML = '🎲🍀';
            titulo.textContent = 'Boa Sorte!';
            mensagem.innerHTML = `Você ganhou <strong style="font-size: 24px; color: #f97316;">${premio} pontos</strong> na Roleta da Sorte!<br><br>Volte amanhã para mais chances! 🌟`;
        }
        
        modal.style.display = 'flex';
        
        const fecharBtn = document.getElementById('fecharResultadoBtn');
        const closeBtn = modal.querySelector('.close');
        
        const fecharModal = () => {
            modal.style.display = 'none';
            // Atualizar o card de pontos
            const pontosElement = document.querySelector('.points-card div:first-child div:last-child');
            if (pontosElement) {
                pontosElement.textContent = this.userPontos;
            }
        };
        
        fecharBtn.onclick = fecharModal;
        if (closeBtn) closeBtn.onclick = fecharModal;
        
        window.onclick = (event) => {
            if (event.target === modal) fecharModal();
        };
    }

    renderDesafios() {
        if (this.desafiosDiarios.length === 0) {
            return '<p style="text-align: center; color: #666;">Nenhum desafio ativo no momento.</p>';
        }
        
        return this.desafiosDiarios.map(desafio => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                <div>
                    <span style="font-size: 24px; margin-right: 12px;">${desafio.icone || '🎯'}</span>
                    <strong>${desafio.titulo}</strong>
                    <p style="font-size: 12px; color: #666; margin: 0;">${desafio.descricao}</p>
                </div>
                <div style="text-align: right;">
                    <div style="color: #f97316; font-weight: bold;">+${desafio.pontos} pts</div>
                    ${!desafio.completado ? 
                        `<button class="completar-desafio-btn btn-small" data-desafio-id="${desafio.id}" style="margin-top: 5px; padding: 4px 12px; background: #10b981; color: white; border: none; border-radius: 20px; cursor: pointer;">Completar</button>` :
                        '<span style="color: #10b981; font-size: 12px;">✅ Concluído</span>'
                    }
                </div>
            </div>
        `).join('');
    }

    renderItensLoja() {
        if (this.itensDisponiveis.length === 0) {
            return '<p style="text-align: center; color: #666; grid-column: 1/-1;">Nenhum item disponível no momento.</p>';
        }
        
        return this.itensDisponiveis.map(item => `
            <div class="item-card" style="border: 2px solid ${item.pontos <= this.userPontos ? '#10b981' : '#e2e8f0'}; border-radius: 16px; padding: 16px; text-align: center; transition: all 0.3s;">
                <div style="font-size: 48px; margin-bottom: 8px;">${item.icone || '🎁'}</div>
                <h4 style="margin-bottom: 4px;">${item.nome}</h4>
                <p style="font-size: 12px; color: #666; min-height: 40px;">${item.descricao || ''}</p>
                <div style="font-size: 20px; font-weight: bold; color: #f97316; margin: 8px 0;">${item.pontos} pts</div>
                <button class="trocar-item-btn" data-item-id="${item.id}" data-item-nome="${item.nome}" data-item-pontos="${item.pontos}" ${item.pontos <= this.userPontos ? '' : 'disabled style="opacity:0.5;"'}>
                    ${item.pontos <= this.userPontos ? '🛒 Trocar' : '🔒 Pontos insuficientes'}
                </button>
            </div>
        `).join('');
    }

    renderHistorico() {
        if (this.historicoTransacoes.length === 0) {
            return '<p style="text-align: center; color: #666;">Nenhuma transação realizada.</p>';
        }
        
        return this.historicoTransacoes.slice(0, 10).map(transacao => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                <div>
                    <span style="font-size: 20px; margin-right: 12px;">${transacao.tipo === 'ganho' ? '➕' : '➖'}</span>
                    <strong>${transacao.descricao.substring(0, 50)}</strong>
                    <div style="font-size: 11px; color: #999;">${new Date(transacao.data).toLocaleString('pt-BR')}</div>
                </div>
                <div style="font-weight: bold; color: ${transacao.tipo === 'ganho' ? '#10b981' : '#dc2626'}">
                    ${transacao.tipo === 'ganho' ? '+' : '-'} ${transacao.pontos} pts
                </div>
            </div>
        `).join('');
    }

    async carregarDadosUsuario() {
        try {
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                this.userPontos = data.pontos || 0;
                this.userNivel = data.nivel || 1;
                this.userExperiencia = data.experiencia || 0;
            } else {
                await this.criarDocumentoUsuario();
            }
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
        }
    }

    async criarDocumentoUsuario() {
        try {
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            const dadosIniciais = {
                login: this.userInfo.login,
                nome: this.userInfo.nome,
                pontos: 0,
                nivel: 1,
                experiencia: 0,
                ultimo_acesso_diario: null,
                ultima_roleta: null,
                data_criacao: new Date().toISOString()
            };
            await setDoc(userRef, dadosIniciais);
            this.userPontos = 0;
            this.userNivel = 1;
            this.userExperiencia = 0;
        } catch (error) {
            console.error("Erro ao criar documento:", error);
        }
    }

    async carregarItensDisponiveis() {
        try {
            const itensRef = collection(db, 'itens_recompensa');
            const querySnapshot = await getDocs(itensRef);
            
            this.itensDisponiveis = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.ativo !== false) {
                    this.itensDisponiveis.push({ id: doc.id, ...data });
                }
            });
            
            this.itensDisponiveis.sort((a, b) => a.pontos - b.pontos);
        } catch (error) {
            console.error("Erro ao carregar itens:", error);
        }
    }

    async carregarHistorico() {
        try {
            const historicoRef = collection(db, 'transacoes_pontos');
            const q = query(historicoRef, where('usuario_login', '==', this.userInfo.login));
            const querySnapshot = await getDocs(q);
            
            this.historicoTransacoes = [];
            querySnapshot.forEach(doc => {
                this.historicoTransacoes.push({ id: doc.id, ...doc.data() });
            });
            
            this.historicoTransacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
        }
    }

    async carregarConfigGamificacao() {
        try {
            const configRef = doc(db, 'config_gamificacao', 'principal');
            const configDoc = await getDoc(configRef);
            
            if (configDoc.exists()) {
                this.configGamificacao = configDoc.data();
            } else {
                this.configGamificacao = {
                    pontos_por_desafio: 50,
                    pontos_por_foto: 30,
                    roleta_premios: [5, 10, 15, 20, 25, 50, 100],
                    experiencia_por_ponto: 1
                };
            }
        } catch (error) {
            console.error("Erro ao carregar configuração:", error);
        }
    }

    async verificarRoletaDiaria() {
        try {
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const ultimaRoleta = userDoc.data().ultima_roleta;
                if (ultimaRoleta) {
                    const hoje = new Date().toISOString().split('T')[0];
                    const ultimaRoletaData = ultimaRoleta.split('T')[0];
                    this.roletaDisponivel = hoje !== ultimaRoletaData;
                } else {
                    this.roletaDisponivel = true;
                }
            } else {
                this.roletaDisponivel = true;
            }
        } catch (error) {
            console.error("Erro ao verificar roleta:", error);
            this.roletaDisponivel = true;
        }
    }

    async carregarDesafiosDiarios() {
        try {
            const desafiosRef = collection(db, 'desafios_diarios');
            const querySnapshot = await getDocs(desafiosRef);
            
            const hoje = new Date().toISOString().split('T')[0];
            
            this.desafiosDiarios = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.ativo && (!data.data_expiracao || data.data_expiracao >= hoje)) {
                    this.desafiosDiarios.push({ id: doc.id, ...data, completado: false });
                }
            });
            
            await this.verificarDesafiosCompletados();
        } catch (error) {
            console.error("Erro ao carregar desafios:", error);
        }
    }

    async verificarDesafiosCompletados() {
        try {
            const completadosRef = collection(db, 'desafios_completados');
            const q = query(completadosRef, where('usuario_login', '==', this.userInfo.login));
            const querySnapshot = await getDocs(q);
            
            const desafiosCompletados = new Set();
            querySnapshot.forEach(doc => {
                desafiosCompletados.add(doc.data().desafio_id);
            });
            
            this.desafiosDiarios.forEach(desafio => {
                desafio.completado = desafiosCompletados.has(desafio.id);
            });
        } catch (error) {
            console.error("Erro ao verificar desafios completados:", error);
        }
    }

    async adicionarPontos(pontos, descricao, tipo = 'ganho') {
        try {
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            
            // Verifica se o documento existe
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await this.criarDocumentoUsuario();
            }
            
            this.userPontos += pontos;
            this.userExperiencia += pontos;
            
            let novoNivel = this.userNivel;
            const experienciaNecessaria = this.userNivel * 100;
            if (this.userExperiencia >= experienciaNecessaria) {
                novoNivel = this.userNivel + 1;
            }
            
            await updateDoc(userRef, {
                pontos: this.userPontos,
                experiencia: this.userExperiencia,
                nivel: novoNivel,
                ultima_atualizacao: new Date().toISOString()
            });
            
            const transacaoRef = collection(db, 'transacoes_pontos');
            await addDoc(transacaoRef, {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                pontos: pontos,
                descricao: descricao,
                tipo: tipo,
                data: new Date().toISOString(),
                saldo_apos: this.userPontos
            });
            
            this.userNivel = novoNivel;
            await this.carregarHistorico();
            
            // Atualizar UI do nível e pontos
            this.atualizarUIPontos();
            
            return true;
        } catch (error) {
            console.error("Erro ao adicionar pontos:", error);
            return false;
        }
    }

    atualizarUIPontos() {
        const pontosElement = document.querySelector('.points-card div:first-child div:last-child');
        const nivelElement = document.querySelector('.points-card div:nth-child(2) div:last-child');
        const progressoExp = (this.userExperiencia / (this.userNivel * 100)) * 100;
        const progressoBar = document.querySelector('.points-card div:last-child div div div');
        
        if (pontosElement) pontosElement.textContent = this.userPontos;
        if (nivelElement) nivelElement.textContent = this.userNivel;
        if (progressoBar) progressoBar.style.width = `${progressoExp}%`;
    }

    async gastarPontos(pontos, descricao, itemId, itemNome) {
        if (this.userPontos < pontos) {
            alert('❌ Pontos insuficientes!');
            return false;
        }
        
        try {
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            this.userPontos -= pontos;
            
            await updateDoc(userRef, {
                pontos: this.userPontos,
                ultima_atualizacao: new Date().toISOString()
            });
            
            const transacaoRef = collection(db, 'transacoes_pontos');
            await addDoc(transacaoRef, {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                pontos: pontos,
                descricao: descricao,
                tipo: 'gasto',
                item_id: itemId,
                item_nome: itemNome,
                data: new Date().toISOString(),
                saldo_apos: this.userPontos
            });
            
            const resgateRef = collection(db, 'resgates_realizados');
            await addDoc(resgateRef, {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                item_id: itemId,
                item_nome: itemNome,
                pontos_gastos: pontos,
                status: 'pendente',
                data_resgate: new Date().toISOString()
            });
            
            await this.carregarHistorico();
            this.atualizarUIPontos();
            
            alert(`✅ Resgate realizado com sucesso!\n\nItem: ${itemNome}\nPontos gastos: ${pontos}\n\nO profissional responsável entrará em contato para entregar sua recompensa.`);
            
            return true;
        } catch (error) {
            console.error("Erro ao gastar pontos:", error);
            alert('❌ Erro ao realizar resgate.');
            return false;
        }
    }

    async completarDesafio(desafioId) {
        try {
            const desafio = this.desafiosDiarios.find(d => d.id === desafioId);
            if (!desafio || desafio.completado) {
                alert('Desafio já completado ou inválido!');
                return;
            }
            
            // Verificar se o desafio já foi completado hoje
            const completadosRef = collection(db, 'desafios_completados');
            const q = query(completadosRef, 
                where('usuario_login', '==', this.userInfo.login),
                where('desafio_id', '==', desafioId),
                where('data_completado', '>=', new Date().toISOString().split('T')[0])
            );
            const checkSnapshot = await getDocs(q);
            
            if (!checkSnapshot.empty) {
                alert('Você já completou este desafio hoje!');
                return;
            }
            
            await addDoc(completadosRef, {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                desafio_id: desafioId,
                desafio_titulo: desafio.titulo,
                pontos_ganhos: desafio.pontos,
                data_completado: new Date().toISOString()
            });
            
            await this.adicionarPontos(desafio.pontos, `⭐ Desafio: ${desafio.titulo}`, 'ganho');
            
            alert(`🎉 Desafio completado!\n\n${desafio.titulo}\n+${desafio.pontos} pontos`);
            
            await this.carregarDesafiosDiarios();
            this.render();
            this.inicializarRoleta();
            
        } catch (error) {
            console.error("Erro ao completar desafio:", error);
            alert('❌ Erro ao completar desafio.');
        }
    }

    async enviarFoto(descricao, arquivo) {
        try {
            let fotoUrl = '';
            
            if (arquivo && arquivo.type.startsWith('image/')) {
                const reader = new FileReader();
                fotoUrl = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(arquivo);
                });
            }
            
            const pontos = this.configGamificacao?.pontos_por_foto || 30;
            
            const fotoRef = collection(db, 'fotos_progresso');
            await addDoc(fotoRef, {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                descricao: descricao,
                foto_base64: fotoUrl,
                pontos_ganhos: pontos,
                data_envio: new Date().toISOString(),
                status: 'pendente_aprovacao'
            });
            
            await this.adicionarPontos(pontos, `📸 Envio de foto de progresso - ${descricao.substring(0, 50)}`, 'ganho');
            
            alert(`✅ Foto enviada com sucesso!\n\n+${pontos} pontos adicionados!\n\nA foto será analisada pela equipe.`);
            
            const modal = document.getElementById('fotoModal');
            if (modal) modal.style.display = 'none';
            
            document.getElementById('fotoDescricao').value = '';
            document.getElementById('fotoArquivo').value = '';
            
        } catch (error) {
            console.error("Erro ao enviar foto:", error);
            alert('❌ Erro ao enviar foto. Tente novamente.');
        }
    }

    async registrarAcessoDiario() {
        try {
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            
            let userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await this.criarDocumentoUsuario();
                userDoc = await getDoc(userRef);
            }
            
            const hoje = new Date().toISOString().split('T')[0];
            const ultimoAcesso = userDoc.data()?.ultimo_acesso_diario;
            
            if (ultimoAcesso && ultimoAcesso.split('T')[0] === hoje) {
                return;
            }
            
            await updateDoc(userRef, {
                ultimo_acesso_diario: new Date().toISOString()
            });
            
            const pontosDiarios = 5;
            await this.adicionarPontos(pontosDiarios, '📅 Acesso diário ao sistema', 'ganho');
            
        } catch (error) {
            console.error("Erro ao registrar acesso diário:", error);
        }
    }

    attachEvents() {
        const backBtn = document.getElementById('backToHomeBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.navegador.navegarPara('home'));
        }
        
        const girarRoletaBtn = document.getElementById('girarRoletaBtn');
        if (girarRoletaBtn) {
            girarRoletaBtn.addEventListener('click', () => this.girarRoleta());
        }
        
        const enviarFotoBtn = document.getElementById('enviarFotoBtn');
        if (enviarFotoBtn) {
            enviarFotoBtn.addEventListener('click', () => {
                const modal = document.getElementById('fotoModal');
                if (modal) modal.style.display = 'flex';
            });
        }
        
        document.querySelectorAll('.completar-desafio-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const desafioId = btn.getAttribute('data-desafio-id');
                if (desafioId) this.completarDesafio(desafioId);
            });
        });
        
        document.querySelectorAll('.trocar-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = btn.getAttribute('data-item-id');
                const itemNome = btn.getAttribute('data-item-nome');
                const itemPontos = parseInt(btn.getAttribute('data-item-pontos'));
                
                if (this.userPontos >= itemPontos) {
                    const modal = document.getElementById('trocaModal');
                    const titulo = document.getElementById('trocaModalTitulo');
                    const descricao = document.getElementById('trocaModalDescricao');
                    
                    if (titulo) titulo.textContent = `Confirmar Troca: ${itemNome}`;
                    if (descricao) descricao.innerHTML = `Você está trocando <strong>${itemPontos} pontos</strong> por:<br><strong>${itemNome}</strong><br><br>Deseja confirmar?`;
                    
                    modal.style.display = 'flex';
                    
                    const confirmarBtn = document.getElementById('confirmarTrocaBtn');
                    const cancelarBtn = document.getElementById('cancelarTrocaBtn');
                    
                    const handlerConfirmar = () => {
                        this.gastarPontos(itemPontos, `🛍️ Troca por: ${itemNome}`, itemId, itemNome);
                        modal.style.display = 'none';
                        confirmarBtn.removeEventListener('click', handlerConfirmar);
                        cancelarBtn.removeEventListener('click', handlerCancelar);
                    };
                    
                    const handlerCancelar = () => {
                        modal.style.display = 'none';
                        confirmarBtn.removeEventListener('click', handlerConfirmar);
                        cancelarBtn.removeEventListener('click', handlerCancelar);
                    };
                    
                    confirmarBtn.onclick = handlerConfirmar;
                    cancelarBtn.onclick = handlerCancelar;
                }
            });
        });
        
        const fotoModal = document.getElementById('fotoModal');
        const closeFotoModal = fotoModal?.querySelector('.close');
        if (closeFotoModal) {
            closeFotoModal.onclick = () => fotoModal.style.display = 'none';
        }
        
        const trocaModal = document.getElementById('trocaModal');
        const closeTrocaModal = trocaModal?.querySelector('.close');
        if (closeTrocaModal) {
            closeTrocaModal.onclick = () => trocaModal.style.display = 'none';
        }
        
        const fotoForm = document.getElementById('fotoForm');
        if (fotoForm) {
            fotoForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const descricao = document.getElementById('fotoDescricao').value;
                const arquivo = document.getElementById('fotoArquivo').files[0];
                
                if (!descricao) {
                    alert('Por favor, descreva sua foto!');
                    return;
                }
                
                await this.enviarFoto(descricao, arquivo);
            });
        }
        
        window.onclick = (event) => {
            if (event.target === fotoModal) fotoModal.style.display = 'none';
            if (event.target === trocaModal) trocaModal.style.display = 'none';
            const resultadoModal = document.getElementById('resultadoRoletaModal');
            if (event.target === resultadoModal) resultadoModal.style.display = 'none';
        };
        
        this.registrarAcessoDiario();
    }
}
