// components/MenuProfissional.js
export class MenuProfissional {
    constructor(userInfo, onNavigate, currentModule = 'home') {
        this.userInfo = userInfo;
        this.onNavigate = onNavigate;
        this.currentModule = currentModule;
        this.isMenuOpen = false;
    }

    render() {
        const cargoFormatado = this.userInfo.cargo ? this.userInfo.cargo.charAt(0).toUpperCase() + this.userInfo.cargo.slice(1) : '';
        const perfil = this.userInfo.perfil || '';
        
        return `
            <div class="top-bar">
                <div class="logo-area">
                    <img src="./imagens/logo.png" alt="TratamentoWeb" class="logo">
                    <h2>${this.getTitle()}</h2>
                </div>
                <div class="top-bar-actions">
                    <div class="user-greeting">
                        <span>👋 ${this.userInfo.nome}</span>
                        <span class="role-badge perfil-supervisor">${cargoFormatado}</span>
                        <span class="role-badge" style="background: #475569; color: white;">${perfil}</span>
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

    getTitle() {
        if (this.userInfo.cargo === 'nutricionista') return 'Sistema Nutricional';
        if (this.userInfo.cargo === 'psicologo') return 'Sistema Psicológico';
        return 'TratamentoWeb';
    }

    renderMenuItems() {
        return `
            <button class="menu-item ${this.currentModule === 'home' ? 'active' : ''}" data-module="home">
                <span class="menu-icon">🏠</span>
                <span>Home</span>
            </button>
            ${this.userInfo.cargo === 'nutricionista' ? `
                <button class="menu-item ${this.currentModule === 'plano_alimentar' ? 'active' : ''}" data-module="plano_alimentar">
                    <span class="menu-icon">🍽️</span>
                    <span>Plano Alimentar</span>
                </button>
                <button class="menu-item ${this.currentModule === 'anamnese' ? 'active' : ''}" data-module="anamnese">
                    <span class="menu-icon">📋</span>
                    <span>Anamnese</span>
                </button>
            ` : ''}
            <button class="menu-item ${this.currentModule === 'cadastro_cliente' ? 'active' : ''}" data-module="cadastro_cliente">
                <span class="menu-icon">👥</span>
                <span>Clientes</span>
            </button>
            <button class="menu-item ${this.currentModule === 'atendimento_grupo' ? 'active' : ''}" data-module="atendimento_grupo">
                <span class="menu-icon">👥</span>
                <span>Atendimento em Grupo</span>
            </button>
            <button class="menu-item ${this.currentModule === 'gestao_agendamentos' ? 'active' : ''}" data-module="gestao_agendamentos">
                <span class="menu-icon">📅</span>
                <span>Gestão de Agendamentos</span>
            </button>
            <button class="menu-item ${this.currentModule === 'acompanhar_jornadas' ? 'active' : ''}" data-module="acompanhar_jornadas">
                <span class="menu-icon">🌟</span>
                <span>Acompanhar Jornadas</span>
            </button>
            <button class="menu-item ${this.currentModule === 'palestras_videos' ? 'active' : ''}" data-module="palestras_videos">
                <span class="menu-icon">🎥</span>
                <span>Palestras e Vídeos</span>
            </button>
            <button class="menu-item ${this.currentModule === 'chat' ? 'active' : ''}" data-module="chat">
                <span class="menu-icon">💬</span>
                <span>Chat</span>
            </button>
        `;
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
