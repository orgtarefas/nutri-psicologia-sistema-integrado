import { FuncoesCompartilhadas } from './0_home.js';
import { MenuProfissional } from './0_complementos_menu_profissional.js';
import { criarNavegador } from './0_complementos_menu_navegacao.js';
import { 
    db, collection, addDoc, getDocs, query, where, 
    doc, updateDoc, deleteDoc, getDoc 
} from '../0_firebase_api_config.js';

export class ShoppingNutriNutricionista {
    constructor(userInfo, pacientesList) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.pacientesList = pacientesList || [];
        this.menu = null;
        this.navegador = criarNavegador(userInfo, this.pacientesList);
        
        // Dados do sistema
        this.itensRecompensa = [];
        this.desafiosDiarios = [];
        this.fotosProgresso = [];
        this.resgatesPendentes = [];
        this.rankingPontuacao = [];
        this.configGamificacao = null;
        
        // Estado da UI
        this.activeTab = 'dashboard';
        this.selectedPaciente = null;
    }

    async render() {
        const app = document.getElementById('app');
        await this.carregarTodosDados();
        
        app.innerHTML = this.renderHTML();
        
        this.navegador.pacientesList = this.pacientesList;
        
        this.menu = new MenuProfissional(this.userInfo, (module) => this.navegador.navegarPara(module), 'shopping_nutri');
        const menuHtml = this.menu.render();
        const menuContainer = document.getElementById('menuContainer');
        if (menuContainer) {
            menuContainer.innerHTML = menuHtml;
        }
        this.menu.attachEvents();
        
        this.attachEvents();
    }

    renderHTML() {
        return `
            <div class="dashboard-container" style="height: 100vh; display: flex; flex-direction: column;">
                <div id="menuContainer"></div>

                <div class="main-content" style="flex: 1; overflow-y: auto; padding: 20px 32px;">
                    <!-- TABS -->
                    <div class="tabs-container" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                        <button class="tab-btn ${this.activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard" style="padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; ${this.activeTab === 'dashboard' ? 'background: #1a237e; color: white;' : 'background: #f1f5f9;'}">
                            📊 Dashboard
                        </button>
                        <button class="tab-btn ${this.activeTab === 'itens' ? 'active' : ''}" data-tab="itens" style="padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; ${this.activeTab === 'itens' ? 'background: #1a237e; color: white;' : 'background: #f1f5f9;'}">
                            🛍️ Itens para Troca
                        </button>
                        <button class="tab-btn ${this.activeTab === 'desafios' ? 'active' : ''}" data-tab="desafios" style="padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; ${this.activeTab === 'desafios' ? 'background: #1a237e; color: white;' : 'background: #f1f5f9;'}">
                            ⭐ Desafios Diários
                        </button>
                        <button class="tab-btn ${this.activeTab === 'fotos' ? 'active' : ''}" data-tab="fotos" style="padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; ${this.activeTab === 'fotos' ? 'background: #1a237e; color: white;' : 'background: #f1f5f9;'}">
                            📸 Fotos de Progresso
                        </button>
                        <button class="tab-btn ${this.activeTab === 'resgates' ? 'active' : ''}" data-tab="resgates" style="padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; ${this.activeTab === 'resgates' ? 'background: #1a237e; color: white;' : 'background: #f1f5f9;'}">
                            🎁 Resgates Pendentes
                        </button>
                        <button class="tab-btn ${this.activeTab === 'ranking' ? 'active' : ''}" data-tab="ranking" style="padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; ${this.activeTab === 'ranking' ? 'background: #1a237e; color: white;' : 'background: #f1f5f9;'}">
                            🏆 Ranking
                        </button>
                        <button class="tab-btn ${this.activeTab === 'config' ? 'active' : ''}" data-tab="config" style="padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; ${this.activeTab === 'config' ? 'background: #1a237e; color: white;' : 'background: #f1f5f9;'}">
                            ⚙️ Configurações
                        </button>
                    </div>

                    <!-- CONTEÚDO DAS TABS -->
                    <div id="tabContent">
                        ${this.renderActiveTab()}
                    </div>
                </div>
            </div>

            <!-- MODAL ITEM -->
            <div id="itemModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 500px;">
                    <span class="close">&times;</span>
                    <h3 id="itemModalTitle">➕ Novo Item</h3>
                    <form id="itemForm">
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>🏷️ Nome do Item</label>
                            <input type="text" id="itemNome" class="form-control" required style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>📝 Descrição</label>
                            <textarea id="itemDescricao" class="form-control" rows="2" style="padding: 12px; border-radius: 12px;"></textarea>
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>🎨 Ícone (emoji)</label>
                            <input type="text" id="ItemIcone" class="form-control" value="🎁" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>⭐ Pontos Necessários</label>
                            <input type="number" id="itemPontos" class="form-control" required min="0" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>📦 Tipo do Item</label>
                            <select id="itemTipo" class="form-control" style="padding: 12px; border-radius: 12px;">
                                <option value="desconto_atendimento">🎯 Desconto em Atendimento</option>
                                <option value="atendimento_gratuito">⭐ Atendimento Grátis</option>
                                <option value="desconto_palestra">📚 Desconto em Palestra</option>
                                <option value="palestra_gratuita">🎤 Palestra Grátis</option>
                                <option value="produto_fisico">📦 Produto Físico</option>
                                <option value="brinde">🎁 Brinde</option>
                                <option value="outro">✨ Outro</option>
                            </select>
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>📋 Informações Adicionais</label>
                            <textarea id="itemInfo" class="form-control" rows="2" placeholder="Ex: Desconto de 20% na próxima consulta..." style="padding: 12px; border-radius: 12px;"></textarea>
                        </div>
                        <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" id="cancelarItemBtn" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">💾 Salvar Item</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL DESAFIO -->
            <div id="desafioModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 500px;">
                    <span class="close">&times;</span>
                    <h3 id="desafioModalTitle">➕ Novo Desafio</h3>
                    <form id="desafioForm">
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>🎯 Título do Desafio</label>
                            <input type="text" id="desafioTitulo" class="form-control" required style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>📝 Descrição</label>
                            <textarea id="desafioDescricao" class="form-control" rows="2" required style="padding: 12px; border-radius: 12px;"></textarea>
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>🎨 Ícone (emoji)</label>
                            <input type="text" id="desafioIcone" class="form-control" value="🎯" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>⭐ Pontos por Completar</label>
                            <input type="number" id="desafioPontos" class="form-control" required min="10" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>📅 Data de Expiração (opcional)</label>
                            <input type="date" id="desafioExpiracao" class="form-control" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" id="cancelarDesafioBtn" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">💾 Salvar Desafio</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- MODAL CONFIGURAÇÕES -->
            <div id="configModal" class="modal" style="display: none;">
                <div class="modal-content" style="max-width: 500px;">
                    <span class="close">&times;</span>
                    <h3>⚙️ Configurações da Gamificação</h3>
                    <form id="configForm">
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>🎡 Prêmios da Roleta (separados por vírgula)</label>
                            <input type="text" id="configRoleta" class="form-control" value="${this.configGamificacao?.roleta_premios?.join(', ') || '5, 10, 15, 20, 25, 50, 100'}" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>⭐ Pontos por Desafio (padrão)</label>
                            <input type="number" id="configPontosDesafio" class="form-control" value="${this.configGamificacao?.pontos_por_desafio || 50}" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>📸 Pontos por Envio de Foto</label>
                            <input type="number" id="configPontosFoto" class="form-control" value="${this.configGamificacao?.pontos_por_foto || 30}" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
                            <button type="button" id="cancelarConfigBtn" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">💾 Salvar Configurações</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    renderActiveTab() {
        switch(this.activeTab) {
            case 'dashboard':
                return this.renderDashboard();
            case 'itens':
                return this.renderItensTab();
            case 'desafios':
                return this.renderDesafiosTab();
            case 'fotos':
                return this.renderFotosTab();
            case 'resgates':
                return this.renderResgatesTab();
            case 'ranking':
                return this.renderRankingTab();
            case 'config':
                return this.renderConfigTab();
            default:
                return this.renderDashboard();
        }
    }

    renderDashboard() {
        const totalPontos = this.rankingPontuacao.reduce((sum, u) => sum + u.pontos, 0);
        const usuariosAtivos = this.rankingPontuacao.filter(u => u.ultimo_acesso && new Date(u.ultimo_acesso) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
        
        return `
            <div class="dashboard-grid">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px;">
                    <div style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 24px; border-radius: 20px; color: white;">
                        <div style="font-size: 32px;">⭐</div>
                        <div style="font-size: 28px; font-weight: bold;">${totalPontos}</div>
                        <div>Total de Pontos Distribuídos</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; border-radius: 20px; color: white;">
                        <div style="font-size: 32px;">👥</div>
                        <div style="font-size: 28px; font-weight: bold;">${this.rankingPontuacao.length}</div>
                        <div>Usuários Ativos</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 24px; border-radius: 20px; color: white;">
                        <div style="font-size: 32px;">🎁</div>
                        <div style="font-size: 28px; font-weight: bold;">${this.resgatesPendentes.length}</div>
                        <div>Resgates Pendentes</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 24px; border-radius: 20px; color: white;">
                        <div style="font-size: 32px;">📸</div>
                        <div style="font-size: 28px; font-weight: bold;">${this.fotosProgresso.length}</div>
                        <div>Fotos Enviadas</div>
                    </div>
                </div>

                <div style="background: white; border-radius: 20px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="margin-bottom: 20px;">🏆 Top 10 Ranking</h3>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f1f5f9;">
                                    <th style="padding: 12px;">Posição</th>
                                    <th style="padding: 12px; text-align: left;">Usuário</th>
                                    <th style="padding: 12px;">Nível</th>
                                    <th style="padding: 12px;">Pontos</th>
                                    </tr>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.rankingPontuacao.slice(0, 10).map((u, idx) => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 12px; text-align: center;">${idx + 1}º</td>
                                        <td style="padding: 12px;"><strong>${u.nome}</strong><br><span style="font-size: 12px; color: #666;">${u.login}</span></td>
                                        <td style="padding: 12px; text-align: center;">🏆 ${u.nivel}</td>
                                        <td style="padding: 12px; text-align: center; color: #f97316; font-weight: bold;">${u.pontos} pts</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="background: white; border-radius: 20px; padding: 24px;">
                    <h3 style="margin-bottom: 20px;">📈 Estatísticas Adicionais</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <div style="color: #666;">Média de Pontos</div>
                            <div style="font-size: 24px; font-weight: bold;">${this.rankingPontuacao.length ? Math.round(totalPontos / this.rankingPontuacao.length) : 0}</div>
                        </div>
                        <div>
                            <div style="color: #666;">Usuários (Nível 5+)</div>
                            <div style="font-size: 24px; font-weight: bold;">${this.rankingPontuacao.filter(u => u.nivel >= 5).length}</div>
                        </div>
                        <div>
                            <div style="color: #666;">Total de Itens</div>
                            <div style="font-size: 24px; font-weight: bold;">${this.itensRecompensa.length}</div>
                        </div>
                        <div>
                            <div style="color: #666;">Desafios Ativos</div>
                            <div style="font-size: 24px; font-weight: bold;">${this.desafiosDiarios.filter(d => d.ativo !== false).length}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderItensTab() {
        return `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                <button id="novoItemBtn" class="btn-primary" style="background: #f97316;">➕ Novo Item</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                ${this.itensRecompensa.map(item => `
                    <div class="item-card" style="border: 2px solid #e2e8f0; border-radius: 20px; padding: 20px; position: relative;">
                        <div style="font-size: 48px; text-align: center; margin-bottom: 12px;">${item.icone || '🎁'}</div>
                        <h4 style="text-align: center; margin-bottom: 8px;">${item.nome}</h4>
                        <p style="font-size: 13px; color: #666; text-align: center; margin-bottom: 12px;">${item.descricao || ''}</p>
                        <div style="text-align: center; font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 16px;">${item.pontos} pts</div>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="editar-item-btn btn-small" data-item-id="${item.id}" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">✏️ Editar</button>
                            <button class="excluir-item-btn btn-small" data-item-id="${item.id}" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">🗑️ Excluir</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDesafiosTab() {
        const hoje = new Date().toISOString().split('T')[0];
        
        return `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                <button id="novoDesafioBtn" class="btn-primary" style="background: #f97316;">➕ Novo Desafio</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${this.desafiosDiarios.map(desafio => {
                    const expirado = desafio.data_expiracao && desafio.data_expiracao < hoje;
                    return `
                        <div class="desafio-card" style="border: 2px solid ${expirado ? '#dc2626' : '#e2e8f0'}; border-radius: 16px; padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <div style="font-size: 40px;">${desafio.icone || '🎯'}</div>
                                <div>
                                    <h4 style="margin-bottom: 4px;">${desafio.titulo}</h4>
                                    <p style="font-size: 13px; color: #666; margin-bottom: 4px;">${desafio.descricao}</p>
                                    <div style="font-size: 12px;">
                                        <span style="color: #f97316; font-weight: bold;">+${desafio.pontos} pts</span>
                                        ${desafio.data_expiracao ? `<span style="color: ${expirado ? '#dc2626' : '#666'}; margin-left: 12px;">📅 Expira: ${this.funcoes.formatDateToDisplay(desafio.data_expiracao)}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="editar-desafio-btn" data-desafio-id="${desafio.id}" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">✏️ Editar</button>
                                <button class="excluir-desafio-btn" data-desafio-id="${desafio.id}" style="background: ${expirado ? '#6b7280' : '#dc2626'}; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer;">🗑️ Excluir</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderFotosTab() {
        return `
            <div class="fotos-container" style="display: flex; flex-direction: column; gap: 20px;">
                ${this.fotosProgresso.map(foto => `
                    <div class="foto-card" style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 16px;">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <div style="font-size: 32px;">📸</div>
                                    <div>
                                        <strong>${foto.usuario_nome}</strong>
                                        <div style="font-size: 12px; color: #666;">${foto.usuario_login}</div>
                                    </div>
                                </div>
                                <p style="margin-bottom: 8px;">${foto.descricao}</p>
                                <div style="font-size: 12px; color: #999;">
                                    Enviado em: ${new Date(foto.data_envio).toLocaleString('pt-BR')}
                                </div>
                                <div style="margin-top: 12px;">
                                    <span style="background: #f1f5f9; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                                        Pontos já creditados: +${foto.pontos_ganhos}
                                    </span>
                                </div>
                            </div>
                            ${foto.foto_base64 ? `
                                <div style="max-width: 150px;">
                                    <img src="${foto.foto_base64}" style="width: 100%; border-radius: 12px; cursor: pointer;" onclick="window.open(this.src)">
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
                ${this.fotosProgresso.length === 0 ? '<p style="text-align: center; color: #666;">Nenhuma foto enviada ainda.</p>' : ''}
            </div>
        `;
    }

    renderResgatesTab() {
        return `
            <div class="resgates-container" style="display: flex; flex-direction: column; gap: 16px;">
                ${this.resgatesPendentes.map(resgate => `
                    <div class="resgate-card" style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <div style="font-size: 28px;">🎁</div>
                                <div>
                                    <strong>${resgate.usuario_nome}</strong>
                                    <div style="font-size: 12px; color: #666;">${resgate.usuario_login}</div>
                                </div>
                            </div>
                            <div><strong>Item:</strong> ${resgate.item_nome}</div>
                            <div><strong>Pontos gastos:</strong> ${resgate.pontos_gastos} pts</div>
                            <div style="font-size: 12px; color: #999;">Data: ${new Date(resgate.data_resgate).toLocaleString('pt-BR')}</div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="aprovar-resgate-btn" data-resgate-id="${resgate.id}" data-usuario-login="${resgate.usuario_login}" data-item-nome="${resgate.item_nome}" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">✅ Aprovar</button>
                            <button class="recusar-resgate-btn" data-resgate-id="${resgate.id}" data-usuario-login="${resgate.usuario_login}" style="background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">❌ Recusar</button>
                        </div>
                    </div>
                `).join('')}
                ${this.resgatesPendentes.length === 0 ? '<p style="text-align: center; color: #666;">Nenhum resgate pendente.</p>' : ''}
            </div>
        `;
    }

    renderRankingTab() {
        return `
            <div style="background: white; border-radius: 20px; padding: 24px;">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="padding: 12px;">Posição</th>
                                <th style="padding: 12px; text-align: left;">Usuário</th>
                                <th style="padding: 12px;">Nível</th>
                                <th style="padding: 12px;">Pontos</th>
                                <th style="padding: 12px;">Experiência</th>
                                <th style="padding: 12px;">Último Acesso</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.rankingPontuacao.map((u, idx) => `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 12px; text-align: center;">
                                        ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
                                    </td>
                                    <td style="padding: 12px;">
                                        <strong>${u.nome}</strong><br>
                                        <span style="font-size: 12px; color: #666;">${u.login}</span>
                                    </td>
                                    <td style="padding: 12px; text-align: center;">
                                        <span style="background: #f1f5f9; padding: 4px 12px; border-radius: 20px;">🏆 ${u.nivel}</span>
                                    </td>
                                    <td style="padding: 12px; text-align: center; color: #f97316; font-weight: bold;">${u.pontos} pts</td>
                                    <td style="padding: 12px; text-align: center;">${u.experiencia || 0} XP</td>
                                    <td style="padding: 12px; text-align: center; font-size: 12px;">${u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleDateString('pt-BR') : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderConfigTab() {
        return `
            <div style="background: white; border-radius: 20px; padding: 24px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px;">
                    <div>
                        <h4>⚙️ Configurações Gerais</h4>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>🎡 Prêmios da Roleta (separados por vírgula)</label>
                            <input type="text" id="configRoleta" class="form-control" value="${this.configGamificacao?.roleta_premios?.join(', ') || '5, 10, 15, 20, 25, 50, 100'}" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>⭐ Pontos por Desafio (padrão)</label>
                            <input type="number" id="configPontosDesafio" class="form-control" value="${this.configGamificacao?.pontos_por_desafio || 50}" style="padding: 12px; border-radius: 12px;">
                        </div>
                        <div class="form-field" style="margin-bottom: 16px;">
                            <label>📸 Pontos por Envio de Foto</label>
                            <input type="number" id="configPontosFoto" class="form-control" value="${this.configGamificacao?.pontos_por_foto || 30}" style="padding: 12px; border-radius: 12px;">
                        </div>
                    </div>
                    <div>
                        <h4>📌 Dicas de Gamificação</h4>
                        <ul style="color: #666; line-height: 1.6;">
                            <li>✅ Crie desafios variados para manter o engajamento</li>
                            <li>✅ Ofereça recompensas atrativas e diversificadas</li>
                            <li>✅ Atualize os itens da loja periodicamente</li>
                            <li>✅ Aprove os resgates rapidamente para motivar os usuários</li>
                            <li>✅ Utilize diferentes tipos de recompensa (descontos, brindes, etc)</li>
                        </ul>
                    </div>
                </div>
                <div style="margin-top: 24px; text-align: right;">
                    <button id="salvarConfigBtn" class="btn-primary" style="background: #f97316;">💾 Salvar Configurações</button>
                </div>
            </div>
        `;
    }

    async carregarTodosDados() {
        await this.carregarItensRecompensa();
        await this.carregarDesafios();
        await this.carregarFotosProgresso();
        await this.carregarResgatesPendentes();
        await this.carregarRanking();
        await this.carregarConfigGamificacao();
    }

    async carregarItensRecompensa() {
        try {
            const itensRef = collection(db, 'itens_recompensa');
            const querySnapshot = await getDocs(itensRef);
            this.itensRecompensa = [];
            querySnapshot.forEach(doc => {
                this.itensRecompensa.push({ id: doc.id, ...doc.data() });
            });
            this.itensRecompensa.sort((a, b) => a.pontos - b.pontos);
        } catch (error) {
            console.error("Erro ao carregar itens:", error);
        }
    }

    async carregarDesafios() {
        try {
            const desafiosRef = collection(db, 'desafios_diarios');
            const querySnapshot = await getDocs(desafiosRef);
            this.desafiosDiarios = [];
            querySnapshot.forEach(doc => {
                this.desafiosDiarios.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error("Erro ao carregar desafios:", error);
        }
    }

    async carregarFotosProgresso() {
        try {
            const fotosRef = collection(db, 'fotos_progresso');
            const querySnapshot = await getDocs(fotosRef);
            this.fotosProgresso = [];
            querySnapshot.forEach(doc => {
                this.fotosProgresso.push({ id: doc.id, ...doc.data() });
            });
            this.fotosProgresso.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio));
        } catch (error) {
            console.error("Erro ao carregar fotos:", error);
        }
    }

    async carregarResgatesPendentes() {
        try {
            const resgatesRef = collection(db, 'resgates_realizados');
            const q = query(resgatesRef, where('status', '==', 'pendente'));
            const querySnapshot = await getDocs(q);
            this.resgatesPendentes = [];
            querySnapshot.forEach(doc => {
                this.resgatesPendentes.push({ id: doc.id, ...doc.data() });
            });
            this.resgatesPendentes.sort((a, b) => new Date(b.data_resgate) - new Date(a.data_resgate));
        } catch (error) {
            console.error("Erro ao carregar resgates:", error);
        }
    }

    async carregarRanking() {
        try {
            const pontosRef = collection(db, 'pontuacao_usuarios');
            const querySnapshot = await getDocs(pontosRef);
            this.rankingPontuacao = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                this.rankingPontuacao.push({
                    id: doc.id,
                    login: data.login,
                    nome: data.nome,
                    pontos: data.pontos || 0,
                    nivel: data.nivel || 1,
                    experiencia: data.experiencia || 0,
                    ultimo_acesso: data.ultimo_acesso_diario || data.ultima_atualizacao
                });
            });
            this.rankingPontuacao.sort((a, b) => b.pontos - a.pontos);
        } catch (error) {
            console.error("Erro ao carregar ranking:", error);
        }
    }

    async carregarConfigGamificacao() {
        try {
            const configRef = doc(db, 'config_gamificacao', 'principal');
            const configDoc = await getDoc(configRef);
            if (configDoc.exists()) {
                this.configGamificacao = configDoc.data();
            } else {
                this.configGamificacao = {
                    roleta_premios: [5, 10, 15, 20, 25, 50, 100],
                    pontos_por_desafio: 50,
                    pontos_por_foto: 30
                };
            }
        } catch (error) {
            console.error("Erro ao carregar config:", error);
        }
    }

    async salvarConfigGamificacao(roletaPremios, pontosDesafio, pontosFoto) {
        try {
            const configRef = doc(db, 'config_gamificacao', 'principal');
            await this.funcoes.setDoc(configRef, {
                roleta_premios: roletaPremios,
                pontos_por_desafio: pontosDesafio,
                pontos_por_foto: pontosFoto,
                ultima_atualizacao: new Date().toISOString(),
                atualizado_por: this.userInfo.nome,
                atualizado_por_login: this.userInfo.login
            });
            this.configGamificacao = { roleta_premios: roletaPremios, pontos_por_desafio: pontosDesafio, pontos_por_foto: pontosFoto };
            alert('✅ Configurações salvas com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar config:", error);
            alert('❌ Erro ao salvar configurações.');
        }
    }

    async salvarItem(itemData, itemId = null) {
        try {
            const itensRef = collection(db, 'itens_recompensa');
            if (itemId) {
                const itemDoc = doc(db, 'itens_recompensa', itemId);
                await updateDoc(itemDoc, itemData);
                alert('✅ Item atualizado com sucesso!');
            } else {
                await addDoc(itensRef, itemData);
                alert('✅ Item criado com sucesso!');
            }
            await this.carregarItensRecompensa();
            this.activeTab = 'itens';
            await this.render();
        } catch (error) {
            console.error("Erro ao salvar item:", error);
            alert('❌ Erro ao salvar item.');
        }
    }

    async excluirItem(itemId) {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;
        try {
            const itemDoc = doc(db, 'itens_recompensa', itemId);
            await deleteDoc(itemDoc);
            alert('✅ Item excluído com sucesso!');
            await this.carregarItensRecompensa();
            this.activeTab = 'itens';
            await this.render();
        } catch (error) {
            console.error("Erro ao excluir item:", error);
            alert('❌ Erro ao excluir item.');
        }
    }

    async salvarDesafio(desafioData, desafioId = null) {
        try {
            const desafiosRef = collection(db, 'desafios_diarios');
            if (desafioId) {
                const desafioDoc = doc(db, 'desafios_diarios', desafioId);
                await updateDoc(desafioDoc, desafioData);
                alert('✅ Desafio atualizado com sucesso!');
            } else {
                await addDoc(desafiosRef, desafioData);
                alert('✅ Desafio criado com sucesso!');
            }
            await this.carregarDesafios();
            this.activeTab = 'desafios';
            await this.render();
        } catch (error) {
            console.error("Erro ao salvar desafio:", error);
            alert('❌ Erro ao salvar desafio.');
        }
    }

    async excluirDesafio(desafioId) {
        if (!confirm('Tem certeza que deseja excluir este desafio?')) return;
        try {
            const desafioDoc = doc(db, 'desafios_diarios', desafioId);
            await deleteDoc(desafioDoc);
            alert('✅ Desafio excluído com sucesso!');
            await this.carregarDesafios();
            this.activeTab = 'desafios';
            await this.render();
        } catch (error) {
            console.error("Erro ao excluir desafio:", error);
            alert('❌ Erro ao excluir desafio.');
        }
    }

    async aprovarResgate(resgateId, usuarioLogin, itemNome) {
        if (!confirm(`Confirmar resgate de "${itemNome}" para o usuário?`)) return;
        
        try {
            const resgateDoc = doc(db, 'resgates_realizados', resgateId);
            await updateDoc(resgateDoc, {
                status: 'aprovado',
                data_aprovacao: new Date().toISOString(),
                aprovado_por: this.userInfo.nome,
                aprovado_por_login: this.userInfo.login
            });
            
            alert(`✅ Resgate aprovado!\n\nItem: ${itemNome}\nUsuário: ${usuarioLogin}\n\nO usuário será notificado.`);
            
            await this.carregarResgatesPendentes();
            this.activeTab = 'resgates';
            await this.render();
            
        } catch (error) {
            console.error("Erro ao aprovar resgate:", error);
            alert('❌ Erro ao aprovar resgate.');
        }
    }

    async recusarResgate(resgateId, usuarioLogin) {
        if (!confirm('Tem certeza que deseja recusar este resgate?')) return;
        
        try {
            const resgateDoc = doc(db, 'resgates_realizados', resgateId);
            await updateDoc(resgateDoc, {
                status: 'recusado',
                data_recusado: new Date().toISOString(),
                recusado_por: this.userInfo.nome,
                recusado_por_login: this.userInfo.login
            });
            
            alert(`❌ Resgate recusado.\n\nUsuário: ${usuarioLogin}`);
            
            await this.carregarResgatesPendentes();
            this.activeTab = 'resgates';
            await this.render();
            
        } catch (error) {
            console.error("Erro ao recusar resgate:", error);
            alert('❌ Erro ao recusar resgate.');
        }
    }

    attachEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tab = btn.getAttribute('data-tab');
                if (tab) {
                    this.activeTab = tab;
                    await this.render();
                }
            });
        });
        
        // Botões de itens
        const novoItemBtn = document.getElementById('novoItemBtn');
        if (novoItemBtn) {
            novoItemBtn.addEventListener('click', () => {
                document.getElementById('itemModalTitle').textContent = '➕ Novo Item';
                document.getElementById('itemForm').reset();
                document.getElementById('itemModal').style.display = 'flex';
            });
        }
        
        document.querySelectorAll('.editar-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-item-id');
                const item = this.itensRecompensa.find(i => i.id === itemId);
                if (item) {
                    document.getElementById('itemModalTitle').textContent = '✏️ Editar Item';
                    document.getElementById('itemNome').value = item.nome || '';
                    document.getElementById('itemDescricao').value = item.descricao || '';
                    document.getElementById('ItemIcone').value = item.icone || '🎁';
                    document.getElementById('itemPontos').value = item.pontos || 0;
                    document.getElementById('itemTipo').value = item.tipo || 'outro';
                    document.getElementById('itemInfo').value = item.info_adicional || '';
                    document.getElementById('itemModal').style.display = 'flex';
                    
                    const form = document.getElementById('itemForm');
                    const handler = async (e) => {
                        e.preventDefault();
                        await this.salvarItem({
                            nome: document.getElementById('itemNome').value,
                            descricao: document.getElementById('itemDescricao').value,
                            icone: document.getElementById('ItemIcone').value,
                            pontos: parseInt(document.getElementById('itemPontos').value),
                            tipo: document.getElementById('itemTipo').value,
                            info_adicional: document.getElementById('itemInfo').value,
                            ativo: true,
                            data_criacao: item.data_criacao || new Date().toISOString(),
                            data_atualizacao: new Date().toISOString()
                        }, itemId);
                        form.removeEventListener('submit', handler);
                        document.getElementById('itemModal').style.display = 'none';
                    };
                    form.removeEventListener('submit', form._submitHandler);
                    form._submitHandler = handler;
                    form.addEventListener('submit', handler);
                }
            });
        });
        
        document.querySelectorAll('.excluir-item-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-item-id');
                this.excluirItem(itemId);
            });
        });
        
        // Botões de desafios
        const novoDesafioBtn = document.getElementById('novoDesafioBtn');
        if (novoDesafioBtn) {
            novoDesafioBtn.addEventListener('click', () => {
                document.getElementById('desafioModalTitle').textContent = '➕ Novo Desafio';
                document.getElementById('desafioForm').reset();
                document.getElementById('desafioModal').style.display = 'flex';
                
                const form = document.getElementById('desafioForm');
                const handler = async (e) => {
                    e.preventDefault();
                    await this.salvarDesafio({
                        titulo: document.getElementById('desafioTitulo').value,
                        descricao: document.getElementById('desafioDescricao').value,
                        icone: document.getElementById('desafioIcone').value,
                        pontos: parseInt(document.getElementById('desafioPontos').value),
                        data_expiracao: document.getElementById('desafioExpiracao').value || null,
                        ativo: true,
                        data_criacao: new Date().toISOString()
                    });
                    form.removeEventListener('submit', handler);
                    document.getElementById('desafioModal').style.display = 'none';
                };
                form.removeEventListener('submit', form._submitHandler);
                form._submitHandler = handler;
                form.addEventListener('submit', handler);
            });
        }
        
        document.querySelectorAll('.editar-desafio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const desafioId = btn.getAttribute('data-desafio-id');
                const desafio = this.desafiosDiarios.find(d => d.id === desafioId);
                if (desafio) {
                    document.getElementById('desafioModalTitle').textContent = '✏️ Editar Desafio';
                    document.getElementById('desafioTitulo').value = desafio.titulo || '';
                    document.getElementById('desafioDescricao').value = desafio.descricao || '';
                    document.getElementById('desafioIcone').value = desafio.icone || '🎯';
                    document.getElementById('desafioPontos').value = desafio.pontos || 0;
                    document.getElementById('desafioExpiracao').value = desafio.data_expiracao || '';
                    document.getElementById('desafioModal').style.display = 'flex';
                    
                    const form = document.getElementById('desafioForm');
                    const handler = async (e) => {
                        e.preventDefault();
                        await this.salvarDesafio({
                            titulo: document.getElementById('desafioTitulo').value,
                            descricao: document.getElementById('desafioDescricao').value,
                            icone: document.getElementById('desafioIcone').value,
                            pontos: parseInt(document.getElementById('desafioPontos').value),
                            data_expiracao: document.getElementById('desafioExpiracao').value || null,
                            ativo: true,
                            data_atualizacao: new Date().toISOString()
                        }, desafioId);
                        form.removeEventListener('submit', handler);
                        document.getElementById('desafioModal').style.display = 'none';
                    };
                    form.removeEventListener('submit', form._submitHandler);
                    form._submitHandler = handler;
                    form.addEventListener('submit', handler);
                }
            });
        });
        
        document.querySelectorAll('.excluir-desafio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const desafioId = btn.getAttribute('data-desafio-id');
                this.excluirDesafio(desafioId);
            });
        });
        
        // Botões de resgates
        document.querySelectorAll('.aprovar-resgate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const resgateId = btn.getAttribute('data-resgate-id');
                const usuarioLogin = btn.getAttribute('data-usuario-login');
                const itemNome = btn.getAttribute('data-item-nome');
                this.aprovarResgate(resgateId, usuarioLogin, itemNome);
            });
        });
        
        document.querySelectorAll('.recusar-resgate-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const resgateId = btn.getAttribute('data-resgate-id');
                const usuarioLogin = btn.getAttribute('data-usuario-login');
                this.recusarResgate(resgateId, usuarioLogin);
            });
        });
        
        // Botão salvar configurações
        const salvarConfigBtn = document.getElementById('salvarConfigBtn');
        if (salvarConfigBtn) {
            salvarConfigBtn.addEventListener('click', async () => {
                const roletaStr = document.getElementById('configRoleta')?.value;
                const roletaPremios = roletaStr ? roletaStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v)) : [5, 10, 15, 20, 25, 50, 100];
                const pontosDesafio = parseInt(document.getElementById('configPontosDesafio')?.value) || 50;
                const pontosFoto = parseInt(document.getElementById('configPontosFoto')?.value) || 30;
                await this.salvarConfigGamificacao(roletaPremios, pontosDesafio, pontosFoto);
            });
        }
        
        // Fechar modais
        const modais = ['itemModal', 'desafioModal', 'configModal'];
        modais.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                const closeBtn = modal.querySelector('.close');
                if (closeBtn) {
                    closeBtn.onclick = () => modal.style.display = 'none';
                }
                const cancelBtn = document.getElementById(`cancelar${modalId.charAt(0).toUpperCase() + modalId.slice(1)}Btn`);
                if (cancelBtn) {
                    cancelBtn.onclick = () => modal.style.display = 'none';
                }
            }
        });
        
        window.onclick = (event) => {
            modais.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (event.target === modal) modal.style.display = 'none';
            });
        };
        
        const itemForm = document.getElementById('itemForm');
        if (itemForm && !itemForm._hasListener) {
            const handler = async (e) => {
                e.preventDefault();
                await this.salvarItem({
                    nome: document.getElementById('itemNome').value,
                    descricao: document.getElementById('itemDescricao').value,
                    icone: document.getElementById('ItemIcone').value,
                    pontos: parseInt(document.getElementById('itemPontos').value),
                    tipo: document.getElementById('itemTipo').value,
                    info_adicional: document.getElementById('itemInfo').value,
                    ativo: true,
                    data_criacao: new Date().toISOString()
                });
                document.getElementById('itemModal').style.display = 'none';
            };
            itemForm.addEventListener('submit', handler);
            itemForm._hasListener = true;
        }
    }
}