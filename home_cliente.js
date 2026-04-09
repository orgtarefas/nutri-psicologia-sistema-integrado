import { FuncoesCompartilhadas } from './home.js';

export class HomeCliente {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.currentEvaluations = [];
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.loadEvaluations();
    }

    renderHTML() {
        const perfilBadgeClass = this.funcoes.getPerfilBadgeClass(this.userInfo.perfil);
        const perfilDisplayName = this.funcoes.getPerfilDisplayName(this.userInfo.perfil);
        
        return `
            <div class="home-container">
                <div class="header">
                    <div class="header-logo">
                        <img src="imagens/logo.png" alt="TratamentoWeb" class="header-logo-img">
                        <h1>Minhas Avaliações</h1>
                    </div>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ ${this.userInfo.cargo === 'paciente' ? 'Paciente' : this.userInfo.cargo}</span>
                        <span class="perfil-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                        ${this.userInfo.perfil === 'admin' || this.userInfo.cargo === 'desenvolvedor' ? `
                            <select id="adminRoleSelector" class="role-selector">
                                <option value="paciente|operador">👤 Paciente (Operador)</option>
                                <option value="paciente|operador_membro">👤 Paciente (Membro)</option>
                                <option value="nutricionista|supervisor_nutricionista">🍎 Nutricionista (Supervisor)</option>
                                <option value="nutricionista|gerente_nutricionista">🍎 Nutricionista (Gerente)</option>
                                <option value="psicologo|supervisor_psicologo">🧠 Psicólogo</option>
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
                        ${this.userInfo.perfil === 'operador_membro' ? `
                            <button class="nav-btn" id="membroExclusiveBtn" style="background: #ed8936; color: white;">⭐ Conteúdo Exclusivo Membro</button>
                        ` : ''}
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
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.funcoes.logout());
        }

        const adminSelector = document.getElementById('adminRoleSelector');
        if (adminSelector) {
            adminSelector.addEventListener('change', (e) => {
                const [cargo, perfil] = e.target.value.split('|');
                const event = new CustomEvent('adminRoleChange', { 
                    detail: { cargo: cargo, perfil: perfil } 
                });
                window.dispatchEvent(event);
            });
        }

        const membroExclusiveBtn = document.getElementById('membroExclusiveBtn');
        if (membroExclusiveBtn) {
            membroExclusiveBtn.addEventListener('click', () => {
                this.showMembroExclusiveContent();
            });
        }

        document.querySelectorAll('.nav-btn').forEach(btn => {
            const module = btn.getAttribute('data-module');
            if (module) {
                btn.addEventListener('click', () => alert(`🚧 Módulo ${module} em desenvolvimento!`));
            }
        });
    }

    showMembroExclusiveContent() {
        alert('⭐ Conteúdo exclusivo para membros!\n\nAqui você tem acesso a:\n- Planos alimentares exclusivos\n- Desafios especiais\n- Consultoria prioritária');
    }

    async loadEvaluations() {
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
                        ${data.bioimpedancia.massa_muscular ? `<div><strong>Massa Muscular:</strong> ${data.bioimpedancia.massa_muscular} kg</div>` : ''}
                        ${data.bioimpedancia.gordura_corporal ? `<div><strong>Gordura:</strong> ${data.bioimpedancia.gordura_corporal}%</div>` : ''}
                    </div>
                `;
                evaluationsList.appendChild(card);
            });
        }
    }
}
