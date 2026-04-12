// Componente de Menu Profissional - usado por TODAS as telas de profissionais
export class MenuProfissional {
    constructor(userInfo, onNavigate, currentModule = 'home') {
        this.userInfo = userInfo;
        this.onNavigate = onNavigate;
        this.currentModule = currentModule;
        this.isMenuOpen = false;
    }

    render() {
        const perfilBadgeClass = this.userInfo.perfil === 'supervisor_nutricionista' ? 'perfil-supervisor' : 'perfil-supervisor';
        const perfilDisplayName = this.userInfo.cargo === 'nutricionista' ? 'Nutricionista' : 'Psicólogo';
        
        return `
            <div class="top-bar">
                <div class="logo-area">
                    <img src="./imagens/logo.png" alt="TratamentoWeb" class="logo">
                    <h2>${this.userInfo.cargo === 'nutricionista' ? 'Sistema Nutricional' : 'Sistema Psicológico'}</h2>
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
                    ${this.renderMenuItems()}
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

    renderMenuItems() {
        // Itens comuns para NUTRICIONISTA e PSICÓLOGO
        const commonItems = [
            { module: 'home', icon: '🏠', label: 'Home' },
            { module: 'cadastro_cliente', icon: '👥', label: 'Clientes' },
            { module: 'atendimento_grupo', icon: '👥', label: 'Atendimento em Grupo' },
            { module: 'gestao_agendamentos', icon: '📅', label: 'Gestão de Agendamentos' },
            { module: 'acompanhar_jornadas', icon: '🌟', label: 'Acompanhar Jornadas' },
            { module: 'palestras_videos', icon: '🎥', label: 'Palestras e Vídeos' },
            { module: 'chat', icon: '💬', label: 'Chat' }
        ];

        // Item específico para NUTRICIONISTA
        const nutricionistaItems = [
            { module: 'plano_alimentar', icon: '🍽️', label: 'Plano Alimentar' }
        ];

        let itemsHtml = '';

        // Adiciona itens comuns
        commonItems.forEach(item => {
            itemsHtml += `
                <button class="menu-item ${this.currentModule === item.module ? 'active' : ''}" data-module="${item.module}">
                    <span class="menu-icon">${item.icon}</span>
                    <span>${item.label}</span>
                </button>
            `;
        });

        // Adiciona itens específicos do nutricionista
        if (this.userInfo.cargo === 'nutricionista') {
            nutricionistaItems.forEach(item => {
                itemsHtml += `
                    <button class="menu-item ${this.currentModule === item.module ? 'active' : ''}" data-module="${item.module}">
                        <span class="menu-icon">${item.icon}</span>
                        <span>${item.label}</span>
                    </button>
                `;
            });
        }

        return itemsHtml;
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

        const logoutMenuItem = document.getElementById('logoutMenuItem');
        if (logoutMenuItem) logoutMenuItem.addEventListener('click', () => this.onNavigate('logout'));

        document.querySelectorAll('.menu-item[data-module]').forEach(item => {
            item.addEventListener('click', (e) => {
                const module = item.getAttribute('data-module');
                closeMenuFunc();
                if (this.onNavigate) this.onNavigate(module);
            });
        });
    }
}
