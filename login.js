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
            // A estrutura correta: logins -> funcionarios (documento)
            // O documento "funcionarios" contém um MAP com os logins
            const funcionariosRef = doc(db, "logins", "funcionarios");
            const funcionariosDoc = await getDoc(funcionariosRef);
            
            let userFound = null;
            let userData = null;
            
            if (funcionariosDoc.exists()) {
                const data = funcionariosDoc.data();
                // Buscar o login no MAP dentro do documento
                if (data[login]) {
                    userFound = true;
                    userData = data[login];
                    console.log('Usuário encontrado em funcionarios:', userData);
                }
            }
            
            // Se não encontrou em funcionarios, tentar em clientes
            if (!userFound) {
                const clientesRef = doc(db, "logins", "clientes");
                const clientesDoc = await getDoc(clientesRef);
                
                if (clientesDoc.exists()) {
                    const data = clientesDoc.data();
                    if (data[login]) {
                        userFound = true;
                        userData = data[login];
                        console.log('Usuário encontrado em clientes:', userData);
                    }
                }
            }
            
            // Se não encontrou em clientes, tentar em admin
            if (!userFound) {
                const adminRef = doc(db, "logins", "admin");
                const adminDoc = await getDoc(adminRef);
                
                if (adminDoc.exists()) {
                    const data = adminDoc.data();
                    if (data[login]) {
                        userFound = true;
                        userData = data[login];
                        console.log('Usuário encontrado em admin:', userData);
                    }
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
