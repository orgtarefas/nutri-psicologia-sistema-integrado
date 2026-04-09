import { db, collection, doc, getDoc } from './0_firebase_api_config.js';

class LoginManager {
    constructor() {
        this.init();
    }

    init() {
        this.renderLoginScreen();
        this.attachLoginEvent();
    }

    renderLoginScreen() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <h2>🚀 Sistema de Avaliação</h2>
                <form id="loginForm">
                    <div class="input-group">
                        <label>👤 Login</label>
                        <input type="text" id="login" placeholder="Digite seu login" required>
                    </div>
                    <div class="input-group">
                        <label>🔒 Senha</label>
                        <input type="password" id="password" placeholder="Digite sua senha" required>
                    </div>
                    <button type="submit" class="login-btn">Entrar</button>
                    <div id="errorMessage" class="error-message"></div>
                </form>
            </div>
        `;
    }

    attachLoginEvent() {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const login = document.getElementById('login').value;
            const password = document.getElementById('password').value;
            await this.validateLogin(login, password);
        });
    }

    async validateLogin(login, password) {
        try {
            // Buscar em todas as pastas possíveis
            const pastas = ['funcionarios', 'clientes', 'admin'];
            let userFound = null;
            let userData = null;
            let userType = null;
            
            for (const pasta of pastas) {
                try {
                    const userRef = doc(db, "logins", pasta, login);
                    const userDoc = await getDoc(userRef);
                    
                    if (userDoc.exists()) {
                        userFound = userDoc;
                        userData = userDoc.data();
                        userType = pasta;
                        console.log(`Usuário encontrado na pasta: ${pasta}`, userData);
                        break;
                    }
                } catch (error) {
                    console.log(`Erro ao buscar em ${pasta}:`, error);
                }
            }
            
            if (!userFound) {
                this.showError("Usuário não encontrado!");
                return;
            }

            // Validar senha e status
            if (userData.senha === password && userData.status_ativo === true) {
                const userInfo = {
                    login: login,
                    nome: userData.nome,
                    perfil: userData.perfil,
                    cargo: userData.cargo,
                    tipo: userType, // funcionarios, clientes ou admin
                    status_ativo: userData.status_ativo
                };
                localStorage.setItem('currentUser', JSON.stringify(userInfo));
                console.log('Login bem sucedido!', userInfo);
                this.loadHomeScreen(userInfo);
            } else {
                if (userData.senha !== password) {
                    this.showError("Senha incorreta!");
                } else {
                    this.showError("Usuário inativo! Contate o administrador.");
                }
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            this.showError("Erro ao conectar com o servidor: " + error.message);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        setTimeout(() => {
            errorDiv.textContent = '';
        }, 3000);
    }

    loadHomeScreen(userInfo) {
        import('./home.js').then(module => {
            const homeManager = new module.HomeManager(userInfo);
            homeManager.render();
        });
    }
}

// Verificar se já existe usuário logado
const currentUser = localStorage.getItem('currentUser');
if (currentUser) {
    const userInfo = JSON.parse(currentUser);
    import('./home.js').then(module => {
        const homeManager = new module.HomeManager(userInfo);
        homeManager.render();
    });
} else {
    new LoginManager();
}
