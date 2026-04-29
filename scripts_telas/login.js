// login.js - COM LOGS COMPLETOS

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
import { HomeManager, FuncoesCompartilhadas } from './0_home.js';

const CARGOS_VALIDOS = ['paciente', 'nutricionista', 'psicologo'];

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
                
                if (!this.isCargoValido(user.cargo)) {
                    console.warn('Cargo invalido na sessao salva:', user.cargo);
                    localStorage.removeItem('currentUser');
                    return;
                }
                
                this.showHome(user);
            } catch (error) {
                console.error("Erro ao restaurar sessao:", error);
                localStorage.removeItem('currentUser');
            }
        }
    }

    isCargoValido(cargo) {
        return CARGOS_VALIDOS.includes(cargo);
    }

    getMensagemCargoInvalido(cargo) {
        return `Cargo invalido: ${cargo}`;
    }

    async handleLogin() {
        const loginInput = document.getElementById('login')?.value.trim();
        const password = document.getElementById('password')?.value;
        const rememberCheckbox = document.getElementById('rememberLogin');
    
        console.log('========== INÍCIO DO PROCESSO DE LOGIN ==========');
        console.log('📝 1. Login digitado pelo usuário:', loginInput);
        console.log('🔒 2. Senha digitada:', password ? '********' : '(vazia)');
    
        if (!loginInput || !password) {
            console.error('❌ Campos vazios!');
            this.showError('Preencha todos os campos!');
            return;
        }
    
        const submitBtn = document.querySelector('.login-button');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Entrando...';
        submitBtn.disabled = true;
    
        try {
            // 1. Monta o email a partir do login
            const emailMontado = `${loginInput.toLowerCase()}@tratamentoweb.com`;
            console.log('📧 3. Email montado para autenticação:', emailMontado);
            
            // 2. TENTA AUTENTICAR NO AUTH
            console.log('🔐 4. Tentando autenticar no Firebase Auth...');
            const userCredential = await signInWithEmailAndPassword(auth, emailMontado, password);
            const authUser = userCredential.user;
            
            console.log('✅ 5. AUTENTICADO COM SUCESSO!');
            console.log('   - UID:', authUser.uid);
            console.log('   - Email:', authUser.email);
            console.log('   - Email verificado:', authUser.emailVerified);
            
            // 3. SÓ AGORA, após autenticado, consulta o Firestore
            console.log('📁 6. Tentando buscar dados no Firestore...');
            console.log('   - Coleção: logins');
            console.log('   - Documento:', loginInput);
            
            const userRef = doc(db, "logins", loginInput);
            console.log('   - Referência do documento criada');
            
            const userDoc = await getDoc(userRef);
            console.log('   - Documento existe?', userDoc.exists());
            
            if (!userDoc.exists()) {
                console.error('❌ 7. ERRO: Usuário autenticado no Auth mas documento NÃO existe no Firestore!');
                console.error('   - Documento procurado:', loginInput);
                console.error('   - Isso pode ser um problema de inconsistência de dados');
                await auth.signOut();
                this.showError('Usuário autenticado mas dados não encontrados! Contate o administrador.');
                return;
            }
            
            console.log('✅ 7. Documento encontrado com sucesso!');
            
            const userData = userDoc.data();
            console.log('📋 8. Dados do usuário obtidos:');
            console.log('   - Nome:', userData.nome);
            console.log('   - Cargo:', userData.cargo);
            console.log('   - Perfil:', userData.perfil);
            console.log('   - Status ativo:', userData.status_ativo);
            console.log('   - Tem último login?', userData.hasOwnProperty('ultimo_login'));
            console.log('   - Email no Firestore:', userData.email);
            
            // 4. Validar se o usuário está ativo
            if (userData.status_ativo === false) {
                console.error('❌ 9. Conta desativada!');
                await auth.signOut();
                this.showError('Conta desativada! Contate o administrador.');
                return;
            }
            
            // 5. Validar cargo
            if (!this.isCargoValido(userData.cargo)) {
                console.error('❌ 10. Cargo inválido:', userData.cargo);
                await auth.signOut();
                this.showError(this.getMensagemCargoInvalido(userData.cargo));
                return;
            }
            
            console.log('✅ 9. Validações de cargo e status passaram');
            
            // 6. Verificar se é primeiro acesso (paciente sem ultimo_login)
            const isPaciente = userData.cargo === 'paciente';
            const hasPrimeiroAcesso = userData.hasOwnProperty('ultimo_login');
            
            console.log('🔍 10. Verificando tipo de acesso:');
            console.log('   - É paciente?', isPaciente);
            console.log('   - Já fez primeiro acesso?', hasPrimeiroAcesso);
            
            // 7. Para pacientes em primeiro acesso
            if (isPaciente && !hasPrimeiroAcesso) {
                console.log('🆕 11. PACIENTE EM PRIMEIRO ACESSO!');
                console.log('   - Redirecionando para criar senha...');
                await auth.signOut();
                
                // Verificar código temporário
                if (password !== userData.codigo_temporario) {
                    console.error('   - Código temporário inválido!');
                    this.showError('Código temporário inválido!');
                    return;
                }
                
                const dataExpiracao = new Date(userData.codigo_expiracao);
                if (dataExpiracao < new Date()) {
                    console.error('   - Código expirado!', dataExpiracao);
                    this.showError('Código expirado! Solicite um novo código ao profissional.');
                    return;
                }
                
                console.log('   - Código válido! Mostrando tela de criação de senha');
                
                this.tempData = {
                    login: loginInput,
                    email: emailMontado,
                    nome: userData.nome,
                    cargo: userData.cargo,
                    perfil: userData.perfil,
                    userRef: userRef
                };
                
                this.showCreatePasswordScreen();
                return;
            }
            
            // 8. Atualiza último login no Firestore
            console.log('📝 11. Atualizando último login no Firestore...');
            await updateDoc(userRef, {
                ultimo_login: serverTimestamp()
            });
            console.log('   - Último login atualizado!');
            
            // 9. Prepara dados do usuário para a sessão
            userData.login = loginInput;
            userData.email = emailMontado;
            
            // Garante perfil padrão
            if (!userData.perfil) {
                userData.perfil = isPaciente ? 'operador' : 'supervisor';
                console.log('   - Perfil padrão aplicado:', userData.perfil);
            }
            
            // 10. Salva credenciais se solicitado
            if (rememberCheckbox && rememberCheckbox.checked) {
                localStorage.setItem('savedLogin', loginInput);
                localStorage.setItem('savedPassword', password);
                localStorage.setItem('rememberLogin', 'true');
                console.log('💾 12. Credenciais salvas no localStorage');
            } else {
                localStorage.removeItem('savedLogin');
                localStorage.removeItem('savedPassword');
                localStorage.setItem('rememberLogin', 'false');
                console.log('🔓 12. Credenciais NÃO salvas');
            }
            
            // 11. Salva sessão e mostra home
            localStorage.setItem('currentUser', JSON.stringify(userData));
            console.log('✅ 13. LOGIN COMPLETO! Redirecionando para HOME...');
            console.log('========== FIM DO PROCESSO DE LOGIN ==========');
            
            this.showHome(userData);
            
        } catch (authError) {
            console.error('========== ERRO NO LOGIN ==========');
            console.error('❌ Código do erro:', authError.code);
            console.error('❌ Mensagem do erro:', authError.message);
            console.error('❌ Erro completo:', authError);
            
            if (authError.code === 'auth/invalid-credential' || 
                authError.code === 'auth/wrong-password') {
                console.error('   → Senha incorreta ou credencial inválida');
                this.showError('Login ou senha incorretos!');
            } else if (authError.code === 'auth/user-not-found') {
                console.error('   → Usuário não encontrado no Auth');
                console.error('   → Verificando se é primeiro acesso de paciente...');
                await this.handlePrimeiroAcesso(loginInput, password);
            } else if (authError.code === 'auth/too-many-requests') {
                console.error('   → Muitas tentativas!');
                this.showError('Muitas tentativas! Tente novamente mais tarde.');
            } else if (authError.code === 'permission-denied' || authError.message.includes('Missing or insufficient permissions')) {
                console.error('   → ERRO DE PERMISSÃO DO FIRESTORE!');
                console.error('   → O usuário está autenticado mas não tem permissão para ler o documento');
                console.error('   → Verifique as regras do Firestore para a coleção "logins"');
                this.showError('Erro de permissão no banco de dados. Contate o administrador.');
            } else {
                console.error('   → Erro desconhecido:', authError.message);
                this.showError('Erro: ' + authError.message);
            }
        } catch (error) {
            console.error('========== ERRO INESPERADO ==========');
            console.error('❌ Erro:', error);
            this.showError('Erro ao conectar com o servidor: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async handlePrimeiroAcesso(loginInput, password) {
        console.log('🔍 Verificando primeiro acesso para:', loginInput);
        
        try {
            // Verificar se o usuário existe no Firestore
            console.log('📁 Buscando documento no Firestore:', loginInput);
            const userRef = doc(db, "logins", loginInput);
            const userDoc = await getDoc(userRef);
            
            console.log('   - Documento existe?', userDoc.exists());
            
            if (!userDoc.exists()) {
                console.error('❌ Login não encontrado no Firestore!');
                this.showError('Login não encontrado!');
                return;
            }
            
            const userData = userDoc.data();
            console.log('   - Cargo do usuário:', userData.cargo);
            
            // Só paciente pode ter primeiro acesso
            if (userData.cargo !== 'paciente') {
                console.error('❌ Usuário não é paciente. Cargo:', userData.cargo);
                this.showError('Usuário não encontrado no sistema. Contate o administrador.');
                return;
            }
            
            // Verificar código temporário
            console.log('🔑 Verificando código temporário...');
            if (password !== userData.codigo_temporario) {
                console.error('❌ Código temporário inválido!');
                this.showError('Código temporário inválido!');
                return;
            }
            
            const dataExpiracao = new Date(userData.codigo_expiracao);
            console.log('   - Data de expiração:', dataExpiracao);
            console.log('   - Código expirado?', dataExpiracao < new Date());
            
            if (dataExpiracao < new Date()) {
                console.error('❌ Código expirado!');
                this.showError('Código expirado! Solicite um novo código ao profissional.');
                return;
            }
            
            const emailMontado = `${loginInput.toLowerCase()}@tratamentoweb.com`;
            console.log('✅ Primeiro acesso válido! Email montado:', emailMontado);
            
            this.tempData = {
                login: loginInput,
                email: emailMontado,
                nome: userData.nome,
                cargo: userData.cargo,
                perfil: userData.perfil,
                userRef: userRef
            };
            
            this.showCreatePasswordScreen();
            
        } catch (error) {
            console.error("❌ Erro ao verificar primeiro acesso:", error);
            this.showError('Erro ao verificar dados. Tente novamente.');
        }
    }

    showCreatePasswordScreen() {
        console.log('📱 Mostrando tela de criação de senha para:', this.tempData.login);
        
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
                const icon = toggleNew.querySelector('i');
                if (icon) {
                    icon.classList.toggle('bi-eye');
                    icon.classList.toggle('bi-eye-slash');
                }
            });
        }
        
        if (toggleConfirm && confirmPassword) {
            toggleConfirm.addEventListener('click', () => {
                const type = confirmPassword.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPassword.setAttribute('type', type);
                const icon = toggleConfirm.querySelector('i');
                if (icon) {
                    icon.classList.toggle('bi-eye');
                    icon.classList.toggle('bi-eye-slash');
                }
            });
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = newPassword.value;
            const confirm = confirmPassword.value;
            
            console.log('🔐 Criando nova senha para:', this.tempData.login);
            
            if (password !== confirm) {
                console.error('❌ Senhas não coincidem');
                this.showError('As senhas não coincidem!', 'createPasswordForm');
                return;
            }
            
            if (password.length < 6) {
                console.error('❌ Senha muito curta');
                this.showError('A senha deve ter no mínimo 6 caracteres!', 'createPasswordForm');
                return;
            }
            
            try {
                console.log('📧 Criando conta no Auth com email:', this.tempData.email);
                await createUserWithEmailAndPassword(auth, this.tempData.email, password);
                console.log('✅ Conta criada no Auth com sucesso!');
                
                console.log('📝 Atualizando Firestore...');
                await updateDoc(this.tempData.userRef, {
                    ultimo_login: serverTimestamp(),
                    codigo_temporario: deleteField(),
                    codigo_expiracao: deleteField(),
                    email: this.tempData.email
                });
                console.log('✅ Firestore atualizado!');
                
                const updatedDoc = await getDoc(this.tempData.userRef);
                const userData = updatedDoc.data();
                userData.login = this.tempData.login;
                userData.email = this.tempData.email;
                
                if (!userData.perfil) {
                    userData.perfil = 'operador';
                }
                
                localStorage.setItem('currentUser', JSON.stringify(userData));
                console.log('✅ Primeiro acesso concluído! Redirecionando para HOME...');
                this.showHome(userData);
                
            } catch (authError) {
                console.error("❌ Erro ao criar usuário:", authError);
                
                if (authError.code === 'auth/email-already-in-use') {
                    this.showError('Este login já possui cadastro. Contate o administrador.', 'createPasswordForm');
                } else if (authError.code === 'auth/weak-password') {
                    this.showError('Senha muito fraca. Use pelo menos 6 caracteres.', 'createPasswordForm');
                } else {
                    this.showError('Erro ao criar conta: ' + authError.message, 'createPasswordForm');
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
    console.log('🚀 Aplicação TratamentoWeb iniciada');
    new LoginManager();
});
