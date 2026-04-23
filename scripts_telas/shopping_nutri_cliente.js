import { FuncoesCompartilhadas } from './0_home.js';
import { criarNavegador } from './0_complementos_menu_navegacao.js';
import { 
    db, collection, addDoc, getDocs, query, where, 
    doc, updateDoc, getDoc, setDoc 
} from '../0_firebase_api_config.js';

// Carregar TensorFlow.js e modelo COCO-SSD
let modeloIA = null;

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
        
        // Desafio com foto ativo
        this.desafioFotoAtual = null;
        this.streamCamera = null;
        this.modeloCarregado = false;
        this.fotoTemp = null;
        
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
        
        // Carregar modelo de IA se ainda não carregou
        if (!modeloIA && !this.modeloCarregado) {
            this.mostrarLoadingIA();
            await this.carregarModeloIA();
        }
        
        await this.carregarDadosUsuario();
        await this.carregarItensDisponiveis();
        await this.carregarHistorico();
        await this.carregarConfigGamificacao();
        await this.verificarRoletaDiaria();
        await this.carregarDesafiosDiarios();
        await this.carregarDesafioFotoAtivo();
        
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.inicializarRoleta();
    }

    mostrarLoadingIA() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="home-container" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; background: white; padding: 40px; border-radius: 24px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🧠</div>
                    <h3>Carregando Inteligência Artificial...</h3>
                    <p style="margin-top: 10px; color: #666;">Preparando o sistema de validação de fotos</p>
                    <div style="width: 200px; height: 4px; background: #e2e8f0; border-radius: 4px; margin: 20px auto; overflow: hidden;">
                        <div style="width: 60%; height: 100%; background: #f97316; border-radius: 4px; animation: loading 1s infinite;"></div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes loading {
                    0% { transform: translateX(-100%); width: 30%; }
                    50% { transform: translateX(0%); width: 70%; }
                    100% { transform: translateX(100%); width: 30%; }
                }
            </style>
        `;
    }

    async carregarModeloIA() {
        try {
            // Carregar scripts do TensorFlow.js
            await this.carregarScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js');
            await this.carregarScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js');
            
            // Aguardar um pouco para os scripts serem processados
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Carregar o modelo COCO-SSD
            modeloIA = await cocoSsd.load();
            this.modeloCarregado = true;
            console.log('✅ Modelo de IA carregado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao carregar modelo de IA:', error);
            this.modeloCarregado = false;
        }
    }

    carregarScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    renderHTML() {
        const experienciaParaProxNivel = this.userNivel * 100;
        const progressoExp = (this.userExperiencia / experienciaParaProxNivel) * 100;
        
        this.roletaPremios = this.configGamificacao?.roleta_premios || [5, 10, 15, 20, 25, 50, 100];
        const desafioDisponivel = this.verificarDisponibilidadeDesafioFoto();
        
        let desafioHtml = '';
        if (this.desafioFotoAtual && this.desafioFotoAtual.ativo) {
            desafioHtml = `
                <div class="desafio-foto-card" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 20px; padding: 24px; margin-bottom: 24px; color: white;">
                    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div style="font-size: 48px;">📸</div>
                        <div style="flex: 1;">
                            <h3 style="margin-bottom: 8px;">${this.desafioFotoAtual.titulo || 'Desafio Especial'}</h3>
                            <p style="margin-bottom: 8px; opacity: 0.9;">${this.desafioFotoAtual.descricao || 'Participe deste desafio e ganhe pontos extras!'}</p>
                            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px;">
                                <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                                    ⭐ Pontos: +${this.desafioFotoAtual.pontos || 50}
                                </span>
                                <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                                    ⏰ ${this.formatarHorarioDesafio(this.desafioFotoAtual)}
                                </span>
                            </div>
                        </div>
                        <button id="participarDesafioBtn" class="btn-primary" style="background: white; color: #7c3aed; ${!desafioDisponivel ? 'opacity:0.5; cursor:not-allowed;' : ''}" ${!desafioDisponivel ? 'disabled' : ''}>
                            ${desafioDisponivel ? '📷 Participar Agora' : '🔒 Aguarde o horário'}
                        </button>
                    </div>
                </div>
            `;
        }

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
                                <div style="font-size: 48px; font-weight: bold;" id="userPontosDisplay">${this.userPontos}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9;">🏆 NÍVEL</div>
                                <div style="font-size: 36px; font-weight: bold;" id="userNivelDisplay">${this.userNivel}</div>
                            </div>
                            <div style="flex: 1; max-width: 200px;">
                                <div style="font-size: 12px; margin-bottom: 8px;">📈 Progresso para Nível ${this.userNivel + 1}</div>
                                <div style="background: rgba(255,255,255,0.3); border-radius: 10px; overflow: hidden; height: 8px;">
                                    <div style="background: white; width: ${progressoExp}%; height: 100%; border-radius: 10px;"></div>
                                </div>
                                <div style="font-size: 12px; margin-top: 5px;">${this.userExperiencia}/${experienciaParaProxNivel} XP</div>
                            </div>
                        </div>
                        ${this.modeloCarregado ? '<div style="margin-top: 12px; font-size: 11px; opacity: 0.7;">🤖 IA ativa para validação de fotos</div>' : '<div style="margin-top: 12px; font-size: 11px; opacity: 0.7;">⚠️ IA não disponível - fotos serão enviadas para análise</div>'}
                    </div>

                    <!-- DESAFIO COM FOTO (se ativo) -->
                    ${desafioHtml}

                    <!-- ROLETA ANIMADA -->
                    <div class="roleta-container" style="background: white; border-radius: 24px; padding: 24px; margin-bottom: 24px; text-align: center;">
                        <h3 style="margin-bottom: 20px; color: #1a237e;">🎡 Roleta da Sorte</h3>
                        <p style="margin-bottom: 20px; color: #666;">Gire a roleta uma vez por dia e ganhe pontos incríveis!</p>
                        
                        <div style="position: relative; display: inline-block;">
                            <canvas id="roletaCanvas" width="400" height="400" style="max-width: 100%; height: auto; border-radius: 50%; box-shadow: 0 10px 30px rgba(0,0,0,0.2);"></canvas>
                            
                            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 40px solid #f97316; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3)); z-index: 10;">
                            </div>
                            
                            <button id="girarRoletaBtn" class="roleta-girar-btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); color: white; border: none; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 20; transition: all 0.3s;" ${!this.roletaDisponivel ? 'disabled style="opacity:0.5;"' : ''}>
                                ${this.roletaDisponivel ? 'GIRAR' : '✓'}
                            </button>
                        </div>
                        
                        ${!this.roletaDisponivel ? '<p style="margin-top: 20px; color: #10b981;">✅ Você já girou a roleta hoje! Volte amanhã para mais pontos!</p>' : ''}
                    </div>

                    <!-- DESAFIOS DIÁRIOS SIMPLES -->
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

            <!-- MODAL CÂMERA PARA DESAFIO -->
            <div id="cameraModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close">&times;</span>
                    <h3 id="cameraModalTitulo">📸 Desafio: ${this.desafioFotoAtual?.titulo || 'Foto'}</h3>
                    <p id="cameraModalDescricao">${this.desafioFotoAtual?.descricao || ''}</p>
                    
                    <div style="position: relative; margin: 20px 0;">
                        <video id="videoCamera" autoplay playsinline style="width: 100%; border-radius: 16px; background: #000;"></video>
                        <canvas id="canvasFoto" style="display: none;"></canvas>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button id="tirarFotoBtn" class="btn-primary" style="background: #f97316;">📷 Tirar Foto</button>
                        <button id="cancelarCameraBtn" class="btn-secondary">Cancelar</button>
                    </div>
                    
                    <div id="iaAnaliseResultado" style="margin-top: 20px; padding: 16px; border-radius: 12px; display: none;">
                        <div id="iaAnaliseIcone" style="font-size: 32px; text-align: center;">🤖</div>
                        <p id="iaAnaliseMensagem" style="text-align: center; margin-top: 8px;"></p>
                        <div id="iaAnaliseDetalhes" style="font-size: 12px; color: #666; margin-top: 8px; text-align: center;"></div>
                    </div>
                </div>
            </div>

            <!-- MODAL PRÉ-VISUALIZAÇÃO -->
            <div id="previewModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 500px;">
                    <span class="close">&times;</span>
                    <h3>📸 Pré-visualização da Foto</h3>
                    <img id="previewImagem" style="width: 100%; border-radius: 16px; margin: 20px 0;">
                    <p id="previewResultadoIA" style="padding: 12px; border-radius: 12px; margin: 10px 0;"></p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button id="refazerFotoBtn" class="btn-secondary">📷 Refazer Foto</button>
                        <button id="confirmarEnvioBtn" class="btn-primary" style="background: #10b981;">✅ Confirmar Envio</button>
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

    verificarDisponibilidadeDesafioFoto() {
        if (!this.desafioFotoAtual || !this.desafioFotoAtual.ativo) return false;
        
        const agora = new Date();
        const horarioInicio = this.desafioFotoAtual.horario_inicio ? new Date(this.desafioFotoAtual.horario_inicio) : null;
        const horarioFim = this.desafioFotoAtual.horario_fim ? new Date(this.desafioFotoAtual.horario_fim) : null;
        
        if (!horarioInicio || !horarioFim) return true;
        
        return agora >= horarioInicio && agora <= horarioFim;
    }

    async abrirCamera() {
        try {
            if (this.streamCamera) {
                this.streamCamera.getTracks().forEach(track => track.stop());
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            
            this.streamCamera = stream;
            const video = document.getElementById('videoCamera');
            if (video) {
                video.srcObject = stream;
            }
            
            const modal = document.getElementById('cameraModal');
            modal.style.display = 'flex';
            
            const tirarFotoBtn = document.getElementById('tirarFotoBtn');
            const cancelarBtn = document.getElementById('cancelarCameraBtn');
            
            const novoTirarFoto = () => this.tirarFoto();
            const novoCancelar = () => this.fecharCamera();
            
            tirarFotoBtn.onclick = novoTirarFoto;
            cancelarBtn.onclick = novoCancelar;
            
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
        
        // Analisar com IA
        await this.analisarComIA(imagemDataUrl);
    }

    async analisarComIA(imagemDataUrl) {
        const iaResultado = document.getElementById('iaAnaliseResultado');
        const iaIcone = document.getElementById('iaAnaliseIcone');
        const iaMensagem = document.getElementById('iaAnaliseMensagem');
        const iaDetalhes = document.getElementById('iaAnaliseDetalhes');
        
        iaResultado.style.display = 'block';
        iaIcone.innerHTML = '🔍';
        iaMensagem.innerHTML = 'Analisando imagem com Inteligência Artificial...';
        iaDetalhes.innerHTML = '';
        
        let analise = {
            aprovado: false,
            confianca: 0,
            objetosEncontrados: [],
            mensagem: ''
        };
        
        if (modeloIA && this.modeloCarregado) {
            try {
                // Converter base64 para blob
                const blob = await this.dataURLtoBlob(imagemDataUrl);
                const imagemUrl = URL.createObjectURL(blob);
                
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = imagemUrl;
                });
                
                // Detectar objetos na imagem
                const predictions = await modeloIA.detect(img);
                URL.revokeObjectURL(imagemUrl);
                
                this.processarAnaliseIA(predictions, this.desafioFotoAtual, analise);
                
            } catch (error) {
                console.error('Erro na análise de IA:', error);
                analise.aprovado = false;
                analise.confianca = 0;
                analise.mensagem = 'Erro na análise automática. Foto será enviada para avaliação manual.';
            }
        } else {
            analise.aprovado = false;
            analise.confianca = 0;
            analise.mensagem = 'IA não disponível. Foto será enviada para avaliação manual.';
        }
        
        // Atualizar UI da análise
        if (analise.aprovado && analise.confianca >= 0.7) {
            iaIcone.innerHTML = '✅';
            iaMensagem.innerHTML = `✔️ Imagem validada pela IA! ${analise.mensagem}`;
            iaDetalhes.innerHTML = `Objetos identificados: ${analise.objetosEncontrados.join(', ')}`;
            iaDetalhes.style.color = '#10b981';
            iaMensagem.style.color = '#10b981';
        } else if (analise.aprovado && analise.confianca < 0.7) {
            iaIcone.innerHTML = '⚠️';
            iaMensagem.innerHTML = `🤔 Análise em dúvida. Foto será enviada para avaliação manual.`;
            iaDetalhes.innerHTML = `Motivo: ${analise.mensagem}`;
            iaDetalhes.style.color = '#f59e0b';
            iaMensagem.style.color = '#f59e0b';
        } else {
            iaIcone.innerHTML = '👩‍⚕️';
            iaMensagem.innerHTML = `📋 Foto será enviada para avaliação do nutricionista.`;
            iaDetalhes.innerHTML = `Motivo: ${analise.mensagem || 'IA não reconheceu o conteúdo esperado'}`;
            iaDetalhes.style.color = '#f97316';
            iaMensagem.style.color = '#f97316';
        }
        
        // Mostrar pré-visualização
        const previewModal = document.getElementById('previewModal');
        const previewImg = document.getElementById('previewImagem');
        const previewResultado = document.getElementById('previewResultadoIA');
        
        previewImg.src = imagemDataUrl;
        previewResultado.innerHTML = `
            <strong>${analise.aprovado ? '🟢 Aprovado pela IA' : '🟡 Pendente de análise manual'}</strong><br>
            ${analise.mensagem}
            ${analise.objetosEncontrados.length > 0 ? `<br><small>🔍 Identificado: ${analise.objetosEncontrados.join(', ')}</small>` : ''}
        `;
        previewResultado.style.background = analise.aprovado && analise.confianca >= 0.7 ? '#d1fae5' : '#fed7aa';
        
        previewModal.style.display = 'flex';
        
        // Armazenar dados para envio
        this.fotoTemp = {
            dataUrl: imagemDataUrl,
            analise: analise
        };
        
        const confirmarBtn = document.getElementById('confirmarEnvioBtn');
        const refazerBtn = document.getElementById('refazerFotoBtn');
        
        confirmarBtn.onclick = () => this.confirmarEnvioFoto();
        refazerBtn.onclick = () => {
            previewModal.style.display = 'none';
            this.abrirCamera();
        };
    }

    processarAnaliseIA(predictions, desafio, analise) {
        const palavrasChave = {
            'refeicao': ['sandwich', 'pizza', 'cake', 'donut', 'carrot', 'broccoli', 'apple', 'orange', 'banana', 'hot dog', 'pizza', 'bowl'],
            'exercicio': ['person', 'sports ball', 'skateboard', 'surfboard', 'snowboard', 'frisbee', 'baseball bat', 'baseball glove', 'tennis racket'],
            'selfie': ['person', 'face', 'head', 'hair'],
            'prato_feito': ['sandwich', 'pizza', 'bowl', 'cake', 'donut', 'hot dog', 'carrot', 'broccoli'],
            'agua': ['bottle', 'cup', 'glass', 'water'],
            'fruta': ['apple', 'orange', 'banana', 'carrot'],
            'amigo': ['person', 'face', 'head', 'hair', 'people', 'group']  // NOVA CATEGORIA
        };
        
        const categoriasEsperadas = desafio?.categoria ? [desafio.categoria] : ['refeicao', 'exercicio', 'selfie'];
        
        let melhorMatch = { categoria: null, confianca: 0, objetos: [] };
        
        for (const categoria of categoriasEsperadas) {
            const palavras = palavrasChave[categoria] || palavrasChave['refeicao'];
            let pontuacao = 0;
            const objetosMatch = [];
            
            for (const pred of predictions) {
                const classe = pred.class.toLowerCase();
                if (palavras.some(p => classe.includes(p.toLowerCase()))) {
                    pontuacao += pred.score;
                    objetosMatch.push(pred.class);
                }
            }
            
            // Para categoria "amigo", verifica se tem pelo menos duas pessoas
            if (categoria === 'amigo') {
                const totalPessoas = predictions.filter(pred => 
                    pred.class.toLowerCase().includes('person') || 
                    pred.class.toLowerCase().includes('face')
                ).length;
                
                if (totalPessoas >= 2) {
                    pontuacao += 0.9;
                    objetosMatch.push(`${totalPessoas} pessoas`);
                } else if (totalPessoas === 1) {
                    pontuacao += 0.5;
                    objetosMatch.push(`1 pessoa (seria melhor com um amigo!)`);
                }
            }
            
            if (pontuacao > melhorMatch.confianca) {
                melhorMatch = { categoria, confianca: pontuacao, objetos: objetosMatch };
            }
        }
        
        analise.objetosEncontrados = melhorMatch.objetos.slice(0, 5);
        
        if (melhorMatch.confianca >= 0.9) {
            analise.aprovado = true;
            analise.confianca = 0.9;
            analise.mensagem = `Excelente! Foto corresponde perfeitamente ao desafio.`;
        } else if (melhorMatch.confianca >= 0.7) {
            analise.aprovado = true;
            analise.confianca = 0.7;
            analise.mensagem = `Boa! Foto reconhecida como relacionada ao desafio.`;
        } else if (melhorMatch.confianca >= 0.4) {
            analise.aprovado = false;
            analise.confianca = melhorMatch.confianca;
            analise.mensagem = `Possível correspondência detectada, mas com baixa confiança. Enviando para análise.`;
        } else if (predictions.length === 0) {
            analise.aprovado = false;
            analise.confianca = 0;
            analise.mensagem = `Nenhum objeto reconhecido. A foto pode não estar relacionada ao desafio.`;
        } else {
            analise.aprovado = false;
            analise.confianca = melhorMatch.confianca;
            analise.mensagem = `Conteúdo não identificado como relacionado ao desafio.`;
        }
        
        // Mensagem personalizada para desafio de amigo
        if (desafio?.categoria === 'amigo') {
            if (analise.aprovado && analise.confianca >= 0.7) {
                analise.mensagem = `🎉 Legal! Foto com amigo identificada! Pontos creditados!`;
            } else if (analise.confianca >= 0.4) {
                analise.mensagem = `🤔 Não consegui identificar claramente um amigo na foto. Enviando para avaliação do nutricionista.`;
            } else {
                analise.mensagem = `👥 Nenhuma pessoa identificada na foto. Lembre-se: o desafio é tirar foto com um amigo!`;
            }
        }
    }

    dataURLtoBlob(dataURL) {
        const partes = dataURL.split(',');
        const byteString = atob(partes[1]);
        const mimeString = partes[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }

    async confirmarEnvioFoto() {
        if (!this.fotoTemp) return;
        
        const modal = document.getElementById('previewModal');
        modal.style.display = 'none';
        
        const pontos = this.desafioFotoAtual?.pontos || 50;
        const status = (this.fotoTemp.analise.aprovado && this.fotoTemp.analise.confianca >= 0.7) ? 'aprovado_ia' : 'pendente_manual';
        
        try {
            const fotoRef = collection(db, 'fotos_desafio');
            await addDoc(fotoRef, {
                usuario_login: this.userInfo.login,
                usuario_nome: this.userInfo.nome,
                desafio_id: this.desafioFotoAtual.id,
                desafio_titulo: this.desafioFotoAtual.titulo,
                descricao: this.desafioFotoAtual.descricao,
                foto_base64: this.fotoTemp.dataUrl,
                status: status,
                analise_ia: {
                    aprovado: this.fotoTemp.analise.aprovado,
                    confianca: this.fotoTemp.analise.confianca,
                    objetos_encontrados: this.fotoTemp.analise.objetosEncontrados,
                    mensagem: this.fotoTemp.analise.mensagem
                },
                data_envio: new Date().toISOString()
            });
            
            if (status === 'aprovado_ia') {
                await this.adicionarPontos(pontos, `📸 Desafio: ${this.desafioFotoAtual.titulo} (Validado por IA)`, 'ganho');
                alert(`✅ Parabéns! Sua foto foi validada pela IA!\n\n+${pontos} pontos adicionados!`);
            } else {
                alert(`📸 Foto enviada com sucesso!\n\nSua foto será analisada pelo nutricionista. Você receberá os pontos após a aprovação.`);
            }
            
            this.fotoTemp = null;
            this.fecharCamera();
            await this.carregarDesafioFotoAtivo();
            this.render();
            
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
        
        const modal = document.getElementById('cameraModal');
        if (modal) modal.style.display = 'none';
        
        const iaResultado = document.getElementById('iaAnaliseResultado');
        if (iaResultado) iaResultado.style.display = 'none';
    }

    // ==================== MÉTODOS DA ROLETA (PRESERVADOS) ====================

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
            const texto = `${premio} pts`;
            this.roletaCtx.fillText(texto, radius * 0.65, 0);
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
        
        if (this.roletaAnimacaoId) {
            cancelAnimationFrame(this.roletaAnimacaoId);
        }
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
            
            await updateDoc(userRef, {
                ultima_roleta: new Date().toISOString()
            });
            
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
            const pontosElement = document.getElementById('userPontosDisplay');
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

    // ==================== MÉTODOS AUXILIARES ====================

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
                if (data.ativo && data.tipo !== 'foto' && (!data.data_expiracao || data.data_expiracao >= hoje)) {
                    this.desafiosDiarios.push({ id: doc.id, ...data, completado: false });
                }
            });
            
            await this.verificarDesafiosCompletados();
        } catch (error) {
            console.error("Erro ao carregar desafios:", error);
        }
    }

    async carregarDesafioFotoAtivo() {
        try {
            const desafiosRef = collection(db, 'desafios_diarios');
            const q = query(desafiosRef, where('ativo', '==', true), where('tipo', '==', 'foto'));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                this.desafioFotoAtual = { id: docSnap.id, ...docSnap.data() };
            } else {
                this.desafioFotoAtual = null;
            }
        } catch (error) {
            console.error("Erro ao carregar desafio foto:", error);
            this.desafioFotoAtual = null;
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
                ultima_atualizacion: new Date().toISOString()
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
                ultima_atualizacion: new Date().toISOString()
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
        
        const participarDesafioBtn = document.getElementById('participarDesafioBtn');
        if (participarDesafioBtn) {
            participarDesafioBtn.addEventListener('click', () => this.abrirCamera());
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
        
        const modais = ['cameraModal', 'previewModal', 'trocaModal', 'resultadoRoletaModal'];
        modais.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                const closeBtn = modal.querySelector('.close');
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        modal.style.display = 'none';
                        if (modalId === 'cameraModal') this.fecharCamera();
                    };
                }
            }
        });
        
        window.onclick = (event) => {
            modais.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (event.target === modal) {
                    modal.style.display = 'none';
                    if (modalId === 'cameraModal') this.fecharCamera();
                }
            });
        };
        
        this.registrarAcessoDiario();
    }
}
