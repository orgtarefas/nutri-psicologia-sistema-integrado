import { FuncoesCompartilhadas } from './home.js';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, orderBy } from '../0_firebase_api_config.js';

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
                        <button class="nav-btn" id="backToHomeBtn" style="background: #667eea; color: white;">🏠 Voltar para Home</button>
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
                        <!-- Informações do Paciente -->
                        <div class="client-info">
                            <h3>📋 Informações do Paciente</h3>
                            <div class="info-card">
                                <p><strong>Nome:</strong> ${this.selectedPaciente.nome}</p>
                                <p><strong>Login:</strong> ${this.selectedPaciente.login}</p>
                                <p><strong>Idade:</strong> ${this.funcoes.calcularIdade(this.selectedPaciente.dataNascimento)} anos</p>
                                <p><strong>Sexo:</strong> ${this.selectedPaciente.sexo || 'Não informado'}</p>
                            </div>
                        </div>

                        <!-- Tabs -->
                        <div class="tabs">
                            <button class="tab-btn ${this.activeTab === 'plan' ? 'active' : ''}" data-tab="plan">
                                📋 Plano Alimentar
                            </button>
                            <button class="tab-btn ${this.activeTab === 'products' ? 'active' : ''}" data-tab="products">
                                🛒 Produtos Recomendados
                            </button>
                            <button class="tab-btn ${this.activeTab === 'shopping' ? 'active' : ''}" data-tab="shopping">
                                🛍️ Lista de Compras
                            </button>
                        </div>

                        <!-- Tab: Plano Alimentar -->
                        <div id="planTab" class="tab-content ${this.activeTab === 'plan' ? 'active' : ''}">
                            <div class="meal-plan-editor">
                                <div class="plan-header">
                                    <h3>📝 Editar Plano Alimentar</h3>
                                    <button id="savePlanBtn" class="save-btn">💾 Salvar Plano</button>
                                </div>
                                
                                <div class="meals-container">
                                    <!-- Café da Manhã -->
                                    <div class="meal-card">
                                        <h4>🌅 Café da Manhã (07:00 - 08:00)</h4>
                                        <textarea id="breakfast" class="meal-textarea" placeholder="Ex: 2 ovos mexidos\n1 fatia de pão integral\n1 fruta\n1 xícara de café sem açúcar">${this.currentMealPlan?.breakfast || ''}</textarea>
                                    </div>

                                    <!-- Lanche Manhã -->
                                    <div class="meal-card">
                                        <h4>🍎 Lanche da Manhã (10:00 - 10:30)</h4>
                                        <textarea id="morningSnack" class="meal-textarea" placeholder="Ex: 1 iogurte natural\n1 punhado de castanhas\n1 fruta">${this.currentMealPlan?.morningSnack || ''}</textarea>
                                    </div>

                                    <!-- Almoço -->
                                    <div class="meal-card">
                                        <h4>🍽️ Almoço (12:00 - 13:00)</h4>
                                        <textarea id="lunch" class="meal-textarea" placeholder="Ex: 150g frango grelhado\n100g arroz integral\n100g feijão\nSalada à vontade">${this.currentMealPlan?.lunch || ''}</textarea>
                                    </div>

                                    <!-- Lanche Tarde -->
                                    <div class="meal-card">
                                        <h4>🍌 Lanche da Tarde (15:30 - 16:00)</h4>
                                        <textarea id="afternoonSnack" class="meal-textarea" placeholder="Ex: 1 vitamina de frutas\n2 torradas integrais\n1 colher de pasta de amendoim">${this.currentMealPlan?.afternoonSnack || ''}</textarea>
                                    </div>

                                    <!-- Jantar -->
                                    <div class="meal-card">
                                        <h4>🌙 Jantar (19:00 - 20:00)</h4>
                                        <textarea id="dinner" class="meal-textarea" placeholder="Ex: Sopa de legumes\n150g peixe grelhado\nLegumes no vapor">${this.currentMealPlan?.dinner || ''}</textarea>
                                    </div>

                                    <!-- Ceia -->
                                    <div class="meal-card">
                                        <h4>⭐ Ceia (22:00 - 22:30)</h4>
                                        <textarea id="supper" class="meal-textarea" placeholder="Ex: 1 chá de camomila\n3 biscoitos integrais">${this.currentMealPlan?.supper || ''}</textarea>
                                    </div>
                                </div>

                                <!-- Orientações Gerais -->
                                <div class="general-guidelines">
                                    <h4>📌 Orientações Gerais</h4>
                                    <textarea id="guidelines" class="guidelines-textarea" placeholder="Ex: Beber 2L de água por dia\nEvitar alimentos ultraprocessados\nPraticar atividade física 3x por semana">${this.currentMealPlan?.guidelines || ''}</textarea>
                                </div>

                                <!-- Restrições Alimentares -->
                                <div class="restrictions">
                                    <h4>⚠️ Restrições Alimentares</h4>
                                    <textarea id="restrictions" class="restrictions-textarea" placeholder="Ex: Alergia a lactose\nIntolerância a glúten\nRestrição a frutos do mar">${this.currentMealPlan?.restrictions || ''}</textarea>
                                </div>

                                <!-- Objetivos -->
                                <div class="goals">
                                    <h4>🎯 Objetivos do Plano</h4>
                                    <textarea id="goals" class="goals-textarea" placeholder="Ex: Perda de peso: 5kg em 2 meses\nGanho de massa muscular\nMelhorar exames de colesterol">${this.currentMealPlan?.goals || ''}</textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Tab: Produtos Recomendados -->
                        <div id="productsTab" class="tab-content ${this.activeTab === 'products' ? 'active' : ''}">
                            <div class="products-section">
                                <div class="products-header">
                                    <h3>🛒 Produtos Disponíveis para Compra</h3>
                                    <button id="addProductBtn" class="add-product-btn">➕ Adicionar Produto</button>
                                </div>
                                
                                <div class="products-grid" id="productsGrid">
                                    ${this.availableProducts.map(product => `
                                        <div class="product-card" data-product-id="${product.id}">
                                            <div class="product-info">
                                                <h4>${product.nome}</h4>
                                                <p class="product-description">${product.descricao || ''}</p>
                                                <div class="product-details">
                                                    <span class="product-category">${product.categoria || 'Geral'}</span>
                                                    <span class="product-price">R$ ${product.preco?.toFixed(2) || '0,00'}</span>
                                                </div>
                                            </div>
                                            <div class="product-actions">
                                                <button class="btn-recommend" data-product-id="${product.id}">⭐ Recomendar</button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>

                                <div class="recommended-products">
                                    <h3>⭐ Produtos Recomendados para ${this.selectedPaciente.nome}</h3>
                                    <div id="recommendedProductsList" class="recommended-list">
                                        ${this.currentProducts.map(product => `
                                            <div class="recommended-item" data-product-id="${product.id}">
                                                <div class="item-info">
                                                    <strong>${product.nome}</strong>
                                                    <span>${product.descricao || ''}</span>
                                                    <span class="price">R$ ${product.preco?.toFixed(2) || '0,00'}</span>
                                                </div>
                                                <button class="btn-remove-recommend" data-product-id="${product.id}">❌ Remover</button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tab: Lista de Compras -->
                        <div id="shoppingTab" class="tab-content ${this.activeTab === 'shopping' ? 'active' : ''}">
                            <div class="shopping-list-section">
                                <h3>🛍️ Lista de Compras Semanal</h3>
                                <div class="shopping-list-editor">
                                    <textarea id="shoppingList" class="shopping-list-textarea" placeholder="Lista de compras baseada no plano alimentar...">${this.currentMealPlan?.shoppingList || ''}</textarea>
                                    <button id="saveShoppingListBtn" class="save-shopping-btn">💾 Salvar Lista de Compras</button>
                                </div>
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
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.funcoes.logout());

        // Voltar para Home
        const backBtn = document.getElementById('backToHomeBtn');
        if (backBtn) {
            backBtn.addEventListener('click', async () => {
                const { HomeNutricionista } = await import('./home_nutricionista.js');
                const homeScreen = new HomeNutricionista(this.userInfo);
                homeScreen.render();
            });
        }

        // Seleção de paciente
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

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.activeTab = btn.getAttribute('data-tab');
                this.render();
            });
        });

        // Salvar Plano Alimentar
        const savePlanBtn = document.getElementById('savePlanBtn');
        if (savePlanBtn) {
            savePlanBtn.addEventListener('click', () => this.saveMealPlan());
        }

        // Adicionar Produto
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showAddProductModal());
        }

        // Recomendar produtos
        document.querySelectorAll('.btn-recommend').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = btn.getAttribute('data-product-id');
                await this.recommendProduct(productId);
            });
        });

        // Remover recomendação
        document.querySelectorAll('.btn-remove-recommend').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = btn.getAttribute('data-product-id');
                await this.removeRecommendation(productId);
            });
        });

        // Salvar lista de compras
        const saveShoppingBtn = document.getElementById('saveShoppingListBtn');
        if (saveShoppingBtn) {
            saveShoppingBtn.addEventListener('click', () => this.saveShoppingList());
        }
    }

    async loadAvailableProducts() {
        try {
            const productsRef = collection(window.db, 'produtos');
            const querySnapshot = await getDocs(productsRef);
            this.availableProducts = [];
            querySnapshot.forEach(doc => {
                this.availableProducts.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            // Produtos de exemplo se não houver no banco
            this.availableProducts = [
                { id: '1', nome: 'Whey Protein', descricao: 'Suplemento proteico', categoria: 'Suplementos', preco: 129.90 },
                { id: '2', nome: 'Creatina', descricao: 'Auxilia no desempenho', categoria: 'Suplementos', preco: 89.90 },
                { id: '3', nome: 'Barra de Proteína', descricao: 'Snack saudável', categoria: 'Alimentos', preco: 8.50 },
                { id: '4', nome: 'Vitamina C', descricao: 'Reforço imunológico', categoria: 'Vitaminas', preco: 35.90 }
            ];
        }
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
            console.error('Erro ao carregar plano alimentar:', error);
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
                goals: document.getElementById('goals')?.value || '',
                shoppingList: this.currentMealPlan?.shoppingList || ''
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

    async loadProductsList() {
        try {
            const recommendationsRef = collection(window.db, 'recomendacoes_produtos');
            const q = query(
                recommendationsRef, 
                where('paciente_login', '==', this.selectedPaciente.login)
            );
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
            console.error('Erro ao carregar produtos:', error);
            this.currentProducts = [];
        }
    }

    async recommendProduct(productId) {
        try {
            const product = this.availableProducts.find(p => p.id === productId);
            if (!product) return;

            const recommendationsRef = collection(window.db, 'recomendacoes_produtos');
            await addDoc(recommendationsRef, {
                paciente_login: this.selectedPaciente.login,
                paciente_nome: this.selectedPaciente.nome,
                produto_id: productId,
                produto_nome: product.nome,
                profissional: this.userInfo.nome,
                data_recomendacao: new Date().toISOString()
            });

            alert(`✅ Produto "${product.nome}" recomendado com sucesso!`);
            await this.loadProductsList();
            await this.render();
        } catch (error) {
            console.error('Erro ao recomendar produto:', error);
            alert('❌ Erro ao recomendar produto: ' + error.message);
        }
    }

    async removeRecommendation(productId) {
        try {
            const product = this.currentProducts.find(p => p.id === productId);
            if (!product || !product.recommendationId) return;

            if (confirm(`Remover recomendação de "${product.nome}"?`)) {
                const recommendationDoc = doc(window.db, 'recomendacoes_produtos', product.recommendationId);
                await deleteDoc(recommendationDoc);
                alert(`✅ Recomendação de "${product.nome}" removida!`);
                await this.loadProductsList();
                await this.render();
            }
        } catch (error) {
            console.error('Erro ao remover recomendação:', error);
            alert('❌ Erro ao remover recomendação: ' + error.message);
        }
    }

    async saveShoppingList() {
        try {
            const shoppingListText = document.getElementById('shoppingList')?.value || '';
            
            if (this.currentMealPlan?.id) {
                const planDoc = doc(window.db, 'planos_alimentares', this.currentMealPlan.id);
                await updateDoc(planDoc, { shoppingList: shoppingListText });
                alert('✅ Lista de compras salva com sucesso!');
                await this.loadMealPlan();
            } else {
                // Criar plano primeiro se não existir
                await this.saveMealPlan();
                await this.loadMealPlan();
                if (this.currentMealPlan?.id) {
                    const planDoc = doc(window.db, 'planos_alimentares', this.currentMealPlan.id);
                    await updateDoc(planDoc, { shoppingList: shoppingListText });
                    alert('✅ Lista de compras salva com sucesso!');
                }
            }
        } catch (error) {
            console.error('Erro ao salvar lista de compras:', error);
            alert('❌ Erro ao salvar lista de compras: ' + error.message);
        }
    }

    showAddProductModal() {
        // Modal simples para adicionar produtos (pode ser expandido)
        const productName = prompt('Nome do produto:');
        const productDesc = prompt('Descrição:');
        const productPrice = parseFloat(prompt('Preço (R$):'));
        const productCategory = prompt('Categoria:');
        
        if (productName && productPrice) {
            this.addNewProduct({
                nome: productName,
                descricao: productDesc || '',
                preco: productPrice,
                categoria: productCategory || 'Geral'
            });
        }
    }

    async addNewProduct(productData) {
        try {
            const productsRef = collection(window.db, 'produtos');
            await addDoc(productsRef, productData);
            alert('✅ Produto adicionado com sucesso!');
            await this.loadAvailableProducts();
            await this.render();
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            alert('❌ Erro ao adicionar produto: ' + error.message);
        }
    }
}