// Importa apenas do arquivo central do Firebase
import { db, collection, getDocs, query, where } from './0_firebase_api_config.js';

export class LoginManager {
    constructor() {
        console.log('LoginManager iniciado');
        this.init();
    }

    init() {
        this.renderLoginScreen();
        this.attachLoginEvent();
    }

    renderLoginScreen() {
        const app = document.getElementById('app');
        if (!app) {
            console.error('Elemento app não encontrado!');
            return;
        }
        
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
        console.log('Tela de login renderizada');
    }

    attachLoginEvent() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const login = document.getElementById('login').value;
                const password = document.getElementById('password').value;
                console.log('Tentando login com:', login);
                await this.validateLogin(login, password);
            });
        }
    }

    async validateLogin(login, password) {
        try {
            console.log('Validando login...');
            const loginsRef = collection(db, "logins");
            const q = query(loginsRef, where("__name__", "==", login));
            const querySnapshot = await getDocs(q);
            
            console.log('Resultado da consulta:', querySnapshot.size);
            
            if (querySnapshot.empty) {
                this.showError("Usuário não encontrado!");
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            console.log('Usuário encontrado:', userData);

            if (userData.senha === password && userData.status_ativo === true) {
                const userInfo = {
                    login: login,
                    nome: userData.nome,
                    perfil: userData.perfil,
                    cargo: userData.cargo,
                    status_ativo: userData.status_ativo
                };
                localStorage.setItem('currentUser', JSON.stringify(userInfo));
                console.log('Login bem sucedido!');
                this.loadHomeScreen(userInfo);
            } else {
                this.showError("Senha incorreta ou usuário inativo!");
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            this.showError("Erro ao conectar com o servidor: " + error.message);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            setTimeout(() => {
                errorDiv.textContent = '';
            }, 3000);
        }
    }

    loadHomeScreen(userInfo) {
        import('./home.js').then(module => {
            const homeManager = new module.HomeManager(userInfo);
            homeManager.render();
        }).catch(error => {
            console.error('Erro ao carregar home:', error);
        });
    }
}

// Não inicializa automaticamente, deixamos o index.html controlar
