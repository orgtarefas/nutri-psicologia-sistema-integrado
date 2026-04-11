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
        
        const isGerente = this.userInfo.perfil === 'gerente_nutricionista' && !this.userInfo.isAdminView;
        const cargoDisplayText = this.userInfo.isAdminView ? 
            `[Admin] Visualizando como ${this.funcoes.getCargoDisplayName(this.userInfo.cargo)}` : 
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
                        <button class="nav-btn" data-module="journey">🌟 Acompanhar Jornadas</button>
                        <button class="nav-btn" data-module="challenges">🏆 Desafios</button>
                        <button class="nav-btn" id="registerPacienteBtn" style="background: #48bb78; color: white;">➕ Cadastrar Paciente</button>
                        <button class="nav-btn" id="listaPacientesBtn" style="background: #3b82f6; color: white;">📋 Lista de Pacientes</button>
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
                                    <small>⚠️ Este login será único e não poderá ser alterado</small>
                                </div>
                                <div class="form-field">
                                    <label>📅 Data de Nascimento:</label>
                                    <input type="date" id="regDataNascimento" required>
                                </div>
                                <button type="submit" class="submit-btn">Cadastrar Paciente</button>
                            </form>
                        </div>
                    </div>
                    
                    <!-- MODAL DE LISTA DE PACIENTES -->
                    <div id="listaPacientesModal" class="modal" style="display: none;">
                        <div class="modal-content" style="max-width: 800px;">
                            <span class="close">&times;</span>
                            <h3>📋 Lista de Pacientes</h3>
                            <div id="listaPacientesContainer"></div>
                        </div>
                    </div>
                    
                    <!-- FORMULÁRIO DE AVALIAÇÃO -->
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

    attachEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.funcoes.logout());

        const registerBtn = document.getElementById('registerPacienteBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.clearRegisterForm();
                this.funcoes.showModal('registerModal');
            });
        }

        const listaPacientesBtn = document.getElementById('listaPacientesBtn');
        if (listaPacientesBtn) {
            listaPacientesBtn.addEventListener('click', () => this.abrirListaPacientes());
        }

        this.funcoes.setupModalEvents('registerModal');
        this.setupListaModalEvents();

        const registerForm = document.getElementById('registerPacienteForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.registerPaciente();
            });
        }

        const manageTeamBtn = document.getElementById('manageTeamBtn');
        if (manageTeamBtn) manageTeamBtn.addEventListener('click', () => this.manageTeam());

        const reportsBtn = document.getElementById('reportsBtn');
        if (reportsBtn) reportsBtn.addEventListener('click', () => this.showReports());

        document.querySelectorAll('.nav-btn[data-module]').forEach(btn => {
            const module = btn.getAttribute('data-module');
            if (module) btn.addEventListener('click', () => alert(`🚧 Módulo "${module}" em desenvolvimento!`));
        });

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
    }

    setupListaModalEvents() {
        const modal = document.getElementById('listaPacientesModal');
        if (!modal) return;
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) closeBtn.onclick = () => this.funcoes.closeModal('listaPacientesModal');
        window.onclick = (event) => { if (event.target === modal) this.funcoes.closeModal('listaPacientesModal'); };
    }

    async abrirListaPacientes() {
        await this.carregarListaPacientes();
        this.funcoes.showModal('listaPacientesModal');
    }

    async carregarListaPacientes() {
        const container = document.getElementById('listaPacientesContainer');
        if (!container) return;
        
        container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading"></div> Carregando...</div>';
        await this.loadPacientesList();
        
        if (this.pacientesList.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhum paciente cadastrado.</p>';
            return;
        }
        
        let html = `<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #1a237e; color: white;">
            <th style="padding: 12px;">Paciente</th><th style="padding: 12px;">Login</th><th style="padding: 12px;">Status</th><th style="padding: 12px;">Ações</th>
        </tr></thead><tbody>`;
        
        for (const paciente of this.pacientesList) {
            const hasPrimeiroAcesso = paciente.hasUltimoLogin;
            const statusBadge = hasPrimeiroAcesso 
                ? '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 20px;">✅ Já acessou</span>'
                : '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 20px;">⏳ Aguardando 1º acesso</span>';
            
            html += `<tr><td style="padding: 12px;"><strong>${paciente.nome}</strong><br><small>Cadastro: ${paciente.dataHoraCadastro || 'Data não registrada'}</small></td>
                <td style="padding: 12px;"><code>${paciente.login}</code></td>
                <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                <td style="padding: 12px; text-align: center;">${!hasPrimeiroAcesso ? `
                    <button class="btn-ver-codigo-modal" data-login="${paciente.login}" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 8px; margin-right: 8px; cursor: pointer;">👁️ Ver Código</button>
                    <button class="btn-regerar-codigo-modal" data-login="${paciente.login}" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">🔄 Regenerar</button>
                ` : '<span style="color: #94a3b8;">Sem ações</span>'}</td></tr>`;
        }
        
        html += `</tbody></table></div>`;
        container.innerHTML = html;
        
        document.querySelectorAll('.btn-ver-codigo-modal').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await this.visualizarCodigo(btn.getAttribute('data-login'));
            });
        });
        
        document.querySelectorAll('.btn-regerar-codigo-modal').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await this.regenerarCodigo(btn.getAttribute('data-login'));
            });
        });
    }

    async visualizarCodigo(login) {
        try {
            const result = await this.funcoes.visualizarCodigoPaciente(login);
            alert(`🔑 CÓDIGO DE ACESSO\n\nPaciente: ${result.nome}\nLogin: ${result.login}\nCódigo: ${result.codigo}\n\nExpira em: ${new Date(result.expiracao).toLocaleString('pt-BR')}`);
        } catch (error) {
            alert(error.message);
        }
    }

    async regenerarCodigo(login) {
        if (!confirm('⚠️ Gerar NOVO código? O anterior será invalidado.')) return;
        try {
            const result = await this.funcoes.regenerarCodigoPaciente(login);
            alert(`✅ NOVO CÓDIGO GERADO!\n\nPaciente: ${result.nome}\nLogin: ${result.login}\nNovo Código: ${result.codigo}`);
            await this.carregarListaPacientes();
        } catch (error) {
            alert(error.message);
        }
    }

    clearRegisterForm() {
        ['regNome', 'regLogin', 'regDataNascimento', 'regSexo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    async registerPaciente() {
        try {
            const result = await this.funcoes.registerPaciente({
                nome: document.getElementById('regNome').value,
                login: document.getElementById('regLogin').value,
                dataNascimento: document.getElementById('regDataNascimento').value,
                sexo: document.getElementById('regSexo').value
            });
            alert(`${result.message}\n\n📋 Login: ${result.login}\n🔑 Código: ${result.codigo}`);
            this.funcoes.closeModal('registerModal');
            await this.loadPacientesList();
        } catch (error) {
            alert('❌ ' + error.message);
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
        select.addEventListener('change', async (e) => {
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
            document.getElementById('idealMuscleMass').value = params.idealMuscleMass;
            document.getElementById('idealBodyFat').value = params.idealBodyFat;
            document.getElementById('idealBodyWater').value = params.idealBodyWater;
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
            ['weight', 'height', 'muscleMass', 'bodyFat', 'glucose', 'cholesterol', 'imc', 'imcClassification', 'idealMuscleMass', 'idealBodyFat', 'idealBodyWater'].forEach(id => {
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

    manageTeam() { alert('👥 Gerenciar Equipe'); }
    showReports() { alert('📊 Relatórios Gerenciais'); }
}
