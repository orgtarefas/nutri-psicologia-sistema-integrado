import { addDoc, collection } from '../0_firebase_api_config.js';
import { FuncoesCompartilhadas } from './home.js';

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
        
        // SÓ mostra botões de supervisor/gerente se NÃO for admin view
        const isGerente = this.userInfo.perfil === 'gerente_nutricionista' && !this.userInfo.isAdminView;
        const isSupervisor = this.userInfo.perfil === 'supervisor_nutricionista' && !this.userInfo.isAdminView;
        
        // Texto do cargo para admin view
        const cargoDisplayText = this.userInfo.isAdminView ? 
            `[Admin] Visualizando como ${this.getCargoDisplayName(this.userInfo.cargo)}` : 
            'Nutricionista';
        
        return `
            <div class="home-container">
                <div class="header">
                    <div class="header-logo">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="header-logo-img">
                        <h1>Sistema de Avaliação Nutricional</h1>
                    </div>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ ${cargoDisplayText}</span>
                        <span class="perfil-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                        <button class="logout-btn" id="logoutBtn">Sair</button>
                    </div>
                </div>
                <div class="content">
                    <div class="nav-buttons">
                        <button class="nav-btn" data-module="group">👥 Atendimento em Grupo</button>
                        <button class="nav-btn" data-module="scheduled">📅 Atendimento Agendado</button>
                        <button class="nav-btn" data-module="journey">🌟 Minha Jornada</button>
                        <button class="nav-btn" data-module="challenges">🏆 Desafios</button>
                        <button class="nav-btn" id="registerPacienteBtn" style="background: #48bb78; color: white;">➕ Cadastrar Paciente</button>
                        ${isSupervisor ? `
                            <button class="nav-btn" id="approveEvaluationsBtn" style="background: #4299e1; color: white;">✓ Aprovar Avaliações</button>
                        ` : ''}
                        ${isGerente ? `
                            <button class="nav-btn" id="manageTeamBtn" style="background: #9f7aea; color: white;">👥 Gerenciar Equipe</button>
                            <button class="nav-btn" id="reportsBtn" style="background: #ed8936; color: white;">📊 Relatórios Gerenciais</button>
                        ` : ''}
                    </div>
                    
                    <!-- MODAL DE CADASTRO DE PACIENTE -->
                    <div id="registerModal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <span class="close">&times;</span>
                            <h3>📝 Cadastrar Novo Paciente</h3>
                            <form id="registerPacienteForm">
                                <div class="form-field">
                                    <label>👤 Nome Completo:</label>
                                    <input type="text" id="regNome" required>
                                </div>
                                <div class="form-field">
                                    <label>⚥ Sexo:</label>
                                    <select id="regSexo" required>
                                        <option value="">Selecione</option>
                                        <option value="feminino">Feminino</option>
                                        <option value="masculino">Masculino</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>🔑 Login (ex: bia.santos):</label>
                                    <input type="text" id="regLogin" placeholder="Ex: bia.santos" required>
                                    <small style="color: #666; font-size: 11px; margin-top: 5px; display: block;">⚠️ Este login será único e não poderá ser alterado</small>
                                </div>
                                <div class="form-field">
                                    <label>📅 Data de Nascimento:</label>
                                    <input type="date" id="regDataNascimento" required>
                                </div>
                                <button type="submit" class="submit-btn">Cadastrar Paciente</button>
                            </form>
                        </div>
                    </div>
                    
                    <!-- FORMULÁRIO DE AVALIAÇÃO NUTRICIONAL -->
                    <div class="evaluation-form">
                        <h3>📊 Nova Avaliação Nutricional</h3>
                        <form id="nutritionalForm">
                            <div class="form-grid">
                                <div class="form-field">
                                    <label>👤 Paciente:</label>
                                    <select id="pacienteSelect" required>
                                        <option value="">-- Selecione um paciente --</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>📅 Data:</label>
                                    <input type="date" id="evaluationDate" required>
                                </div>
                                <div class="form-field">
                                    <label>📏 Peso (kg):</label>
                                    <input type="number" id="weight" step="0.1" required>
                                </div>
                                <div class="form-field">
                                    <label>📐 Altura (m):</label>
                                    <input type="number" id="height" step="0.01" required>
                                </div>
                                <div class="form-field">
                                    <label>📊 IMC:</label>
                                    <input type="text" id="imc" readonly>
                                </div>
                                <div class="form-field">
                                    <label>📋 Classificação:</label>
                                    <input type="text" id="imcClassification" readonly>
                                </div>
                                <div class="form-field">
                                    <label>💪 Massa Muscular Ideal (kg):</label>
                                    <input type="text" id="idealMuscleMass" readonly>
                                </div>
                                <div class="form-field">
                                    <label>💪 Massa Muscular (kg):</label>
                                    <input type="number" id="muscleMass" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>🧈 Gordura Ideal (%):</label>
                                    <input type="text" id="idealBodyFat" readonly>
                                </div>
                                <div class="form-field">
                                    <label>🧈 Gordura (%):</label>
                                    <input type="number" id="bodyFat" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>💧 Água Ideal (%):</label>
                                    <input type="text" id="idealBodyWater" readonly>
                                </div>
                                <div class="form-field">
                                    <label>🩸 Glicemia (mg/dL):</label>
                                    <input type="number" id="glucose">
                                </div>
                                <div class="form-field">
                                    <label>🩸 Colesterol (mg/dL):</label>
                                    <input type="number" id="cholesterol">
                                </div>
                            </div>
                            <button type="submit" class="submit-btn">💾 Salvar Avaliação</button>
                        </form>
                    </div>
                    
                    <!-- INFORMAÇÕES DO PACIENTE -->
                    <div id="pacienteInfo" class="client-info" style="display: none;">
                        <h3>📋 Informações do Paciente</h3>
                        <div class="info-card">
                            <p><strong>Nome:</strong> <span id="infoNome"></span></p>
                            <p><strong>Login:</strong> <span id="infoLogin"></span></p>
                            <p><strong>Data Nasc.:</strong> <span id="infoDataNasc"></span></p>
                            <p><strong>Idade:</strong> <span id="infoIdade"></span> anos</p>
                            <p><strong>Sexo:</strong> <span id="infoSexo"></span></p>
                        </div>
                    </div>
                    
                    <!-- GRÁFICOS -->
                    <div class="charts-section">
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

    attachEvents() {
        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.funcoes.logout());
        }

        // Botão de cadastrar paciente
        const registerBtn = document.getElementById('registerPacienteBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.clearRegisterForm();
                this.funcoes.showModal('registerModal');
            });
        }

        // Configurar eventos do modal
        this.funcoes.setupModalEvents('registerModal');

        // Formulário de cadastro
        const registerForm = document.getElementById('registerPacienteForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.registerPaciente();
            });
        }

        // Botões específicos por perfil
        const approveBtn = document.getElementById('approveEvaluationsBtn');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => this.approveEvaluations());
        }

        const manageTeamBtn = document.getElementById('manageTeamBtn');
        if (manageTeamBtn) {
            manageTeamBtn.addEventListener('click', () => this.manageTeam());
        }

        const reportsBtn = document.getElementById('reportsBtn');
        if (reportsBtn) {
            reportsBtn.addEventListener('click', () => this.showReports());
        }

        // Botões de navegação em desenvolvimento
        document.querySelectorAll('.nav-btn:not(#registerPacienteBtn):not(#approveEvaluationsBtn):not(#manageTeamBtn):not(#reportsBtn)').forEach(btn => {
            const module = btn.getAttribute('data-module');
            if (module) {
                btn.addEventListener('click', () => alert(`🚧 Módulo "${module}" em desenvolvimento!`));
            }
        });

        // Formulário de avaliação nutricional
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

        // Campos de peso e altura para cálculo automático
        const weightInput = document.getElementById('weight');
        const heightInput = document.getElementById('height');
        
        const calculateFields = () => {
            if (this.selectedPaciente) {
                this.calculateNutritionalParameters();
            }
        };
        
        if (weightInput && heightInput) {
            weightInput.addEventListener('input', calculateFields);
            heightInput.addEventListener('input', calculateFields);
        }
        
        // Data padrão para hoje
        const dateInput = document.getElementById('evaluationDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    // ==================== FUNÇÕES ESPECÍFICAS POR PERFIL ====================
    
    approveEvaluations() {
        alert('✓ Funcionalidade de aprovação de avaliações!\n(Apenas supervisores e gerentes)');
    }

    manageTeam() {
        alert('👥 Painel de Gerenciamento de Equipe!\n(Apenas gerentes)');
    }

    showReports() {
        alert('📊 Relatórios Gerenciais!\n(Apenas gerentes)');
    }

    // ==================== FUNÇÕES DE CADASTRO ====================
    
    clearRegisterForm() {
        document.getElementById('regNome').value = '';
        document.getElementById('regLogin').value = '';
        document.getElementById('regDataNascimento').value = '';
        document.getElementById('regSexo').value = '';
    }

    async registerPaciente() {
        const pacienteData = {
            nome: document.getElementById('regNome').value,
            login: document.getElementById('regLogin').value,
            dataNascimento: document.getElementById('regDataNascimento').value,
            sexo: document.getElementById('regSexo').value
        };
        
        try {
            const result = await this.funcoes.registerPaciente(pacienteData);
            
            alert(`${result.message}\n\n📋 Login: ${result.login}\n🔑 Código Temporário: ${result.codigo}\n\n⚠️ Informe este código ao paciente para o primeiro acesso.`);
            
            this.funcoes.closeModal('registerModal');
            await this.loadPacientesList();
            
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    // ==================== FUNÇÕES DE CARREGAMENTO DE DADOS ====================
    
    async loadPacientesList() {
        this.pacientesList = await this.funcoes.loadPacientesList();
        this.populatePacienteSelect();
    }

    populatePacienteSelect() {
        const pacienteSelect = document.getElementById('pacienteSelect');
        if (pacienteSelect) {
            pacienteSelect.innerHTML = '<option value="">-- Selecione um paciente --</option>';
            
            this.pacientesList.forEach(paciente => {
                const option = document.createElement('option');
                option.value = paciente.login;
                option.textContent = `${paciente.nome} (${paciente.login})`;
                pacienteSelect.appendChild(option);
            });
            
            pacienteSelect.addEventListener('change', async (e) => {
                const selectedLogin = e.target.value;
                if (selectedLogin) {
                    this.selectedPaciente = this.pacientesList.find(p => p.login === selectedLogin);
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

    async loadPacientesListWithButtons() {
        this.pacientesList = await this.funcoes.loadPacientesList();
        this.displayPacientesTable();
    }

    displayPacientesTable() {
        const pacienteSelect = document.getElementById('pacienteSelect');
        if (!pacienteSelect) return;
        
        // Verificar se já existe uma tabela
        let tableContainer = document.getElementById('pacientesTableContainer');
        if (!tableContainer) {
            // Criar container para a tabela
            tableContainer = document.createElement('div');
            tableContainer.id = 'pacientesTableContainer';
            tableContainer.style.marginTop = '20px';
            pacienteSelect.parentElement.parentElement.appendChild(tableContainer);
        }
        
        if (this.pacientesList.length === 0) {
            tableContainer.innerHTML = '<p style="color: #666;">Nenhum paciente cadastrado.</p>';
            return;
        }
        
        let html = `
            <h4 style="margin: 20px 0 10px 0; color: #1a237e;">📋 Lista de Pacientes</h4>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden;">
                    <thead>
                        <tr style="background: #1a237e; color: white;">
                            <th style="padding: 12px; text-align: left;">Paciente</th>
                            <th style="padding: 12px; text-align: left;">Login</th>
                            <th style="padding: 12px; text-align: center;">Status</th>
                            <th style="padding: 12px; text-align: center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        for (const paciente of this.pacientesList) {
            const hasPrimeiroAcesso = paciente.hasUltimoLogin;
            const statusBadge = hasPrimeiroAcesso 
                ? '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 20px; font-size: 11px;">✅ Já acessou</span>'
                : '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 20px; font-size: 11px;">⏳ Aguardando 1º acesso</span>';
            
            html += `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px;">${paciente.nome}</td>
                    <td style="padding: 12px;"><code>${paciente.login}</code></td>
                    <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                    <td style="padding: 12px; text-align: center;">
                        ${!hasPrimeiroAcesso ? `
                            <button class="btn-ver-codigo" data-login="${paciente.login}" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 8px; margin-right: 8px; cursor: pointer;">
                                👁️ Ver Código
                            </button>
                            <button class="btn-regerar-codigo" data-login="${paciente.login}" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">
                                🔄 Regenerar
                            </button>
                        ` : `
                            <span style="color: #94a3b8;">Sem ações</span>
                        `}
                    </td>
                </tr>
            `;
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        tableContainer.innerHTML = html;
        
        // Adicionar event listeners
        document.querySelectorAll('.btn-ver-codigo').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const login = btn.getAttribute('data-login');
                await this.visualizarCodigo(login);
            });
        });
        
        document.querySelectorAll('.btn-regerar-codigo').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const login = btn.getAttribute('data-login');
                await this.regenerarCodigo(login);
            });
        });
    }

    async visualizarCodigo(login) {
        try {
            const result = await this.funcoes.visualizarCodigoPaciente(login);
            
            const dataExpiracao = new Date(result.expiracao).toLocaleString('pt-BR');
            
            alert(`🔑 CÓDIGO DE ACESSO\n\nPaciente: ${result.nome}\nLogin: ${result.login}\nCódigo: ${result.codigo}\n\n⚠️ Expira em: ${dataExpiracao}\n\nInforme este código ao paciente para o primeiro acesso.`);
            
        } catch (error) {
            alert(error.message);
        }
    }

    async regenerarCodigo(login) {
        const confirmar = confirm(`⚠️ ATENÇÃO!\n\nVocê está prestes a gerar um NOVO código para este paciente.\n\nO código anterior será invalidado.\n\nDeseja continuar?`);
        
        if (!confirmar) return;
        
        try {
            const result = await this.funcoes.regenerarCodigoPaciente(login);
            
            const dataExpiracao = new Date(result.expiracao).toLocaleString('pt-BR');
            
            alert(`✅ NOVO CÓDIGO GERADO!\n\nPaciente: ${result.nome}\nLogin: ${result.login}\nNovo Código: ${result.codigo}\n\n⚠️ Expira em: ${dataExpiracao}\n\nInforme este NOVO código ao paciente.`);
            
            // Recarregar a lista para atualizar
            await this.loadPacientesList();
            this.displayPacientesTable();
            
        } catch (error) {
            alert(error.message);
        }
    }

    // ==================== FUNÇÕES DE EXIBIÇÃO ====================    

    displayPacienteInfo() {
        if (this.selectedPaciente) {
            document.getElementById('pacienteInfo').style.display = 'block';
            document.getElementById('infoNome').textContent = this.selectedPaciente.nome || 'Não informado';
            document.getElementById('infoLogin').textContent = this.selectedPaciente.login || 'Não informado';
            
            const dataNascimentoExibir = this.funcoes.formatDateToDisplay(this.selectedPaciente.dataNascimento);
            document.getElementById('infoDataNasc').textContent = dataNascimentoExibir || 'Não informado';
            
            document.getElementById('infoSexo').textContent = this.selectedPaciente.sexo || 'Não informado';
            
            const idade = this.funcoes.calculateAge(this.selectedPaciente.dataNascimento);
            document.getElementById('infoIdade').textContent = idade || 'Não informado';
        }
    }

    // ==================== FUNÇÕES DE CÁLCULO NUTRICIONAL ====================
    
    calculateNutritionalParameters() {
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const idade = parseInt(document.getElementById('infoIdade').textContent) || 30;
        const sexo = this.selectedPaciente?.sexo || 'feminino';
        
        const params = this.funcoes.calculateNutritionalParameters(weight, height, idade, sexo);
        
        if (params) {
            document.getElementById('imc').value = params.imc;
            document.getElementById('imcClassification').value = params.classification;
            document.getElementById('idealMuscleMass').value = params.idealMuscleMass;
            document.getElementById('idealBodyFat').value = params.idealBodyFat;
            document.getElementById('idealBodyWater').value = params.idealBodyWater;
        }
    }

    // ==================== FUNÇÕES DE AVALIAÇÃO ====================
    
    async saveNutritionalEvaluation() {
        try {
            const evaluationData = {
                paciente_login: this.selectedPaciente.login,
                paciente_nome: this.selectedPaciente.nome || '',
                profissional: this.userInfo.nome || '',
                profissional_login: this.userInfo.login || '',
                cargo: this.userInfo.cargo || 'nutricionista',
                data_avaliacao: document.getElementById('evaluationDate').value,
                dados_antropometricos: {
                    peso: parseFloat(document.getElementById('weight').value) || 0,
                    altura: parseFloat(document.getElementById('height').value) || 0,
                    imc: parseFloat(document.getElementById('imc').value) || 0,
                    classificacao_imc: document.getElementById('imcClassification').value || ''
                },
                bioimpedancia: {
                    massa_muscular: parseFloat(document.getElementById('muscleMass').value) || null,
                    massa_muscular_ideal: parseFloat(document.getElementById('idealMuscleMass').value) || null,
                    gordura_corporal: parseFloat(document.getElementById('bodyFat').value) || null,
                    gordura_corporal_ideal: document.getElementById('idealBodyFat').value || '',
                    agua_corporal_ideal: document.getElementById('idealBodyWater').value || ''
                },
                exames_laboratoriais: {
                    glicemia: parseFloat(document.getElementById('glucose').value) || null,
                    colesterol_total: parseFloat(document.getElementById('cholesterol').value) || null
                }
            };

            await this.funcoes.saveNutritionalEvaluation(evaluationData);
            
            // Limpar campos do formulário
            document.getElementById('weight').value = '';
            document.getElementById('height').value = '';
            document.getElementById('muscleMass').value = '';
            document.getElementById('bodyFat').value = '';
            document.getElementById('glucose').value = '';
            document.getElementById('cholesterol').value = '';
            document.getElementById('imc').value = '';
            document.getElementById('imcClassification').value = '';
            document.getElementById('idealMuscleMass').value = '';
            document.getElementById('idealBodyFat').value = '';
            document.getElementById('idealBodyWater').value = '';
            
            alert('✅ Avaliação salva com sucesso!');
            
            await this.loadEvaluationData();
            
        } catch (error) {
            alert('❌ Erro ao salvar avaliação: ' + error.message);
        }
    }

    async loadEvaluationData() {
        if (!this.selectedPaciente) return;
        
        this.currentEvaluations = await this.funcoes.loadEvaluationsByPatient(this.selectedPaciente.login);
        this.renderCharts();
    }

    // ==================== FUNÇÕES DE GRÁFICOS ====================
    
    renderCharts() {
        if (this.currentEvaluations.length === 0) {
            if (this.weightChart) this.weightChart.destroy();
            if (this.imcChart) this.imcChart.destroy();
            if (this.muscleChart) this.muscleChart.destroy();
            
            const weightCtx = document.getElementById('weightChart')?.getContext('2d');
            const imcCtx = document.getElementById('imcChart')?.getContext('2d');
            const muscleCtx = document.getElementById('muscleChart')?.getContext('2d');
            
            if (weightCtx) {
                weightCtx.clearRect(0, 0, weightCtx.canvas.width, weightCtx.canvas.height);
                weightCtx.font = '14px Arial';
                weightCtx.fillStyle = '#999';
                weightCtx.textAlign = 'center';
                weightCtx.fillText('Nenhuma avaliação encontrada', weightCtx.canvas.width/2, weightCtx.canvas.height/2);
            }
            if (imcCtx) {
                imcCtx.clearRect(0, 0, imcCtx.canvas.width, imcCtx.canvas.height);
                imcCtx.font = '14px Arial';
                imcCtx.fillStyle = '#999';
                imcCtx.textAlign = 'center';
                imcCtx.fillText('Nenhuma avaliação encontrada', imcCtx.canvas.width/2, imcCtx.canvas.height/2);
            }
            if (muscleCtx) {
                muscleCtx.clearRect(0, 0, muscleCtx.canvas.width, muscleCtx.canvas.height);
                muscleCtx.font = '14px Arial';
                muscleCtx.fillStyle = '#999';
                muscleCtx.textAlign = 'center';
                muscleCtx.fillText('Nenhuma avaliação encontrada', muscleCtx.canvas.width/2, muscleCtx.canvas.height/2);
            }
            return;
        }
        
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.renderCharts(), 500);
            return;
        }
        
        this.createCharts();
    }

    createCharts() {
        const labels = this.currentEvaluations.map(e => e.data_avaliacao);
        const weights = this.currentEvaluations.map(e => e.dados_antropometricos.peso);
        const imcs = this.currentEvaluations.map(e => e.dados_antropometricos.imc);
        const muscles = this.currentEvaluations.map(e => e.bioimpedancia.massa_muscular || 0);
        
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
                    }
                }
            });
        }
        
        const muscleCtx = document.getElementById('muscleChart')?.getContext('2d');
        if (muscleCtx && muscles.some(m => m > 0)) {
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
        } else if (muscleCtx) {
            muscleCtx.clearRect(0, 0, muscleCtx.canvas.width, muscleCtx.canvas.height);
            muscleCtx.font = '14px Arial';
            muscleCtx.fillStyle = '#999';
            muscleCtx.textAlign = 'center';
            muscleCtx.fillText('Dados de massa muscular não disponíveis', muscleCtx.canvas.width/2, muscleCtx.canvas.height/2);
        }
    }
}
