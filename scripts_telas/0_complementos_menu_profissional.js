// components/MenuProfissional.js
export class MenuProfissional {
    constructor(userInfo, onNavigate) {
        this.userInfo = userInfo;
        this.onNavigate = onNavigate;
        this.isMenuOpen = false;
    }

    render() {
        const perfilBadgeClass = this.userInfo.funcoes?.getPerfilBadgeClass(this.userInfo.perfil) || 'perfil-admin';
        const perfilDisplayName = this.userInfo.funcoes?.getPerfilDisplayName(this.userInfo.perfil) || 'Administrador';
        const isGerente = this.userInfo.perfil === 'gerente_nutricionista' && !this.userInfo.isAdminView;
        const isAdmin = this.userInfo.cargo === 'desenvolvedor' || this.userInfo.perfil === 'admin';
        
        return `
            <div class="top-bar">
                <div class="logo-area">
                    <img src="./imagens/logo.png" alt="TratamentoWeb" class="logo">
                    <h2>${this.getTitle()}</h2>
                </div>
                <div class="top-bar-actions">
                    <div class="user-greeting">
                        <span>👋 ${this.userInfo.nome}</span>
                        <span class="role-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                        ${this.userInfo.isPreviewMode ? '<span class="preview-badge">🔍 Preview</span>' : ''}
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
                    ${this.renderMenuItems(isAdmin, isGerente)}
                    <div class="menu-divider">Sistema</div>
                    <button class="menu-item logout" id="logoutMenuItem">
                        <span class="menu-icon">🚪</span>
                        <span>Sair</span>
                    </button>
                </nav>
            </div>
            <div class="menu-overlay" id="menuOverlay"></div>
        `;
    }

    getTitle() {
        if (this.userInfo.isPreviewMode) {
            return `Preview - ${this.userInfo.cargo === 'nutricionista' ? 'Nutricionista' : this.userInfo.cargo === 'psicologo' ? 'Psicólogo' : 'Administrador'}`;
        }
        if (this.userInfo.cargo === 'nutricionista') return 'Sistema Nutricional';
        if (this.userInfo.cargo === 'psicologo') return 'Sistema Psicológico';
        return 'Administração - TratamentoWeb';
    }

    renderMenuItems(isAdmin, isGerente) {
        let items = '';
        
        // Dashboard Admin (só para admin)
        if (isAdmin && !this.userInfo.isPreviewMode) {
            items += `
                <button class="menu-item ${this.userInfo.currentModule === 'admin_dashboard' ? 'active' : ''}" data-module="admin_dashboard">
                    <span class="menu-icon">📊</span>
                    <span>Dashboard Admin</span>
                </button>
                <div class="menu-divider">Visualizações</div>
                <button class="menu-item ${this.userInfo.previewMode === 'nutricionista' ? 'active' : ''}" data-module="preview_nutricionista">
                    <span class="menu-icon">🍎</span>
                    <span>Ver como Nutricionista</span>
                </button>
                <button class="menu-item ${this.userInfo.previewMode === 'psicologo' ? 'active' : ''}" data-module="preview_psicologo">
                    <span class="menu-icon">🧠</span>
                    <span>Ver como Psicólogo</span>
                </button>
                <button class="menu-item ${this.userInfo.previewMode === 'paciente' ? 'active' : ''}" data-module="preview_paciente">
                    <span class="menu-icon">👤</span>
                    <span>Ver como Paciente</span>
                </button>
                ${this.userInfo.previewMode ? `
                    <button class="menu-item" data-module="exit_preview">
                        <span class="menu-icon">🚪</span>
                        <span>Sair da Visualização</span>
                    </button>
                ` : ''}
                <div class="menu-divider">Módulos</div>
            `;
        }
        
        // Módulos comuns para todos profissionais
        items += `
            <button class="menu-item ${this.userInfo.currentModule === 'home' ? 'active' : ''}" data-module="home">
                <span class="menu-icon">🏠</span>
                <span>Home</span>
            </button>
            <button class="menu-item ${this.userInfo.currentModule === 'plano_alimentar' ? 'active' : ''}" data-module="plano_alimentar">
                <span class="menu-icon">🍽️</span>
                <span>Plano Alimentar</span>
            </button>
            <button class="menu-item ${this.userInfo.currentModule === 'cadastro_cliente' ? 'active' : ''}" data-module="cadastro_cliente">
                <span class="menu-icon">👥</span>
                <span>Clientes</span>
            </button>
            <button class="menu-item ${this.userInfo.currentModule === 'atendimento_grupo' ? 'active' : ''}" data-module="atendimento_grupo">
                <span class="menu-icon">👥</span>
                <span>Atendimento em Grupo</span>
            </button>
            <button class="menu-item ${this.userInfo.currentModule === 'gestao_agendamentos' ? 'active' : ''}" data-module="gestao_agendamentos">
                <span class="menu-icon">📅</span>
                <span>Gestão de Agendamentos</span>
            </button>
            <button class="menu-item ${this.userInfo.currentModule === 'acompanhar_jornadas' ? 'active' : ''}" data-module="acompanhar_jornadas">
                <span class="menu-icon">🌟</span>
                <span>Acompanhar Jornadas</span>
            </button>
            <button class="menu-item ${this.userInfo.currentModule === 'palestras_videos' ? 'active' : ''}" data-module="palestras_videos">
                <span class="menu-icon">🎥</span>
                <span>Palestras e Vídeos</span>
            </button>
            <button class="menu-item ${this.userInfo.currentModule === 'chat' ? 'active' : ''}" data-module="chat">
                <span class="menu-icon">💬</span>
                <span>Chat</span>
            </button>
        `;
        
        // Itens específicos para gerente
        if (isGerente) {
            items += `
                <button class="menu-item ${this.userInfo.currentModule === 'gerenciar_equipe' ? 'active' : ''}" data-module="gerenciar_equipe">
                    <span class="menu-icon">👥</span>
                    <span>Gerenciar Equipe</span>
                </button>
                <button class="menu-item ${this.userInfo.currentModule === 'relatorios' ? 'active' : ''}" data-module="relatorios">
                    <span class="menu-icon">📊</span>
                    <span>Relatórios</span>
                </button>
            `;
        }
        
        // Itens específicos para admin (não em preview)
        if (isAdmin && !this.userInfo.isPreviewMode) {
            items += `
                <button class="menu-item ${this.userInfo.currentModule === 'usuarios' ? 'active' : ''}" data-module="usuarios">
                    <span class="menu-icon">⚙️</span>
                    <span>Gerenciar Usuários</span>
                </button>
                <button class="menu-item ${this.userInfo.currentModule ==='configuracoes' ? 'active' : ''}" data-module="configuracoes">
                    <span class="menu-icon">⚙️</span>
                    <span>Configurações</span>
                </button>
            `;
        }
        
        return items;
    }

    attachEvents() {
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
        if (logoutMenuItem) logoutMenuItem.addEventListener('click', () => this.onNavigate('logout'));

        // Menu items
        document.querySelectorAll('.menu-item[data-module]').forEach(item => {
            item.addEventListener('click', (e) => {
                const module = item.getAttribute('data-module');
                closeMenuFunc();
                if (this.onNavigate) this.onNavigate(module);
            });
        });
    }
}
