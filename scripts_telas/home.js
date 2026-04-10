import { db, collection, getDocs, doc, setDoc, getDoc, addDoc, auth, createUserWithEmailAndPassword, signOut } from '../0_firebase_api_config.js';
import { HomeCliente } from './home_cliente.js';
import { HomeNutricionista } from './home_nutricionista.js';
import { HomePsicologo } from './home_psicologo.js';

// ==================== FUNÇÕES COMPARTILHADAS ====================

export class FuncoesCompartilhadas {
    
    // Gera e-mail automático baseado no login
    static gerarEmailPorLogin(login) {
        return `${login.toLowerCase()}@tratamentoweb.com`;
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
    
    // Formatar data de YYYY-MM-DD para DD/MM/YYYY para exibição
    static formatDateToDisplay(dateString) {
        if (!dateString) return '';
        const partes = dateString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dateString;
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
                        dataHoraCadastro: data.dataHoraCadastro
                    });
                }
            });
            
            return pacientesList;
        } catch (error) {
            console.error("Erro ao carregar pacientes:", error);
            return [];
        }
    }
    
    static async registerPaciente(pacienteData) {
        const { nome, login, senha, dataNascimento, sexo } = pacienteData;
        
        if (!nome || !login || !senha || !dataNascimento || !sexo) {
            throw new Error('Preencha todos os campos!');
        }
        
        if (login.includes(' ')) {
            throw new Error('O login não pode conter espaços!');
        }
        
        if (senha.length < 6) {
            throw new Error('A senha deve ter no mínimo 6 caracteres!');
        }
        
        // Gerar e-mail automaticamente
        const emailGerado = this.gerarEmailPorLogin(login);
        
        // Converter data de nascimento
        let dataNascimentoFormatada = dataNascimento;
        if (dataNascimento.includes('/')) {
            const partes = dataNascimento.split('/');
            dataNascimentoFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
        
        const dataNasc = new Date(dataNascimentoFormatada);
        const hoje = new Date();
        if (dataNasc > hoje) {
            throw new Error('Data de nascimento não pode ser futura!');
        }
        
        let idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mesDiff = hoje.getMonth() - dataNasc.getMonth();
        if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < dataNasc.getDate())) {
            idade--;
        }
        
        if (idade < 18) {
            throw new Error('Paciente deve ter 18 anos ou mais!');
        }
        
        // Verificar se o login já existe no Firestore
        const existingPacientes = await this.loadPacientesList();
        const existingPaciente = existingPacientes.find(c => c.login === login);
        if (existingPaciente) {
            throw new Error('❌ Este login já está cadastrado! Escolha outro.');
        }
        
        // Verificar se o e-mail gerado já existe
        const emailExiste = existingPacientes.find(c => c.email === emailGerado);
        if (emailExiste) {
            throw new Error('❌ Este login já está cadastrado no sistema! Escolha outro.');
        }
        
        try {
            // 1° Criar usuário no Firebase Auth com e-mail automático
            const userCredential = await createUserWithEmailAndPassword(auth, emailGerado, senha);
            
            // 2° Salvar dados no Firestore (SEM O CAMPO SENHA)
            const pacienteRef = doc(db, "logins", login);
            
            // Formatar data e hora
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
            
            const dataHoraCadastro = `${dia} de ${mes} de ${ano} às ${horas}:${minutos}:${segundos} ${offsetStr}`;
            
            const pacienteDataToSave = {
                nome: nome.toUpperCase(),
                email: emailGerado,
                dataNascimento: dataNascimentoFormatada,
                sexo: sexo,
                cargo: "paciente",
                perfil: "operador",
                status_ativo: true,
                dataHoraCadastro: dataHoraCadastro,
                dataCadastro: agora.toISOString()
            };
            
            await setDoc(pacienteRef, pacienteDataToSave);
            
            return { success: true, message: `✅ Paciente "${nome}" cadastrado com sucesso!\n📋 Login: ${login}\n🔒 Senha: ${senha}` };
            
        } catch (error) {
            console.error("Erro ao cadastrar paciente:", error);
            
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('❌ Este login já está cadastrado no sistema! Escolha outro.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('❌ Erro interno: e-mail gerado inválido. Contate o administrador.');
            } else if (error.code === 'auth/weak-password') {
                throw new Error('❌ Senha muito fraca! Use pelo menos 6 caracteres.');
            }
            
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
    
    static calculateAge(birthDate) {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }
    
    // ==================== FUNÇÕES DE UTILITÁRIOS ====================
    
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
    
    static async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout do Auth:", error);
        }
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
    
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
}

// ==================== GERENCIADOR PRINCIPAL ====================

export class HomeManager {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.currentHome = null;
        this.isAdmin = (userInfo.cargo === 'desenvolvedor' || userInfo.perfil === 'admin');
        
        if (this.isAdmin) {
            // Guarda o cargo original
            this.originalCargo = this.userInfo.cargo;
            this.originalPerfil = this.userInfo.perfil;
            // Define cargo padrão para visualização (nutricionista)
            this.currentViewCargo = 'nutricionista';
            this.currentViewPerfil = 'supervisor_nutricionista';
        }
    }

    render() {
        if (this.isAdmin) {
            // Mostra a tela baseada na visualização atual
            this.showHomeByCargo(this.currentViewCargo);
            // Aguarda o DOM carregar e adiciona o seletor especial
            setTimeout(() => this.setupAdminViewSelector(), 100);
        } else {
            this.showHomeByCargo(this.userInfo.cargo);
        }
    }
    
    // método para configurar o seletor de visualização do admin
    setupAdminViewSelector() {
        const userInfoDiv = document.querySelector('.user-info');
        if (!userInfoDiv) return;
        
        // Remove seletor existente se houver
        const existingSelector = document.getElementById('adminViewSelector');
        if (existingSelector) existingSelector.remove();
                
        // Cria o seletor de visualização
        const selectorHtml = `
            <select id="adminViewSelector" class="role-selector" style="background: #f97316; border-color: #f97316;">
                <option value="nutricionista|supervisor_nutricionista" ${this.currentViewCargo === 'nutricionista' ? 'selected' : ''}>🍎 Visualizar como Nutricionista</option>
                <option value="psicologo|supervisor_psicologo" ${this.currentViewCargo === 'psicologo' ? 'selected' : ''}>🧠 Visualizar como Psicólogo</option>
                <option value="paciente|operador" ${this.currentViewCargo === 'paciente' ? 'selected' : ''}>👤 Visualizar como Paciente</option>
                <option value="paciente_membro|operador_membro" ${this.currentViewCargo === 'paciente_membro' ? 'selected' : ''}>⭐ Visualizar como Paciente Membro</option>
            </select>
        `;
        
        // Insere antes do botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.insertAdjacentHTML('beforebegin', selectorHtml);
        } else {
            userInfoDiv.insertAdjacentHTML('beforeend', selectorHtml);
        }
        
        // Adiciona evento de mudança
        const selector = document.getElementById('adminViewSelector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                const [cargo, perfil] = e.target.value.split('|');
                this.currentViewCargo = cargo;
                this.currentViewPerfil = perfil;
                
                // Recria a tela com o novo cargo
                this.showHomeByCargo(cargo, perfil);
                
                // Recria o seletor na nova tela
                setTimeout(() => this.setupAdminViewSelector(), 100);
            });
        }
    }
    
    // Modificar showHomeByCargo para aceitar perfil opcional
    showHomeByCargo(cargo, customPerfil = null) {
        // Cria um objeto userInfo modificado para a visualização
        let viewUserInfo = { ...this.userInfo };
        
        if (this.isAdmin) {
            // Não altera o cargo original no banco, apenas para visualização
            let perfilFinal = customPerfil;
            if (!perfilFinal) {
                perfilFinal = this.getPerfilForCargo(cargo);
            }
            
            viewUserInfo = {
                ...this.userInfo,
                cargo: cargo === 'paciente_membro' ? 'paciente' : cargo,
                perfil: perfilFinal,
                isAdminView: true,  // Marca que é uma visualização de admin
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
    
    // Helper para pegar perfil padrão por cargo
    getPerfilForCargo(cargo) {
        const perfis = {
            'nutricionista': 'supervisor_nutricionista',
            'psicologo': 'supervisor_psicologo',
            'paciente': 'operador',
            'paciente_membro': 'operador_membro'
        };
        return perfis[cargo] || 'operador';
    }
}
