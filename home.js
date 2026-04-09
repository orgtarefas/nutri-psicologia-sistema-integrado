// Importa apenas do arquivo central do Firebase
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
        if (!app) {
            console.error('Elemento app não encontrado!');
            return;
        }
        
        console.log('Renderizando home para cargo:', this.userInfo.cargo);
        
        // Por enquanto, vamos mostrar uma versão simples para teste
        app.innerHTML = `
            <div class="home-container">
                <div class="header">
                    <h1>🍎 Sistema de Avaliação Nutricional</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ ${this.userInfo.cargo}</span>
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
        
        this.attachEvents();
        this.loadEvaluationData();
    }

    attachEvents() {
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

    logout() {
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
}
