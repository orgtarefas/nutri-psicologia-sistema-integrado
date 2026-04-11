import { FuncoesCompartilhadas } from './home.js';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from '../0_firebase_api_config.js';

export class PlanoAlimentarNutricionista {
    constructor(userInfo, pacientesList) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.pacientesList = pacientesList || [];
        this.selectedPaciente = null;
        this.currentMealPlan = null;
        this.isMenuOpen = false;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        if (this.selectedPaciente) {
            this.loadMealPlan();
        }
    }

    renderHTML() {
        const perfilBadgeClass = this.funcoes.getPerfilBadgeClass(this.userInfo.perfil);
        const perfilDisplayName = this.funcoes.getPerfilDisplayName(this.userInfo.perfil);
        
        return `
            <div class="dashboard-container">
                <div class="top-bar">
                    <div class="logo-area">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="logo">
                        <h2>Plano Alimentar - Nutricionista</h2>
                    </div>
                    <div class="top-bar-actions">
                        <div class="user-greeting">
                            <span>👋 ${this.userInfo.nome}</span>
                            <span class="role-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                        </div>
                        <button class="menu-toggle" id="menuToggle">
                            <span class="menu-icon">☰</span>
                        </button>
                    </div>
                </div>

                <div class="side-menu" id="sideMenu">
                    <div class="menu-header">
                        <h3>Menu</h3>
                        <button class="close-menu" id="closeMenu">×</button>
                    </div>
                    <nav class="menu-nav">
                        <button class="menu-item" data-module="home">🏠 Home</button>
                        <button class="menu-item active" data-module="plano_alimentar">🍽️ Plano Alimentar</button>
                        <button class="menu-item" data-module="gestao_pacientes">📋 Gestão de Pacientes</button>
                        <button class="menu-item logout" id="logoutMenuItem">🚪 Sair</button>
                    </nav>
                </div>
                <div class="menu-overlay" id="menuOverlay"></div>

                <div class="main-content">
                    <div class="patient-selector">
                        <label>👤 Selecionar Paciente</label>
                        <select id="pacienteSelect" class="patient-select">
                            <option value="">-- Selecione um paciente --</option>
                            ${this.pacientesList.map(p => `
                                <option value="${p.login}" ${this.selectedPaciente?.login === p.login ? 'selected' : ''}>
                                    ${p.nome} (${p.login})
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    ${this.selectedPaciente ? `
                        <div class="patient-info-bar">
                            <div class="patient-info-item"><strong>👤</strong> ${this.selectedPaciente.nome}</div>
                            <div class="patient-info-item"><strong>📅</strong> ${this.funcoes.calcularIdade(this.selectedPaciente.dataNascimento)} anos</div>
                            <div class="patient-info-item"><strong>⚥</strong> ${this.selectedPaciente.sexo || 'N/I'}</div>
                        </div>

                        <div class="meal-plan-container">
                            <div class="plan-header">
                                <h3>📝 Plano Alimentar Personalizado</h3>
                                <button id="savePlanBtn" class="btn-primary">💾 Salvar Plano</button>
                            </div>

                            <div class="meals-grid">
                                <div class="meal-card">
                                    <div class="meal-header">🌅 Café da Manhã (07:00-08:00)</div>
                                    <textarea id="breakfast" class="meal-textarea" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.breakfast || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header">🍎 Lanche Manhã (10:00-10:30)</div>
                                    <textarea id="morningSnack" class="meal-textarea" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.morningSnack || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header">🍽️ Almoço (12:00-13:00)</div>
                                    <textarea id="lunch" class="meal-textarea" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.lunch || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header">🍌 Lanche Tarde (15:30-16:00)</div>
                                    <textarea id="afternoonSnack" class="meal-textarea" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.afternoonSnack || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header">🌙 Jantar (19:00-20:00)</div>
                                    <textarea id="dinner" class="meal-textarea" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.dinner || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header">⭐ Ceia (22:00-22:30)</div>
                                    <textarea id="supper" class="meal-textarea" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.supper || ''}</textarea>
                                </div>
                            </div>

                            <div class="additional-info">
                                <div class="info-group">
                                    <label>📌 Orientações Gerais</label>
                                    <textarea id="guidelines" class="info-textarea" placeholder="Hidratação, horários, etc...">${this.currentMealPlan?.guidelines || ''}</textarea>
                                </div>
                                <div class="info-group">
                                    <label>⚠️ Restrições Alimentares</label>
                                    <textarea id="restrictions" class="info-textarea" placeholder="Alergias, intolerâncias...">${this.currentMealPlan?.restrictions || ''}</textarea>
                                </div>
                                <div class="info-group">
                                    <label>🎯 Objetivos do Plano</label>
                                    <textarea id="goals" class="info-textarea" placeholder="Metas de peso, medidas, etc...">${this.currentMealPlan?.goals || ''}</textarea>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <span class="empty-icon">👆</span>
                            <h3>Selecione um paciente</h3>
                            <p>Escolha um paciente para criar ou editar o plano alimentar</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    attachEvents() {
        // Menu
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

        // Navigation
        document.querySelectorAll('.menu-item[data-module]').forEach(item => {
            item.addEventListener('click', async (e) => {
                const module = item.getAttribute('data-module');
                closeMenuFunc();
                await this.navigateTo(module);
            });
        });

        // Patient select
        const pacienteSelect = document.getElementById('pacienteSelect');
        if (pacienteSelect) {
            pacienteSelect.addEventListener('change', async (e) => {
                const login = e.target.value;
                if (login) {
                    this.selectedPaciente = this.pacientesList.find(p => p.login === login);
                    await this.render();
                } else {
                    this.selectedPaciente = null;
                    await this.render();
                }
            });
        }

        // Save plan
        const savePlanBtn = document.getElementById('savePlanBtn');
        if (savePlanBtn) {
            savePlanBtn.addEventListener('click', () => this.saveMealPlan());
        }
    }

    async navigateTo(module) {
        switch(module) {
            case 'home':
                const { HomeNutricionista } = await import('./home_nutricionista.js');
                const homeScreen = new HomeNutricionista(this.userInfo);
                homeScreen.render();
                break;
            case 'gestao_pacientes':
                const { GestaoPacientes } = await import('./gestao_pacientes.js');
                const gestaoPacientes = new GestaoPacientes(this.userInfo);
                gestaoPacientes.render();
                break;
            case 'plano_alimentar':
                this.render();
                break;
        }
    }

    async loadMealPlan() {
        try {
            const plansRef = collection(window.db, 'planos_alimentares');
            const q = query(plansRef, where('paciente_login', '==', this.selectedPaciente.login));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                this.currentMealPlan = { id: docSnap.id, ...docSnap.data() };
            } else {
                this.currentMealPlan = null;
            }
        } catch (error) {
            console.error('Erro ao carregar plano:', error);
            this.currentMealPlan = null;
        }
    }

    async saveMealPlan() {
        try {
            const mealPlanData = {
                paciente_login: this.selectedPaciente.login,
                paciente_nome: this.selectedPaciente.nome,
                profissional: this.userInfo.nome,
                profissional_login: this.userInfo.login,
                data_atualizacao: new Date().toISOString(),
                breakfast: document.getElementById('breakfast')?.value || '',
                morningSnack: document.getElementById('morningSnack')?.value || '',
                lunch: document.getElementById('lunch')?.value || '',
                afternoonSnack: document.getElementById('afternoonSnack')?.value || '',
                dinner: document.getElementById('dinner')?.value || '',
                supper: document.getElementById('supper')?.value || '',
                guidelines: document.getElementById('guidelines')?.value || '',
                restrictions: document.getElementById('restrictions')?.value || '',
                goals: document.getElementById('goals')?.value || ''
            };

            const plansRef = collection(window.db, 'planos_alimentares');
            
            if (this.currentMealPlan?.id) {
                const planDoc = doc(window.db, 'planos_alimentares', this.currentMealPlan.id);
                await updateDoc(planDoc, mealPlanData);
                alert('✅ Plano alimentar atualizado com sucesso!');
            } else {
                await addDoc(plansRef, mealPlanData);
                alert('✅ Plano alimentar criado com sucesso!');
            }
            
            await this.loadMealPlan();
        } catch (error) {
            console.error('Erro ao salvar plano:', error);
            alert('❌ Erro ao salvar plano alimentar: ' + error.message);
        }
    }
}
