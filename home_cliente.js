import { FuncoesCompartilhadas } from './home_funcoescompartilhadas.js';

export class HomeCliente {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.loadClientEvaluations();
    }

    renderHTML() {
        return `
            <div class="home-container">
                <div class="header">
                    <h1>📋 Minhas Avaliações</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Cliente</span>
                        ${this.userInfo.perfil === 'admin' ? `
                            <select id="adminRoleSelector" class="role-selector">
                                <option value="cliente">👤 Cliente</option>
                                <option value="nutricionista">🍎 Nutricionista</option>
                                <option value="psicologo">🧠 Psicólogo</option>
                            </select>
                        ` : ''}
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

    attachEvents() {
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.funcoes.logout());
        }

        // Admin role selector
        const adminSelector = document.getElementById('adminRoleSelector');
        if (adminSelector) {
            adminSelector.addEventListener('change', (e) => {
                this.funcoes.switchAdminRole(e.target.value, this.userInfo);
            });
        }

        // Navegação
        this.funcoes.setupNavButtons();
    }

    async loadClientEvaluations() {
        const evaluations = await this.funcoes.loadEvaluationsByPatient(this.userInfo.login);
        const evaluationsList = document.getElementById('evaluationsList');
        
        if (evaluationsList) {
            evaluationsList.innerHTML = '';
            
            if (evaluations.length === 0) {
                evaluationsList.innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
                return;
            }
            
            evaluations.forEach((data) => {
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
            });
        }
    }
}
