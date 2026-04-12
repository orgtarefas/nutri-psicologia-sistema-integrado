import { 
    db, 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    getDoc, 
    addDoc, 
    auth, 
    createUserWithEmailAndPassword, 
    signOut, 
    serverTimestamp,
    updateDoc
} from '../0_firebase_api_config.js';
import { deleteField } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { HomeCliente } from './home_cliente.js';
import { HomeNutricionista } from './home_nutricionista.js';
import { HomePsicologo } from './home_psicologo.js';

// ==================== FUNÇÕES COMPARTILHADAS ====================

export class FuncoesCompartilhadas {
    
    // ==================== UTILITÁRIOS GERAIS ====================
    
    static gerarCodigoTemporario() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    static gerarEmailPorLogin(login) {
        return `${login.toLowerCase()}@tratamentoweb.com`;
    }
    
    static formatDateToDisplay(dateString) {
        if (!dateString) return '';
        const partes = dateString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dateString;
    }
    
    static formatarDataHoraCadastro() {
        const agora = new Date();
        const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                       'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        
        const dia = agora.getDate();
        const mes = meses[agora.getMonth()];
        const ano = agora.getFullYear();
        const horas = agora.getHours().toString().padStart(2, '0');
        const minutos = agora.getMinutes().toString().padStart(2, '0');
        const segundos = agora.getSeconds().toString().padStart(2, '0');
        
        const offset = -agora.getTimezoneOffset() / 60;
        const offsetSinal = offset >= 0 ? '+' : '';
        const offsetStr = `UTC${offsetSinal}${offset}`;
        
        return `${dia} de ${mes} de ${ano} às ${horas}:${minutos}:${segundos} ${offsetStr}`;
    }
    
    static validarIdade(dataNascimento) {
        if (!dataNascimento) return false;
        const dataNasc = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mesDiff = hoje.getMonth() - dataNasc.getMonth();
        if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < dataNasc.getDate())) {
            idade--;
        }
        return idade >= 18;
    }
    
    static calcularIdade(dataNascimento) {
        if (!dataNascimento) return null;
        const dataNasc = new Date(dataNascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mesDiff = hoje.getMonth() - dataNasc.getMonth();
        if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < dataNasc.getDate())) {
            idade--;
        }
        return idade;
    }
    
    static getPerfilPadrao(cargo) {
        const mapaPerfis = {
            'paciente': 'operador',
            'cliente': 'operador',
            'nutricionista': 'supervisor_nutricionista',
            'psicologo': 'supervisor_psicologo',
            'desenvolvedor': 'admin',
            'admin': 'admin'
        };
        return mapaPerfis[cargo] || 'operador';
    }
    
    static getPerfilDisplayName(perfil) {
        const nomes = {
            'operador': 'Operador',
            'operador_membro': 'Membro',
            'supervisor_nutricionista': 'Supervisor Nutrição',
            'supervisor_psicologo': 'Supervisor Psicologia',
            'gerente_nutricionista': 'Gerente Nutrição',
            'admin': 'Administrador'
        };
        return nomes[perfil] || perfil;
    }
    
    static getPerfilBadgeClass(perfil) {
        const classes = {
            'operador': 'perfil-operador',
            'operador_membro': 'perfil-operador-membro',
            'supervisor_nutricionista': 'perfil-supervisor',
            'supervisor_psicologo': 'perfil-supervisor',
            'gerente_nutricionista': 'perfil-gerente',
            'admin': 'perfil-admin'
        };
        return classes[perfil] || 'perfil-operador';
    }
    
    static getCargoDisplayName(cargo) {
        const nomes = {
            'paciente': 'Paciente',
            'nutricionista': 'Nutricionista',
            'psicologo': 'Psicólogo',
            'desenvolvedor': 'Administrador'
        };
        return nomes[cargo] || cargo;
    }
    
    // ==================== FUNÇÕES DE PACIENTE ====================
    
    static async loadPacientesList() {
        try {
            const querySnapshot = await getDocs(collection(db, "logins"));
            const pacientesList = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.cargo === 'paciente') {
                    pacientesList.push({
                        login: doc.id,
                        nome: data.nome,
                        email: data.email,
                        dataNascimento: data.dataNascimento,
                        sexo: data.sexo,
                        status_ativo: data.status_ativo,
                        cargo: data.cargo,
                        perfil: data.perfil,
                        dataHoraCadastro: data.dataHoraCadastro,
                        hasUltimoLogin: data.hasOwnProperty('ultimo_login')
                    });
                }
            });
            
            return pacientesList;
        } catch (error) {
            console.error("Erro ao carregar pacientes:", error);
            return [];
        }
    }
    
    static async verificarLoginExistente(login) {
        try {
            const userRef = doc(db, "logins", login);
            const userDoc = await getDoc(userRef);
            return userDoc.exists();
        } catch (error) {
            console.error("Erro ao verificar login:", error);
            return false;
        }
    }
    
    static async registerPaciente(pacienteData) {
        const { nome, login, dataNascimento, sexo } = pacienteData;
        
        if (!nome || !login || !dataNascimento || !sexo) {
            throw new Error('Preencha todos os campos!');
        }
        
        if (login.includes(' ')) {
            throw new Error('O login não pode conter espaços!');
        }
        
        if (!this.validarIdade(dataNascimento)) {
            throw new Error('Paciente deve ter 18 anos ou mais!');
        }
        
        const codigo = this.gerarCodigoTemporario();
        const emailGerado = this.gerarEmailPorLogin(login);
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 7);
        
        const loginExiste = await this.verificarLoginExistente(login);
        if (loginExiste) {
            throw new Error('❌ Este login já está cadastrado! Escolha outro.');
        }
        
        try {
            const pacienteRef = doc(db, "logins", login);
            
            const pacienteDataToSave = {
                nome: nome.toUpperCase(),
                email: emailGerado,
                dataNascimento: dataNascimento,
                sexo: sexo,
                cargo: "paciente",
                perfil: "operador",
                status_ativo: true,
                dataHoraCadastro: this.formatarDataHoraCadastro(),
                codigo_temporario: codigo,
                codigo_expiracao: dataExpiracao.toISOString()
            };
            
            await setDoc(pacienteRef, pacienteDataToSave);
            
            return { 
                success: true, 
                message: `✅ Paciente "${nome}" cadastrado com sucesso!`,
                codigo: codigo,
                login: login
            };
            
        } catch (error) {
            console.error("Erro ao cadastrar paciente:", error);
            throw new Error('❌ Erro ao cadastrar paciente: ' + error.message);
        }
    }
    
    // ==================== FUNÇÕES DE GESTÃO DE CÓDIGO ====================
    
    static async visualizarCodigoPaciente(login) {
        try {
            const userRef = doc(db, "logins", login);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('Paciente não encontrado!');
            }
            
            const userData = userDoc.data();
            
            if (userData.hasOwnProperty('ultimo_login')) {
                throw new Error('❌ Este paciente já fez o primeiro acesso!');
            }
            
            if (!userData.codigo_temporario) {
                throw new Error('❌ Nenhum código temporário encontrado.');
            }
            
            const dataExpiracao = new Date(userData.codigo_expiracao);
            if (dataExpiracao < new Date()) {
                throw new Error('⚠️ O código expirou! Gere um novo código.');
            }
            
            return {
                success: true,
                codigo: userData.codigo_temporario,
                expiracao: userData.codigo_expiracao,
                nome: userData.nome,
                login: login
            };
            
        } catch (error) {
            console.error("Erro ao visualizar código:", error);
            throw error;
        }
    }
    
    static async regenerarCodigoPaciente(login) {
        try {
            const userRef = doc(db, "logins", login);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('Paciente não encontrado!');
            }
            
            const userData = userDoc.data();
            
            if (userData.hasOwnProperty('ultimo_login')) {
                throw new Error('❌ Este paciente já fez o primeiro acesso!');
            }
            
            const novoCodigo = this.gerarCodigoTemporario();
            const dataExpiracao = new Date();
            dataExpiracao.setDate(dataExpiracao.getDate() + 7);
            
            await updateDoc(userRef, {
                codigo_temporario: novoCodigo,
                codigo_expiracao: dataExpiracao.toISOString()
            });
            
            return {
                success: true,
                codigo: novoCodigo,
                expiracao: dataExpiracao.toISOString(),
                nome: userData.nome,
                login: login
            };
            
        } catch (error) {
            console.error("Erro ao regenerar código:", error);
            throw error;
        }
    }
    
    // ==================== FUNÇÕES DE RESET DE SENHA ====================
    
    static async resetarSenhaPaciente(login) {
        try {
            const userRef = doc(db, "logins", login);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('Paciente não encontrado!');
            }
            
            const userData = userDoc.data();
            
            if (!userData.hasOwnProperty('ultimo_login')) {
                throw new Error('❌ Este paciente ainda não fez o primeiro acesso! Use a opção de gerar código.');
            }
            
            const tokenReset = this.gerarCodigoTemporario();
            const dataExpiracao = new Date();
            dataExpiracao.setHours(dataExpiracao.getHours() + 1);
            
            await updateDoc(userRef, {
                reset_token: tokenReset,
                reset_token_expiracao: dataExpiracao.toISOString()
            });
            
            return {
                success: true,
                token: tokenReset,
                expiracao: dataExpiracao.toISOString(),
                nome: userData.nome,
                login: login
            };
            
        } catch (error) {
            console.error("Erro ao resetar senha:", error);
            throw error;
        }
    }
    
    static async visualizarTokenReset(login) {
        try {
            const userRef = doc(db, "logins", login);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('Paciente não encontrado!');
            }
            
            const userData = userDoc.data();
            
            if (!userData.reset_token) {
                throw new Error('❌ Nenhum token de reset ativo. Gere um novo token.');
            }
            
            const dataExpiracao = new Date(userData.reset_token_expiracao);
            if (dataExpiracao < new Date()) {
                throw new Error('⚠️ Token expirado! Gere um novo token.');
            }
            
            return {
                success: true,
                token: userData.reset_token,
                expiracao: userData.reset_token_expiracao,
                nome: userData.nome,
                login: login
            };
            
        } catch (error) {
            console.error("Erro ao visualizar token:", error);
            throw error;
        }
    }
    
    static async limparTokenReset(login) {
        try {
            const userRef = doc(db, "logins", login);
            await updateDoc(userRef, {
                reset_token: deleteField(),
                reset_token_expiracao: deleteField()
            });
            return { success: true };
        } catch (error) {
            console.error("Erro ao limpar token:", error);
            throw error;
        }
    }

    static async updatePaciente(login, data) {
        try {
            const userRef = doc(db, "logins", login);
            await updateDoc(userRef, data);
            return { success: true };
        } catch (error) {
            console.error("Erro ao atualizar paciente:", error);
            throw new Error('Erro ao atualizar dados do paciente');
        }
    }
    
    // ==================== FUNÇÕES DE LISTA DE PACIENTES (HTML) ====================
    
    static gerarTabelaPacientes(pacientesList, callbacks) {
        if (pacientesList.length === 0) {
            return '<p style="text-align: center; padding: 40px; color: #666;">Nenhum paciente cadastrado.</p>';
        }
        
        let html = `<div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden;">
                <thead>
                    <tr style="background: #1a237e; color: white;">
                        <th style="padding: 12px; text-align: left;">Paciente</th>
                        <th style="padding: 12px; text-align: left;">Login</th>
                        <th style="padding: 12px; text-align: center;">Status</th>
                        <th style="padding: 12px; text-align: center;">Ações</th>
                    </tr>
                </thead>
                <tbody>`;
        
        for (const paciente of pacientesList) {
            const hasPrimeiroAcesso = paciente.hasUltimoLogin;
            
            const statusBadge = hasPrimeiroAcesso 
                ? '<span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 20px; font-size: 11px;">✅ Já acessou</span>'
                : '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 20px; font-size: 11px;">⏳ Aguardando 1º acesso</span>';
            
            html += `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px;">
                        <strong>${paciente.nome}</strong><br>
                        <small style="color: #666;">Cadastro: ${paciente.dataHoraCadastro || 'Data não registrada'}</small>
                    </td>
                    <td style="padding: 12px;"><code style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">${paciente.login}</code></td>
                    <td style="padding: 12px; text-align: center;">${statusBadge}</td>
                    <td style="padding: 12px; text-align: center;">`;
            
            if (!hasPrimeiroAcesso) {
                html += `
                    <button class="btn-ver-codigo" data-login="${paciente.login}" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 8px; margin-right: 8px; cursor: pointer;">👁️ Ver Código</button>
                    <button class="btn-regerar-codigo" data-login="${paciente.login}" style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">🔄 Gerar Código</button>
                `;
            } else {
                html += `
                    <button class="btn-reset-senha" data-login="${paciente.login}" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; margin-right: 8px; cursor: pointer;">🔑 Reset Senha</button>
                    <button class="btn-ver-token" data-login="${paciente.login}" style="background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">👁️ Ver Token</button>
                `;
            }
            
            html += `</td></tr>`;
        }
        
        html += `</tbody></table></div>`;
        
        return html;
    }
    
    // ==================== FUNÇÕES DE AVALIAÇÃO ====================
    
    static async loadEvaluationsByPatient(patientLogin) {
        try {
            const querySnapshot = await getDocs(collection(db, "avaliacao_nutricional"));
            const evaluations = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.paciente_login === patientLogin) {
                    evaluations.push({ id: doc.id, ...data });
                }
            });
            
            evaluations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            return evaluations;
            
        } catch (error) {
            console.error("Erro ao carregar avaliações:", error);
            return [];
        }
    }
    
    static async saveNutritionalEvaluation(evaluationData) {
        try {
            const docRef = await addDoc(collection(db, "avaliacao_nutricional"), {
                ...evaluationData,
                timestamp: new Date().toISOString()
            });
            return { success: true, message: '✅ Avaliação salva com sucesso!', id: docRef.id };
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error);
            throw new Error('Erro ao salvar avaliação: ' + error.message);
        }
    }
    
    static calculateNutritionalParameters(weight, height, idade, sexo) {
        if (!weight || !height || height <= 0) return null;
        
        const imc = weight / (height * height);
        
        let classification = '';
        if (imc < 18.5) classification = 'Abaixo do peso';
        else if (imc < 25) classification = 'Peso normal';
        else if (imc < 30) classification = 'Sobrepeso';
        else if (imc < 35) classification = 'Obesidade grau I';
        else if (imc < 40) classification = 'Obesidade grau II';
        else classification = 'Obesidade grau III';
        
        let percentualMassaMuscularIdeal = 0;
        
        if (sexo === 'masculino') {
            if (idade <= 35) percentualMassaMuscularIdeal = 42;
            else if (idade <= 55) percentualMassaMuscularIdeal = 38;
            else if (idade <= 75) percentualMassaMuscularIdeal = 33.5;
            else percentualMassaMuscularIdeal = 30;
        } else {
            if (idade <= 35) percentualMassaMuscularIdeal = 27.5;
            else if (idade <= 55) percentualMassaMuscularIdeal = 26;
            else if (idade <= 75) percentualMassaMuscularIdeal = 24;
            else percentualMassaMuscularIdeal = 22;
        }
        
        if (imc > 25 && imc < 30) percentualMassaMuscularIdeal -= 1;
        else if (imc >= 30) percentualMassaMuscularIdeal -= 2;
        else if (imc < 18.5) percentualMassaMuscularIdeal -= 2;
        
        percentualMassaMuscularIdeal = Math.min(50, Math.max(20, percentualMassaMuscularIdeal));
        const massaMuscularIdealKg = (weight * percentualMassaMuscularIdeal) / 100;
        
        let percentualGorduraIdeal = 0;
        
        if (sexo === 'masculino') {
            if (idade < 30) percentualGorduraIdeal = 14;
            else if (idade < 50) percentualGorduraIdeal = 16;
            else percentualGorduraIdeal = 18;
        } else {
            if (idade < 30) percentualGorduraIdeal = 21;
            else if (idade < 50) percentualGorduraIdeal = 23;
            else percentualGorduraIdeal = 25;
        }
        
        if (imc < 18.5) percentualGorduraIdeal -= 2;
        else if (imc > 25) percentualGorduraIdeal += 2;
        if (imc > 30) percentualGorduraIdeal += 2;
        
        percentualGorduraIdeal = Math.min(35, Math.max(10, percentualGorduraIdeal));
        
        let idealBodyWater = 0;
        
        if (sexo === 'masculino') {
            if (idade < 30) idealBodyWater = 62;
            else if (idade < 50) idealBodyWater = 60;
            else idealBodyWater = 58;
        } else {
            if (idade < 30) idealBodyWater = 58;
            else if (idade < 50) idealBodyWater = 56;
            else idealBodyWater = 54;
        }
        
        if (imc > 25) idealBodyWater -= 3;
        if (imc > 30) idealBodyWater -= 2;
        idealBodyWater = Math.min(70, Math.max(45, idealBodyWater));
        
        return {
            imc: imc.toFixed(2),
            classification: classification,
            idealMuscleMass: massaMuscularIdealKg.toFixed(1),
            idealBodyFat: percentualGorduraIdeal + '%',
            idealBodyWater: idealBodyWater + '%'
        };
    }
    
    // ==================== FUNÇÕES DE UI ====================
    
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'block';
    }
    
    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }
    
    static setupModalEvents(modalId) {
        const modal = document.getElementById(modalId);
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal(modalId);
        }
        
        window.onclick = (event) => {
            if (event.target === modal) {
                this.closeModal(modalId);
            }
        };
    }
    
    static showError(message, formId = 'loginForm') {
        const existingError = document.querySelector('.error-message-custom');
        if (existingError) existingError.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message-custom';
        errorDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i><span>${message}</span>`;
        
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
    
    static async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout do Auth:", error);
        }
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
}

// ==================== GERENCIADOR PRINCIPAL ====================

export class HomeManager {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.currentHome = null;
        this.funcoes = FuncoesCompartilhadas;
        this.isAdmin = (userInfo.cargo === 'desenvolvedor' || userInfo.perfil === 'admin');
        
        // Guardar o userInfo original do admin
        this.originalUserInfo = { ...userInfo };
        
        // Estado de visualização temporária (não altera o admin)
        this.previewMode = null; // 'nutricionista', 'psicologo', 'paciente'
    }

    render() {
        if (this.isAdmin) {
            // Admin sempre vê o dashboard, mesmo em preview
            this.showAdminDashboard();
        } else {
            this.showHomeByCargo(this.userInfo.cargo);
        }
    }
    
    // ==================== DASHBOARD DO ADMIN ====================
    
    showAdminDashboard() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderAdminDashboard();
        this.attachAdminEvents();
    }
    
    renderAdminDashboard() {
        const perfilBadgeClass = this.funcoes.getPerfilBadgeClass(this.userInfo.perfil);
        const perfilDisplayName = this.funcoes.getPerfilDisplayName(this.userInfo.perfil);
        
        // Mostrar se está em modo de preview
        const previewBadge = this.previewMode ? 
            `<span class="preview-badge">🔍 Visualizando como: ${this.previewMode === 'nutricionista' ? '🍎 Nutricionista' : this.previewMode === 'psicologo' ? '🧠 Psicólogo' : '👤 Paciente'}</span>` : '';
        
        return `
            <div class="dashboard-container">
                <div class="top-bar">
                    <div class="logo-area">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="logo">
                        <h2>Admin - TratamentoWeb</h2>
                    </div>
                    <div class="top-bar-actions">
                        <div class="user-greeting">
                            <span>👋 ${this.userInfo.nome}</span>
                            <span class="role-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                            ${previewBadge}
                        </div>
                        <button class="menu-toggle" id="menuToggle">
                            <span class="menu-icon">☰</span>
                        </button>
                    </div>
                </div>

                <!-- MENU LATERAL COMPLETO DO ADMIN -->
                <div class="side-menu" id="sideMenu">
                    <div class="menu-header">
                        <h3>Menu Administrativo</h3>
                        <button class="close-menu" id="closeMenu">×</button>
                    </div>
                    <nav class="menu-nav">
                        <button class="menu-item ${!this.previewMode ? 'active' : ''}" data-module="admin_dashboard">
                            <span class="menu-icon">📊</span>
                            <span>Dashboard Admin</span>
                        </button>
                        <div class="menu-divider">Visualizações</div>
                        <button class="menu-item ${this.previewMode === 'nutricionista' ? 'active' : ''}" data-module="preview_nutricionista">
                            <span class="menu-icon">🍎</span>
                            <span>Ver como Nutricionista</span>
                        </button>
                        <button class="menu-item ${this.previewMode === 'psicologo' ? 'active' : ''}" data-module="preview_psicologo">
                            <span class="menu-icon">🧠</span>
                            <span>Ver como Psicólogo</span>
                        </button>
                        <button class="menu-item ${this.previewMode === 'paciente' ? 'active' : ''}" data-module="preview_paciente">
                            <span class="menu-icon">👤</span>
                            <span>Ver como Paciente</span>
                        </button>
                        ${this.previewMode ? `
                            <button class="menu-item" data-module="exit_preview">
                                <span class="menu-icon">🚪</span>
                                <span>Sair da Visualização</span>
                            </button>
                        ` : ''}
                        <div class="menu-divider">Módulos</div>
                        <button class="menu-item" data-module="plano_alimentar">
                            <span class="menu-icon">🍽️</span>
                            <span>Plano Alimentar</span>
                        </button>
                        <button class="menu-item" data-module="cadastro_cliente">
                            <span class="menu-icon">👥</span>
                            <span>Clientes</span>
                        </button>
                        <button class="menu-item" data-module="usuarios">
                            <span class="menu-icon">👥</span>
                            <span>Gerenciar Usuários</span>
                        </button>
                        <div class="menu-divider">Sistema</div>
                        <button class="menu-item logout" id="logoutMenuItem">
                            <span class="menu-icon">🚪</span>
                            <span>Sair</span>
                        </button>
                    </nav>
                </div>
                <div class="menu-overlay" id="menuOverlay"></div>

                <div class="main-content">
                    <div class="admin-welcome">
                        <h2>Bem-vindo, Administrador ${this.userInfo.nome}!</h2>
                        ${this.previewMode ? 
                            `<p>🔍 Você está visualizando o sistema como <strong>${this.previewMode === 'nutricionista' ? 'Nutricionista' : this.previewMode === 'psicologo' ? 'Psicólogo' : 'Paciente'}</strong>. Clique em "Sair da Visualização" para voltar ao modo Admin.</p>` :
                            `<p>Utilize o menu lateral para navegar entre os diferentes módulos do sistema ou escolha uma visualização para ver como outros perfis enxergam o sistema.</p>`
                        }
                    </div>
                    
                    <div class="admin-cards">
                        <div class="admin-card" data-module="preview_nutricionista">
                            <div class="admin-card-icon">🍎</div>
                            <h3>Nutricionista</h3>
                            <p>Visualizar o sistema como nutricionista</p>
                            <span class="card-badge">Preview</span>
                        </div>
                        <div class="admin-card" data-module="preview_psicologo">
                            <div class="admin-card-icon">🧠</div>
                            <h3>Psicólogo</h3>
                            <p>Visualizar o sistema como psicólogo</p>
                            <span class="card-badge">Preview</span>
                        </div>
                        <div class="admin-card" data-module="preview_paciente">
                            <div class="admin-card-icon">👤</div>
                            <h3>Paciente</h3>
                            <p>Visualizar o sistema como paciente</p>
                            <span class="card-badge">Preview</span>
                        </div>
                        <div class="admin-card" data-module="plano_alimentar">
                            <div class="admin-card-icon">🍽️</div>
                            <h3>Plano Alimentar</h3>
                            <p>Gerenciar planos alimentares</p>
                            <span class="card-badge">Gerenciar</span>
                        </div>
                        <div class="admin-card" data-module="cadastro_cliente">
                            <div class="admin-card-icon">👥</div>
                            <h3>Clientes</h3>
                            <p>Gerenciar cadastro de clientes</p>
                            <span class="card-badge">Gerenciar</span>
                        </div>
                        <div class="admin-card" data-module="usuarios">
                            <div class="admin-card-icon">⚙️</div>
                            <h3>Usuários</h3>
                            <p>Gerenciar usuários do sistema</p>
                            <span class="card-badge">Admin</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    attachAdminEvents() {
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeMenu = document.getElementById('closeMenu');

        const openMenu = () => sideMenu.classList.add('open');
        const closeMenuFunc = () => sideMenu.classList.remove('open');
        if (menuToggle) menuToggle.addEventListener('click', openMenu);
        if (closeMenu) closeMenu.addEventListener('click', closeMenuFunc);
        if (menuOverlay) menuOverlay.addEventListener('click', closeMenuFunc);

        // Logout
        const logoutMenuItem = document.getElementById('logoutMenuItem');
        if (logoutMenuItem) logoutMenuItem.addEventListener('click', () => this.funcoes.logout());

        // Menu items e cards navigation
        document.querySelectorAll('.menu-item[data-module], .admin-card[data-module]').forEach(item => {
            item.addEventListener('click', async (e) => {
                const module = item.getAttribute('data-module');
                closeMenuFunc();
                await this.navigateAdminTo(module);
            });
        });
    }
    
    async navigateAdminTo(module) {
        switch(module) {
            case 'admin_dashboard':
                this.previewMode = null;
                this.showAdminDashboard();
                break;
            case 'preview_nutricionista':
                this.previewMode = 'nutricionista';
                this.showPreviewAs('nutricionista', 'supervisor_nutricionista');
                break;
            case 'preview_psicologo':
                this.previewMode = 'psicologo';
                this.showPreviewAs('psicologo', 'supervisor_psicologo');
                break;
            case 'preview_paciente':
                this.previewMode = 'paciente';
                this.showPreviewAs('paciente', 'operador');
                break;
            case 'exit_preview':
                this.previewMode = null;
                this.showAdminDashboard();
                break;
            case 'plano_alimentar':
                const { PlanoAlimentarNutricionista } = await import('./plano_alimentar_nutricionista.js');
                const pacientesList = await this.funcoes.loadPacientesList();
                const planoAlimentar = new PlanoAlimentarNutricionista(this.userInfo, pacientesList);
                planoAlimentar.render();
                break;
            case 'cadastro_cliente':
                const { CadastroCliente } = await import('./cadastro_cliente.js');
                const cadastroCliente = new CadastroCliente(this.userInfo);
                cadastroCliente.render();
                break;
            case 'usuarios':
                alert('👥 Módulo Gerenciar Usuários em desenvolvimento');
                break;
        }
    }
    
    // Mostrar preview sem perder o admin
    showPreviewAs(cargo, perfil) {
        // Criar um objeto de visualização TEMPORÁRIO
        // O admin original permanece intacto
        const previewUserInfo = {
            ...this.userInfo,  // Mantém todos os dados do admin
            cargo: cargo,
            perfil: perfil,
            isPreviewMode: true,
            originalCargo: this.userInfo.cargo,
            originalPerfil: this.userInfo.perfil
        };
        
        // Renderizar a tela correspondente
        switch(cargo) {
            case 'nutricionista':
                const homeNutri = new HomeNutricionista(previewUserInfo);
                homeNutri.render();
                break;
            case 'psicologo':
                const homePsi = new HomePsicologo(previewUserInfo);
                homePsi.render();
                break;
            case 'paciente':
                const homePaciente = new HomeCliente(previewUserInfo);
                homePaciente.render();
                break;
        }
    }
    
    // ==================== MÉTODOS LEGADO (mantidos para compatibilidade) ====================
    
    async navigateToCadastroCliente() {
        const { CadastroCliente } = await import('./cadastro_cliente.js');
        const cadastroScreen = new CadastroCliente(this.userInfo);
        cadastroScreen.render();
    }
    
    setupAdminViewSelector() {
        // Não usado mais, mantido para compatibilidade
    }
    
    showHomeByCargo(cargo, customPerfil = null) {
        let viewUserInfo = { ...this.userInfo };
        
        if (this.isAdmin) {
            let perfilFinal = customPerfil;
            if (!perfilFinal) {
                perfilFinal = this.funcoes.getPerfilPadrao(cargo);
            }
            
            viewUserInfo = {
                ...this.userInfo,
                cargo: cargo === 'paciente_membro' ? 'paciente' : cargo,
                perfil: perfilFinal,
                isAdminView: true,
                viewCargo: cargo
            };
        }
        
        switch(cargo) {
            case 'paciente':
            case 'paciente_membro':
                const perfilMembro = cargo === 'paciente_membro' ? 'operador_membro' : 'operador';
                viewUserInfo.cargo = 'paciente';
                viewUserInfo.perfil = perfilMembro;
                this.currentHome = new HomeCliente(viewUserInfo);
                break;
            case 'nutricionista':
                this.currentHome = new HomeNutricionista(viewUserInfo);
                break;
            case 'psicologo':
                this.currentHome = new HomePsicologo(viewUserInfo);
                break;
            default:
                this.currentHome = new HomeNutricionista(viewUserInfo);
        }
        
        this.currentHome.render();
    }
}
