import { FuncoesCompartilhadas } from './home.js';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from '../0_firebase_api_config.js';

export class HomeNutricionistaPlanoAlimentar {
    constructor(userInfo, pacientesList) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.pacientesList = pacientesList || [];
        this.selectedPaciente = null;
        this.currentMealPlan = null;
        this.availableProducts = [];
        this.currentProducts = [];
        this.activeTab = 'plan';
    }

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        await this.loadAvailableProducts();
        if (this.selectedPaciente) {
            await this.loadMealPlan();
            await this.loadProductsList();
        }
    }

    renderHTML() {
        const perfilBadgeClass = this.funcoes.getPerfilBadgeClass(this.userInfo.perfil);
        const perfilDisplayName = this.funcoes.getPerfilDisplayName(this.userInfo.perfil);
        
        return `
            <div class="home-container">
                <div class="header">
                    <div class="header-logo">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="header-logo-img">
                        <h1>Plano Alimentar - Sistema de Avaliação Nutricional</h1>
                    </div>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ Nutricionista</span>
                        <span class="perfil-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                        <button class="logout-btn" id="logoutBtn">Sair</button>
                    </div>
                </div>
                <div class="content">
                    <div class="nav-buttons">
                        <button class="nav-btn" id="homeBtn" style="background: #667eea; color: white;">🏠 Home</button>
                    </div>

                    <!-- Seleção de Paciente -->
                    <div class="patient-selection">
                        <h3>👤 Selecionar Paciente</h3>
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
                        <div class="client-info">
                            <h3>📋 Informações do Paciente</h3>
                            <div class="info-card">
                                <p><strong>Nome:</strong> ${this.selectedPaciente.nome}</p>
                                <p><strong>Login:</strong> ${this.selectedPaciente.login}</p>
                                <p><strong>Idade:</strong> ${this.funcoes.calcularIdade(this.selectedPaciente.dataNascimento)} anos</p>
                                <p><strong>Sexo:</strong> ${this.selectedPaciente.sexo || 'Não informado'}</p>
                            </div>
                        </div>

                        <div class="tabs">
                            <button class="tab-btn ${this.activeTab === 'plan' ? 'active' : ''}" data-tab="plan">📋 Plano Alimentar</button>
                            <button class="tab-btn ${this.activeTab === 'products' ? 'active' : ''}" data-tab="products">🛒 Produtos</button>
                            <button class="tab-btn ${this.activeTab === 'shopping' ? 'active' : ''}" data-tab="shopping">🛍️ Lista de Compras</button>
                        </div>

                        <div id="planTab" class="tab-content ${this.activeTab === 'plan' ? 'active' : ''}">
                            <div class="meal-plan-editor">
                                <div class="plan-header">
                                    <h3>📝 Editar Plano Alimentar</h3>
                                    <button id="savePlanBtn" class="save-btn">💾 Salvar Plano</button>
                                </div>
                                <div class="meals-container">
                                    <div class="meal-card">
                                        <h4>🌅 Café da Manhã</h4>
                                        <textarea id="breakfast" class="meal-textarea" placeholder="Ex: 2 ovos mexidos, 1 fatia de pão integral, 1 fruta">${this.currentMealPlan?.breakfast || ''}</textarea>
                                    </div>
                                    <div class="meal-card">
                                        <h4>🍎 Lanche da Manhã</h4>
                                        <textarea id="morningSnack" class="meal-textarea" placeholder="Ex: 1 iogurte natural, 1 punhado de castanhas">${this.currentMealPlan?.morningSnack || ''}</textarea>
                                    </div>
                                    <div class="meal-card">
                                        <h4>🍽️ Almoço</h4>
                                        <textarea id="lunch" class="meal-textarea" placeholder="Ex: 150g frango grelhado, 100g arroz integral, salada">${this.currentMealPlan?.lunch || ''}</textarea>
                                    </div>
                                    <div class="meal-card">
                                        <h4>🍌 Lanche da Tarde</h4>
                                        <textarea id="afternoonSnack" class="meal-textarea" placeholder="Ex: 1 vitamina de frutas, 2 torradas integrais">${this.currentMealPlan?.afternoonSnack || ''}</textarea>
                                    </div>
                                    <div class="meal-card">
                                        <h4>🌙 Jantar</h4>
                                        <textarea id="dinner" class="meal-textarea" placeholder="Ex: Sopa de legumes, 150g peixe grelhado">${this.currentMealPlan?.dinner || ''}</textarea>
                                    </div>
                                    <div class="meal-card">
                                        <h4>⭐ Ceia</h4>
                                        <textarea id="supper" class="meal-textarea" placeholder="Ex: 1 chá de camomila, 3 biscoitos integrais">${this.currentMealPlan?.supper || ''}</textarea>
                                    </div>
                                </div>
                                <textarea id="guidelines" class="guidelines-textarea" placeholder="📌 Orientações Gerais...">${this.currentMealPlan?.guidelines || ''}</textarea>
                                <textarea id="restrictions" class="restrictions-textarea" placeholder="⚠️ Restrições Alimentares...">${this.currentMealPlan?.restrictions || ''}</textarea>
                                <textarea id="goals" class="goals-textarea" placeholder="🎯 Objetivos...">${this.currentMealPlan?.goals || ''}</textarea>
                            </div>
                        </div>

                        <div id="productsTab" class="tab-content ${this.activeTab === 'products' ? 'active' : ''}">
                            <div class="products-section">
                                <h3>🛒 Produtos Recomendados</h3>
                                <div id="recommendedProductsList" class="recommended-list">
                                    ${this.currentProducts.map(product => `
                                        <div class="recommended-item">
                                            <div><strong>${product.nome}</strong> - R$ ${product.preco?.toFixed(2) || '0,00'}</div>
                                            <button class="btn-remove-recommend" data-product-id="${product.id}">❌ Remover</button>
                                        </div>
                                    `).join('')}
                                </div>
                                <button id="addProductBtn" class="add-product-btn">➕ Adicionar Produto</button>
                            </div>
                        </div>

                        <div id="shoppingTab" class="tab-content ${this.activeTab === 'shopping' ? 'active' : ''}">
                            <div class="shopping-list-section">
                                <h3>🛍️ Lista de Compras</h3>
                                <textarea id="shoppingList" class="shopping-list-textarea" placeholder="Lista de compras...">${this.currentMealPlan?.shoppingList || ''}</textarea>
                                <button id="saveShoppingListBtn" class="save-shopping-btn">💾 Salvar Lista</button>
                            </div>
                        </div>
                    ` : `
                        <div class="info-message">
                            <p>👆 Selecione um paciente para começar</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    attachEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.funcoes.logout());

        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', async () => {
                const { HomeNutricionista } = await import('./home_nutricionista.js');
                const homeScreen = new HomeNutricionista(this.userInfo);
                homeScreen.render();
            });
        }

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

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.activeTab = btn.getAttribute('data-tab');
                this.render();
            });
        });

        const savePlanBtn = document.getElementById('savePlanBtn');
        if (savePlanBtn) savePlanBtn.addEventListener('click', () => this.saveMealPlan());

        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) addProductBtn.addEventListener('click', () => this.addDummyProduct());

        document.querySelectorAll('.btn-remove-recommend').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = btn.getAttribute('data-product-id');
                await this.removeRecommendation(productId);
            });
        });

        const saveShoppingBtn = document.getElementById('saveShoppingListBtn');
        if (saveShoppingBtn) saveShoppingBtn.addEventListener('click', () => this.saveShoppingList());
    }

    async loadAvailableProducts() {
        this.availableProducts = [
            { id: '1', nome: 'Whey Protein', preco: 129.90 },
            { id: '2', nome: 'Creatina', preco: 89.90 },
            { id: '3', nome: 'Barra de Proteína', preco: 8.50 },
            { id: '4', nome: 'Vitamina C', preco: 35.90 }
        ];
    }

    async loadMealPlan() {
        try {
            const plansRef = collection(window.db, 'planos_alimentares');
            const q = query(plansRef, where('paciente_login', '==', this.selectedPaciente.login));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                this.currentMealPlan = { id: doc.id, ...doc.data() };
            } else {
                this.currentMealPlan = null;
            }
        } catch (error) {
            this.currentMealPlan = null;
        }
    }

    async saveMealPlan() {
        try {
            const mealPlanData = {
                paciente_login: this.selectedPaciente.login,
                paciente_nome: this.selectedPaciente.nome,
                profissional: this.userInfo.nome,
                data_atualizacao: new Date().toISOString(),
                breakfast: document.getElementById('breakfast')?.value || '',
                morningSnack: document.getElementById('morningSnack')?.value || '',
                lunch: document.getElementById('lunch')?.value || '',
                afternoonSnack: document.getElementById('afternoonSnack')?.value || '',
                dinner: document.getElementById('dinner')?.value || '',
                supper: document.getElementById('supper')?.value || '',
                guidelines: document.getElementById('guidelines')?.value || '',
                restrictions: document.getElementById('restrictions')?.value || '',
                goals: document.getElementById('goals')?.value || '',
                shoppingList: this.currentMealPlan?.shoppingList || ''
            };

            const plansRef = collection(window.db, 'planos_alimentares');
            if (this.currentMealPlan?.id) {
                const planDoc = doc(window.db, 'planos_alimentares', this.currentMealPlan.id);
                await updateDoc(planDoc, mealPlanData);
                alert('✅ Plano atualizado!');
            } else {
                await addDoc(plansRef, mealPlanData);
                alert('✅ Plano criado!');
            }
            await this.loadMealPlan();
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    }

    async loadProductsList() {
        try {
            const recommendationsRef = collection(window.db, 'recomendacoes_produtos');
            const q = query(recommendationsRef, where('paciente_login', '==', this.selectedPaciente.login));
            const querySnapshot = await getDocs(q);
            this.currentProducts = [];
            for (const doc of querySnapshot.docs) {
                const data = doc.data();
                const product = this.availableProducts.find(p => p.id === data.produto_id);
                if (product) {
                    this.currentProducts.push({ ...product, recommendationId: doc.id });
                }
            }
        } catch (error) {
            this.currentProducts = [];
        }
    }

    async addDummyProduct() {
        const product = this.availableProducts[Math.floor(Math.random() * this.availableProducts.length)];
        try {
            const recommendationsRef = collection(window.db, 'recomendacoes_produtos');
            await addDoc(recommendationsRef, {
                paciente_login: this.selectedPaciente.login,
                paciente_nome: this.selectedPaciente.nome,
                produto_id: product.id,
                produto_nome: product.nome,
                profissional: this.userInfo.nome,
                data_recomendacao: new Date().toISOString()
            });
            alert(`✅ ${product.nome} recomendado!`);
            await this.loadProductsList();
            await this.render();
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    }

    async removeRecommendation(productId) {
        try {
            const product = this.currentProducts.find(p => p.id === productId);
            if (product && product.recommendationId) {
                const recommendationDoc = doc(window.db, 'recomendacoes_produtos', product.recommendationId);
                await deleteDoc(recommendationDoc);
                alert(`✅ Removido!`);
                await this.loadProductsList();
                await this.render();
            }
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    }

    async saveShoppingList() {
        try {
            const shoppingListText = document.getElementById('shoppingList')?.value || '';
            if (this.currentMealPlan?.id) {
                const planDoc = doc(window.db, 'planos_alimentares', this.currentMealPlan.id);
                await updateDoc(planDoc, { shoppingList: shoppingListText });
                alert('✅ Lista salva!');
            } else {
                await this.saveMealPlan();
                await this.loadMealPlan();
                if (this.currentMealPlan?.id) {
                    const planDoc = doc(window.db, 'planos_alimentares', this.currentMealPlan.id);
                    await updateDoc(planDoc, { shoppingList: shoppingListText });
                    alert('✅ Lista salva!');
                }
            }
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    }
}
