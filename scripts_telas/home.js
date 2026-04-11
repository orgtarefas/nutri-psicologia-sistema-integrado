import { db, collection, getDocs, doc, setDoc, getDoc, addDoc, auth, createUserWithEmailAndPassword, signOut, serverTimestamp } from '../0_firebase_api_config.js';
import { HomeCliente } from './home_cliente.js';
import { HomeNutricionista } from './home_nutricionista.js';
import { HomePsicologo } from './home_psicologo.js';

// ==================== FUNÇÕES COMPARTILHADAS ====================

export class FuncoesCompartilhadas {
    
    // ==================== UTILITÁRIOS GERAIS ====================
    
    // Gera código aleatório de 6 dígitos
    static gerarCodigoTemporario() {
        return Math.floor(100000 + Math.random()  * 900000).toString();
    }
    
    // Gera e-mail automático baseado no login
    static gerarEmailPorLogin(login) {
        return `${login.toLowerCase()}@tratamentoweb.com`;
    }
    
    // Formatar data de YYYY-MM-DD para DD/MM/YYYY para exibição
    static formatDateToDisplay(dateString) {
        if (!dateString) return '';
        const partes = dateString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dateString;
    }
    
    // Formatar data para exibição completa
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
    
    // Validar idade mínima (18 anos)
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
    
    // Mapeamento de perfis padrão por cargo
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
    
    // Nome amigável do perfil
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
    
    // Classe CSS do badge do perfil
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
    
    // Nome amigável do cargo para visualização
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
    
    static async registerPaciente(pacienteData, codigoTemporario = null) {
        const { nome, login, dataNascimento, sexo } = pacienteData;
        
        if (!nome || !login || !dataNascimento || !sexo) {
            throw new Error('Preencha todos os campos!');
        }
        
        if (login.includes(' ')) {
            throw new Error('O login não pode conter espaços!');
        }
        
        // Validar idade mínima
        if (!this.validarIdade(dataNascimento)) {
            throw new Error('Paciente deve ter 18 anos ou mais!');
        }
        
        // Gerar código temporário se não foi fornecido
        const codigo = codigoTemporario || this.gerarCodigoTemporario();
        const emailGerado = this.gerarEmailPorLogin(login);
        
        // Verificar se o login já existe
        const loginExiste = await this.verificarLoginExistente(login);
        if (loginExiste) {
            throw new Error('❌ Este login já está cadastrado! Escolha outro.');
        }
        
        try {
            // Salvar no Firestore (SEM criar usuário no Auth)
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
                dataCadastro: new Date().toISOString()
                // ⚠️ NÃO TEM campo ultimo_login - será criado no primeiro login
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
    
    // ==================== FUNÇÕES DE CÁLCULO NUTRICIONAL ====================
    
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
    
    static showSuccess(message, formId) {
        const existingSuccess = document.querySelector('.success-message-custom');
        if (existingSuccess) existingSuccess.remove();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message-custom';
        successDiv.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            <span>${message}</span>
        `;
        
        const form = document.getElementById(formId);
        if (form) {
            const button = form.querySelector('button');
            if (button) {
                form.insertBefore(successDiv, button);
            } else {
                form.appendChild(successDiv);
            }
        }
        
        setTimeout(() => {
            if (successDiv) successDiv.remove();
        }, 3000);
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
        
        if (this.isAdmin) {
            this.originalCargo = this.userInfo.cargo;
            this.originalPerfil = this.userInfo.perfil;
            this.currentViewCargo = 'nutricionista';
            this.currentViewPerfil = 'supervisor_nutricionista';
        }
    }

    render() {
        if (this.isAdmin) {
            this.showHomeByCargo(this.currentViewCargo);
            setTimeout(() => this.setupAdminViewSelector(), 100);
        } else {
            this.showHomeByCargo(this.userInfo.cargo);
        }
    }
    
    setupAdminViewSelector() {
        const userInfoDiv = document.querySelector('.user-info');
        if (!userInfoDiv) return;
        
        const existingSelector = document.getElementById('adminViewSelector');
        if (existingSelector) existingSelector.remove();
                
        const selectorHtml = `
            <select id="adminViewSelector" class="role-selector" style="background: #f97316; border-color: #f97316;">
                <option value="nutricionista|supervisor_nutricionista" ${this.currentViewCargo === 'nutricionista' ? 'selected' : ''}>🍎 Visualizar como Nutricionista</option>
                <option value="psicologo|supervisor_psicologo" ${this.currentViewCargo === 'psicologo' ? 'selected' : ''}>🧠 Visualizar como Psicólogo</option>
                <option value="paciente|operador" ${this.currentViewCargo === 'paciente' ? 'selected' : ''}>👤 Visualizar como Paciente</option>
                <option value="paciente_membro|operador_membro" ${this.currentViewCargo === 'paciente_membro' ? 'selected' : ''}>⭐ Visualizar como Paciente Membro</option>
            </select>
        `;
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.insertAdjacentHTML('beforebegin', selectorHtml);
        } else {
            userInfoDiv.insertAdjacentHTML('beforeend', selectorHtml);
        }
        
        const selector = document.getElementById('adminViewSelector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                const [cargo, perfil] = e.target.value.split('|');
                this.currentViewCargo = cargo;
                this.currentViewPerfil = perfil;
                this.showHomeByCargo(cargo, perfil);
                setTimeout(() => this.setupAdminViewSelector(), 100);
            });
        }
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
