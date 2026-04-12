import { FuncoesCompartilhadas } from './0_home.js';
import { doc, updateDoc, getDoc } from '../0_firebase_api_config.js';

export class HomeNutricionista {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.currentEvaluations = [];
        this.pacientesList = [];
        this.weightChart = null;
        this.imcChart = null;
        this.muscleChart = null;
        this.selectedPaciente = null;
        this.isMenuOpen = false;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.loadPacientesList();
    }

    renderHTML() {
        const perfilBadgeClass = this.funcoes.getPerfilBadgeClass(this.userInfo.perfil);
        const perfilDisplayName = this.funcoes.getPerfilDisplayName(this.userInfo.perfil);
        const isGerente = this.userInfo.perfil === 'gerente_nutricionista' && !this.userInfo.isAdminView;
        
        return `
            <div class="dashboard-container">
                <!-- TOP BAR -->
                <div class="top-bar">
                    <div class="logo-area">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="logo">
                        <h2>Sistema Nutricional</h2>
                    </div>
                    <div class="top-bar-actions">
                        <div class="user-greeting">
                            <span>👋 ${this.userInfo.nome}</span>
                            <span class="role-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                        </div>
                        <button class="menu-toggle" id="menuToggle">
                            <span class="menu-icon">☰</span>
                        </button>
                    </div>
                </div>

                <!-- MENU LATERAL -->
                <div class="side-menu" id="sideMenu">
                    <div class="menu-header">
                        <h3>Menu</h3>
                        <button class="close-menu" id="closeMenu">×</button>
                    </div>
                    <nav class="menu-nav">
                        <button class="menu-item active" data-module="home">
                            <span class="menu-icon">🏠</span>
                            <span>Home</span>
                        </button>
                        <button class="menu-item" data-module="plano_alimentar">
                            <span class="menu-icon">🍽️</span>
                            <span>Plano Alimentar</span>
                        </button>
                        <button class="menu-item" data-module="cadastro_cliente">
                            <span class="menu-icon">👥</span>
                            <span>Clientes</span>
                        </button>
                        <button class="menu-item" data-module="atendimento_grupo">
                            <span class="menu-icon">👥</span>
                            <span>Atendimento em Grupo</span>
                        </button>
                        <button class="menu-item" data-module="gestao_agendamentos">
                            <span class="menu-icon">📅</span>
                            <span>Gestão de Agendamentos</span>
                        </button>
                        <button class="menu-item" data-module="acompanhar_jornadas">
                            <span class="menu-icon">🌟</span>
                            <span>Acompanhar Jornadas</span>
                        </button>
                        <button class="menu-item" data-module="palestras_videos">
                            <span class="menu-icon">🎥</span>
                            <span>Palestras e Vídeos</span>
                        </button>
                        <button class="menu-item" data-module="chat">
                            <span class="menu-icon">💬</span>
                            <span>Chat</span>
                        </button>
                        ${isGerente ? `
                            <button class="menu-item" data-module="gerenciar_equipe">
                                <span class="menu-icon">👥</span>
                                <span>Gerenciar Equipe</span>
                            </button>
                            <button class="menu-item" data-module="relatorios">
                                <span class="menu-icon">📊</span>
                                <span>Relatórios</span>
                            </button>
                        ` : ''}
                        <button class="menu-item logout" id="logoutMenuItem">
                            <span class="menu-icon">🚪</span>
                            <span>Sair</span>
                        </button>
                    </nav>
                </div>

                <!-- OVERLAY -->
                <div class="menu-overlay" id="menuOverlay"></div>

                <!-- CONTEÚDO PRINCIPAL -->
                <div class="main-content">
                    <!-- FORMULÁRIO DE AVALIAÇÃO -->
                    <div class="evaluation-section">
                        <div class="section-header">
                            <h3>📊 Nova Avaliação Nutricional</h3>
                        </div>
                        <form id="nutritionalForm">
                            <div class="form-grid">
                                <div class="form-field">
                                    <label>👤 Paciente</label>
                                    <select id="pacienteSelect" required>
                                        <option value="">-- Selecione um paciente --</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>📅 Data</label>
                                    <input type="date" id="evaluationDate" required>
                                </div>
                                <div class="form-field">
                                    <label>📏 Peso (kg)</label>
                                    <input type="number" id="weight" step="0.1" required>
                                </div>
                                <div class="form-field">
                                    <label>📐 Altura (m)</label>
                                    <input type="number" id="height" step="0.01" required>
                                </div>
                                <div class="form-field">
                                    <label>📊 IMC</label>
                                    <input type="text" id="imc" readonly>
                                </div>
                                <div class="form-field">
                                    <label>📋 Classificação</label>
                                    <input type="text" id="imcClassification" readonly>
                                </div>
                                <div class="form-field">
                                    <label>💪 Massa Muscular (kg)</label>
                                    <input type="number" id="muscleMass" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>🧈 Gordura (%)</label>
                                    <input type="number" id="bodyFat" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>🩸 Glicemia (mg/dL)</label>
                                    <input type="number" id="glucose">
                                </div>
                                <div class="form-field">
                                    <label>🩸 Colesterol (mg/dL)</label>
                                    <input type="number" id="cholesterol">
                                </div>
                            </div>
                            <button type="submit" class="btn-primary">💾 Salvar Avaliação</button>
                        </form>
                    </div>

                    <!-- INFORMAÇÕES DO PACIENTE -->
                    <div id="pacienteInfo" class="info-section" style="display: none;">
                        <div class="section-header">
                            <h3>📋 Informações do Paciente</h3>
                        </div>
                        <div class="info-grid">
                            <div class="info-card">
                                <span class="info-label">Nome</span>
                                <span class="info-value" id="infoNome"></span>
                            </div>
                            <div class="info-card">
                                <span class="info-label">Login</span>
                                <span class="info-value" id="infoLogin"></span>
                            </div>
                            <div class="info-card">
                                <span class="info-label">Data Nasc.</span>
                                <span class="info-value" id="infoDataNasc"></span>
                            </div>
                            <div class="info-card">
                                <span class="info-label">Idade</span>
                                <span class="info-value" id="infoIdade"></span>
                            </div>
                            <div class="info-card">
                                <span class="info-label">Sexo</span>
                                <span class="info-value" id="infoSexo"></span>
                            </div>
                        </div>
                    </div>

                    <!-- GRÁFICOS -->
                    <div class="charts-section">
                        <div class="chart-card">
                            <h4>📈 Evolução do Peso</h4>
                            <canvas id="weightChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h4>📊 Evolução do IMC</h4>
                            <canvas id="imcChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h4>💪 Evolução da Massa Muscular</h4>
                            <canvas id="muscleChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeMenu = document.getElementById('closeMenu');

        const openMenu = () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('open');
            this.isMenuOpen = true;
        };

        const closeMenuFunc = () => {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('open');
            this.isMenuOpen = false;
        };

        if (menuToggle) menuToggle.addEventListener('click', openMenu);
        if (closeMenu) closeMenu.addEventListener('click', closeMenuFunc);
        if (menuOverlay) menuOverlay.addEventListener('click', closeMenuFunc);

        // Logout
        const logoutMenuItem = document.getElementById('logoutMenuItem');
        if (logoutMenuItem) logoutMenuItem.addEventListener('click', () => this.funcoes.logout());

        // Menu items navigation
        document.querySelectorAll('.menu-item[data-module]').forEach(item => {
            item.addEventListener('click', async (e) => {
                const module = item.getAttribute('data-module');
                closeMenuFunc();
                await this.navigateTo(module);
            });
        });

        // Form events
        const form = document.getElementById('nutritionalForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!this.selectedPaciente) {
                    alert('❌ Selecione um paciente primeiro!');
                    return;
                }
                await this.saveNutritionalEvaluation();
            });
        }

        const weightInput = document.getElementById('weight');
        const heightInput = document.getElementById('height');
        const calculateFields = () => { if (this.selectedPaciente) this.calculateNutritionalParameters(); };
        if (weightInput && heightInput) {
            weightInput.addEventListener('input', calculateFields);
            heightInput.addEventListener('input', calculateFields);
        }

        const dateInput = document.getElementById('evaluationDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        const pacienteSelect = document.getElementById('pacienteSelect');
        if (pacienteSelect) {
            pacienteSelect.addEventListener('change', async (e) => {
                const login = e.target.value;
                if (login) {
                    this.selectedPaciente = this.pacientesList.find(p => p.login === login);
                    this.displayPacienteInfo();
                    await this.loadEvaluationData();
                } else {
                    this.selectedPaciente = null;
                    document.getElementById('pacienteInfo').style.display = 'none';
                    this.currentEvaluations = [];
                    this.renderCharts();
                }
            });
        }
    }

    async navigateTo(module) {
        switch(module) {
            case 'home':
                this.render();
                break;
            case 'plano_alimentar':
                const { PlanoAlimentarNutricionista } = await import('./plano_alimentar_nutricionista.js');
                const planoAlimentar = new PlanoAlimentarNutricionista(this.userInfo, this.pacientesList);
                planoAlimentar.render();
                break;
            case 'cadastro_cliente':
                const { CadastroCliente } = await import('./cadastro_cliente.js');
                const cadastroCliente = new CadastroCliente(this.userInfo);
                cadastroCliente.render();
                break;
            case 'atendimento_grupo':
                alert('🚧 Módulo Atendimento em Grupo em desenvolvimento');
                break;
            case 'gestao_agendamentos':
                alert('🚧 Módulo Gestão de Agendamentos em desenvolvimento');
                break;
            case 'acompanhar_jornadas':
                alert('🚧 Módulo Acompanhar Jornadas em desenvolvimento');
                break;
            case 'palestras_videos':
                alert('🚧 Módulo Palestras e Vídeos em desenvolvimento');
                break;
            case 'chat':
                alert('🚧 Módulo Chat em desenvolvimento');
                break;
            case 'gerenciar_equipe':
                alert('👥 Gerenciar Equipe');
                break;
            case 'relatorios':
                alert('📊 Relatórios Gerenciais');
                break;
        }
    }

    async loadPacientesList() {
        this.pacientesList = await this.funcoes.loadPacientesList();
        this.populatePacienteSelect();
    }

    populatePacienteSelect() {
        const select = document.getElementById('pacienteSelect');
        if (!select) return;
        select.innerHTML = '<option value="">-- Selecione um paciente --</option>';
        this.pacientesList.forEach(p => {
            select.appendChild(new Option(`${p.nome} (${p.login})`, p.login));
        });
    }

    displayPacienteInfo() {
        if (!this.selectedPaciente) return;
        document.getElementById('pacienteInfo').style.display = 'block';
        document.getElementById('infoNome').textContent = this.selectedPaciente.nome || 'Não informado';
        document.getElementById('infoLogin').textContent = this.selectedPaciente.login || 'Não informado';
        document.getElementById('infoDataNasc').textContent = this.funcoes.formatDateToDisplay(this.selectedPaciente.dataNascimento) || 'Não informado';
        document.getElementById('infoSexo').textContent = this.selectedPaciente.sexo || 'Não informado';
        document.getElementById('infoIdade').textContent = this.funcoes.calcularIdade(this.selectedPaciente.dataNascimento) || 'Não informado';
    }

    calculateNutritionalParameters() {
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const idade = parseInt(document.getElementById('infoIdade').textContent) || 30;
        const sexo = this.selectedPaciente?.sexo || 'feminino';
        const params = this.funcoes.calculateNutritionalParameters(weight, height, idade, sexo);
        if (params) {
            document.getElementById('imc').value = params.imc;
            document.getElementById('imcClassification').value = params.classification;
        }
    }

    async saveNutritionalEvaluation() {
        try {
            await this.funcoes.saveNutritionalEvaluation({
                paciente_login: this.selectedPaciente.login,
                paciente_nome: this.selectedPaciente.nome || '',
                profissional: this.userInfo.nome || '',
                profissional_login: this.userInfo.login || '',
                cargo: 'nutricionista',
                data_avaliacao: document.getElementById('evaluationDate').value,
                dados_antropometricos: {
                    peso: parseFloat(document.getElementById('weight').value) || 0,
                    altura: parseFloat(document.getElementById('height').value) || 0,
                    imc: parseFloat(document.getElementById('imc').value) || 0,
                    classificacao_imc: document.getElementById('imcClassification').value || ''
                },
                bioimpedancia: {
                    massa_muscular: parseFloat(document.getElementById('muscleMass').value) || null,
                    gordura_corporal: parseFloat(document.getElementById('bodyFat').value) || null
                },
                exames_laboratoriais: {
                    glicemia: parseFloat(document.getElementById('glucose').value) || null,
                    colesterol_total: parseFloat(document.getElementById('cholesterol').value) || null
                }
            });
            alert('✅ Avaliação salva!');
            ['weight', 'height', 'muscleMass', 'bodyFat', 'glucose', 'cholesterol', 'imc', 'imcClassification'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            await this.loadEvaluationData();
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    }

    async loadEvaluationData() {
        if (!this.selectedPaciente) return;
        this.currentEvaluations = await this.funcoes.loadEvaluationsByPatient(this.selectedPaciente.login);
        this.renderCharts();
    }

    renderCharts() {
        if (this.currentEvaluations.length === 0) {
            ['weightChart', 'imcChart', 'muscleChart'].forEach(id => {
                const ctx = document.getElementById(id)?.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    ctx.font = '14px Arial';
                    ctx.fillStyle = '#999';
                    ctx.textAlign = 'center';
                    ctx.fillText('Nenhuma avaliação encontrada', ctx.canvas.width / 2, ctx.canvas.height / 2);
                }
            });
            return;
        }
        if (typeof Chart === 'undefined') { setTimeout(() => this.renderCharts(), 500); return; }
        this.createCharts();
    }

    createCharts() {
        const labels = this.currentEvaluations.map(e => e.data_avaliacao);
        const weights = this.currentEvaluations.map(e => e.dados_antropometricos?.peso || 0);
        const imcs = this.currentEvaluations.map(e => e.dados_antropometricos?.imc || 0);
        const muscles = this.currentEvaluations.map(e => e.bioimpedancia?.massa_muscular || 0);
        
        if (this.weightChart) this.weightChart.destroy();
        if (this.imcChart) this.imcChart.destroy();
        if (this.muscleChart) this.muscleChart.destroy();
        
        const weightCtx = document.getElementById('weightChart')?.getContext('2d');
        if (weightCtx) {
            this.weightChart = new Chart(weightCtx, {
                type: 'line', data: { labels, datasets: [{ label: 'Peso (kg)', data: weights, borderColor: '#f97316', borderWidth: 3, tension: 0.4, fill: true }] }
            });
        }
        const imcCtx = document.getElementById('imcChart')?.getContext('2d');
        if (imcCtx) {
            this.imcChart = new Chart(imcCtx, {
                type: 'line', data: { labels, datasets: [{ label: 'IMC', data: imcs, borderColor: '#3b82f6', borderWidth: 3, tension: 0.4, fill: true }] }
            });
        }
        const muscleCtx = document.getElementById('muscleChart')?.getContext('2d');
        if (muscleCtx && muscles.some(m => m > 0)) {
            this.muscleChart = new Chart(muscleCtx, {
                type: 'line', data: { labels, datasets: [{ label: 'Massa Muscular (kg)', data: muscles, borderColor: '#10b981', borderWidth: 3, tension: 0.4, fill: true }] }
            });
        }
    }
}
