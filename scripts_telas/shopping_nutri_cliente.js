import { FuncoesCompartilhadas } from './0_home.js';
import { criarNavegador } from './0_complementos_menu_navegacao.js';
import { 
    db, collection, addDoc, getDocs, query, where, 
    doc, updateDoc, getDoc, setDoc, serverTimestamp 
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
        
        // Conteúdo gamificado (configurado pelo nutricionista)
        this.configGamificacao = null;
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
    }

    renderHTML() {
        const experienciaParaProxNivel = this.userNivel * 100;
        const progressoExp = (this.userExperiencia / experienciaParaProxNivel) * 100;
        
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

                    <!-- SEÇÃO DE GAMIFICAÇÃO (ROLETA E DESAFIOS) -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <!-- ROLETA DIÁRIA -->
                        <div class="gamification-card" style="background: white; border-radius: 20px; padding: 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 12px;">🎡</div>
                            <h3 style="margin-bottom: 8px;">Roleta da Sorte</h3>
                            <p style="font-size: 13px; color: #666; margin-bottom: 16px;">Gire a roleta uma vez por dia e ganhe pontos!</p>
                            <button id="girarRoletaBtn" class="btn-primary" ${!this.roletaDisponivel ? 'disabled style="opacity:0.5;"' : ''}>
                                ${this.roletaDisponivel ? '🎲 Girar Roleta' : '✅ Roleta já girada hoje!'}
                            </button>
                        </div>

                        <!-- ENVIO DE FOTOS (Mini Game) -->
                        <div class="gamification-card" style="background: white; border-radius: 20px; padding: 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 12px;">📸</div>
                            <h3 style="margin-bottom: 8px;">Desafio do Progresso</h3>
                            <p style="font-size: 13px; color: #666; margin-bottom: 16px;">Envie uma foto do seu progresso e ganhe pontos extras!</p>
                            <button id="enviarFotoBtn" class="btn-primary" style="background: #8b5cf6;">📷 Enviar Foto</button>
                        </div>
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
        
        return this.historicoTransacoes.map(transacao => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;">
                <div>
                    <span style="font-size: 20px; margin-right: 12px;">${transacao.tipo === 'ganho' ? '➕' : '➖'}</span>
                    <strong>${transacao.descricao}</strong>
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
            
            // Primeiro verifica se o documento existe
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
            
            return true;
        } catch (error) {
            console.error("Erro ao adicionar pontos:", error);
            return false;
        }
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
            
            alert(`✅ Resgate realizado com sucesso!\n\nItem: ${itemNome}\nPontos gastos: ${pontos}\n\nO profissional responsável entrará em contato para entregar sua recompensa.`);
            
            return true;
        } catch (error) {
            console.error("Erro ao gastar pontos:", error);
            alert('❌ Erro ao realizar resgate.');
            return false;
        }
    }

    async girarRoleta() {
        try {
            // Verifica se o documento existe
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await this.criarDocumentoUsuario();
            }
            
            const premios = this.configGamificacao?.roleta_premios || [5, 10, 15, 20, 25, 50, 100];
            const premio = premios[Math.floor(Math.random() * premios.length)];
            
            await updateDoc(userRef, {
                ultima_roleta: new Date().toISOString()
            });
            
            await this.adicionarPontos(premio, `🎡 Roleta da Sorte - Ganhou ${premio} pontos`, 'ganho');
            
            alert(`🎉 PARABÉNS!\n\nVocê ganhou ${premio} pontos na Roleta da Sorte!\n\nTotal de pontos: ${this.userPontos}`);
            
            this.roletaDisponivel = false;
            const girarBtn = document.getElementById('girarRoletaBtn');
            if (girarBtn) {
                girarBtn.disabled = true;
                girarBtn.textContent = '✅ Roleta já girada hoje!';
                girarBtn.style.opacity = '0.5';
            }
            
            await this.carregarHistorico();
            
        } catch (error) {
            console.error("Erro ao girar roleta:", error);
            alert('❌ Erro ao girar roleta. Tente novamente.');
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
            
            // Verifica se o documento existe
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
        };
        
        this.registrarAcessoDiario();
    }
}
