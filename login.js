import { db, doc, getDoc } from './0_firebase_api_config.js';
import { HomeManager, FuncoesCompartilhadas } from './home.js';

export class LoginManager {
    constructor() {
        this.renderLoginScreen();
        this.setupEventListeners();
        this.checkAutoLogin();
    }

    renderLoginScreen() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="login-container">
                    <div class="login-logo">
                        <img src="imagens/logo.png" alt="Vitality Logo" class="logo-img">
                    </div>
                    <form id="loginForm">
                        <div class="input-group">
                            <label>📱 Login:</label>
                            <input type="text" id="login" placeholder="Digite seu login" required>
                        </div>
                        <div class="input-group">
                            <label>🔒 Senha:</label>
                            <input type="password" id="password" placeholder="Digite sua senha" required>
                        </div>
                        <button type="submit" class="login-btn">Entrar</button>
                        <div id="errorMsg" class="error-message" style="display: none;"></div>
                    </form>
                </div>
            `;
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    checkAutoLogin() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                this.showHome(user);
            } catch (error) {
                console.error("Erro ao restaurar sessão:", error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    async handleLogin() {
        const loginInput = document.getElementById('login')?.value.trim();
        const password = document.getElementById('password')?.value;
        const errorMsg = document.getElementById('errorMsg');

        if (!loginInput || !password) {
            if (errorMsg) {
                errorMsg.textContent = 'Preencha todos os campos!';
                errorMsg.style.display = 'block';
            }
            return;
        }

        try {
            const userRef = doc(db, "logins", loginInput);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists() && userDoc.data().senha === password) {
                const userData = userDoc.data();
                userData.login = loginInput;
                
                if (!userData.perfil) {
                    userData.perfil = FuncoesCompartilhadas.getPerfilPadrao(userData.cargo);
                }
                
                if (errorMsg) errorMsg.style.display = 'none';
                localStorage.setItem('currentUser', JSON.stringify(userData));
                this.showHome(userData);
            } else {
                if (errorMsg) {
                    errorMsg.textContent = 'Login ou senha incorretos!';
                    errorMsg.style.display = 'block';
                }
            }
            
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            if (errorMsg) {
                errorMsg.textContent = 'Erro ao conectar com o servidor!';
                errorMsg.style.display = 'block';
            }
        }
    }

    showHome(userData) {
        const homeManager = new HomeManager(userData);
        homeManager.render();
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
