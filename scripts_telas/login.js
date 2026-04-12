import { 
    db, 
    auth, 
    getDoc, 
    doc, 
    signInWithEmailAndPassword, 
    updateDoc,
    createUserWithEmailAndPassword,
    serverTimestamp
} from '../0_firebase_api_config.js';
import { deleteField } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { HomeManager, FuncoesCompartilhadas } from './home.js';

export class LoginManager {
    constructor() {
        this.renderLoginScreen();
        this.setupEventListeners();
        this.checkAutoLogin();
        this.loadSavedCredentials();
        this.tempData = null;
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
                                    <label>Senha / Código</label>
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
                                <a href="#" id="forgotPasswordLink" class="forgot-password">Esqueci minha senha</a>
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

        const forgotLink = document.getElementById('forgotPasswordLink');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPasswordResetDialog();
            });
        }

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
            
            const hasUltimoLogin = userData.hasOwnProperty('ultimo_login');
            
            if (!hasUltimoLogin) {
                if (password !== userData.codigo_temporario) {
                    this.showError('❌ Código temporário inválido!');
                    return;
                }
                
                const dataExpiracao = new Date(userData.codigo_expiracao);
                if (dataExpiracao < new Date()) {
                    this.showError('⚠️ Código expirado! Solicite um novo código ao profissional.');
                    return;
                }
                
                this.tempData = {
                    login: loginInput,
                    email: userData.email,
                    nome: userData.nome,
                    userRef: userRef
                };
                
                this.showCreatePasswordScreen();
                return;
            }
            
            try {
                const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
                
                await updateDoc(userRef, {
                    ultimo_login: serverTimestamp()
                });
                
                userData.login = loginInput;
                
                if (!userData.perfil) {
                    userData.perfil = FuncoesCompartilhadas.getPerfilPadrao(userData.cargo);
                }
                
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
                    this.showError('❌ Usuário não encontrado! Contate o administrador.');
                } else {
                    this.showError('❌ Erro: ' + authError.message);
                }
            }
            
        } catch (error) {
            console.error("Erro:", error);
            this.showError('❌ Erro ao conectar com o servidor!');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    showCreatePasswordScreen() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="login-wrapper">
                    <div class="login-card">
                        <div class="login-header">
                            <div class="logo-container">
                                <img src="./imagens/logo.png" alt="TratamentoWeb" class="login-logo-img">
                            </div>
                            <h2>Primeiro Acesso</h2>
                            <p>Olá, <strong>${this.tempData.nome || this.tempData.login}</strong>!</p>
                            <p>Cadastre sua senha pessoal para continuar.</p>
                        </div>
    
                        <form id="createPasswordForm" class="login-form">
                            <div class="info-box" style="background: #e8eaf6; padding: 12px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                                <i class="bi bi-info-circle" style="color: #1a237e;"></i>
                                <span style="font-size: 13px; color: #1a237e;">Crie uma senha forte e segura para suas próximas visitas.</span>
                            </div>
    
                            <div class="input-group-custom">
                                <div class="input-icon">
                                    <i class="bi bi-shield-lock"></i>
                                </div>
                                <div class="input-field">
                                    <input type="password" id="newPassword" placeholder=" " required>
                                    <label>Nova Senha</label>
                                </div>
                                <div class="input-icon password-toggle" id="toggleNewPassword">
                                    <i class="bi bi-eye-slash"></i>
                                </div>
                            </div>
    
                            <div class="input-group-custom">
                                <div class="input-icon">
                                    <i class="bi bi-shield-check"></i>
                                </div>
                                <div class="input-field">
                                    <input type="password" id="confirmPassword" placeholder=" " required>
                                    <label>Confirmar Senha</label>
                                </div>
                                <div class="input-icon password-toggle" id="toggleConfirmPassword">
                                    <i class="bi bi-eye-slash"></i>
                                </div>
                            </div>
    
                            <button type="submit" class="login-button">
                                <i class="bi bi-check-circle"></i>
                                Cadastrar Senha e Entrar
                            </button>
                        </form>
                    </div>
                </div>
            `;
            this.setupCreatePasswordEvents();
        }
    }

    setupCreatePasswordEvents() {
        const form = document.getElementById('createPasswordForm');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        const toggleNew = document.getElementById('toggleNewPassword');
        const toggleConfirm = document.getElementById('toggleConfirmPassword');
        
        if (toggleNew && newPassword) {
            toggleNew.addEventListener('click', () => {
                const type = newPassword.getAttribute('type') === 'password' ? 'text' : 'password';
                newPassword.setAttribute('type', type);
                toggleNew.querySelector('i').classList.toggle('bi-eye');
                toggleNew.querySelector('i').classList.toggle('bi-eye-slash');
            });
        }
        
        if (toggleConfirm && confirmPassword) {
            toggleConfirm.addEventListener('click', () => {
                const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPassword.setAttribute('type', type);
                toggleConfirm.querySelector('i').classList.toggle('bi-eye');
                toggleConfirm.querySelector('i').classList.toggle('bi-eye-slash');
            });
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = newPassword.value;
            const confirm = confirmPassword.value;
            
            if (password !== confirm) {
                this.showError('As senhas não coincidem!', 'createPasswordForm');
                return;
            }
            
            if (password.length < 6) {
                this.showError('A senha deve ter no mínimo 6 caracteres!', 'createPasswordForm');
                return;
            }
            
            try {
                await createUserWithEmailAndPassword(auth, this.tempData.email, password);
                
                await updateDoc(this.tempData.userRef, {
                    ultimo_login: serverTimestamp(),
                    codigo_temporario: deleteField(),
                    codigo_expiracao: deleteField()
                });
                
                const updatedDoc = await getDoc(this.tempData.userRef);
                const userData = updatedDoc.data();
                userData.login = this.tempData.login;
                
                if (!userData.perfil) {
                    userData.perfil = FuncoesCompartilhadas.getPerfilPadrao(userData.cargo);
                }
                
                localStorage.setItem('currentUser', JSON.stringify(userData));
                this.showHome(userData);
                
            } catch (authError) {
                console.error("Erro ao criar usuário:", authError);
                
                if (authError.code === 'auth/email-already-in-use') {
                    this.showError('❌ Este login já possui cadastro. Contate o administrador.', 'createPasswordForm');
                } else if (authError.code === 'auth/weak-password') {
                    this.showError('❌ Senha muito fraca. Use pelo menos 6 caracteres.', 'createPasswordForm');
                } else {
                    this.showError('❌ Erro ao criar conta: ' + authError.message, 'createPasswordForm');
                }
            }
        });
    }

    showPasswordResetDialog() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="login-wrapper">
                    <div class="login-card">
                        <div class="login-header">
                            <div class="logo-container">
                                <img src="./imagens/logo.png" alt="TratamentoWeb" class="login-logo-img">
                            </div>
                            <h2>Recuperar Senha</h2>
                            <p>Para recuperar sua senha, entre em contato com o profissional responsável.</p>
                            <p>Ele poderá gerar uma nova senha temporária para você.</p>
                        </div>
    
                        <form id="resetForm" class="login-form">
                            <button type="button" id="backToLoginBtn" class="login-button">
                                <i class="bi bi-arrow-left"></i>
                                Voltar ao Login
                            </button>
                        </form>
                    </div>
                </div>
            `;
            
            const backBtn = document.getElementById('backToLoginBtn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.renderLoginScreen();
                    this.setupEventListeners();
                    this.loadSavedCredentials();
                });
            }
        }
    }

    showError(message, formId = 'loginForm') {
        const existingError = document.querySelector('.error-message-custom');
        if (existingError) existingError.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message-custom';
        errorDiv.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>${message}</span>
        `;
        
        const form = document.getElementById(formId);
        if (form) {
            const button = form.querySelector('button');
            if (button) {
                form.insertBefore(errorDiv, button);
            } else {
                form.appendChild(errorDiv);
            }
        }
        
        setTimeout(() => {
            if (errorDiv) errorDiv.remove();
        }, 5000);
    }

    showHome(userData) {
        // Adiciona classe CSS no body conforme o perfil
        const body = document.body;
        body.classList.remove('profile-paciente', 'profile-profissional');
        
        if (userData.cargo === 'paciente') {
            body.classList.add('profile-paciente');
        } else {
            body.classList.add('profile-profissional');
        }
        
        const homeManager = new HomeManager(userData);
        homeManager.render();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
