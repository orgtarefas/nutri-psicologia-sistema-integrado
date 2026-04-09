import { db, collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc } from './0_firebase_api_config.js';

export class HomeManager {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.currentEvaluations = [];
        this.clientsList = [];
        this.weightChart = null;
        this.imcChart = null;
        this.muscleChart = null;
        this.selectedClient = null;
    }

    render() {
        const app = document.getElementById('app');
        
        if (this.userInfo.cargo === 'nutricionista' || this.userInfo.perfil === 'nutricionista') {
            app.innerHTML = this.renderNutricionistaHome();
            this.attachNutricionistaEvents();
            this.loadClientsList();
        } 
        else if (this.userInfo.cargo === 'psicologo' || this.userInfo.perfil === 'psicologo') {
            app.innerHTML = this.renderPsicologoHome();
            this.attachGenericEvents();
        } 
        else if (this.userInfo.tipo === 'admin' || this.userInfo.perfil === 'admin') {
            app.innerHTML = this.renderAdminHome();
            this.attachAdminEvents();
        }
        else if (this.userInfo.tipo === 'clientes' || this.userInfo.perfil === 'cliente') {
            app.innerHTML = this.renderClienteHome();
            this.attachClienteEvents(); // Usar evento específico para cliente
            this.loadClientEvaluations();
        } 
        else {
            app.innerHTML = this.renderGenericHome();
            this.attachGenericEvents();
        }
    }

    renderNutricionistaHome() {
        return `
            <div class="home-container">
                <div class="header">
                    <h1>🍎 Sistema de Avaliação Nutricional</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Nutricionista</span>
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
                    
                    <!-- Modal de Cadastro de Cliente -->
                    <div id="registerModal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <span class="close">&times;</span>
                            <h3>📝 Cadastrar Novo Cliente</h3>
                            <form id="registerClientForm">
                                <div class="form-field">
                                    <label>👤 Nome Completo:</label>
                                    <input type="text" id="regNome" placeholder="Digite o nome completo" required>
                                </div>
                                <div class="form-field">
                                    <label>🔑 Login (será usado para acesso):</label>
                                    <input type="text" id="regLogin" placeholder="Ex: bia.santos" required>
                                </div>
                                <div class="form-field">
                                    <label>🔒 Senha:</label>
                                    <input type="password" id="regSenha" placeholder="Digite a senha" required>
                                </div>
                                <div class="form-field">
                                    <label>📅 Data de Nascimento:</label>
                                    <input type="date" id="regDataNascimento" required>
                                </div>
                                <button type="submit" class="submit-btn">Cadastrar Cliente</button>
                            </form>
                        </div>
                    </div>
                    
                    <div class="evaluation-form">
                        <h3 class="form-title">📊 Nova Avaliação Nutricional</h3>
                        <form id="nutritionalForm">
                            <div class="form-grid">
                                <div class="form-field">
                                    <label>👤 Selecione o Cliente:</label>
                                    <select id="clientSelect" required>
                                        <option value="">-- Selecione um cliente --</option>
                                    </select>
                                </div>
                                <div class="form-field">
                                    <label>📅 Data da Avaliação:</label>
                                    <input type="date" id="evaluationDate" required>
                                </div>
                                <div class="form-field">
                                    <label>📏 Peso (kg):</label>
                                    <input type="number" id="weight" step="0.1" placeholder="Ex: 70.5" required>
                                </div>
                                <div class="form-field">
                                    <label>📐 Altura (m):</label>
                                    <input type="number" id="height" step="0.01" placeholder="Ex: 1.65" required>
                                </div>
                                <div class="form-field">
                                    <label>📊 IMC:</label>
                                    <input type="text" id="imc" readonly>
                                </div>
                                <div class="form-field">
                                    <label>📋 Classificação IMC:</label>
                                    <input type="text" id="imcClassification" readonly>
                                </div>
                                <div class="form-field">
                                    <label>💪 Massa Muscular Ideal (kg):</label>
                                    <input type="text" id="idealMuscleMass" readonly>
                                </div>
                                <div class="form-field">
                                    <label>💪 Massa Muscular (kg):</label>
                                    <input type="number" id="muscleMass" step="0.1" placeholder="Ex: 45.0">
                                </div>
                                <div class="form-field">
                                    <label>🧈 Gordura Corporal Ideal (%):</label>
                                    <input type="text" id="idealBodyFat" readonly>
                                </div>
                                <div class="form-field">
                                    <label>🧈 Gordura Corporal (%):</label>
                                    <input type="number" id="bodyFat" step="0.1" placeholder="Ex: 25.5">
                                </div>
                                <div class="form-field">
                                    <label>💧 Água Corporal Ideal (%):</label>
                                    <input type="text" id="idealBodyWater" readonly>
                                </div>
                                <div class="form-field">
                                    <label>🩸 Glicemia (mg/dL):</label>
                                    <input type="number" id="glucose" placeholder="Ex: 90">
                                </div>
                                <div class="form-field">
                                    <label>🩸 Colesterol Total (mg/dL):</label>
                                    <input type="number" id="cholesterol" placeholder="Ex: 180">
                                </div>
                            </div>
                            <button type="submit" class="submit-btn">Salvar Avaliação</button>
                        </form>
                    </div>
                    
                    <div id="clientInfo" class="client-info" style="display: none;">
                        <h3>📋 Informações do Cliente</h3>
                        <div class="info-card">
                            <p><strong>Nome:</strong> <span id="infoNome"></span></p>
                            <p><strong>Login:</strong> <span id="infoLogin"></span></p>
                            <p><strong>Data de Nascimento:</strong> <span id="infoDataNasc"></span></p>
                            <p><strong>Idade:</strong> <span id="infoIdade"></span> anos</p>
                        </div>
                    </div>
                    
                    <div class="charts-section">
                        <div class="chart-container">
                            <h4 class="chart-title">📈 Evolução do Peso</h4>
                            <canvas id="weightChart"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4 class="chart-title">📊 Evolução do IMC</h4>
                            <canvas id="imcChart"></canvas>
                        </div>
                        <div class="chart-container">
                            <h4 class="chart-title">💪 Evolução da Massa Muscular</h4>
                            <canvas id="muscleChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderClienteHome() {
        return `
            <div class="home-container">
                <div class="header">
                    <h1>📋 Minhas Avaliações</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Cliente</span>
                        <button class="logout-btn" id="logoutBtn">Sair</button>
                    </div>
                </div>
                <div class="content">
                    <div class="nav-buttons">
                        <button class="nav-btn" data-module="history">📜 Histórico</button>
                        <button class="nav-btn" data-module="results">📈 Resultados</button>
                        <button class="nav-btn" data-module="schedule">📅 Agendamentos</button>
                        <button class="nav-btn" data-module="messages">💬 Mensagens</button>
                    </div>
                    <div id="clientEvaluations" class="client-evaluations">
                        <h3>📊 Histórico de Avaliações</h3>
                        <div id="evaluationsList"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPsicologoHome() {
        return `
            <div class="home-container">
                <div class="header">
                    <h1>🧠 Sistema de Avaliação Psicológica</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Psicólogo</span>
                        <button class="logout-btn" id="logoutBtn">Sair</button>
                    </div>
                </div>
                <div class="content">
                    <div class="nav-buttons">
                        <button class="nav-btn" data-module="group">👥 Atendimento em Grupo</button>
                        <button class="nav-btn" data-module="scheduled">📅 Atendimento Agendado</button>
                        <button class="nav-btn" data-module="journey">🌟 Minha Jornada</button>
                        <button class="nav-btn" data-module="challenges">🏆 Desafios</button>
                    </div>
                    <div style="text-align: center; padding: 40px;">
                        <h2>🚧 Em Desenvolvimento</h2>
                        <p>Módulo de avaliação psicológica será implementado em breve!</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderAdminHome() {
        return `
            <div class="home-container">
                <div class="header">
                    <h1>👑 Painel Administrativo</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Administrador</span>
                        <button class="logout-btn" id="logoutBtn">Sair</button>
                    </div>
                </div>
                <div class="content">
                    <div class="nav-buttons">
                        <button class="nav-btn" data-module="users">👥 Gerenciar Usuários</button>
                        <button class="nav-btn" data-module="reports">📊 Relatórios</button>
                        <button class="nav-btn" data-module="config">⚙️ Configurações</button>
                        <button class="nav-btn" data-module="backup">💾 Backup</button>
                    </div>
                    <div style="text-align: center; padding: 40px;">
                        <h2>🚧 Em Desenvolvimento</h2>
                        <p>Painel administrativo será implementado em breve!</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderGenericHome() {
        return `
            <div class="home-container">
                <div class="header">
                    <h1>🏠 Sistema de Avaliação</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <button class="logout-btn" id="logoutBtn">Sair</button>
                    </div>
                </div>
                <div class="content">
                    <div class="nav-buttons">
                        <button class="nav-btn" data-module="group">👥 Atendimento em Grupo</button>
                        <button class="nav-btn" data-module="scheduled">📅 Atendimento Agendado</button>
                        <button class="nav-btn" data-module="journey">🌟 Minha Jornada</button>
                        <button class="nav-btn" data-module="challenges">🏆 Desafios</button>
                    </div>
                    <div style="text-align: center; padding: 40px;">
                        <h2>🚧 Em Desenvolvimento</h2>
                        <p>Sistema em desenvolvimento para seu perfil!</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Método de logout centralizado
    logout() {
        localStorage.removeItem('currentUser');
        window.location.reload();
    }

    attachClienteEvents() {
        // Logout para cliente
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Navegação
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('🚧 Esta funcionalidade está em desenvolvimento!');
            });
        });
    }

    attachGenericEvents() {
        // Logout para outros perfis
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('🚧 Esta funcionalidade está em desenvolvimento!');
            });
        });
    }

    attachAdminEvents() {
        // Logout para admin
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('🚧 Funcionalidade administrativa em desenvolvimento!');
            });
        });
    }

    async loadClientsList() {
        try {
            const clientesRef = doc(db, "logins", "clientes");
            const clientesDoc = await getDoc(clientesRef);
            
            if (clientesDoc.exists()) {
                const data = clientesDoc.data();
                this.clientsList = [];
                
                for (const [login, clientData] of Object.entries(data)) {
                    this.clientsList.push({
                        login: login,
                        nome: clientData.nome,
                        senha: clientData.senha,
                        dataNascimento: clientData.dataNascimento,
                        status_ativo: clientData.status_ativo
                    });
                }
                
                this.populateClientSelect();
            }
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
        }
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
            
            if (this.selectedClient.dataNascimento) {
                const birthDate = new Date(this.selectedClient.dataNascimento);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                document.getElementById('infoIdade').textContent = age;
            } else {
                document.getElementById('infoIdade').textContent = 'Não informado';
            }
        }
    }

    async registerClient() {
        const nome = document.getElementById('regNome').value;
        const login = document.getElementById('regLogin').value;
        const senha = document.getElementById('regSenha').value;
        const dataNascimento = document.getElementById('regDataNascimento').value;
        
        if (!nome || !login || !senha || !dataNascimento) {
            alert('❌ Preencha todos os campos!');
            return;
        }
        
        const existingClient = this.clientsList.find(c => c.login === login);
        if (existingClient) {
            alert('❌ Este login já existe!');
            return;
        }
        
        try {
            const clientesRef = doc(db, "logins", "clientes");
            const clientesDoc = await getDoc(clientesRef);
            
            const newClientData = {
                [login]: {
                    nome: nome,
                    senha: senha,
                    dataNascimento: dataNascimento,
                    status_ativo: true,
                    cargo: "cliente",
                    perfil: "cliente"
                }
            };
            
            if (clientesDoc.exists()) {
                const currentData = clientesDoc.data();
                currentData[login] = newClientData[login];
                await updateDoc(clientesRef, currentData);
            } else {
                await setDoc(clientesRef, newClientData);
            }
            
            alert('✅ Cliente cadastrado com sucesso!');
            
            document.getElementById('regNome').value = '';
            document.getElementById('regLogin').value = '';
            document.getElementById('regSenha').value = '';
            document.getElementById('regDataNascimento').value = '';
            
            document.getElementById('registerModal').style.display = 'none';
            await this.loadClientsList();
            
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            alert('❌ Erro ao cadastrar cliente: ' + error.message);
        }
    }

    calculateNutritionalParameters() {
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);
        const age = parseInt(document.getElementById('infoIdade').textContent) || 30;
        
        if (weight && height && height > 0) {
            const imc = weight / (height * height);
            document.getElementById('imc').value = imc.toFixed(2);
            
            let classification = '';
            if (imc < 18.5) classification = 'Abaixo do peso';
            else if (imc < 25) classification = 'Peso normal';
            else if (imc < 30) classification = 'Sobrepeso';
            else if (imc < 35) classification = 'Obesidade grau I';
            else if (imc < 40) classification = 'Obesidade grau II';
            else classification = 'Obesidade grau III';
            
            document.getElementById('imcClassification').value = classification;
            
            let idealMuscleMass = 0;
            if (imc < 18.5) idealMuscleMass = (height * height) * 9.5;
            else if (imc < 25) idealMuscleMass = (height * height) * 10.5;
            else if (imc < 30) idealMuscleMass = (height * height) * 11.5;
            else idealMuscleMass = (height * height) * 12.5;
            document.getElementById('idealMuscleMass').value = idealMuscleMass.toFixed(1);
            
            let idealBodyFat = 0;
            if (age < 30) idealBodyFat = 21;
            else if (age < 50) idealBodyFat = 23;
            else idealBodyFat = 25;
            
            if (imc > 25) idealBodyFat += 2;
            document.getElementById('idealBodyFat').value = idealBodyFat + '%';
            
            let idealBodyWater = 0;
            if (age < 30) idealBodyWater = 60;
            else if (age < 50) idealBodyWater = 55;
            else idealBodyWater = 50;
            
            if (imc > 25) idealBodyWater -= 5;
            document.getElementById('idealBodyWater').value = idealBodyWater + '%';
        }
    }

    attachNutricionistaEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        const registerBtn = document.getElementById('registerClientBtn');
        const modal = document.getElementById('registerModal');
        const closeBtn = document.querySelector('.close');
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                document.getElementById('regNome').value = '';
                document.getElementById('regLogin').value = '';
                document.getElementById('regSenha').value = '';
                document.getElementById('regDataNascimento').value = '';
                modal.style.display = 'block';
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        const registerForm = document.getElementById('registerClientForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.registerClient();
            });
        }
        
        const navBtns = document.querySelectorAll('.nav-btn:not(#registerClientBtn)');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('🚧 Esta funcionalidade está em desenvolvimento!');
            });
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
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
    }

    async saveNutritionalEvaluation() {
        try {
            if (!this.selectedClient) {
                alert('❌ Selecione um cliente primeiro!');
                return;
            }

            const evaluationData = {
                paciente_login: this.selectedClient.login,
                paciente_nome: this.selectedClient.nome || '',
                profissional: this.userInfo.nome || '',
                profissional_login: this.userInfo.login || '',
                cargo: this.userInfo.cargo || 'nutricionista',
                data_avaliacao: document.getElementById('evaluationDate').value || new Date().toISOString().split('T')[0],
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
                },
                timestamp: new Date().toISOString()
            };

            await addDoc(collection(db, "avaliacao_nutricional"), evaluationData);
            alert('✅ Avaliação salva com sucesso!');
            
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
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('evaluationDate').value = today;
            
            await this.loadEvaluationData();
            
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error);
            alert('❌ Erro ao salvar avaliação: ' + error.message);
        }
    }

    async loadEvaluationData() {
        try {
            if (!this.selectedClient) {
                return;
            }
            
            const querySnapshot = await getDocs(collection(db, "avaliacao_nutricional"));
            this.currentEvaluations = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.paciente_login === this.selectedClient.login) {
                    this.currentEvaluations.push({ id: doc.id, ...data });
                }
            });
            
            this.currentEvaluations.sort((a, b) => {
                return new Date(a.timestamp) - new Date(b.timestamp);
            });
            
            this.renderCharts();
            
        } catch (error) {
            console.error("Erro ao carregar avaliações:", error);
        }
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
                options: {
                    responsive: true,
                    maintainAspectRatio: true
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
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
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
                        borderColor: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }
    }

    async loadClientEvaluations() {
        try {
            const querySnapshot = await getDocs(collection(db, "avaliacao_nutricional"));
            const evaluationsList = document.getElementById('evaluationsList');
            
            if (evaluationsList) {
                evaluationsList.innerHTML = '';
                let hasEvaluations = false;
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.paciente_login === this.userInfo.login) {
                        hasEvaluations = true;
                        const card = document.createElement('div');
                        card.className = 'evaluation-card';
                        card.innerHTML = `
                            <div class="evaluation-date">📅 ${data.data_avaliacao}</div>
                            <div><strong>Profissional:</strong> ${data.profissional} (${data.cargo})</div>
                            <div class="evaluation-data">
                                <div><strong>Peso:</strong> ${data.dados_antropometricos.peso} kg</div>
                                <div><strong>Altura:</strong> ${data.dados_antropometricos.altura} m</div>
                                <div><strong>IMC:</strong> ${data.dados_antropometricos.imc} - ${data.dados_antropometricos.classificacao_imc}</div>
                                ${data.bioimpedancia.massa_muscular ? `<div><strong>Massa Muscular:</strong> ${data.bioimpedancia.massa_muscular} kg (Ideal: ${data.bioimpedancia.massa_muscular_ideal} kg)</div>` : ''}
                                ${data.bioimpedancia.gordura_corporal ? `<div><strong>Gordura:</strong> ${data.bioimpedancia.gordura_corporal}% (Ideal: ${data.bioimpedancia.gordura_corporal_ideal})</div>` : ''}
                                ${data.exames_laboratoriais.glicemia ? `<div><strong>Glicemia:</strong> ${data.exames_laboratoriais.glicemia} mg/dL</div>` : ''}
                            </div>
                        `;
                        evaluationsList.appendChild(card);
                    }
                });
                
                if (!hasEvaluations) {
                    evaluationsList.innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
                }
            }
        } catch (error) {
            console.error("Erro ao carregar avaliações do cliente:", error);
        }
    }
}
