import { FuncoesCompartilhadas } from './0_home.js';
import { criarNavegador } from './0_complementos_menu_navegacao.js';

export class HomeCliente {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.currentEvaluations = [];
        this.navegador = criarNavegador(userInfo);
        this.isMenuOpen = false;
        
        // Gráficos
        this.weightChart = null;
        this.imcChart = null;
        this.muscleChart = null;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.loadEvaluations();
    }

    renderHTML() {
        const perfilDisplayName = this.getPerfilDisplayName(this.userInfo.perfil);
        const perfilBadgeClass = this.getPerfilBadgeClass(this.userInfo.perfil);
        
        const isMembro = this.userInfo.perfil === 'operador_membro' && !this.userInfo.isAdminView;
        
        const cargoDisplayText = this.userInfo.isAdminView ? 
            `[Admin] Visualizando como ${this.getCargoDisplayName(this.userInfo.cargo)}` : 
            (this.userInfo.cargo === 'paciente' ? 'Paciente' : this.userInfo.cargo);
        
        return `
            <div class="home-container">
                <!-- HEADER COM MENU HAMBURGUER -->
                <div class="header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div class="header-logo">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="header-logo-img">
                        <h1>Minhas Avaliações</h1>
                    </div>
                    <div class="user-info" style="display: flex; align-items: center; gap: 12px;">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span class="perfil-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                        <button class="menu-toggle-btn" id="menuToggleBtn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: white;">☰</button>
                    </div>
                </div>

                <!-- MENU LATERAL (3 PONTINHOS) -->
                <div class="side-menu" id="sideMenu" style="position: fixed; top: 0; right: -280px; width: 280px; height: 100%; background: white; box-shadow: -2px 0 10px rgba(0,0,0,0.1); z-index: 1001; transition: right 0.3s ease; display: flex; flex-direction: column;">
                    <div class="menu-header" style="background: linear-gradient(135deg, #1a237e 0%, #0f1a5c 100%); padding: 24px 20px; display: flex; justify-content: space-between; align-items: center; color: white;">
                        <h3 style="margin: 0;">Menu</h3>
                        <button class="close-menu" id="closeMenu" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 28px; width: 36px; height: 36px; border-radius: 8px; cursor: pointer;">×</button>
                    </div>
                    <nav class="menu-nav" style="flex: 1; padding: 16px 0;">
                        <button class="menu-item" data-module="home" style="display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 500; color: #475569; text-align: left;">
                            <span class="menu-icon">🏠</span>
                            <span>Home</span>
                        </button>
                        <button class="menu-item" data-module="meu_plano_alimentar" style="display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 500; color: #475569; text-align: left;">
                            <span class="menu-icon">🍽️</span>
                            <span>Meu Plano Alimentar</span>
                        </button>
                        <button class="menu-item" data-module="minha_anamnese" style="display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 500; color: #475569; text-align: left;">
                            <span class="menu-icon">📋</span>
                            <span>Minha Anamnese</span>
                        </button>
                        <button class="menu-item" data-module="shopping_nutri" style="display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 500; color: #475569; text-align: left;">
                            <span class="menu-icon">🛍️</span>
                            <span>Shopping Nutri</span>
                        </button>
                        <button class="menu-item" id="minhaJornadaMenuItem" style="display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 500; color: #8b5cf6; text-align: left;">
                            <span class="menu-icon">🌟</span>
                            <span>Minha Jornada</span>
                        </button>
                        ${isMembro ? `
                        <button class="menu-item" id="membroExclusiveMenuItem" style="display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 500; color: #ed8936; text-align: left;">
                            <span class="menu-icon">⭐</span>
                            <span>Conteúdo Exclusivo</span>
                        </button>
                        ` : ''}
                        <div style="height: 1px; background: #e2e8f0; margin: 12px 24px;"></div>
                        <button class="menu-item logout" id="logoutMenuItem" style="display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 24px; background: none; border: none; cursor: pointer; font-size: 15px; font-weight: 500; color: #dc2626; text-align: left;">
                            <span class="menu-icon">🚪</span>
                            <span>Sair</span>
                        </button>
                    </nav>
                </div>
                <div class="menu-overlay" id="menuOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; opacity: 0; visibility: hidden; transition: all 0.3s;"></div>

                <div class="content">
                    <!-- INFORMAÇÕES DO PACIENTE -->
                    <div class="client-info">
                        <h3>📋 Meus Dados</h3>
                        <div class="info-card">
                            <p><strong>Nome:</strong> ${this.userInfo.nome || 'Não informado'}</p>
                            <p><strong>Login:</strong> ${this.userInfo.login || 'Não informado'}</p>
                            <p><strong>Data Nasc.:</strong> ${this.funcoes.formatDateToDisplay(this.userInfo.dataNascimento) || 'Não informado'}</p>
                            <p><strong>Idade:</strong> ${this.funcoes.calcularIdade(this.userInfo.dataNascimento) || 'Não informado'} anos</p>
                            <p><strong>Sexo:</strong> ${this.userInfo.sexo === 'masculino' ? 'Masculino' : (this.userInfo.sexo === 'feminino' ? 'Feminino' : 'Não informado')}</p>
                        </div>
                    </div>
                    
                    <!-- LISTA DE AVALIAÇÕES -->
                    <div id="clientEvaluations" class="client-evaluations">
                        <h3>📊 Histórico de Avaliações Nutricionais</h3>
                        <div id="evaluationsList"></div>
                    </div>
                    
                    <!-- GRÁFICOS (apenas para membros reais, não para admin) -->
                    ${isMembro ? `
                        <div class="charts-section">
                            <h3 style="color: #1a237e; margin-bottom: 20px;">📈 Meus Gráficos de Evolução</h3>
                            <div class="chart-container">
                                <h4>📈 Evolução do Peso</h4>
                                <canvas id="weightChart"></canvas>
                            </div>
                            <div class="chart-container">
                                <h4>📊 Evolução do IMC</h4>
                                <canvas id="imcChart"></canvas>
                            </div>
                            <div class="chart-container">
                                <h4>💪 Evolução da Massa Muscular</h4>
                                <canvas id="muscleChart"></canvas>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getCargoDisplayName(cargo) {
        const nomes = {
            'paciente': 'Paciente',
            'nutricionista': 'Nutricionista',
            'psicologo': 'Psicólogo'
        };
        return nomes[cargo] || cargo;
    }

    getPerfilDisplayName(perfil) {
        const perfis = {
            'operador': 'Operador',
            'operador_membro': 'Membro VIP',
            'supervisor': 'Supervisor',
            'gerente': 'Gerente'
        };
        return perfis[perfil] || perfil || 'Usuário';
    }

    getPerfilBadgeClass(perfil) {
        const classes = {
            'operador': 'perfil-operador',
            'operador_membro': 'perfil-operador-membro',
            'supervisor': 'perfil-supervisor',
            'gerente': 'perfil-gerente'
        };
        return classes[perfil] || '';
    }

    attachEvents() {
        // Menu lateral
        const menuToggle = document.getElementById('menuToggleBtn');
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeMenu = document.getElementById('closeMenu');

        const openMenu = () => {
            if (sideMenu) sideMenu.style.right = '0';
            if (menuOverlay) {
                menuOverlay.style.opacity = '1';
                menuOverlay.style.visibility = 'visible';
            }
            this.isMenuOpen = true;
        };

        const closeMenuFunc = () => {
            if (sideMenu) sideMenu.style.right = '-280px';
            if (menuOverlay) {
                menuOverlay.style.opacity = '0';
                menuOverlay.style.visibility = 'hidden';
            }
            this.isMenuOpen = false;
        };

        if (menuToggle) menuToggle.addEventListener('click', openMenu);
        if (closeMenu) closeMenu.addEventListener('click', closeMenuFunc);
        if (menuOverlay) menuOverlay.addEventListener('click', closeMenuFunc);

        // Botões do menu
        document.querySelectorAll('.menu-item[data-module]').forEach(item => {
            item.addEventListener('click', async (e) => {
                const module = item.getAttribute('data-module');
                closeMenuFunc();
                await this.navegador.navegarPara(module);
            });
        });

        // Botão Minha Jornada do menu
        const minhaJornadaMenuItem = document.getElementById('minhaJornadaMenuItem');
        if (minhaJornadaMenuItem) {
            minhaJornadaMenuItem.addEventListener('click', () => {
                closeMenuFunc();
                this.showMinhaJornada();
            });
        }

        // Botão Conteúdo Exclusivo do menu
        const membroExclusiveMenuItem = document.getElementById('membroExclusiveMenuItem');
        if (membroExclusiveMenuItem) {
            membroExclusiveMenuItem.addEventListener('click', () => {
                closeMenuFunc();
                this.showMembroExclusiveContent();
            });
        }

        // Botão Sair do menu
        const logoutMenuItem = document.getElementById('logoutMenuItem');
        if (logoutMenuItem) {
            logoutMenuItem.addEventListener('click', () => {
                closeMenuFunc();
                this.navegador.navegarPara('logout');
            });
        }

        // Botão Meu Plano Alimentar (antigo, manter para compatibilidade)
        const meuPlanoAlimentarBtn = document.getElementById('meuPlanoAlimentarBtn');
        if (meuPlanoAlimentarBtn) {
            meuPlanoAlimentarBtn.addEventListener('click', () => {
                this.navegador.navegarPara('meu_plano_alimentar');
            });
        }
    }

    showMinhaJornada() {
        const evaluations = this.currentEvaluations;
        
        if (evaluations.length === 0) {
            alert('🌟 Minha Jornada\n\nVocê ainda não possui avaliações registradas.\n\nComece sua jornada agendando uma consulta!');
            return;
        }
        
        const totalAvaliacoes = evaluations.length;
        const primeiraAvaliacao = evaluations[0]?.data_avaliacao;
        const ultimaAvaliacao = evaluations[evaluations.length - 1]?.data_avaliacao;
        
        const primeiroPeso = evaluations[0]?.dados_antropometricos?.peso;
        const ultimoPeso = evaluations[evaluations.length - 1]?.dados_antropometricos?.peso;
        let evolucaoPeso = '';
        if (primeiroPeso && ultimoPeso) {
            const diferenca = ultimoPeso - primeiroPeso;
            evolucaoPeso = diferenca < 0 ? `📉 Perdeu ${Math.abs(diferenca).toFixed(1)} kg` : 
                           (diferenca > 0 ? `📈 Ganhou ${diferenca.toFixed(1)} kg` : '⚖️ Peso estável');
        }
        
        const primeiroImc = evaluations[0]?.dados_antropometricos?.imc;
        const ultimoImc = evaluations[evaluations.length - 1]?.dados_antropometricos?.imc;
        let evolucaoImc = '';
        if (primeiroImc && ultimoImc) {
            const diferenca = ultimoImc - primeiroImc;
            evolucaoImc = diferenca < 0 ? `📉 IMC reduziu ${Math.abs(diferenca).toFixed(1)} pontos` : 
                          (diferenca > 0 ? `📈 IMC aumentou ${diferenca.toFixed(1)} pontos` : '⚖️ IMC estável');
        }
        
        const modalHtml = `
            <div id="jornadaModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 500px;">
                    <span class="close">&times;</span>
                    <h3 style="color: #8b5cf6;">🌟 Minha Jornada de Saúde</h3>
                    <div style="margin-top: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 16px; color: white; margin-bottom: 20px;">
                            <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">📊</div>
                            <p style="text-align: center; margin: 0;"><strong>${totalAvaliacoes}</strong> avaliações realizadas</p>
                        </div>
                        
                        <div style="display: grid; gap: 15px;">
                            <div style="background: #f1f5f9; padding: 15px; border-radius: 12px;">
                                <strong>📅 Período</strong><br>
                                <span style="color: #475569;">${this.formatDate(primeiraAvaliacao)} até ${this.formatDate(ultimaAvaliacao)}</span>
                            </div>
                            
                            ${evolucaoPeso ? `
                            <div style="background: #f1f5f9; padding: 15px; border-radius: 12px;">
                                <strong>⚖️ Evolução do Peso</strong><br>
                                <span style="color: #475569;">${evolucaoPeso}</span>
                                <div style="margin-top: 5px; font-size: 12px; color: #666;">
                                    ${primeiroPeso} kg → ${ultimoPeso} kg
                                </div>
                            </div>
                            ` : ''}
                            
                            ${evolucaoImc ? `
                            <div style="background: #f1f5f9; padding: 15px; border-radius: 12px;">
                                <strong>📊 Evolução do IMC</strong><br>
                                <span style="color: #475569;">${evolucaoImc}</span>
                                <div style="margin-top: 5px; font-size: 12px; color: #666;">
                                    ${primeiroImc} → ${ultimoImc}
                                </div>
                            </div>
                            ` : ''}
                            
                            <div style="background: #f1f5f9; padding: 15px; border-radius: 12px;">
                                <strong>🏆 Próximos Passos</strong><br>
                                <span style="color: #475569;">Continue acompanhando sua saúde! Agende sua próxima avaliação.</span>
                            </div>
                        </div>
                    </div>
                    <button id="closeJornadaModal" class="submit-btn" style="margin-top: 20px;">Fechar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('jornadaModal');
        const closeBtn = modal.querySelector('.close');
        const closeButton = document.getElementById('closeJornadaModal');
        
        const closeModal = () => modal.remove();
        closeBtn.onclick = closeModal;
        closeButton.onclick = closeModal;
        window.onclick = (event) => { if (event.target === modal) closeModal(); };
    }    

    showModuleMessage(module) {
        const messages = {
            'history': '📜 Histórico de Avaliações\n\nAqui você pode visualizar todo o seu histórico de avaliações realizadas pelos profissionais.',
            'results': '📈 Resultados\n\nAqui você pode acompanhar a evolução dos seus resultados ao longo do tempo.',
            'schedule': '📅 Agendamentos\n\nFuncionalidade em desenvolvimento. Em breve você poderá agendar consultas online!',
            'messages': '💬 Mensagens\n\nFuncionalidade em desenvolvimento. Em breve você poderá se comunicar com seus profissionais!'
        };
        
        alert(messages[module] || `🚧 Módulo "${module}" em desenvolvimento!`);
    }

    showMembroExclusiveContent() {
        const modalHtml = `
            <div id="exclusiveModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close">&times;</span>
                    <h3 style="color: #ed8936;">⭐ Conteúdo Exclusivo para Membros</h3>
                    <div style="margin-top: 20px;">
                        <p style="margin-bottom: 15px;">🎯 <strong>Planos Alimentares Exclusivos</strong><br>
                        Acesso a planos alimentares personalizados desenvolvidos por nossos nutricionistas.</p>
                        
                        <p style="margin-bottom: 15px;">🏆 <strong>Desafios Especiais</strong><br>
                        Participe de desafios exclusivos e ganhe prêmios ao atingir suas metas.</p>
                        
                        <p style="margin-bottom: 15px;">💎 <strong>Consultoria Prioritária</strong><br>
                        Atendimento prioritário com nossa equipe de profissionais.</p>
                        
                        <p style="margin-bottom: 15px;">📚 <strong>Materiais Educativos</strong><br>
                        Acesso a e-books, vídeos e guias exclusivos sobre nutrição e bem-estar.</p>
                        
                        <p style="margin-bottom: 15px;">🎁 <strong>Brindes e Descontos</strong><br>
                        Receba brindes exclusivos e descontos em parceiros do programa.</p>
                    </div>
                    <button id="closeExclusiveModal" class="submit-btn" style="margin-top: 20px;">Fechar</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('exclusiveModal');
        const closeBtn = modal.querySelector('.close');
        const closeButton = document.getElementById('closeExclusiveModal');
        
        const closeModal = () => {
            modal.remove();
        };
        
        closeBtn.onclick = closeModal;
        closeButton.onclick = closeModal;
        
        window.onclick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };
    }

    async loadEvaluations() {
        const evaluationsList = document.getElementById('evaluationsList');
        
        if (!evaluationsList) return;
        
        try {
            const evaluations = await this.funcoes.loadEvaluationsByPatient(this.userInfo.login);
            this.currentEvaluations = evaluations;
            
            evaluationsList.innerHTML = '';
            
            if (evaluations.length === 0) {
                evaluationsList.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 16px;">
                        <p style="color: #666;">📭 Nenhuma avaliação encontrada.</p>
                        <p style="color: #999; font-size: 14px; margin-top: 10px;">Suas avaliações aparecerão aqui assim que forem registradas pelos profissionais.</p>
                    </div>
                `;
            } else {
                evaluations.forEach((data) => {
                    const card = document.createElement('div');
                    card.className = 'evaluation-card';
                    
                    const dataAvaliacao = data.data_avaliacao ? this.formatDate(data.data_avaliacao) : 'Data não informada';
                    
                    card.innerHTML = `
                        <div class="evaluation-date">
                            📅 ${dataAvaliacao}
                            <span style="float: right; font-size: 12px; color: #f97316;">por: ${data.profissional || 'Profissional'}</span>
                        </div>
                        <div><strong>👨‍⚕️ Profissional:</strong> ${data.profissional || 'Não informado'} (${data.cargo === 'nutricionista' ? 'Nutricionista' : (data.cargo === 'psicologo' ? 'Psicólogo' : data.cargo)})</div>
                        <div class="evaluation-data">
                            <div><strong>📏 Peso:</strong> ${data.dados_antropometricos?.peso || '-'} kg</div>
                            <div><strong>📐 Altura:</strong> ${data.dados_antropometricos?.altura || '-'} m</div>
                            <div><strong>📊 IMC:</strong> ${data.dados_antropometricos?.imc || '-'} - ${data.dados_antropometricos?.classificacao_imc || '-'}</div>
                            ${data.bioimpedancia?.massa_muscular ? `<div><strong>💪 Massa Muscular:</strong> ${data.bioimpedancia.massa_muscular} kg</div>` : ''}
                            ${data.bioimpedancia?.gordura_corporal ? `<div><strong>🧈 Gordura Corporal:</strong> ${data.bioimpedancia.gordura_corporal}%</div>` : ''}
                            ${data.exames_laboratoriais?.glicemia ? `<div><strong>🩸 Glicemia:</strong> ${data.exames_laboratoriais.glicemia} mg/dL</div>` : ''}
                            ${data.exames_laboratoriais?.colesterol_total ? `<div><strong>🩸 Colesterol:</strong> ${data.exames_laboratoriais.colesterol_total} mg/dL</div>` : ''}
                        </div>
                    `;
                    evaluationsList.appendChild(card);
                });
            }
            
            if (this.userInfo.perfil === 'operador_membro' && evaluations.length > 0) {
                this.renderCharts();
            } else if (this.userInfo.perfil === 'operador_membro' && evaluations.length === 0) {
                this.showEmptyCharts();
            }
            
        } catch (error) {
            console.error("Erro ao carregar avaliações:", error);
            evaluationsList.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 16px;">
                    <p style="color: #dc2626;">❌ Erro ao carregar avaliações.</p>
                    <p style="color: #999; font-size: 14px; margin-top: 10px;">Tente novamente mais tarde.</p>
                </div>
            `;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        if (dateString.includes('/')) return dateString;
        const partes = dateString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dateString;
    }

    showEmptyCharts() {
        const weightCtx = document.getElementById('weightChart')?.getContext('2d');
        const imcCtx = document.getElementById('imcChart')?.getContext('2d');
        const muscleCtx = document.getElementById('muscleChart')?.getContext('2d');
        
        const showEmptyMessage = (ctx) => {
            if (ctx) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#999';
                ctx.textAlign = 'center';
                ctx.fillText('Nenhuma avaliação encontrada', ctx.canvas.width/2, ctx.canvas.height/2);
            }
        };
        
        showEmptyMessage(weightCtx);
        showEmptyMessage(imcCtx);
        showEmptyMessage(muscleCtx);
    }

    renderCharts() {
        if (this.currentEvaluations.length === 0) {
            this.showEmptyCharts();
            return;
        }
        
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.renderCharts(), 500);
            return;
        }
        
        this.createCharts();
    }

    createCharts() {
        const sortedEvaluations = [...this.currentEvaluations].sort((a, b) => 
            new Date(a.data_avaliacao) - new Date(b.data_avaliacao)
        );
        
        const labels = sortedEvaluations.map(e => this.formatDate(e.data_avaliacao));
        const weights = sortedEvaluations.map(e => e.dados_antropometricos?.peso || 0);
        const imcs = sortedEvaluations.map(e => e.dados_antropometricos?.imc || 0);
        const muscles = sortedEvaluations.map(e => e.bioimpedancia?.massa_muscular || 0);
        
        if (this.weightChart) this.weightChart.destroy();
        if (this.imcChart) this.imcChart.destroy();
        if (this.muscleChart) this.muscleChart.destroy();
        
        const weightCtx = document.getElementById('weightChart')?.getContext('2d');
        if (weightCtx) {
            this.weightChart = new Chart(weightCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Peso (kg)',
                        data: weights,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#f97316',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw} kg`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        const imcCtx = document.getElementById('imcChart')?.getContext('2d');
        if (imcCtx) {
            this.imcChart = new Chart(imcCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'IMC',
                        data: imcs,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'IMC'
                            }
                        }
                    }
                }
            });
        }
        
        const muscleCtx = document.getElementById('muscleChart')?.getContext('2d');
        if (muscleCtx) {
            const hasMuscleData = muscles.some(m => m > 0);
            
            if (hasMuscleData) {
                this.muscleChart = new Chart(muscleCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Massa Muscular (kg)',
                            data: muscles,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: ${context.raw} kg`;
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                muscleCtx.clearRect(0, 0, muscleCtx.canvas.width, muscleCtx.canvas.height);
                muscleCtx.font = '14px Arial';
                muscleCtx.fillStyle = '#999';
                muscleCtx.textAlign = 'center';
                muscleCtx.fillText('Dados de massa muscular não disponíveis', muscleCtx.canvas.width/2, muscleCtx.canvas.height/2);
            }
        }
    }
}
