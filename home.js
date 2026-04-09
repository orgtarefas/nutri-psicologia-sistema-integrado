import { db, collection, getDocs, doc, updateDoc, setDoc, getDoc, addDoc } from './0_firebase_api_config.js';
import { HomeCliente } from './home_cliente.js';
import { HomeNutricionista } from './home_nutricionista.js';
import { HomePsicologo } from './home_psicologo.js';

// ==================== FUNÇÕES COMPARTILHADAS ====================

export class FuncoesCompartilhadas {
    
    // ==================== FUNÇÕES DE CLIENTE ====================
    
    static async loadClientsList() {
        try {
            const clientesRef = doc(db, "logins", "clientes");
            const clientesDoc = await getDoc(clientesRef);
            const clientsList = [];
            
            if (clientesDoc.exists()) {
                const data = clientesDoc.data();
                
                for (const [key, clientData] of Object.entries(data)) {
                    clientsList.push({
                        login: clientData.login || key,  // <-- USA O CAMPO login SE EXISTIR
                        nome: clientData.nome,
                        senha: clientData.senha,
                        dataNascimento: clientData.dataNascimento,
                        sexo: clientData.sexo,
                        status_ativo: clientData.status_ativo,
                        cargo: clientData.cargo,
                        perfil: clientData.perfil
                    });
                }
            }
            
            return clientsList;
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
            return [];
        }
    }
    
    static async registerClient(clientData) {
        const { nome, login, senha, dataNascimento, sexo } = clientData;
        
        if (!nome || !login || !senha || !dataNascimento || !sexo) {
            throw new Error('Preencha todos os campos!');
        }
        
        if (login.includes(' ')) {
            throw new Error('O login não pode conter espaços!');
        }
        
        if (senha.length < 4) {
            throw new Error('A senha deve ter no mínimo 4 caracteres!');
        }
        
        const dataNasc = new Date(dataNascimento);
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
            throw new Error('Cliente deve ter 18 anos ou mais!');
        }
        
        const existingClients = await this.loadClientsList();
        const existingClient = existingClients.find(c => c.login === login);
        if (existingClient) {
            throw new Error('Este login já existe! Escolha outro.');
        }

        try {
            const clientesRef = doc(db, "logins", "clientes");
            const clientesDoc = await getDoc(clientesRef);
            
            // Usar o login COM PONTO como chave do mapa
            const newClientData = {
                [login]: {  // login = "bia.santos" - funciona como chave
                    nome: nome.toUpperCase(),
                    senha: senha,
                    dataNascimento: dataNascimento,
                    sexo: sexo,
                    cargo: "cliente",
                    perfil: "cliente",
                    status_ativo: true,
                    dataCadastro: new Date().toISOString()
                }
            };
            
            if (clientesDoc.exists()) {
                const currentData = clientesDoc.data();
                await updateDoc(clientesRef, {
                  [login]: newClientData[login]
                });
            } else {
                await setDoc(clientesRef, newClientData);
            }
            
            return { success: true, message: `Cliente cadastrado! Login: ${login}` };
            
        } catch (error) {
            throw new Error('Erro ao cadastrar cliente: ' + error.message);
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
    
    // ==================== FUNÇÕES DE UTILITÁRIOS ====================
    
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
    
    static formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
    }
    
    static logout() {
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
    }

    render() {
        if (this.userInfo.perfil === 'admin') {
            this.showHomeByRole(this.userInfo.cargo || 'nutricionista');
        } else {
            this.showHomeByRole(this.userInfo.cargo || this.userInfo.perfil);
        }
        
        window.addEventListener('adminRoleChange', (e) => {
            if (this.userInfo.perfil === 'admin') {
                this.userInfo.cargo = e.detail.role;
                this.userInfo.perfil = e.detail.role;
                this.showHomeByRole(e.detail.role);
            }
        });
    }
    
    showHomeByRole(role) {
        switch(role) {
            case 'cliente':
                this.currentHome = new HomeCliente(this.userInfo);
                break;
            case 'nutricionista':
                this.currentHome = new HomeNutricionista(this.userInfo);
                break;
            case 'psicologo':
                this.currentHome = new HomePsicologo(this.userInfo);
                break;
            default:
                this.currentHome = new HomeCliente(this.userInfo);
        }
        
        this.currentHome.render();
    }
}
