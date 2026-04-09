import { db, collection, getDocs, doc, updateDoc, setDoc, getDoc } from './0_firebase_api_config.js';

export class FuncoesCompartilhadas {
    
    // ==================== FUNÇÕES DE CLIENTE (Compartilhadas) ====================
    
    static async loadClientsList() {
        try {
            const clientesRef = doc(db, "logins", "clientes");
            const clientesDoc = await getDoc(clientesRef);
            const clientsList = [];
            
            if (clientesDoc.exists()) {
                const data = clientesDoc.data();
                
                for (const [login, clientData] of Object.entries(data)) {
                    clientsList.push({
                        login: login,
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
        
        // Validações
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
        
        // Verificar se login já existe
        const existingClients = await this.loadClientsList();
        const existingClient = existingClients.find(c => c.login === login);
        if (existingClient) {
            throw new Error('Este login já existe! Escolha outro.');
        }
        
        try {
            const clientesRef = doc(db, "logins", "clientes");
            const clientesDoc = await getDoc(clientesRef);
            
            const newClientData = {
                [login]: {
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
                currentData[login] = newClientData[login];
                await updateDoc(clientesRef, currentData);
            } else {
                await setDoc(clientesRef, newClientData);
            }
            
            return { success: true, message: `Cliente "${nome}" cadastrado com sucesso!\nLogin: ${login}\nSenha: ${senha}` };
            
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            throw new Error('Erro ao cadastrar cliente: ' + error.message);
        }
    }
    
    // ==================== FUNÇÕES DE AVALIAÇÃO (Leitura apenas - compartilhada) ====================
    
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
    
    // ==================== FUNÇÕES DE UTILITÁRIOS (Compartilhadas) ====================
    
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
    
    static formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleString('pt-BR');
    }
    
    static logout() {
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
    
    static switchAdminRole(role, currentUser) {
        const event = new CustomEvent('adminRoleChange', { 
            detail: { 
                role,
                currentUser: {
                    ...currentUser,
                    cargo: role,
                    perfil: role
                }
            } 
        });
        window.dispatchEvent(event);
    }
    
    // ==================== FUNÇÕES DE MODAL (Compartilhadas) ====================
    
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    static setupModalEvents(modalId, closeBtnClass = '.close') {
        const modal = document.getElementById(modalId);
        const closeBtn = document.querySelector(closeBtnClass);
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal(modalId);
            });
        }
        
        window.onclick = (event) => {
            if (event.target === modal) {
                this.closeModal(modalId);
            }
        };
    }
    
    // ==================== FUNÇÕES DE NAVEGAÇÃO (Compartilhadas) ====================
    
    static setupNavButtons(prefix = '') {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            const module = btn.getAttribute('data-module');
            if (module && !btn.id?.includes('register')) {
                btn.addEventListener('click', () => {
                    alert(`🚧 Módulo ${module} em desenvolvimento!`);
                });
            }
        });
    }
}
