import { FuncoesCompartilhadas } from './home.js';

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
        
        // SÓ mostra botões de supervisor se NÃO for admin view
        const isSupervisor = this.userInfo.perfil === 'supervisor_psicologo' && !this.userInfo.isAdminView;
        
        // Texto do cargo para admin view
        const cargoDisplayText = this.userInfo.isAdminView ? 
            `[Admin] Visualizando como ${this.getCargoDisplayName(this.userInfo.cargo)}` : 
            'Psicólogo';
        
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
                        <button class="nav-btn" data-module="journey">🌟 Minha Jornada</button>
                        <button class="nav-btn" data-module="challenges">🏆 Desafios</button>
                        <button class="nav-btn" id="registerPacienteBtn" style="background: #48bb78; color: white;">➕ Cadastrar Paciente</button>
                        ${isSupervisor ? `
                            <button class="nav-btn" id="approveEvaluationsBtn" style="background: #4299e1; color: white;">✓ Aprovar Avaliações</button>
                            <button class="nav-btn" id="superviseTeamBtn" style="background: #9f7aea; color: white;">👥 Supervisionar Equipe</button>
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
                                    <label>🔒 Senha:</label>
                                    <input type="password" id="regSenha" required>
                                    <small style="color: #666; font-size: 11px; margin-top: 5px; display: block;">⚠️ Mínimo 6 caracteres</small>
                                </div>
                                <div class="form-field">
                                    <label>📅 Data de Nascimento:</label>
                                    <input type="date" id="regDataNascimento" required>
                                </div>
                                <button type="submit" class="submit-btn">Cadastrar Paciente</button>
                            </form>
                        </div>
                    </div>
                    
                    <!-- SEÇÃO PRINCIPAL -->
                    <div style="text-align: center; padding: 40px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 40px; color: white; margin-bottom: 30px;">
                            <div style="font-size: 64px; margin-bottom: 20px;">🧠</div>
                            <h2 style="margin-bottom: 15px;">Módulo de Psicologia em Desenvolvimento</h2>
                            <p style="font-size: 18px; opacity: 0.9;">Estamos trabalhando para trazer as melhores ferramentas para avaliação psicológica</p>
                        </div>
                        
                        <!-- SELETOR DE PACIENTE -->
                        <div class="evaluation-form" style="text-align: left;">
                            <h3>👤 Selecionar Paciente</h3>
                            <div class="form-field">
                                <label>Paciente:</label>
                                <select id="pacienteSelect" class="paciente-select">
                                    <option value="">-- Selecione um paciente --</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- INFORMAÇÕES DO PACIENTE -->
                        <div id="pacienteInfo" class="client-info" style="display: none; text-align: left;">
                            <h3>📋 Informações do Paciente</h3>
                            <div class="info-card">
                                <p><strong>Nome:</strong> <span id="infoNome"></span></p>
                                <p><strong>Login:</strong> <span id="infoLogin"></span></p>
                                <p><strong>Data Nasc.:</strong> <span id="infoDataNasc"></span></p>
                                <p><strong>Idade:</strong> <span id="infoIdade"></span> anos</p>
                                <p><strong>Sexo:</strong> <span id="infoSexo"></span></p>
                            </div>
                        </div>
                        
                        <!-- FORMULÁRIO DE AVALIAÇÃO PSICOLÓGICA -->
                        <div id="avaliacaoForm" class="evaluation-form" style="display: none; text-align: left;">
                            <h3>📝 Nova Avaliação Psicológica</h3>
                            <form id="psicologiaForm">
                                <div class="form-grid">
                                    <div class="form-field">
                                        <label>📅 Data da Avaliação:</label>
                                        <input type="date" id="evaluationDate" required>
                                    </div>
                                    <div class="form-field">
                                        <label>📊 Escala de Ansiedade (0-10):</label>
                                        <input type="range" id="ansiedade" min="0" max="10" step="1" value="5">
                                        <span id="ansiedadeValue" style="display: inline-block; margin-left: 10px;">5</span>
                                    </div>
                                    <div class="form-field">
                                        <label>📊 Escala de Depressão (0-10):</label>
                                        <input type="range" id="depressao" min="0" max="10" step="1" value="5">
                                        <span id="depressaoValue" style="display: inline-block; margin-left: 10px;">5</span>
                                    </div>
                                    <div class="form-field">
                                        <label>📊 Escala de Estresse (0-10):</label>
                                        <input type="range" id="estresse" min="0" max="10" step="1" value="5">
                                        <span id="estresseValue" style="display: inline-block; margin-left: 10px;">5</span>
                                    </div>
                                    <div class="form-field">
                                        <label>💤 Qualidade do Sono (0-10):</label>
                                        <input type="range" id="sono" min="0" max="10" step="1" value="5">
                                        <span id="sonoValue" style="display: inline-block; margin-left: 10px;">5</span>
                                    </div>
                                    <div class="form-field">
                                        <label>🍽️ Hábitos Alimentares:</label>
                                        <select id="habitosAlimentares">
                                            <option value="">Selecione</option>
                                            <option value="regular">Regular</option>
                                            <option value="bom">Bom</option>
                                            <option value="muito_bom">Muito Bom</option>
                                            <option value="precisa_melhorar">Precisa Melhorar</option>
                                        </select>
                                    </div>
                                    <div class="form-field">
                                        <label>🏃‍♂️ Prática de Exercícios:</label>
                                        <select id="praticaExercicios">
                                            <option value="">Selecione</option>
                                            <option value="sim">Sim</option>
                                            <option value="nao">Não</option>
                                            <option value="as_vezes">Às vezes</option>
                                        </select>
                                    </div>
                                    <div class="form-field full-width">
                                        <label>📝 Observações / Anotações:</label>
                                        <textarea id="observacoes" rows="4" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 10px; font-family: inherit;"></textarea>
                                    </div>
                                </div>
                                <button type="submit" class="submit-btn">💾 Salvar Avaliação Psicológica</button>
                            </form>
                        </div>
                        
                        <!-- LISTA DE AVALIAÇÕES -->
                        <div id="avaliacoesList" class="client-evaluations" style="display: none; text-align: left;">
                            <h3>📊 Histórico de Avaliações Psicológicas</h3>
                            <div id="evaluationsList"></div>
                        </div>
                        
                        <!-- GRÁFICOS -->
                        <div id="graficosSection" class="charts-section" style="display: none;">
                            <h3 style="color: #1a237e; margin-bottom: 20px;">📈 Evolução do Paciente</h3>
                            <div class="chart-container">
                                <h4>📊 Evolução dos Indicadores</h4>
                                <canvas id="psicologiaChart"></canvas>
                            </div>
                        </div>
                        
                        <!-- ÁREA DO SUPERVISOR -->
                        ${isSupervisor ? `
                            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white; text-align: left;">
                                <h3 style="color: white; margin-bottom: 15px;">🔒 Área do Supervisor</h3>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px;">
                                        <strong>✓ Aprovação de Avaliações</strong>
                                        <p style="font-size: 12px; margin-top: 5px;">Revise e aprove avaliações realizadas pela equipe</p>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px;">
                                        <strong>📊 Relatórios da Equipe</strong>
                                        <p style="font-size: 12px; margin-top: 5px;">Acesse relatórios consolidados da equipe</p>
                                    </div>
                                    <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px;">
                                        <strong>👥 Supervisão</strong>
                                        <p style="font-size: 12px; margin-top: 5px;">Acompanhe o desempenho da equipe</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
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

        // Botões específicos para supervisor
        const approveBtn = document.getElementById('approveEvaluationsBtn');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => this.approveEvaluations());
        }

        const superviseTeamBtn = document.getElementById('superviseTeamBtn');
        if (superviseTeamBtn) {
            superviseTeamBtn.addEventListener('click', () => this.superviseTeam());
        }

        // Botões de navegação
        document.querySelectorAll('.nav-btn:not(#registerPacienteBtn):not(#approveEvaluationsBtn):not(#superviseTeamBtn)').forEach(btn => {
            const module = btn.getAttribute('data-module');
            if (module) {
                btn.addEventListener('click', () => this.showModuleMessage(module));
            }
        });

        // Seletor de paciente
        const pacienteSelect = document.getElementById('pacienteSelect');
        if (pacienteSelect) {
            pacienteSelect.addEventListener('change', async (e) => {
                const selectedLogin = e.target.value;
                if (selectedLogin) {
                    this.selectedPaciente = this.pacientesList.find(p => p.login === selectedLogin);
                    this.displayPacienteInfo();
                    await this.loadPsychologicalEvaluations();
                    
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

        // Sliders com valores
        const sliders = ['ansiedade', 'depressao', 'estresse', 'sono'];
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(`${sliderId}Value`);
            if (slider && valueSpan) {
                slider.addEventListener('input', (e) => {
                    valueSpan.textContent = e.target.value;
                });
            }
        });

        // Formulário de avaliação psicológica
        const psicologiaForm = document.getElementById('psicologiaForm');
        if (psicologiaForm) {
            psicologiaForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!this.selectedPaciente) {
                    alert('❌ Selecione um paciente primeiro!');
                    return;
                }
                await this.savePsychologicalEvaluation();
            });
        }
    }

    showModuleMessage(module) {
        const messages = {
            'group': '👥 Atendimento em Grupo\n\nFuncionalidade em desenvolvimento. Em breve você poderá realizar atendimentos em grupo!',
            'scheduled': '📅 Atendimento Agendado\n\nFuncionalidade em desenvolvimento. Em breve você poderá gerenciar seus agendamentos!',
            'journey': '🌟 Minha Jornada\n\nFuncionalidade em desenvolvimento. Acompanhe sua jornada profissional!',
            'challenges': '🏆 Desafios\n\nFuncionalidade em desenvolvimento. Participe de desafios com seus pacientes!'
        };
        
        alert(messages[module] || `🚧 Módulo "${module}" em desenvolvimento!`);
    }

    approveEvaluations() {
        alert('✓ Funcionalidade de aprovação de avaliações!\n\nAqui você pode revisar e aprovar avaliações realizadas pela equipe.');
    }

    superviseTeam() {
        alert('👥 Supervisão de Equipe!\n\nAqui você pode acompanhar o desempenho da equipe e fornecer feedbacks.');
    }

    // ==================== FUNÇÕES DE CADASTRO ====================
    
    clearRegisterForm() {
        document.getElementById('regNome').value = '';
        document.getElementById('regLogin').value = '';
        document.getElementById('regSenha').value = '';
        document.getElementById('regDataNascimento').value = '';
        document.getElementById('regSexo').value = '';
    }

    async registerPaciente() {
        const pacienteData = {
            nome: document.getElementById('regNome').value,
            login: document.getElementById('regLogin').value,
            senha: document.getElementById('regSenha').value,
            dataNascimento: document.getElementById('regDataNascimento').value,
            sexo: document.getElementById('regSexo').value
        };
        
        try {
            const result = await this.funcoes.registerPaciente(pacienteData);
            alert(result.message);
            this.funcoes.closeModal('registerModal');
            await this.loadPacientesList();
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }

    // ==================== FUNÇÕES DE CARREGAMENTO ====================
    
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
        }
    }

    displayPacienteInfo() {
        if (this.selectedPaciente) {
            document.getElementById('pacienteInfo').style.display = 'block';
            document.getElementById('infoNome').textContent = this.selectedPaciente.nome || 'Não informado';
            document.getElementById('infoLogin').textContent = this.selectedPaciente.login || 'Não informado';
            
            const dataNascimentoExibir = this.funcoes.formatDateToDisplay(this.selectedPaciente.dataNascimento);
            document.getElementById('infoDataNasc').textContent = dataNascimentoExibir || 'Não informado';
            
            document.getElementById('infoSexo').textContent = this.selectedPaciente.sexo === 'masculino' ? 'Masculino' : 'Feminino';
            
            const idade = this.funcoes.calculateAge(this.selectedPaciente.dataNascimento);
            document.getElementById('infoIdade').textContent = idade || 'Não informado';
        }
    }

    // ==================== FUNÇÕES DE AVALIAÇÃO PSICOLÓGICA ====================
    
    async savePsychologicalEvaluation() {
        try {
            const evaluationData = {
                paciente_login: this.selectedPaciente.login,
                paciente_nome: this.selectedPaciente.nome || '',
                profissional: this.userInfo.nome || '',
                profissional_login: this.userInfo.login || '',
                cargo: this.userInfo.cargo || 'psicologo',
                tipo: 'psicologica',
                data_avaliacao: document.getElementById('evaluationDate').value,
                escalas: {
                    ansiedade: parseInt(document.getElementById('ansiedade').value),
                    depressao: parseInt(document.getElementById('depressao').value),
                    estresse: parseInt(document.getElementById('estresse').value),
                    qualidade_sono: parseInt(document.getElementById('sono').value)
                },
                habitos: {
                    alimentares: document.getElementById('habitosAlimentares').value,
                    pratica_exercicios: document.getElementById('praticaExercicios').value
                },
                observacoes: document.getElementById('observacoes').value,
                status: 'pendente'
            };

            await this.funcoes.saveNutritionalEvaluation(evaluationData);
            
            alert('✅ Avaliação Psicológica salva com sucesso!');
            
            document.getElementById('ansiedade').value = 5;
            document.getElementById('ansiedadeValue').textContent = 5;
            document.getElementById('depressao').value = 5;
            document.getElementById('depressaoValue').textContent = 5;
            document.getElementById('estresse').value = 5;
            document.getElementById('estresseValue').textContent = 5;
            document.getElementById('sono').value = 5;
            document.getElementById('sonoValue').textContent = 5;
            document.getElementById('habitosAlimentares').value = '';
            document.getElementById('praticaExercicios').value = '';
            document.getElementById('observacoes').value = '';
            
            await this.loadPsychologicalEvaluations();
            
        } catch (error) {
            alert('❌ Erro ao salvar avaliação: ' + error.message);
        }
    }

    async loadPsychologicalEvaluations() {
        if (!this.selectedPaciente) return;
        
        try {
            const allEvaluations = await this.funcoes.loadEvaluationsByPatient(this.selectedPaciente.login);
            this.currentEvaluations = allEvaluations.filter(e => e.tipo === 'psicologica');
            
            this.displayEvaluationsList();
            this.renderCharts();
            
        } catch (error) {
            console.error("Erro ao carregar avaliações:", error);
        }
    }

    displayEvaluationsList() {
        const evaluationsList = document.getElementById('evaluationsList');
        
        if (!evaluationsList) return;
        
        evaluationsList.innerHTML = '';
        
        if (this.currentEvaluations.length === 0) {
            evaluationsList.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 16px;">
                    <p style="color: #666;">📭 Nenhuma avaliação psicológica encontrada.</p>
                    <p style="color: #999; font-size: 14px; margin-top: 10px;">Registre a primeira avaliação do paciente.</p>
                </div>
            `;
            return;
        }
        
        this.currentEvaluations.forEach((data) => {
            const card = document.createElement('div');
            card.className = 'evaluation-card';
            
            const dataAvaliacao = data.data_avaliacao ? this.formatDate(data.data_avaliacao) : 'Data não informada';
            const statusBadge = data.status === 'aprovado' ? '✅ Aprovado' : (data.status === 'pendente' ? '⏳ Pendente' : '📝 Rascunho');
            
            card.innerHTML = `
                <div class="evaluation-date">
                    📅 ${dataAvaliacao}
                    <span style="float: right; font-size: 12px;">${statusBadge}</span>
                </div>
                <div><strong>👨‍⚕️ Profissional:</strong> ${data.profissional || 'Não informado'}</div>
                <div class="evaluation-data">
                    <div><strong>😰 Ansiedade:</strong> ${data.escalas?.ansiedade || '-'}/10</div>
                    <div><strong>😔 Depressão:</strong> ${data.escalas?.depressao || '-'}/10</div>
                    <div><strong>😫 Estresse:</strong> ${data.escalas?.estresse || '-'}/10</div>
                    <div><strong>💤 Qualidade do Sono:</strong> ${data.escalas?.qualidade_sono || '-'}/10</div>
                    <div><strong>🍽️ Hábitos Alimentares:</strong> ${this.getHabitosText(data.habitos?.alimentares)}</div>
                    <div><strong>🏃‍♂️ Exercícios:</strong> ${this.getExerciciosText(data.habitos?.pratica_exercicios)}</div>
                </div>
                ${data.observacoes ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;"><strong>📝 Observações:</strong><br>${data.observacoes}</div>` : ''}
            `;
            evaluationsList.appendChild(card);
        });
    }

    getHabitosText(value) {
        const textos = {
            'regular': 'Regular',
            'bom': 'Bom',
            'muito_bom': 'Muito Bom',
            'precisa_melhorar': 'Precisa Melhorar'
        };
        return textos[value] || value || 'Não informado';
    }

    getExerciciosText(value) {
        const textos = {
            'sim': 'Sim',
            'nao': 'Não',
            'as_vezes': 'Às vezes'
        };
        return textos[value] || value || 'Não informado';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        if (dateString.includes('/')) return dateString;
        const partes = dateString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dateString;
    }

    renderCharts() {
        if (this.currentEvaluations.length === 0) {
            return;
        }
        
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.renderCharts(), 500);
            return;
        }
        
        this.createCharts();
    }

    createCharts() {
        const sorted = [...this.currentEvaluations].sort((a, b) => 
            new Date(a.data_avaliacao) - new Date(b.data_avaliacao)
        );
        
        const labels = sorted.map(e => this.formatDate(e.data_avaliacao));
        const ansiedade = sorted.map(e => e.escalas?.ansiedade || 0);
        const depressao = sorted.map(e => e.escalas?.depressao || 0);
        const estresse = sorted.map(e => e.escalas?.estresse || 0);
        const sono = sorted.map(e => e.escalas?.qualidade_sono || 0);
        
        if (this.psicologiaChart) this.psicologiaChart.destroy();
        
        const ctx = document.getElementById('psicologiaChart')?.getContext('2d');
        if (ctx) {
            this.psicologiaChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ansiedade',
                            data: ansiedade,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Depressão',
                            data: depressao,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Estresse',
                            data: estresse,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Qualidade do Sono',
                            data: sono,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 10,
                            title: {
                                display: true,
                                text: 'Nível (0-10)'
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw}/10`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
}
