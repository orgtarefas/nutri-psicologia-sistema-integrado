import { db, auth, getDoc, doc, signInWithEmailAndPassword } from '../0_firebase_api_config.js';
import { HomeManager, FuncoesCompartilhadas } from './home.js';

export class LoginManager {
    constructor() {
        this.renderLoginScreen();
        this.setupEventListeners();
        this.checkAutoLogin();
        this.loadSavedCredentials();
    }

    renderLoginScreen() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="login-wrapper">
                    <div class="login-card">
                        <div class="login-header">
                            <div class="logo-container">
                                <img src="./imagens/logo.png" alt="TratamentoWeb" class="login-logo-img">
                            </div>
                        </div>

                        <form id="loginForm" class="login-form">
                            <div class="input-group-custom">
                                <div class="input-icon">
                                    <i class="bi bi-person"></i>
                                </div>
                                <div class="input-field">
                                    <input type="text" id="login" placeholder=" " autocomplete="username">
                                    <label>Login</label>
                                </div>
                            </div>

                            <div class="input-group-custom">
                                <div class="input-icon">
                                    <i class="bi bi-lock"></i>
                                </div>
                                <div class="input-field">
                                    <input type="password" id="password" placeholder=" " autocomplete="current-password">
                                    <label>Senha</label>
                                </div>
                                <div class="input-icon password-toggle" id="togglePassword">
                                    <i class="bi bi-eye-slash"></i>
                                </div>
                            </div>

                            <div class="login-options">
                                <label class="checkbox-custom">
                                    <input type="checkbox" id="rememberLogin">
                                    <span class="checkmark"></span>
                                    <span class="checkbox-text">Lembrar meus dados</span>
                                </label>
                            </div>

                            <button type="submit" class="login-button">
                                <i class="bi bi-box-arrow-in-right"></i>
                                Entrar
                            </button>
                        </form>
                    </div>
                </div>
            `;
        }
    }

    loadSavedCredentials() {
        const savedLogin = localStorage.getItem('savedLogin');
        const savedPassword = localStorage.getItem('savedPassword');
        const rememberLogin = localStorage.getItem('rememberLogin') === 'true';
        
        if (rememberLogin && savedLogin && savedPassword) {
            const loginInput = document.getElementById('login');
            const passwordInput = document.getElementById('password');
            const rememberCheckbox = document.getElementById('rememberLogin');
            
            if (loginInput) loginInput.value = savedLogin;
            if (passwordInput) passwordInput.value = savedPassword;
            if (rememberCheckbox) rememberCheckbox.checked = true;
            
            // Ativar animação dos labels
            setTimeout(() => {
                const inputs = document.querySelectorAll('.input-field input');
                inputs.forEach(input => {
                    if (input.value) {
                        input.parentElement.classList.add('focused');
                    }
                });
            }, 100);
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

        // Toggle para exibir/esconder senha
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                const icon = togglePassword.querySelector('i');
                if (icon) {
                    icon.classList.toggle('bi-eye');
                    icon.classList.toggle('bi-eye-slash');
                }
            });
        }

        // Animação dos inputs
        const inputs = document.querySelectorAll('.input-field input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
            if (input.value) {
                input.parentElement.classList.add('focused');
            }
        });
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
        const rememberCheckbox = document.getElementById('rememberLogin');

        if (!loginInput || !password) {
            this.showError('Preencha todos os campos!');
            return;
        }

        // Mostrar loading no botão
        const submitBtn = document.querySelector('.login-button');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Entrando...';
        submitBtn.disabled = true;

        try {
            const userRef = doc(db, "logins", loginInput);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                this.showError('❌ Login não encontrado!');
                return;
            }
            
            const userData = userDoc.data();
            
            if (userData.status_ativo === false) {
                this.showError('❌ Conta desativada! Contate o administrador.');
                return;
            }
            
            if (!userData.email) {
                this.showError('❌ Erro de configuração: contate o administrador!');
                return;
            }
            
            try {
                const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
                
                userData.login = loginInput;
                
                if (!userData.perfil) {
                    userData.perfil = FuncoesCompartilhadas.getPerfilPadrao(userData.cargo);
                }
                
                // Salvar credenciais se "Lembrar dados" estiver marcado
                if (rememberCheckbox && rememberCheckbox.checked) {
                    localStorage.setItem('savedLogin', loginInput);
                    localStorage.setItem('savedPassword', password);
                    localStorage.setItem('rememberLogin', 'true');
                } else {
                    localStorage.removeItem('savedLogin');
                    localStorage.removeItem('savedPassword');
                    localStorage.setItem('rememberLogin', 'false');
                }
                
                localStorage.setItem('currentUser', JSON.stringify(userData));
                this.showHome(userData);
                
            } catch (authError) {
                console.error("Erro de autenticação:", authError);
                
                if (authError.code === 'auth/invalid-credential' || 
                    authError.code === 'auth/wrong-password') {
                    this.showError('❌ Senha incorreta!');
                } else if (authError.code === 'auth/user-not-found') {
                    this.showError('❌ Usuário não encontrado no sistema de autenticação!');
                } else {
                    this.showError('❌ Erro de autenticação: ' + authError.message);
                }
            }
            
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            this.showError('❌ Erro ao conectar com o servidor!');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showError(message) {
        // Remove erro existente
        const existingError = document.querySelector('.error-message-custom');
        if (existingError) existingError.remove();
        
        // Criar elemento de erro estilizado
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message-custom';
        errorDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>${message}</span>
        `;
        
        const form = document.getElementById('loginForm');
        if (form) {
            form.insertBefore(errorDiv, form.querySelector('.login-button'));
        }
        
        // Auto fechar após 5 segundos
        setTimeout(() => {
            if (errorDiv) errorDiv.remove();
        }, 5000);
    }

    showHome(userData) {
        const homeManager = new HomeManager(userData);
        homeManager.render();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
