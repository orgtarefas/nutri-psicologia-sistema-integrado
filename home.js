import { db, collection, addDoc, getDocs, query, where, orderBy, limit } from './0_firebase_api_config.js';

export class HomeManager {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.currentEvaluations = [];
        this.weightChart = null;
        this.imcChart = null;
        this.muscleChart = null;
        console.log('HomeManager iniciado para:', userInfo);
    }

    render() {
        const app = document.getElementById('app');
        
        // Verificar se é nutricionista (cargo ou tipo)
        if (this.userInfo.cargo === 'nutricionista' || this.userInfo.perfil === 'nutricionista') {
            app.innerHTML = this.renderNutricionistaHome();
            this.attachNutricionistaEvents();
            this.loadEvaluationData();
        } 
        // Verificar se é psicólogo
        else if (this.userInfo.cargo === 'psicologo' || this.userInfo.perfil === 'psicologo') {
            app.innerHTML = this.renderPsicologoHome();
            this.attachGenericEvents();
        } 
        // Verificar se é admin
        else if (this.userInfo.tipo === 'admin' || this.userInfo.perfil === 'admin') {
            app.innerHTML = this.renderAdminHome();
            this.attachAdminEvents();
        }
        // Verificar se é cliente
        else if (this.userInfo.tipo === 'clientes' || this.userInfo.perfil === 'cliente') {
            app.innerHTML = this.renderClienteHome();
            this.loadClientEvaluations();
        } 
        // Perfil genérico
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
                    </div>
                    
                    <div class="evaluation-form">
                        <h3 class="form-title">📊 Nova Avaliação Nutricional</h3>
                        <form id="nutritionalForm">
                            <div class="form-grid">
                                <div class="form-field">
                                    <label>👤 Nome do Paciente:</label>
                                    <input type="text" id="patientName" required>
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
                                    <label>💪 Massa Muscular (kg):</label>
                                    <input type="number" id="muscleMass" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>🧈 Gordura Corporal (%):</label>
                                    <input type="number" id="bodyFat" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>💧 Água Corporal (%):</label>
                                    <input type="number" id="bodyWater" step="0.1">
                                </div>
                                <div class="form-field">
                                    <label>🩸 Glicemia (mg/dL):</label>
                                    <input type="number" id="glucose">
                                </div>
                                <div class="form-field">
                                    <label>🩸 Colesterol Total (mg/dL):</label>
                                    <input type="number" id="cholesterol">
                                </div>
                                <div class="form-field">
                                    <label>📅 Data da Avaliação:</label>
                                    <input type="date" id="evaluationDate" required>
                                </div>
                            </div>
                            <button type="submit" class="submit-btn">Salvar Avaliação</button>
                        </form>
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
                        <p style="margin-top: 20px; color: #666;">Área reservada para avaliação psicológica</p>
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
                        <p style="margin-top: 20px; color: #666;">Área restrita para administradores</p>
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

    attachNutricionistaEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('🚧 Esta funcionalidade está em desenvolvimento!');
            });
        });

        const form = document.getElementById('nutritionalForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveNutritionalEvaluation();
            });
        }

        const weightInput = document.getElementById('weight');
        const heightInput = document.getElementById('height');
        const imcInput = document.getElementById('imc');
        
        const calculateIMC = () => {
            const weight = parseFloat(weightInput.value);
            const height = parseFloat(heightInput.value);
            if (weight && height && height > 0) {
                const imc = weight / (height * height);
                imcInput.value = imc.toFixed(2);
            }
        };
        
        if (weightInput && heightInput) {
            weightInput.addEventListener('input', calculateIMC);
            heightInput.addEventListener('input', calculateIMC);
        }
    }

    attachAdminEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('🚧 Funcionalidade administrativa em desenvolvimento!');
            });
        });
    }

    attachGenericEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('🚧 Esta funcionalidade está em desenvolvimento!');
            });
        });
    }

    async saveNutritionalEvaluation() {
        try {
            const patientName = document.getElementById('patientName').value;
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseFloat(document.getElementById('height').value);
            const imc = parseFloat(document.getElementById('imc').value);
            const muscleMass = parseFloat(document.getElementById('muscleMass').value);
            const bodyFat = parseFloat(document.getElementById('bodyFat').value);
            const bodyWater = parseFloat(document.getElementById('bodyWater').value);
            const glucose = parseFloat(document.getElementById('glucose').value);
            const cholesterol = parseFloat(document.getElementById('cholesterol').value);
            const evaluationDate = document.getElementById('evaluationDate').value;

            const evaluationData = {
                paciente: patientName,
                profissional: this.userInfo.nome,
                profissional_login: this.userInfo.login,
                cargo: this.userInfo.cargo,
                data_avaliacao: evaluationDate,
                dados_antropometricos: {
                    peso: weight,
                    altura: height,
                    imc: imc
                },
                bioimpedancia: {
                    massa_muscular: muscleMass || null,
                    gordura_corporal: bodyFat || null,
                    agua_corporal: bodyWater || null
                },
                exames_laboratoriais: {
                    glicemia: glucose || null,
                    colesterol_total: cholesterol || null
                },
                timestamp: new Date().toISOString()
            };

            await addDoc(collection(db, "avaliacao_nutricional"), evaluationData);
            alert('✅ Avaliação salva com sucesso!');
            document.getElementById('nutritionalForm').reset();
            this.loadEvaluationData();
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error);
            alert('❌ Erro ao salvar avaliação: ' + error.message);
        }
    }

    async loadEvaluationData() {
        try {
            const q = query(collection(db, "avaliacao_nutricional"), orderBy("timestamp", "desc"), limit(10));
            const querySnapshot = await getDocs(q);
            this.currentEvaluations = [];
            
            querySnapshot.forEach((doc) => {
                this.currentEvaluations.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('Avaliações carregadas:', this.currentEvaluations.length);
            this.renderCharts();
        } catch (error) {
            console.error("Erro ao carregar avaliações:", error);
        }
    }

    async loadClientEvaluations() {
        try {
            // Buscar avaliações do cliente logado
            const q = query(collection(db, "avaliacao_nutricional"), where("paciente", "==", this.userInfo.nome), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const evaluationsList = document.getElementById('evaluationsList');
            
            if (evaluationsList) {
                evaluationsList.innerHTML = '';
                
                if (querySnapshot.empty) {
                    evaluationsList.innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const card = document.createElement('div');
                    card.className = 'evaluation-card';
                    card.innerHTML = `
                        <div class="evaluation-date">📅 ${data.data_avaliacao}</div>
                        <div><strong>Profissional:</strong> ${data.profissional} (${data.cargo})</div>
                        <div class="evaluation-data">
                            <div><strong>Peso:</strong> ${data.dados_antropometricos.peso} kg</div>
                            <div><strong>Altura:</strong> ${data.dados_antropometricos.altura} m</div>
                            <div><strong>IMC:</strong> ${data.dados_antropometricos.imc}</div>
                            ${data.bioimpedancia.massa_muscular ? `<div><strong>Massa Muscular:</strong> ${data.bioimpedancia.massa_muscular} kg</div>` : ''}
                            ${data.bioimpedancia.gordura_corporal ? `<div><strong>Gordura:</strong> ${data.bioimpedancia.gordura_corporal}%</div>` : ''}
                            ${data.exames_laboratoriais.glicemia ? `<div><strong>Glicemia:</strong> ${data.exames_laboratoriais.glicemia} mg/dL</div>` : ''}
                            ${data.exames_laboratoriais.colesterol_total ? `<div><strong>Colesterol:</strong> ${data.exames_laboratoriais.colesterol_total} mg/dL</div>` : ''}
                        </div>
                    `;
                    evaluationsList.appendChild(card);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar avaliações do cliente:", error);
        }
    }

    renderCharts() {
        if (this.currentEvaluations.length === 0) {
            console.log('Sem dados para gráficos');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.log('Aguardando Chart.js...');
            setTimeout(() => this.renderCharts(), 500);
            return;
        }
        
        this.createCharts();
    }

    createCharts() {
        const evaluations = [...this.currentEvaluations].reverse();
        const labels = evaluations.map(e => e.data_avaliacao);
        const weights = evaluations.map(e => e.dados_antropometricos.peso);
        const imcs = evaluations.map(e => e.dados_antropometricos.imc);
        const muscles = evaluations.map(e => e.bioimpedancia.massa_muscular || 0);
        
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
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
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

    logout() {
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
}
