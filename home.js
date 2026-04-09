import { db, collection, getDocs, doc, setDoc, getDoc } from './0_firebase_api_config.js';
import { HomeCliente } from './home_cliente.js';
import { HomeNutricionista } from './home_nutricionista.js';
import { HomePsicologo } from './home_psicologo.js';

// ==================== FUNÇÕES COMPARTILHADAS ====================

export class FuncoesCompartilhadas {
    
    // ==================== FUNÇÕES DE CLIENTE ====================
    
    static async loadClientsList() {
        try {
            const querySnapshot = await getDocs(collection(db, "logins"));
            const clientsList = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.perfil === 'paciente') {  // Mudado de cargo para perfil
                    clientsList.push({
                        login: doc.id,
                        nome: data.nome,
                        senha: data.senha,
                        dataNascimento: data.dataNascimento,
                        dataNascimentoExibir: this.formatDateToDisplay(data.dataNascimento),
                        sexo: data.sexo,
                        status_ativo: data.status_ativo,
                        cargo: data.cargo || 'paciente',  // Para exibição
                        perfil: data.perfil,
                        dataHoraCadastro: data.dataHoraCadastro
                    });
                }
            });
            
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
        
        // Converter data de nascimento do formato DD/MM/YYYY para YYYY-MM-DD
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
            throw new Error('Cliente deve ter 18 anos ou mais!');
        }
        
        const existingClients = await this.loadClientsList();
        const existingClient = existingClients.find(c => c.login === login);
        if (existingClient) {
            throw new Error('Este login já existe! Escolha outro.');
        }
        
        try {
            const clientRef = doc(db, "logins", login);
            
            // Formatar data e hora no padrão solicitado
            const agora = new Date();
            const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                           'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            
            const dia = agora.getDate();
            const mes = meses[agora.getMonth()];
            const ano = agora.getFullYear();
            const horas = agora.getHours().toString().padStart(2, '0');
            const minutos = agora.getMinutes().toString().padStart(2, '0');
            const segundos = agora.getSeconds().toString().padStart(2, '0');
            
            // Obter offset do timezone
            const offset = -agora.getTimezoneOffset() / 60;
            const offsetSinal = offset >= 0 ? '+' : '';
            const offsetStr = `UTC${offsetSinal}${offset}`;
            
            const dataHoraCadastro = `${dia} de ${mes} de ${ano} às ${horas}:${minutos}:${segundos} ${offsetStr}`;
            
            const clientDataToSave = {
                nome: nome.toUpperCase(),
                senha: senha,
                dataNascimento: dataNascimentoFormatada,
                sexo: sexo,
                cargo: "paciente",  // Para exibição
                perfil: "paciente",  // Para navegação e regras
                status_ativo: true,
                dataHoraCadastro: dataHoraCadastro,
                dataCadastro: agora.toISOString()
            };
            
            await setDoc(clientRef, clientDataToSave);
            
            return { success: true, message: `Paciente "${nome}" cadastrado com sucesso!\nLogin: ${login}\nSenha: ${senha}` };
            
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            throw new Error('Erro ao cadastrar cliente: ' + error.message);
        }
    }
    
    // ==================== FUNÇÕES DE FORMATAÇÃO ====================
    
    static formatDateToDisplay(dateString) {
        if (!dateString) return '';
        const partes = dateString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dateString;
    }
    
    static formatDateToSave(dateString) {
        if (!dateString) return '';
        if (dateString.includes('/')) {
            const partes = dateString.split('/');
            return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
        return dateString;
    }
    
    // ==================== FUNÇÕES DE AVALIAÇÃO (LEITURA) ====================
    
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
    
    static formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('pt-BR');
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
        // Usa 'perfil' para navegação
        if (this.userInfo.perfil === 'admin') {
            this.showHomeByRole(this.userInfo.perfil || 'admin');
        } else {
            this.showHomeByRole(this.userInfo.perfil);
        }
        
        window.addEventListener('adminRoleChange', (e) => {
            if (this.userInfo.perfil === 'admin') {
                this.userInfo.perfil = e.detail.role;
                this.userInfo.cargo = e.detail.role === 'paciente' ? 'paciente' : e.detail.role;
                this.showHomeByRole(e.detail.role);
            }
        });
    }
    
    showHomeByRole(role) {
        switch(role) {
            case 'paciente':
                this.currentHome = new HomeCliente(this.userInfo);
                break;
            case 'nutricionista':
                this.currentHome = new HomeNutricionista(this.userInfo);
                break;
            case 'psicologo':
                this.currentHome = new HomePsicologo(this.userInfo);
                break;
            case 'admin':
                // Admin pode escolher, por padrão mostra nutricionista
                this.currentHome = new HomeNutricionista(this.userInfo);
                break;
            default:
                this.currentHome = new HomeCliente(this.userInfo);
        }
        
        this.currentHome.render();
    }
}
