import { FuncoesCompartilhadas } from './0_home.js';

export class HomePsicologo {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.pacientesList = [];
        this.currentEvaluations = [];
        this.selectedPaciente = null;
        this.psicologiaChart = null;
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
        const isSupervisor = this.userInfo.perfil === 'supervisor_psicologo' && !this.userInfo.isAdminView;
        const cargoDisplayText = this.userInfo.isAdminView ? 
            `[Admin] Visualizando como ${this.funcoes.getCargoDisplayName(this.userInfo.cargo)}` : 'Psicólogo';
        
        return `
            <div class="home-container">
                <div class="header">
                    <div class="header-logo">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="header-logo-img">
                        <h1>Sistema de Avaliação Psicológica</h1>
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
                        ${isSupervisor ? `
                            <button class="nav-btn" id="superviseTeamBtn" style="background: #9f7aea; color: white;">👥 Supervisionar Equipe</button>
                        ` : ''}
                    </div>
                    
                    <div id="registerModal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <span class="close">&times;</span>
                            <h3>📝 Cadastrar Novo Paciente</h3>
                            <form id="registerPacienteForm">
                                <div class="form-field"><label>👤 Nome Completo:</label><input type="text" id="regNome" required></div>
                                <div class="form-field"><label>⚥ Sexo:</label><select id="regSexo" required><option value="">Selecione</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option></select></div>
                                <div class="form-field"><label>🔑 Login:</label><input type="text" id="regLogin" required><small>⚠️ Login único</small></div>
                                <div class="form-field"><label>📅 Data Nascimento:</label><input type="date" id="regDataNascimento" required></div>
                                <button type="submit" class="submit-btn">Cadastrar</button>
                            </form>
                        </div>
                    </div>
                    
                    <div id="listaPacientesModal" class="modal" style="display: none;">
                        <div class="modal-content" style="max-width: 800px;">
                            <span class="close">&times;</span>
                            <h3>📋 Lista de Pacientes</h3>
                            <div id="listaPacientesContainer"></div>
                        </div>
                    </div>
                    
                    <div class="evaluation-form" style="text-align: left;">
                        <h3>👤 Selecionar Paciente</h3>
                        <select id="pacienteSelect" class="form-field" style="width: 100%; padding: 12px;">
                            <option value="">-- Selecione --</option>
                        </select>
                    </div>
                    
                    <div id="pacienteInfo" class="client-info" style="display: none;">
                        <h3>📋 Dados do Paciente</h3>
                        <div class="info-card">
                            <p><strong>Nome:</strong> <span id="infoNome"></span></p>
                            <p><strong>Login:</strong> <span id="infoLogin"></span></p>
                            <p><strong>Idade:</strong> <span id="infoIdade"></span> anos</p>
                        </div>
                    </div>
                    
                    <div id="avaliacaoForm" class="evaluation-form" style="display: none;">
                        <h3>📝 Nova Avaliação</h3>
                        <form id="psicologiaForm">
                            <div class="form-grid">
                                <div class="form-field"><label>📅 Data:</label><input type="date" id="evaluationDate" required></div>
                                <div class="form-field"><label>😰 Ansiedade (0-10):</label><input type="range" id="ansiedade" min="0" max="10" value="5"><span id="ansiedadeValue">5</span></div>
                                <div class="form-field"><label>😔 Depressão (0-10):</label><input type="range" id="depressao" min="0" max="10" value="5"><span id="depressaoValue">5</span></div>
                                <div class="form-field"><label>😫 Estresse (0-10):</label><input type="range" id="estresse" min="0" max="10" value="5"><span id="estresseValue">5</span></div>
                                <div class="form-field"><label>💤 Sono (0-10):</label><input type="range" id="sono" min="0" max="10" value="5"><span id="sonoValue">5</span></div>
                                <div class="form-field full-width"><label>📝 Observações:</label><textarea id="observacoes" rows="3"></textarea></div>
                            </div>
                            <button type="submit" class="submit-btn">💾 Salvar</button>
                        </form>
                    </div>
                    
                    <div id="avaliacoesList" class="client-evaluations" style="display: none;">
                        <h3>📊 Histórico</h3>
                        <div id="evaluationsList"></div>
                    </div>
                    
                    <div id="graficosSection" class="charts-section" style="display: none;">
                        <div class="chart-container"><canvas id="psicologiaChart"></canvas></div>
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

        const listaBtn = document.getElementById('listaPacientesBtn');
        if (listaBtn) listaBtn.addEventListener('click', () => this.abrirListaPacientes());

        this.funcoes.setupModalEvents('registerModal');
        this.setupListaModalEvents();

        const registerForm = document.getElementById('registerPacienteForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.registerPaciente();
            });
        }

        const superviseBtn = document.getElementById('superviseTeamBtn');
        if (superviseBtn) superviseBtn.addEventListener('click', () => this.superviseTeam());

        document.querySelectorAll('.nav-btn[data-module]').forEach(btn => {
            btn.addEventListener('click', () => alert('🚧 Em desenvolvimento'));
        });

        const select = document.getElementById('pacienteSelect');
        if (select) {
            select.addEventListener('change', async (e) => {
                const login = e.target.value;
                if (login) {
                    this.selectedPaciente = this.pacientesList.find(p => p.login === login);
                    this.displayPacienteInfo();
                    await this.loadEvaluations();
                    document.getElementById('avaliacaoForm').style.display = 'block';
                    document.getElementById('avaliacoesList').style.display = 'block';
                    document.getElementById('graficosSection').style.display = 'block';
                    document.getElementById('evaluationDate').value = new Date().toISOString().split('T')[0];
                } else {
                    this.selectedPaciente = null;
                    document.getElementById('pacienteInfo').style.display = 'none';
                    document.getElementById('avaliacaoForm').style.display = 'none';
                    document.getElementById('avaliacoesList').style.display = 'none';
                    document.getElementById('graficosSection').style.display = 'none';
                }
            });
        }

        ['ansiedade', 'depressao', 'estresse', 'sono'].forEach(id => {
            const slider = document.getElementById(id);
            if (slider) slider.addEventListener('input', (e) => document.getElementById(`${id}Value`).textContent = e.target.value);
        });

        const form = document.getElementById('psicologiaForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!this.selectedPaciente) return alert('Selecione um paciente');
                await this.saveEvaluation();
            });
        }
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
        
        const tabelaHtml = this.funcoes.gerarTabelaPacientes(this.pacientesList);
        container.innerHTML = tabelaHtml;
        
        // Event listeners para códigos (primeiro acesso)
        document.querySelectorAll('.btn-ver-codigo').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await this.visualizarCodigo(btn.getAttribute('data-login'));
            });
        });
        
        document.querySelectorAll('.btn-regerar-codigo').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await this.regenerarCodigo(btn.getAttribute('data-login'));
            });
        });
        
        // Event listeners para reset de senha
        document.querySelectorAll('.btn-reset-senha').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await this.resetarSenhaPaciente(btn.getAttribute('data-login'));
            });
        });
        
        document.querySelectorAll('.btn-ver-token').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await this.visualizarTokenReset(btn.getAttribute('data-login'));
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
   
    async resetarSenhaPaciente(login) {
        if (!confirm(`⚠️ ATENÇÃO!\n\nGerar TOKEN DE RESET DE SENHA para:\n\nPaciente: ${login}\n\nO token será válido por 1 hora.\n\nDeseja continuar?`)) return;
        
        try {
            const result = await this.funcoes.resetarSenhaPaciente(login);
            alert(`🔑 TOKEN DE RESET DE SENHA GERADO!\n\nPaciente: ${result.login}\nToken: ${result.token}\n\n⚠️ Válido por 1 hora\n\nInforme este token ao paciente.`);
            await this.carregarListaPacientes();
        } catch (error) {
            alert(error.message);
        }
    }
    
    async visualizarTokenReset(login) {
        try {
            const result = await this.funcoes.visualizarTokenReset(login);
            alert(`🔑 TOKEN DE RESET DE SENHA\n\nPaciente: ${result.nome}\nLogin: ${result.login}\nToken: ${result.token}\n\n⚠️ Expira em: ${new Date(result.expiracao).toLocaleString('pt-BR')}`);
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
        const select = document.getElementById('pacienteSelect');
        if (select) {
            select.innerHTML = '<option value="">-- Selecione --</option>';
            this.pacientesList.forEach(p => {
                select.appendChild(new Option(`${p.nome} (${p.login})`, p.login));
            });
        }
    }

    displayPacienteInfo() {
        if (!this.selectedPaciente) return;
        document.getElementById('pacienteInfo').style.display = 'block';
        document.getElementById('infoNome').textContent = this.selectedPaciente.nome;
        document.getElementById('infoLogin').textContent = this.selectedPaciente.login;
        document.getElementById('infoIdade').textContent = this.funcoes.calcularIdade(this.selectedPaciente.dataNascimento) || '-';
    }

    async loadEvaluations() {
        if (!this.selectedPaciente) return;
        const all = await this.funcoes.loadEvaluationsByPatient(this.selectedPaciente.login);
        this.currentEvaluations = all.filter(e => e.tipo === 'psicologica');
        this.displayEvaluations();
        this.renderChart();
    }

    displayEvaluations() {
        const container = document.getElementById('evaluationsList');
        if (!container) return;
        if (this.currentEvaluations.length === 0) {
            container.innerHTML = '<p>Nenhuma avaliação</p>';
            return;
        }
        container.innerHTML = this.currentEvaluations.map(e => `
            <div class="evaluation-card">
                <div>📅 ${e.data_avaliacao}</div>
                <div>😰 Ansiedade: ${e.escalas?.ansiedade}/10 | 😔 Depressão: ${e.escalas?.depressao}/10 | 😫 Estresse: ${e.escalas?.estresse}/10 | 💤 Sono: ${e.escalas?.qualidade_sono}/10</div>
                ${e.observacoes ? `<div>📝 ${e.observacoes}</div>` : ''}
            </div>
        `).join('');
    }

    async saveEvaluation() {
        try {
            await this.funcoes.saveNutritionalEvaluation({
                paciente_login: this.selectedPaciente.login,
                paciente_nome: this.selectedPaciente.nome,
                profissional: this.userInfo.nome,
                cargo: 'psicologo',
                tipo: 'psicologica',
                data_avaliacao: document.getElementById('evaluationDate').value,
                escalas: {
                    ansiedade: parseInt(document.getElementById('ansiedade').value),
                    depressao: parseInt(document.getElementById('depressao').value),
                    estresse: parseInt(document.getElementById('estresse').value),
                    qualidade_sono: parseInt(document.getElementById('sono').value)
                },
                observacoes: document.getElementById('observacoes').value
            });
            alert('✅ Avaliação salva!');
            await this.loadEvaluations();
            ['ansiedade', 'depressao', 'estresse', 'sono'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = 5;
                const span = document.getElementById(`${id}Value`);
                if (span) span.textContent = '5';
            });
            document.getElementById('observacoes').value = '';
        } catch(e) { alert('Erro: ' + e.message); }
    }

    renderChart() {
        if (this.currentEvaluations.length === 0) return;
        if (typeof Chart === 'undefined') { setTimeout(() => this.renderChart(), 500); return; }
        const sorted = [...this.currentEvaluations].sort((a,b) => new Date(a.data_avaliacao) - new Date(b.data_avaliacao));
        const labels = sorted.map(e => e.data_avaliacao);
        const data = {
            ansiedade: sorted.map(e => e.escalas?.ansiedade || 0),
            depressao: sorted.map(e => e.escalas?.depressao || 0),
            estresse: sorted.map(e => e.escalas?.estresse || 0),
            sono: sorted.map(e => e.escalas?.qualidade_sono || 0)
        };
        const ctx = document.getElementById('psicologiaChart')?.getContext('2d');
        if (!ctx) return;
        if (this.psicologiaChart) this.psicologiaChart.destroy();
        this.psicologiaChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Ansiedade', data: data.ansiedade, borderColor: '#ef4444', tension: 0.4 },
                    { label: 'Depressão', data: data.depressao, borderColor: '#3b82f6', tension: 0.4 },
                    { label: 'Estresse', data: data.estresse, borderColor: '#f59e0b', tension: 0.4 },
                    { label: 'Sono', data: data.sono, borderColor: '#10b981', tension: 0.4 }
                ]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 10 } } }
        });
    }

    superviseTeam() { alert('👥 Supervisão de Equipe'); }
}
