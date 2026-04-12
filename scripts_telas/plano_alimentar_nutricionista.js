import { FuncoesCompartilhadas } from './0_home.js';
import { MenuProfissional } from './0_complementos_menu_profissional.js';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from '../0_firebase_api_config.js';

export class PlanoAlimentarNutricionista {
    constructor(userInfo, pacientesList) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.pacientesList = pacientesList || [];
        this.selectedPaciente = null;
        this.currentMealPlan = null;
        this.menu = null;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        
        // Inicializa o menu e insere no container
        this.menu = new MenuProfissional(this.userInfo, (module) => this.navigateTo(module), 'plano_alimentar');
        const menuHtml = this.menu.render();
        const menuContainer = document.getElementById('menuContainer');
        if (menuContainer) {
            menuContainer.innerHTML = menuHtml;
        }
        this.menu.attachEvents();
        
        this.attachEvents();
        if (this.selectedPaciente) {
            this.loadMealPlan();
        }
    }

    renderHTML() {
        const cargoFormatado = this.funcoes.formatarCargo(this.userInfo.cargo);
        const perfil = this.userInfo.perfil || '';
        
        return `
            <div class="dashboard-container" style="height: 100vh; display: flex; flex-direction: column;">
                <div id="menuContainer"></div>

                <div class="main-content" style="flex: 1; overflow-y: auto; padding: 20px 32px;">
                    <!-- TOPO: Seletor de Paciente + Informações do Profissional -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <label style="font-weight: 600; color: #1a237e;">👤 Paciente:</label>
                            <select id="pacienteSelect" style="min-width: 250px; padding: 10px 14px; border-radius: 10px; border: 2px solid #e2e8f0; background: white;">
                                <option value="">-- Selecione um paciente --</option>
                                ${this.pacientesList.map(p => `
                                    <option value="${p.login}" ${this.selectedPaciente?.login === p.login ? 'selected' : ''}>
                                        ${p.nome} (${p.login})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div style="display: flex; align-items: center; gap: 16px; background: #f1f5f9; padding: 8px 20px; border-radius: 40px;">
                            <span>👨‍⚕️ <strong>${cargoFormatado}</strong></span>
                            <span class="role-badge" style="background: #1a237e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${perfil}</span>
                        </div>
                    </div>

                    ${this.selectedPaciente ? `
                        <!-- INFORMAÇÕES DO PACIENTE -->
                        <div class="info-section" style="margin-bottom: 24px;">
                            <div class="section-header">
                                <h3>📋 Informações do Paciente</h3>
                            </div>
                            <div class="info-grid">
                                <div class="info-card">
                                    <span class="info-label">Nome</span>
                                    <span class="info-value">${this.selectedPaciente.nome}</span>
                                </div>
                                <div class="info-card">
                                    <span class="info-label">Login</span>
                                    <span class="info-value">${this.selectedPaciente.login}</span>
                                </div>
                                <div class="info-card">
                                    <span class="info-label">Idade</span>
                                    <span class="info-value">${this.funcoes.calcularIdade(this.selectedPaciente.dataNascimento)} anos</span>
                                </div>
                                <div class="info-card">
                                    <span class="info-label">Sexo</span>
                                    <span class="info-value">${this.selectedPaciente.sexo || 'N/I'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- PLANO ALIMENTAR -->
                        <div class="meal-plan-container">
                            <div class="plan-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                                <h3 style="margin: 0;">📝 Plano Alimentar Personalizado</h3>
                                <button id="savePlanBtn" class="btn-primary" style="padding: 12px 24px;">💾 Salvar Plano</button>
                            </div>

                            <div class="meals-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 24px;">
                                <div class="meal-card" style="background: #f8fafc; border-radius: 1rem; overflow: hidden; border: 1px solid #e2e8f0;">
                                    <div class="meal-header" style="background: #1a237e; color: white; padding: 12px 16px; font-weight: 600;">🌅 Café da Manhã</div>
                                    <textarea id="breakfast" class="meal-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.breakfast || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header" style="background: #1a237e; color: white; padding: 12px 16px; font-weight: 600;">🍎 Lanche Manhã</div>
                                    <textarea id="morningSnack" class="meal-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.morningSnack || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header" style="background: #1a237e; color: white; padding: 12px 16px; font-weight: 600;">🍽️ Almoço</div>
                                    <textarea id="lunch" class="meal-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.lunch || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header" style="background: #1a237e; color: white; padding: 12px 16px; font-weight: 600;">🍌 Lanche Tarde</div>
                                    <textarea id="afternoonSnack" class="meal-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.afternoonSnack || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header" style="background: #1a237e; color: white; padding: 12px 16px; font-weight: 600;">🌙 Jantar</div>
                                    <textarea id="dinner" class="meal-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.dinner || ''}</textarea>
                                </div>
                                <div class="meal-card">
                                    <div class="meal-header" style="background: #1a237e; color: white; padding: 12px 16px; font-weight: 600;">⭐ Ceia</div>
                                    <textarea id="supper" class="meal-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Alimentos e quantidades...">${this.currentMealPlan?.supper || ''}</textarea>
                                </div>
                            </div>

                            <div class="additional-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                                <div class="info-group" style="background: #f8fafc; border-radius: 1rem; overflow: hidden;">
                                    <label style="display: block; background: #1a237e; color: white; padding: 12px 16px; font-weight: 600; margin: 0;">📌 Orientações Gerais</label>
                                    <textarea id="guidelines" class="info-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Hidratação, horários, etc...">${this.currentMealPlan?.guidelines || ''}</textarea>
                                </div>
                                <div class="info-group" style="background: #f8fafc; border-radius: 1rem; overflow: hidden;">
                                    <label style="display: block; background: #1a237e; color: white; padding: 12px 16px; font-weight: 600; margin: 0;">⚠️ Restrições Alimentares</label>
                                    <textarea id="restrictions" class="info-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Alergias, intolerâncias...">${this.currentMealPlan?.restrictions || ''}</textarea>
                                </div>
                                <div class="info-group" style="background: #f8fafc; border-radius: 1rem; overflow: hidden;">
                                    <label style="display: block; background: #1a237e; color: white; padding: 12px 16px; font-weight: 600; margin: 0;">🎯 Objetivos</label>
                                    <textarea id="goals" class="info-textarea" style="width: 100%; min-height: 120px; padding: 12px; border: none; resize: vertical;" placeholder="Metas...">${this.currentMealPlan?.goals || ''}</textarea>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state" style="text-align: center; padding: 60px; background: white; border-radius: 1rem;">
                            <span class="empty-icon" style="font-size: 48px; opacity: 0.5;">👆</span>
                            <h3 style="margin-top: 16px;">Selecione um paciente</h3>
                            <p style="color: #64748b;">Escolha um paciente para criar ou editar o plano alimentar</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    attachEvents() {
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

        const savePlanBtn = document.getElementById('savePlanBtn');
        if (savePlanBtn) savePlanBtn.addEventListener('click', () => this.saveMealPlan());
    }

    async navigateTo(module) {
        switch(module) {
            case 'home':
                const { HomeNutricionista } = await import('./home_nutricionista.js');
                const homeScreen = new HomeNutricionista(this.userInfo);
                homeScreen.render();
                break;
            case 'cadastro_cliente':
                const { CadastroCliente } = await import('./cadastro_cliente.js');
                const cadastroScreen = new CadastroCliente(this.userInfo);
                cadastroScreen.render();
                break;
            case 'plano_alimentar':
                this.render();
                break;
            case 'logout':
                this.funcoes.logout();
                break;
            default:
                alert(`🚧 Módulo "${module}" em desenvolvimento`);
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
            console.error("Erro ao carregar plano:", error);
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
                alert('✅ Plano atualizado com sucesso!');
            } else {
                await addDoc(plansRef, mealPlanData);
                alert('✅ Plano criado com sucesso!');
            }
            
            await this.loadMealPlan();
        } catch (error) {
            console.error("Erro ao salvar plano:", error);
            alert('❌ Erro ao salvar: ' + error.message);
        }
    }
}
