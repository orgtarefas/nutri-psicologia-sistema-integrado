import { FuncoesCompartilhadas } from './home.js';

export class HomeNutricionista {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.currentEvaluations = [];
        this.clientsList = [];
        this.weightChart = null;
        this.imcChart = null;
        this.muscleChart = null;
        this.selectedClient = null;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.loadClientsList();
    }

    renderHTML() {
        return `
            <div class="home-container">
                <div class="header">
                    <h1>🍎 Sistema de Avaliação Nutricional</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Nutricionista</span>
                        ${this.userInfo.perfil === 'admin' ? `
                            <select id="adminRoleSelector" class="role-selector">
                                <option value="nutricionista">🍎 Nutricionista</option>
                                <option value="cliente">👤 Cliente</option>
                                <option value="psicologo">🧠 Psicólogo</option>
                            </select>
                        ` : ''}
                        <button class="logout-btn" id="logoutBtn">Sair</button>
                    </div>
                </div>
                <div class="content">
                    <div class="nav-buttons">
                        <button class="nav-btn" data-module="group">👥 Atendimento em Grupo</button>
                        <button class="nav-btn" data-module="scheduled">📅 Atendimento Agendado</button>
                        <button class="nav-btn" data-module="journey">🌟 Minha Jornada</button>
                        <button class="nav-btn" data-module="challenges">🏆 Desafios</button>
                        <button class="nav-btn" id="registerClientBtn" style="background: #48bb78; color: white;">➕ Cadastrar Cliente</button>
                    </div>
                    
                    <div id="registerModal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <span class="close">&times;</span>
                            <h3>📝 Cadastrar Novo Cliente</h3>
                            <form id="registerClientForm">
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
                                    <label>🔑 Login:</label>
                                    <input type="text" id="regLogin" placeholder="Ex: bia.santos" required>
                                </div>
                                <div class="form-field">
                                    <label>🔒 Senha:</label>
                                    <input type="password" id="regSenha" required>
                                </div>
                                <div class="form-field">
                                    <label>📅 Data de Nascimento:</label>
                                    <input type="date" id="regDataNascimento" required>
                                </div>
                                <button type="submit" class="submit-btn">Cadastrar</button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="evaluation-form">
                        <h3>📊 Nova Avaliação Nutricional</h3>
                        <form id="nutritionalForm">
                            <div class="form-grid">
                                <div class="form-field">
                                    <label>👤 Cliente:</label>
                                    <select id="clientSelect" required>
                                        <option value="">-- Selecione --</option>
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
                                    <label>💪 Massa Muscular Ideal:</label>
                                    <input type="text" id="idealMuscleMass" readonly>
                                </div>
                                <div class="form-field">
                                    <label>💪 Massa Muscular (kg):</label>
                                    <input type="number" id="muscleMass" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>🧈 Gordura Ideal:</label>
                                    <input type="text" id="idealBodyFat" readonly>
                                </div>
                                <div class="form-field">
                                    <label>🧈 Gordura (%):</label>
                                    <input type="number" id="bodyFat" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>💧 Água Ideal:</label>
                                    <input type="text" id="idealBodyWater" readonly>
                                </div>
                                <div class="form-field">
                                    <label>🩸 Glicemia:</label>
                                    <input type="number" id="glucose">
                                </div>
                                <div class="form-field">
                                    <label>🩸 Colesterol:</label>
                                    <input type="number" id="cholesterol">
                                </div>
                            </div>
                            <button type="submit" class="submit-btn">Salvar</button>
                        </form>
                    </div>
                    
                    <div id="clientInfo" class="client-info" style="display: none;">
                        <h3>📋 Informações do Cliente</h3>
                        <div class="info-card">
                            <p><strong>Nome:</strong> <span id="infoNome"></span></p>
                            <p><strong>Login:</strong> <span id="infoLogin"></span></p>
                            <p><strong>Data Nasc.:</strong> <span id="infoDataNasc"></span></p>
                            <p><strong>Idade:</strong> <span id="infoIdade"></span> anos</p>
                            <p><strong>Sexo:</strong> <span id="infoSexo"></span></p>
                        </div>
                    </div>
                    
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
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.funcoes.logout());
        }

        const adminSelector = document.getElementById('adminRoleSelector');
        if (adminSelector) {
            adminSelector.addEventListener('change', (e) => {
                const event = new CustomEvent('adminRoleChange', { 
                    detail: { role: e.target.value } 
                });
                window.dispatchEvent(event);
            });
        }

        const registerBtn = document.getElementById('registerClientBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.clearRegisterForm();
                this.funcoes.showModal('registerModal');
            });
        }

        this.funcoes.setupModalEvents('registerModal');

        const registerForm = document.getElementById('registerClientForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.registerClient();
            });
        }

        document.querySelectorAll('.nav-btn:not(#registerClientBtn)').forEach(btn => {
            btn.addEventListener('click', () => alert('🚧 Em desenvolvimento!'));
        });

        const form = document.getElementById('nutritionalForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!this.selectedClient) {
                    alert('❌ Selecione um cliente primeiro!');
                    return;
                }
                await this.saveNutritionalEvaluation();
            });
        }

        const weightInput = document.getElementById('weight');
        const heightInput = document.getElementById('height');
        
        const calculateFields = () => {
            if (this.selectedClient) {
                this.calculateNutritionalParameters();
            }
        };
        
        if (weightInput && heightInput) {
            weightInput.addEventListener('input', calculateFields);
            heightInput.addEventListener('input', calculateFields);
        }
        
        const dateInput = document.getElementById('evaluationDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    clearRegisterForm() {
        document.getElementById('regNome').value = '';
        document.getElementById('regLogin').value = '';
        document.getElementById('regSenha').value = '';
        document.getElementById('regDataNascimento').value = '';
        document.getElementById('regSexo').value = '';
    }

    async registerClient() {
        const clientData = {
            nome: document.getElementById('regNome').value,
            login: document.getElementById('regLogin').value,
            senha: document.getElementById('regSenha').value,
            dataNascimento: document.getElementById('regDataNascimento').value,
            sexo: document.getElementById('regSexo').value
        };
        
        try {
            const result = await this.funcoes.registerClient(clientData);
            alert(result.message);
            this.funcoes.closeModal('registerModal');
            await this.loadClientsList();
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    async loadClientsList() {
        this.clientsList = await this.funcoes.loadClientsList();
        this.populateClientSelect();
    }

    populateClientSelect() {
        const clientSelect = document.getElementById('clientSelect');
        if (clientSelect) {
            clientSelect.innerHTML = '<option value="">-- Selecione um cliente --</option>';
            
            this.clientsList.forEach(client => {
                const option = document.createElement('option');
                option.value = client.login;
                option.textContent = `${client.nome} (${client.login})`;
                clientSelect.appendChild(option);
            });
            
            clientSelect.addEventListener('change', async (e) => {
                const selectedLogin = e.target.value;
                if (selectedLogin) {
                    this.selectedClient = this.clientsList.find(c => c.login === selectedLogin);
                    this.displayClientInfo();
                    await this.loadEvaluationData();
                } else {
                    this.selectedClient = null;
                    document.getElementById('clientInfo').style.display = 'none';
                    this.currentEvaluations = [];
                    this.renderCharts();
                }
            });
        }
    }

    displayClientInfo() {
        if (this.selectedClient) {
            document.getElementById('clientInfo').style.display = 'block';
            document.getElementById('infoNome').textContent = this.selectedClient.nome || 'Não informado';
            document.getElementById('infoLogin').textContent = this.selectedClient.login || 'Não informado';
            document.getElementById('infoDataNasc').textContent = this.selectedClient.dataNascimento || 'Não informado';
            document.getElementById('infoSexo').textContent = this.selectedClient.sexo || 'Não informado';
            
            const idade = this.funcoes.calculateAge(this.selectedClient.dataNascimento);
            document.getElementById('infoIdade').textContent = idade || 'Não informado';
        }
    }

    calculateNutritionalParameters() {
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const idade = parseInt(document.getElementById('infoIdade').textContent) || 30;
        const sexo = this.selectedClient?.sexo || 'feminino';
        
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
            const evaluationData = {
                paciente_login: this.selectedClient.login,
                paciente_nome: this.selectedClient.nome || '',
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

            const result = await this.funcoes.saveNutritionalEvaluation(evaluationData);
            alert(result.message);
            
            document.getElementById('weight').value = '';
            document.getElementById('height').value = '';
            document.getElementById('muscleMass').value = '';
            document.getElementById('bodyFat').value = '';
            document.getElementById('glucose').value = '';
            document.getElementById('cholesterol').value = '';
            
            await this.loadEvaluationData();
            
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    async loadEvaluationData() {
        if (!this.selectedClient) return;
        
        this.currentEvaluations = await this.funcoes.loadEvaluationsByPatient(this.selectedClient.login);
        this.renderCharts();
    }

    renderCharts() {
        if (this.currentEvaluations.length === 0) {
            if (this.weightChart) this.weightChart.destroy();
            if (this.imcChart) this.imcChart.destroy();
            if (this.muscleChart) this.muscleChart.destroy();
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
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true }
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
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true }
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
                        borderColor: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: { responsive: true, maintainAspectRatio: true }
            });
        }
    }
}
