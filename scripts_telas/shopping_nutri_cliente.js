import { FuncoesCompartilhadas } from './0_home.js';
import { criarNavegador } from './0_complementos_menu_navegacao.js';
import { 
    db, collection, addDoc, getDocs, query, where, 
    doc, updateDoc, getDoc, setDoc, uploadParaImgbb
} from '../0_firebase_api_config.js';
import { carregarModeloIA, analisarImagemComIA, isModeloCarregado } from './0_ia_tensorflowjs.js';

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
        
        // Desafios diários (comuns)
        this.desafiosDiarios = [];
        
        // Desafios com foto (múltiplos)
        this.desafiosFoto = [];
        this.desafioSelecionado = null;
        this.streamCamera = null;
        this.fotoTemp = null;
        this.carregandoIA = false;
        
        // Participações do usuário nos desafios
        this.participacoesDesafios = new Map();
        
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
        
        this.currentSlideIndex = 0;
        this.totalSlides = 0;
    }

    async render() {
        const app = document.getElementById('app');
        
        await this.carregarDadosUsuario();
        await this.carregarItensDisponiveis();
        await this.carregarHistorico();
        await this.carregarConfigGamificacao();
        await this.verificarRoletaDiaria();
        await this.carregarDesafiosDiarios();
        await this.carregarDesafiosFoto();
        await this.carregarParticipacoesUsuario();
        
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.inicializarRoleta();
        this.inicializarCarrossel();
    }

    renderHTML() {
        const experienciaParaProxNivel = this.userNivel * 100;
        const progressoExp = (this.userExperiencia / experienciaParaProxNivel) * 100;
        
        this.roletaPremios = this.configGamificacao?.roleta_premios || [5, 10, 15, 20, 25, 50, 100];
        
        const desafiosDisponiveis = this.desafiosFoto.filter(desafio => {
            const disponivel = this.verificarDisponibilidadeDesafioFoto(desafio);
            const participacoesRestantes = this.getParticipacoesRestantes(desafio);
            return disponivel && participacoesRestantes > 0;
        });
        
        const desafiosIndisponiveis = this.desafiosFoto.filter(desafio => {
            const disponivel = this.verificarDisponibilidadeDesafioFoto(desafio);
            const participacoesRestantes = this.getParticipacoesRestantes(desafio);
            return !disponivel || participacoesRestantes === 0;
        });
        
        this.totalSlides = desafiosDisponiveis.length + desafiosIndisponiveis.length;

        return `
            <div class="container-fluid p-0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
                <!-- HEADER -->
                <div class="d-flex justify-content-between align-items-center p-3" style="background: rgba(0,0,0,0.2);">
                    <div class="d-flex align-items-center gap-2">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" style="height: 40px; filter: brightness(0) invert(1);">
                        <h1 class="text-white m-0" style="font-size: 20px;">🛍️ Shopping Nutri</h1>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <span class="text-white">👋 Olá, ${this.userInfo.nome}</span>
                        <button class="btn btn-sm btn-outline-light" id="backToHomeBtn">← Voltar</button>
                    </div>
                </div>

                <div class="p-3">
                    <!-- CARD DE PONTOS E NÍVEL -->
                    <div class="card bg-gradient-orange text-white rounded-4 mb-4 border-0" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <div class="small opacity-75">⭐ SEUS PONTOS</div>
                                    <div class="display-4 fw-bold" id="userPontosDisplay">${this.userPontos}</div>
                                </div>
                                <div class="text-center">
                                    <div class="small opacity-75">🏆 NÍVEL</div>
                                    <div class="display-4 fw-bold" id="userNivelDisplay">${this.userNivel}</div>
                                </div>
                                <div class="flex-grow-1" style="max-width: 200px;">
                                    <div class="small mb-1">📈 Progresso para Nível ${this.userNivel + 1}</div>
                                    <div class="progress bg-white bg-opacity-25" style="height: 8px;">
                                        <div class="progress-bar bg-white" style="width: ${progressoExp}%;"></div>
                                    </div>
                                    <div class="small mt-1">${this.userExperiencia}/${experienciaParaProxNivel} XP</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- DESAFIOS COM FOTO (CARROSSEL) -->
                    ${this.desafiosFoto.length > 0 ? `
                    <div class="mb-4">
                        <h3 class="text-white mb-3">📸 Desafios com Foto Analisados por IA</h3>
                        <div class="position-relative">
                            <div class="carrossel-wrapper d-flex overflow-hidden" id="desafiosCarrossel" style="transition: transform 0.3s ease;">
                                ${desafiosDisponiveis.map(desafio => `
                                    <div class="carrossel-slide flex-shrink-0" style="width: 100%; padding: 0 8px;">
                                        <div class="card bg-gradient-purple text-white rounded-4 border-0" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
                                            <div class="card-body">
                                                <div class="d-flex align-items-center gap-3 flex-wrap">
                                                    <div class="display-1">📸</div>
                                                    <div class="flex-grow-1">
                                                        <h3 class="card-title mb-2">${desafio.titulo || 'Desafio Especial'}</h3>
                                                        <p class="card-text opacity-75 mb-2">${desafio.descricao || 'Participe deste desafio e ganhe pontos extras!'}</p>
                                                        <div class="d-flex gap-3 flex-wrap">
                                                            <span class="badge bg-white bg-opacity-25">⭐ Pontos: +${desafio.pontos || 50}</span>
                                                            <span class="badge bg-white bg-opacity-25">⏰ ${this.formatarHorarioDesafio(desafio)}</span>
                                                            <span class="badge bg-white bg-opacity-25">🎯 Participações: ${this.getParticipacoesRestantes(desafio)}/${desafio.quantidade_permitida || 1}</span>
                                                        </div>
                                                    </div>
                                                    <button class="btn btn-light text-purple participar-desafio-btn fw-bold" data-desafio-id="${desafio.id}">📷 Participar Agora</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                                ${desafiosIndisponiveis.map(desafio => `
                                    <div class="carrossel-slide flex-shrink-0" style="width: 100%; padding: 0 8px;">
                                        <div class="card bg-secondary text-white rounded-4 border-0 opacity-75">
                                            <div class="card-body">
                                                <div class="d-flex align-items-center gap-3 flex-wrap">
                                                    <div class="display-1">🔒</div>
                                                    <div class="flex-grow-1">
                                                        <h3 class="card-title mb-2">${desafio.titulo || 'Desafio Especial'}</h3>
                                                        <p class="card-text opacity-75 mb-2">${desafio.descricao || ''}</p>
                                                        <div class="d-flex gap-3 flex-wrap">
                                                            <span class="badge bg-white bg-opacity-25">⭐ Pontos: +${desafio.pontos || 50}</span>
                                                            <span class="badge bg-white bg-opacity-25">🔒 Indisponível</span>
                                                        </div>
                                                    </div>
                                                    <button class="btn btn-secondary" disabled>🔒 Indisponível</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            ${this.totalSlides > 1 ? `
                            <button class="carrossel-prev position-absolute start-0 top-50 translate-middle-y btn btn-dark rounded-circle p-2" style="width: 40px; height: 40px; opacity: 0.7;">◀</button>
                            <button class="carrossel-next position-absolute end-0 top-50 translate-middle-y btn btn-dark rounded-circle p-2" style="width: 40px; height: 40px; opacity: 0.7;">▶</button>
                            <div class="carrossel-dots d-flex justify-content-center gap-2 mt-3"></div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}

                    <!-- ROLETA ANIMADA -->
                    <div class="card rounded-4 mb-4 border-0 shadow">
                        <div class="card-body text-center p-4">
                            <h3 class="card-title text-secondary mb-3">🎡 Roleta da Sorte</h3>
                            <p class="text-muted mb-4">Gire a roleta uma vez por dia e ganhe pontos incríveis!</p>
                            
                            <div class="position-relative d-inline-block">
                                <canvas id="roletaCanvas" width="400" height="400" class="rounded-circle shadow" style="max-width: 100%; height: auto;"></canvas>
                                
                                <div class="position-absolute top-0 start-50 translate-middle-x" style="width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 40px solid #f97316; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3)); z-index: 10;">
                                </div>
                                
                                <button id="girarRoletaBtn" class="roleta-girar-btn position-absolute top-50 start-50 translate-middle rounded-circle border-0 fw-bold shadow" style="width: 80px; height: 80px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; font-size: 18px; z-index: 20; transition: all 0.3s;" ${!this.roletaDisponivel ? 'disabled style="opacity:0.5;"' : ''}>
                                    ${this.roletaDisponivel ? 'GIRAR' : '✓'}
                                </button>
                            </div>
                            
                            ${!this.roletaDisponivel ? '<p class="text-success mt-3 mb-0">✅ Você já girou a roleta hoje! Volte amanhã para mais pontos!</p>' : ''}
                        </div>
                    </div>

                    <!-- DESAFIOS DIÁRIOS SIMPLES -->
                    <div class="card rounded-4 mb-4 border-0 shadow">
                        <div class="card-body p-4">
                            <h3 class="card-title text-secondary mb-3">⭐ Desafios Diários</h3>
                            <div id="desafiosList">
                                ${this.renderDesafios()}
                            </div>
                        </div>
                    </div>

                    <!-- LOJA DE ITENS -->
                    <div class="card rounded-4 mb-4 border-0 shadow">
                        <div class="card-body p-4">
                            <h3 class="card-title text-secondary mb-3">🛍️ Trocar Pontos por Recompensas</h3>
                            <div id="itensLoja" class="row g-3">
                                ${this.renderItensLoja()}
                            </div>
                        </div>
                    </div>

                    <!-- HISTÓRICO -->
                    <div class="card rounded-4 border-0 shadow">
                        <div class="card-body p-4">
                            <h3 class="card-title text-secondary mb-3">📜 Histórico de Transações</h3>
                            <div id="historicoList" style="max-height: 300px; overflow-y: auto;">
                                ${this.renderHistorico()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL LOADING IA -->
            <div id="loadingIAModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content text-center p-4">
                        <div class="display-1 mb-3">🧠</div>
                        <h3 id="loadingIATitulo">Carregando Inteligência Artificial...</h3>
                        <p id="loadingIAMensagem" class="text-muted mt-2">Preparando o sistema de análise de imagens</p>
                        <div class="progress mt-3" style="height: 4px;">
                            <div id="loadingIABarra" class="progress-bar bg-warning" style="width: 0%;"></div>
                        </div>
                        <p id="loadingIADetalhe" class="small text-muted mt-2"></p>
                    </div>
                </div>
            </div>

            <!-- MODAL CÂMERA -->
            <div id="cameraModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="cameraModalTitulo">📸 Tirar Foto</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p id="cameraModalDescricao" class="text-muted"></p>
                            <div class="position-relative mb-3">
                                <video id="videoCamera" autoplay playsinline class="w-100 rounded-3" style="background: #000;"></video>
                                <canvas id="canvasFoto" style="display: none;"></canvas>
                            </div>
                            <div class="d-flex gap-3 justify-content-center">
                                <button id="tirarFotoBtn" class="btn btn-warning">📷 Tirar Foto</button>
                                <button id="cancelarCameraBtn" class="btn btn-secondary">Cancelar</button>
                            </div>
                            <div id="iaAnaliseResultado" class="mt-4 p-3 rounded-3 d-none">
                                <div id="iaAnaliseIcone" class="display-4 text-center">🤖</div>
                                <p id="iaAnaliseMensagem" class="text-center mt-2"></p>
                                <p id="iaAnaliseDetalhes" class="small text-muted text-center"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL PRÉ-VISUALIZAÇÃO -->
            <div id="previewModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">📸 Pré-visualização da Foto</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <img id="previewImagem" class="img-fluid rounded-3 mb-3">
                            <p id="previewResultadoIA" class="p-3 rounded-3"></p>
                            <div class="d-flex gap-3 justify-content-center">
                                <button id="refazerFotoBtn" class="btn btn-secondary">📷 Refazer Foto</button>
                                <button id="confirmarEnvioBtn" class="btn btn-success">✅ Confirmar Envio</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MODAL RESULTADO DA ROLETA -->
            <div id="resultadoRoletaModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content text-center p-4">
                        <div id="resultadoIcone" class="display-1 mb-3">🎉</div>
                        <h3 id="resultadoTitulo" class="text-warning">Parabéns!</h3>
                        <p id="resultadoMensagem" class="fs-5 my-3"></p>
                        <button id="fecharResultadoBtn" class="btn btn-primary mx-auto">Continuar</button>
                    </div>
                </div>
            </div>

            <!-- MODAL CONFIRMAÇÃO DE TROCA -->
            <div id="trocaModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="trocaModalTitulo">Confirmar Troca</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p id="trocaModalDescricao"></p>
                            <div class="d-flex gap-3 justify-content-end mt-4">
                                <button id="cancelarTrocaBtn" class="btn btn-secondary">Cancelar</button>
                                <button id="confirmarTrocaBtn" class="btn btn-primary">Confirmar Troca</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    inicializarCarrossel() {
        const slides = document.querySelectorAll('.carrossel-slide');
        const prevBtn = document.querySelector('.carrossel-prev');
        const nextBtn = document.querySelector('.carrossel-next');
        const dotsContainer = document.querySelector('.carrossel-dots');
        const wrapper = document.querySelector('.carrossel-wrapper');
        
        if (slides.length <= 1) return;
        
        this.totalSlides = slides.length;
        this.currentSlideIndex = 0;
        
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < this.totalSlides; i++) {
                const dot = document.createElement('button');
                dot.className = `btn rounded-circle p-0 mx-1 ${i === this.currentSlideIndex ? 'bg-white' : 'bg-white bg-opacity-50'}`;
                dot.style.width = '10px';
                dot.style.height = '10px';
                dot.addEventListener('click', () => this.goToSlide(i, wrapper, dotsContainer));
                dotsContainer.appendChild(dot);
            }
        }
        
        const updateSlide = () => {
            const offset = -this.currentSlideIndex * 100;
            if (wrapper) wrapper.style.transform = `translateX(${offset}%)`;
            if (dotsContainer) {
                for (let i = 0; i < dotsContainer.children.length; i++) {
                    dotsContainer.children[i].classList.toggle('bg-white', i === this.currentSlideIndex);
                    dotsContainer.children[i].classList.toggle('bg-white bg-opacity-50', i !== this.currentSlideIndex);
                }
            }
        };
        
        if (prevBtn) {
            prevBtn.onclick = () => {
                this.currentSlideIndex = (this.currentSlideIndex - 1 + this.totalSlides) % this.totalSlides;
                updateSlide();
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => {
                this.currentSlideIndex = (this.currentSlideIndex + 1) % this.totalSlides;
                updateSlide();
            };
        }
        
        updateSlide();
    }
    
    goToSlide(index, wrapper, dotsContainer) {
        this.currentSlideIndex = index;
        const offset = -this.currentSlideIndex * 100;
        if (wrapper) wrapper.style.transform = `translateX(${offset}%)`;
        if (dotsContainer) {
            for (let i = 0; i < dotsContainer.children.length; i++) {
                dotsContainer.children[i].classList.toggle('bg-white', i === this.currentSlideIndex);
                dotsContainer.children[i].classList.toggle('bg-white bg-opacity-50', i !== this.currentSlideIndex);
            }
        }
    }

    formatarHorarioDesafio(desafio) {
        if (!desafio.horario_inicio || !desafio.horario_fim) return 'Horário flexível';
        
        const inicio = new Date(desafio.horario_inicio);
        const fim = new Date(desafio.horario_fim);
        const mesmoDia = inicio.toDateString() === fim.toDateString();
        
        if (mesmoDia) {
            return `${inicio.toLocaleDateString('pt-BR')} das ${inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às ${fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        return `${inicio.toLocaleDateString('pt-BR')} ${inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} até ${fim.toLocaleDateString('pt-BR')} ${fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    verificarDisponibilidadeDesafioFoto(desafio) {
        if (!desafio || !desafio.ativo) return false;
        
        const agora = new Date();
        const horarioInicio = desafio.horario_inicio ? new Date(desafio.horario_inicio) : null;
        const horarioFim = desafio.horario_fim ? new Date(desafio.horario_fim) : null;
        
        if (!horarioInicio || !horarioFim) return true;
        return agora >= horarioInicio && agora <= horarioFim;
    }
    
    getParticipacoesRestantes(desafio) {
        const maxParticipacoes = desafio.quantidade_permitida || 1;
        const participacoesFeitas = this.participacoesDesafios.get(desafio.id) || 0;
        return Math.max(0, maxParticipacoes - participacoesFeitas);
    }

    async carregarParticipacoesUsuario() {
        try {
            const participacoesRef = collection(db, 'participacoes_desafios');
            const q = query(participacoesRef, where('usuario_login', '==', this.userInfo.login));
            const querySnapshot = await getDocs(q);
            
            this.participacoesDesafios.clear();
            querySnapshot.forEach(doc => {
                const data = doc.data();
                this.participacoesDesafios.set(data.desafio_id, data.quantidade || 1);
            });
        } catch (error) {
            console.error("Erro ao carregar participações:", error);
        }
    }
    
    async registrarParticipacao(desafioId) {
        try {
            const participacoesRef = collection(db, 'participacoes_desafios');
            const q = query(participacoesRef, where('usuario_login', '==', this.userInfo.login), where('desafio_id', '==', desafioId));
            const querySnapshot = await getDocs(q);
            const novaQuantidade = (this.participacoesDesafios.get(desafioId) || 0) + 1;
            
            if (!querySnapshot.empty) {
                const docRef = doc(db, 'participacoes_desafios', querySnapshot.docs[0].id);
                await updateDoc(docRef, { quantidade: novaQuantidade, ultima_participacao: new Date().toISOString() });
            } else {
                await addDoc(participacoesRef, {
                    usuario_login: this.userInfo.login,
                    usuario_nome: this.userInfo.nome,
                    desafio_id: desafioId,
                    quantidade: 1,
                    data_primeira_participacao: new Date().toISOString(),
                    ultima_participacao: new Date().toISOString()
                });
            }
            this.participacoesDesafios.set(desafioId, novaQuantidade);
        } catch (error) {
            console.error("Erro ao registrar participação:", error);
        }
    }

    async carregarDesafiosFoto() {
        try {
            const desafiosRef = collection(db, 'desafios_diarios');
            const q = query(desafiosRef, where('tipo', '==', 'foto'));
            const querySnapshot = await getDocs(q);
            this.desafiosFoto = [];
            querySnapshot.forEach(doc => {
                this.desafiosFoto.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error("Erro ao carregar desafios foto:", error);
        }
    }

    async participarDesafio(desafioId) {
        const desafio = this.desafiosFoto.find(d => d.id === desafioId);
        if (!desafio) {
            alert('Desafio não encontrado!');
            return;
        }
        
        if (!this.verificarDisponibilidadeDesafioFoto(desafio)) {
            alert('🔒 Desafio não está disponível no momento. Verifique o horário!');
            return;
        }
        
        if (this.getParticipacoesRestantes(desafio) <= 0) {
            alert('🔒 Você já atingiu o limite de participações neste desafio!');
            return;
        }
        
        this.desafioSelecionado = desafio;
        
        if (!isModeloCarregado()) {
            await this.mostrarLoadingIAEcarregar();
        }
        
        await this.abrirCamera();
    }
    
    async mostrarLoadingIAEcarregar() {
        return new Promise(async (resolve, reject) => {
            const modalEl = document.getElementById('loadingIAModal');
            const modal = new bootstrap.Modal(modalEl);
            const barra = document.getElementById('loadingIABarra');
            const detalhe = document.getElementById('loadingIADetalhe');
            
            modal.show();
            
            const onProgress = (percent, msg) => {
                barra.style.width = `${percent}%`;
                if (msg) detalhe.textContent = msg;
            };
            
            try {
                await carregarModeloIA(onProgress);
                modal.hide();
                resolve();
            } catch (error) {
                modal.hide();
                reject(error);
            }
        });
    }

    async abrirCamera() {
        try {
            if (this.streamCamera) {
                this.streamCamera.getTracks().forEach(track => track.stop());
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            this.streamCamera = stream;
            const video = document.getElementById('videoCamera');
            if (video) video.srcObject = stream;
            
            const modalEl = document.getElementById('cameraModal');
            const modal = new bootstrap.Modal(modalEl);
            document.getElementById('cameraModalTitulo').textContent = `📸 Desafio: ${this.desafioSelecionado?.titulo || 'Foto'}`;
            document.getElementById('cameraModalDescricao').textContent = this.desafioSelecionado?.descricao || '';
            modal.show();
            
            document.getElementById('tirarFotoBtn').onclick = () => this.tirarFoto();
            document.getElementById('cancelarCameraBtn').onclick = () => this.fecharCamera();
            
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            alert('❌ Não foi possível acessar a câmera. Verifique as permissões.');
        }
    }

    async tirarFoto() {
        const video = document.getElementById('videoCamera');
        const canvas = document.getElementById('canvasFoto');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imagemDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        this.fecharCamera();
        await this.analisarComIA(imagemDataUrl);
    }

    async analisarComIA(imagemDataUrl) {
        const iaResultado = document.getElementById('iaAnaliseResultado');
        const iaIcone = document.getElementById('iaAnaliseIcone');
        const iaMensagem = document.getElementById('iaAnaliseMensagem');
        const iaDetalhes = document.getElementById('iaAnaliseDetalhes');
        
        iaResultado.classList.remove('d-none');
        iaIcone.innerHTML = '🔍';
        iaMensagem.innerHTML = 'Analisando imagem com Inteligência Artificial...';
        iaDetalhes.innerHTML = '';
        
        let analise = { aprovado: false, confianca: 0, objetosEncontrados: [], mensagem: '' };
        
        try {
            const resultado = await analisarImagemComIA(imagemDataUrl, this.desafioSelecionado?.categoria);
            analise = resultado;
        } catch (error) {
            console.error('Erro na análise de IA:', error);
            analise.mensagem = 'Erro na análise automática. Foto será enviada para avaliação manual.';
        }
        
        if (analise.aprovado && analise.confianca >= 0.7) {
            iaIcone.innerHTML = '✅';
            iaMensagem.innerHTML = `✔️ Imagem validada pela IA! ${analise.mensagem}`;
            iaDetalhes.innerHTML = `Objetos identificados: ${analise.objetosEncontrados.join(', ')}`;
            iaDetalhes.classList.add('text-success');
        } else if (analise.aprovado && analise.confianca < 0.7) {
            iaIcone.innerHTML = '⚠️';
            iaMensagem.innerHTML = `🤔 Análise em dúvida. Foto será enviada para avaliação manual.`;
            iaDetalhes.innerHTML = `Motivo: ${analise.mensagem}`;
            iaDetalhes.classList.add('text-warning');
        } else {
            iaIcone.innerHTML = '👩‍⚕️';
            iaMensagem.innerHTML = `📋 Foto será enviada para avaliação do nutricionista.`;
            iaDetalhes.innerHTML = `Motivo: ${analise.mensagem || 'IA não reconheceu o conteúdo esperado'}`;
            iaDetalhes.classList.add('text-muted');
        }
        
        const previewModalEl = document.getElementById('previewModal');
        const previewModal = new bootstrap.Modal(previewModalEl);
        const previewImg = document.getElementById('previewImagem');
        const previewResultado = document.getElementById('previewResultadoIA');
        
        previewImg.src = imagemDataUrl;
        previewResultado.innerHTML = `
            <strong>${analise.aprovado ? '🟢 Aprovado pela IA' : '🟡 Pendente de análise manual'}</strong><br>
            ${analise.mensagem}
            ${analise.objetosEncontrados.length > 0 ? `<br><small>🔍 Identificado: ${analise.objetosEncontrados.join(', ')}</small>` : ''}
        `;
        previewResultado.classList.add(analise.aprovado && analise.confianca >= 0.7 ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10');
        
        this.fotoTemp = { dataUrl: imagemDataUrl, analise: analise };
        
        document.getElementById('confirmarEnvioBtn').onclick = () => this.confirmarEnvioFoto();
        document.getElementById('refazerFotoBtn').onclick = () => {
            previewModal.hide();
            this.abrirCamera();
        };
        
        previewModal.show();
    }

    async confirmarEnvioFoto() {
        if (!this.fotoTemp || !this.desafioSelecionado) return;
        
        const previewModal = bootstrap.Modal.getInstance(document.getElementById('previewModal'));
        previewModal.hide();
        
        const pontos = this.desafioSelecionado.pontos || 50;
        const status = (this.fotoTemp.analise.aprovado && this.fotoTemp.analise.confianca >= 0.7) ? 'aprovado_ia' : 'pendente_manual';
        
        try {
            let imagemUrl = '';
            try {
                const uploadResult = await uploadParaImgbb(this.fotoTemp.dataUrl);
                if (uploadResult.success) imagemUrl = uploadResult.url;
            } catch (uploadError) {
                console.error('Erro no upload para ImgBB:', uploadError);
            }
            
            await addDoc(collection(db, 'fotos_desafio'), {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                desafio_id: this.desafioSelecionado.id,
                desafio_titulo: this.desafioSelecionado.titulo,
                descricao: this.desafioSelecionado.descricao,
                foto_base64: imagemUrl || this.fotoTemp.dataUrl,
                foto_armazenada_em: imagemUrl ? 'imgbb' : 'firebase',
                status: status,
                analise_ia: {
                    aprovado: this.fotoTemp.analise.aprovado,
                    confianca: this.fotoTemp.analise.confianca,
                    objetos_encontrados: this.fotoTemp.analise.objetosEncontrados,
                    mensagem: this.fotoTemp.analise.mensagem
                },
                data_envio: new Date().toISOString()
            });
            
            await this.registrarParticipacao(this.desafioSelecionado.id);
            
            if (status === 'aprovado_ia') {
                await this.adicionarPontos(pontos, `📸 Desafio: ${this.desafioSelecionado.titulo} (Validado por IA)`, 'ganho');
                alert(`✅ Parabéns! Sua foto foi validada pela IA!\n\n+${pontos} pontos adicionados!`);
            } else {
                alert(`📸 Foto enviada com sucesso!\n\nSua foto será analisada pelo nutricionista. Você receberá os pontos após a aprovação.`);
            }
            
            this.fotoTemp = null;
            this.fecharCamera();
            await this.carregarParticipacoesUsuario();
            await this.carregarDesafiosFoto();
            await this.render();
            
        } catch (error) {
            console.error('Erro ao enviar foto:', error);
            alert('❌ Erro ao enviar foto. Tente novamente.');
        }
    }

    fecharCamera() {
        if (this.streamCamera) {
            this.streamCamera.getTracks().forEach(track => track.stop());
            this.streamCamera = null;
        }
        
        const modalEl = document.getElementById('cameraModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        
        const loadingModalEl = document.getElementById('loadingIAModal');
        const loadingModal = bootstrap.Modal.getInstance(loadingModalEl);
        if (loadingModal) loadingModal.hide();
    }

    // ==================== MÉTODOS DA ROLETA ====================

    inicializarRoleta() {
        this.roletaCanvas = document.getElementById('roletaCanvas');
        if (!this.roletaCanvas) return;
        
        this.roletaCtx = this.roletaCanvas.getContext('2d');
        this.desenharRoleta();
        
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
            
            this.roletaCtx.beginPath();
            this.roletaCtx.moveTo(centerX, centerY);
            this.roletaCtx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.roletaCtx.closePath();
            
            this.roletaCtx.fillStyle = this.roletaCores[i % this.roletaCores.length];
            this.roletaCtx.fill();
            
            this.roletaCtx.strokeStyle = 'white';
            this.roletaCtx.lineWidth = 2;
            this.roletaCtx.stroke();
            
            this.roletaCtx.save();
            this.roletaCtx.translate(centerX, centerY);
            this.roletaCtx.rotate(startAngle + anglePerSegment / 2);
            this.roletaCtx.textAlign = 'center';
            this.roletaCtx.textBaseline = 'middle';
            this.roletaCtx.font = `bold ${Math.max(12, radius / 10)}px "Segoe UI"`;
            this.roletaCtx.fillStyle = '#333';
            
            const premio = this.roletaPremios[i];
            this.roletaCtx.fillText(`${premio} pts`, radius * 0.65, 0);
            this.roletaCtx.restore();
        }
        
        this.roletaCtx.beginPath();
        this.roletaCtx.arc(centerX, centerY, radius * 0.12, 0, Math.PI * 2);
        this.roletaCtx.fillStyle = '#f97316';
        this.roletaCtx.fill();
        this.roletaCtx.strokeStyle = 'white';
        this.roletaCtx.lineWidth = 3;
        this.roletaCtx.stroke();
        
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
        
        const voltasCompletas = 5 + Math.random() * 5;
        const duracao = 3000;
        const inicio = performance.now();
        const anguloInicial = this.roletaAnguloAtual;
        const premioIndex = Math.floor(Math.random() * this.roletaPremios.length);
        const premioGanho = this.roletaPremios[premioIndex];
        const anguloPorSegmento = (Math.PI * 2) / this.roletaPremios.length;
        const anguloAlvo = (-Math.PI / 2) - (premioIndex * anguloPorSegmento) - (anguloPorSegmento / 2);
        
        let rotacaoNecessaria = anguloAlvo - (this.roletaAnguloAtual % (Math.PI * 2));
        while (rotacaoNecessaria > Math.PI) rotacaoNecessaria -= Math.PI * 2;
        while (rotacaoNecessaria < -Math.PI) rotacaoNecessaria += Math.PI * 2;
        
        const anguloDestino = this.roletaAnguloAtual + (Math.PI * 2 * voltasCompletas) + rotacaoNecessaria;
        
        const animar = (agora) => {
            const elapsed = agora - inicio;
            const progresso = Math.min(1, elapsed / duracao);
            const easeOut = 1 - Math.pow(1 - progresso, 3);
            const anguloAtual = anguloInicial + (anguloDestino - anguloInicial) * easeOut;
            this.roletaAnguloAtual = anguloAtual;
            this.desenharRoleta();
            
            if (progresso < 1) {
                this.roletaAnimacaoId = requestAnimationFrame(animar);
            } else {
                this.roletaGirando = false;
                if (girarBtn) girarBtn.disabled = false;
                this.finalizarGiroRoleta(premioGanho);
            }
        };
        
        if (this.roletaAnimacaoId) cancelAnimationFrame(this.roletaAnimacaoId);
        this.roletaAnimacaoId = requestAnimationFrame(animar);
    }

    async finalizarGiroRoleta(premioGanho) {
        try {
            const userRef = doc(db, 'pontuacao_usuarios', this.userInfo.login);
            let userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await this.criarDocumentoUsuario();
                userDoc = await getDoc(userRef);
            }
            
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
            
            await updateDoc(userRef, { ultima_roleta: new Date().toISOString() });
            await this.adicionarPontos(premioGanho, `🎡 Roleta da Sorte - Ganhou ${premioGanho} pontos`, 'ganho');
            this.roletaDisponivel = false;
            this.mostrarResultadoRoleta(premioGanho);
            
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
        const modalEl = document.getElementById('resultadoRoletaModal');
        const modal = new bootstrap.Modal(modalEl);
        const icone = document.getElementById('resultadoIcone');
        const titulo = document.getElementById('resultadoTitulo');
        const mensagem = document.getElementById('resultadoMensagem');
        
        if (premio >= 50) {
            icone.innerHTML = '🎉🎊🏆';
            titulo.textContent = '🎉 JACKPOT! 🎉';
            mensagem.innerHTML = `Parabéns! Você ganhou <strong class="fs-2 text-warning">${premio} pontos</strong> na Roleta da Sorte!<br><br>Continue assim! 🌟`;
        } else if (premio >= 25) {
            icone.innerHTML = '🎉✨';
            titulo.textContent = 'Parabéns!';
            mensagem.innerHTML = `Você ganhou <strong class="fs-2 text-warning">${premio} pontos</strong> na Roleta da Sorte!<br><br>Boa sorte amanhã! 🍀`;
        } else {
            icone.innerHTML = '🎲🍀';
            titulo.textContent = 'Boa Sorte!';
            mensagem.innerHTML = `Você ganhou <strong class="fs-2 text-warning">${premio} pontos</strong> na Roleta da Sorte!<br><br>Volte amanhã para mais chances! 🌟`;
        }
        
        modal.show();
        
        document.getElementById('fecharResultadoBtn').onclick = () => {
            modal.hide();
            const pontosElement = document.getElementById('userPontosDisplay');
            if (pontosElement) pontosElement.textContent = this.userPontos;
        };
    }

    // ==================== MÉTODOS AUXILIARES ====================

    renderDesafios() {
        if (this.desafiosDiarios.length === 0) {
            return '<p class="text-center text-muted py-4">Nenhum desafio ativo no momento.</p>';
        }
        
        return this.desafiosDiarios.map(desafio => `
            <div class="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <span class="fs-1 me-3">${desafio.icone || '🎯'}</span>
                    <strong>${desafio.titulo}</strong>
                    <p class="text-muted small mb-0">${desafio.descricao}</p>
                </div>
                <div class="text-end">
                    <div class="text-warning fw-bold">+${desafio.pontos} pts</div>
                    ${!desafio.completado ? 
                        `<button class="completar-desafio-btn btn btn-sm btn-success mt-2" data-desafio-id="${desafio.id}">Completar</button>` :
                        '<span class="badge bg-success mt-2">✅ Concluído</span>'
                    }
                </div>
            </div>
        `).join('');
    }

    renderItensLoja() {
        if (this.itensDisponiveis.length === 0) {
            return '<p class="text-center text-muted py-4 col-12">Nenhum item disponível no momento.</p>';
        }
        
        return this.itensDisponiveis.map(item => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 text-center border-2 ${item.pontos <= this.userPontos ? 'border-success' : 'border-secondary'}">
                    <div class="card-body">
                        <div class="display-1 mb-3">${item.icone || '🎁'}</div>
                        <h5 class="card-title">${item.nome}</h5>
                        <p class="card-text small text-muted">${item.descricao || ''}</p>
                        <div class="fs-3 fw-bold text-warning my-3">${item.pontos} pts</div>
                        <button class="trocar-item-btn btn ${item.pontos <= this.userPontos ? 'btn-warning' : 'btn-secondary'}" data-item-id="${item.id}" data-item-nome="${item.nome}" data-item-pontos="${item.pontos}" ${item.pontos <= this.userPontos ? '' : 'disabled'}>
                            ${item.pontos <= this.userPontos ? '🛒 Trocar' : '🔒 Pontos insuficientes'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderHistorico() {
        if (this.historicoTransacoes.length === 0) {
            return '<p class="text-center text-muted py-4">Nenhuma transação realizada.</p>';
        }
        
        return this.historicoTransacoes.slice(0, 10).map(transacao => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <span class="fs-4 me-2">${transacao.tipo === 'ganho' ? '➕' : '➖'}</span>
                    <strong>${transacao.descricao.substring(0, 50)}</strong>
                    <div class="small text-muted">${new Date(transacao.data).toLocaleString('pt-BR')}</div>
                </div>
                <div class="fw-bold ${transacao.tipo === 'ganho' ? 'text-success' : 'text-danger'}">
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
            await setDoc(userRef, {
                login: this.userInfo.login,
                nome: this.userInfo.nome,
                pontos: 0,
                nivel: 1,
                experiencia: 0,
                ultimo_acesso_diario: null,
                ultima_roleta: null,
                data_criacao: new Date().toISOString()
            });
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
                    this.roletaDisponivel = hoje !== ultimaRoleta.split('T')[0];
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
                if (data.ativo && data.tipo !== 'foto' && (!data.data_expiracao || data.data_expiracao >= hoje)) {
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
            
            let userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                await this.criarDocumentoUsuario();
                userDoc = await getDoc(userRef);
            }
            
            this.userPontos += pontos;
            this.userExperiencia += pontos;
            
            let novoNivel = this.userNivel;
            if (this.userExperiencia >= this.userNivel * 100) {
                novoNivel = this.userNivel + 1;
            }
            
            await updateDoc(userRef, {
                pontos: this.userPontos,
                experiencia: this.userExperiencia,
                nivel: novoNivel,
                ultima_atualizacao: new Date().toISOString()
            });
            
            await addDoc(collection(db, 'transacoes_pontos'), {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                pontos: pontos,
                descricao: descricao,
                tipo: tipo,
                data: new Date().toISOString(),
                saldo_apos: this.userPontos
            });
            
            this.userNivel = novoNivel;
            
            const pontosElement = document.getElementById('userPontosDisplay');
            const nivelElement = document.getElementById('userNivelDisplay');
            if (pontosElement) pontosElement.textContent = this.userPontos;
            if (nivelElement) nivelElement.textContent = this.userNivel;
            
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
            
            await addDoc(collection(db, 'transacoes_pontos'), {
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
            
            await addDoc(collection(db, 'resgates_realizados'), {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                item_id: itemId,
                item_nome: itemNome,
                pontos_gastos: pontos,
                status: 'pendente',
                data_resgate: new Date().toISOString()
            });
            
            await this.carregarHistorico();
            
            const pontosElement = document.getElementById('userPontosDisplay');
            if (pontosElement) pontosElement.textContent = this.userPontos;
            
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
            
            const completadosRef = collection(db, 'desafios_completados');
            const q = query(completadosRef, where('usuario_login', '==', this.userInfo.login), where('desafio_id', '==', desafioId), where('data_completado', '>=', new Date().toISOString().split('T')[0]));
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
            
            if (ultimoAcesso && ultimoAcesso.split('T')[0] === hoje) return;
            
            await updateDoc(userRef, { ultimo_acesso_diario: new Date().toISOString() });
            await this.adicionarPontos(5, '📅 Acesso diário ao sistema', 'ganho');
            
        } catch (error) {
            console.error("Erro ao registrar acesso diário:", error);
        }
    }

    attachEvents() {
        document.getElementById('backToHomeBtn')?.addEventListener('click', () => this.navegador.navegarPara('home'));
        document.getElementById('girarRoletaBtn')?.addEventListener('click', () => this.girarRoleta());
        
        document.querySelectorAll('.participar-desafio-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const desafioId = btn.getAttribute('data-desafio-id');
                if (desafioId) this.participarDesafio(desafioId);
            });
        });
        
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
                    const modalEl = document.getElementById('trocaModal');
                    const modal = new bootstrap.Modal(modalEl);
                    document.getElementById('trocaModalTitulo').textContent = `Confirmar Troca: ${itemNome}`;
                    document.getElementById('trocaModalDescricao').innerHTML = `Você está trocando <strong>${itemPontos} pontos</strong> por:<br><strong>${itemNome}</strong><br><br>Deseja confirmar?`;
                    modal.show();
                    
                    document.getElementById('confirmarTrocaBtn').onclick = () => {
                        this.gastarPontos(itemPontos, `🛍️ Troca por: ${itemNome}`, itemId, itemNome);
                        modal.hide();
                    };
                    document.getElementById('cancelarTrocaBtn').onclick = () => modal.hide();
                }
            });
        });
        
        this.registrarAcessoDiario();
    }
}
