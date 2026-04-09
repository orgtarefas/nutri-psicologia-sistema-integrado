import { FuncoesCompartilhadas } from './home_funcoescompartilhadas.js';

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
        return `
            <div class="home-container">
                <div class="header">
                    <h1>🧠 Sistema de Avaliação Psicológica</h1>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Psicólogo</span>
                        ${this.userInfo.perfil === 'admin' ? `
                            <select id="adminRoleSelector" class="role-selector">
                                <option value="psicologo">🧠 Psicólogo</option>
                                <option value="cliente">👤 Cliente</option>
                                <option value="nutricionista">🍎 Nutricionista</option>
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
                                    <label>⚥ Sexo:</label>
                                    <select id="regSexo" required>
                                        <option value="">Selecione</option>
                                        <option value="feminino">Feminino</option>
                                        <option value="masculino">Masculino</option>
                                    </select>
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
                    
                    <div style="text-align: center; padding: 40px;">
                        <h2>🚧 Em Desenvolvimento</h2>
                        <p>Módulo de avaliação psicológica será implementado em breve!</p>
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

        // Modal de cadastro
        const registerBtn = document.getElementById('registerClientBtn');
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.limparFormularioCadastro();
                this.funcoes.showModal('registerModal');
            });
        }
        
        this.funcoes.setupModalEvents('registerModal');
        
        // Form de cadastro
        const registerForm = document.getElementById('registerClientForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.registerClient();
            });
        }

        // Navegação
        this.funcoes.setupNavButtons();
    }

    limparFormularioCadastro() {
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
        } catch (error) {
            alert('❌ ' + error.message);
        }
    }
}