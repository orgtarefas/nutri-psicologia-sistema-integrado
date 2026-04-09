import { FuncoesCompartilhadas } from './home.js';

export class HomePsicologo {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
    }

    renderHTML() {
        const perfilBadgeClass = this.funcoes.getPerfilBadgeClass(this.userInfo.perfil);
        const perfilDisplayName = this.funcoes.getPerfilDisplayName(this.userInfo.perfil);
        
        return `
            <div class="home-container">
                <div class="header">
                    <div class="header-logo">
                        <img src="imagens/logo.png" alt="Vitality" class="header-logo-img">
                        <h1>Sistema de Avaliação Psicológica</h1>
                    </div>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Psicólogo</span>
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
                        <button class="nav-btn" data-module="group">👥 Atendimento em Grupo</button>
                        <button class="nav-btn" data-module="scheduled">📅 Atendimento Agendado</button>
                        <button class="nav-btn" data-module="journey">🌟 Minha Jornada</button>
                        <button class="nav-btn" data-module="challenges">🏆 Desafios</button>
                        <button class="nav-btn" id="registerPacienteBtn" style="background: #48bb78; color: white;">➕ Cadastrar Paciente</button>
                    </div>
                    
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
                    
                    <div style="text-align: center; padding: 40px;">
                        <h2>🚧 Em Desenvolvimento</h2>
                        <p>Módulo de avaliação psicológica será implementado em breve!</p>
                        ${this.userInfo.perfil === 'supervisor_psicologo' ? `
                            <div style="margin-top: 20px; padding: 20px; background: #e0f0ff; border-radius: 12px;">
                                <h3>🔒 Funcionalidades de Supervisor</h3>
                                <p>✓ Aprovar avaliações</p>
                                <p>✓ Revisar relatórios</p>
                                <p>✓ Supervisionar equipe</p>
                            </div>
                        ` : ''}
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

        const registerBtn = document.getElementById('registerPacienteBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.clearRegisterForm();
                this.funcoes.showModal('registerModal');
            });
        }

        this.funcoes.setupModalEvents('registerModal');

        const registerForm = document.getElementById('registerPacienteForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.registerPaciente();
            });
        }

        document.querySelectorAll('.nav-btn:not(#registerPacienteBtn)').forEach(btn => {
            const module = btn.getAttribute('data-module');
            if (module) {
                btn.addEventListener('click', () => alert(`🚧 Módulo ${module} em desenvolvimento!`));
            }
        });
    }

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
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }
}
