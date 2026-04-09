import { HomeCliente } from './home_cliente.js';
import { HomeNutricionista } from './home_nutricionista.js';
import { HomePsicologo } from './home_psicologo.js';

export class HomeManager {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.currentHome = null;
    }

    render() {
        // Se for admin, sempre mostrar o seletor na tela
        if (this.userInfo.perfil === 'admin') {
            // Admin pode escolher qual tela ver
            const roleToShow = this.userInfo.cargo || 'nutricionista';
            this.showHomeByRole(roleToShow);
        } else {
            // Usuário normal mostra sua própria tela
            this.showHomeByRole(this.userInfo.cargo || this.userInfo.perfil);
        }
        
        // Listener para mudança de role do admin
        window.addEventListener('adminRoleChange', (e) => {
            if (this.userInfo.perfil === 'admin') {
                this.userInfo.cargo = e.detail.role;
                this.userInfo.perfil = e.detail.role;
                this.showHomeByRole(e.detail.role);
            }
        });
    }
    
    showHomeByRole(role) {
        switch(role) {
            case 'cliente':
                this.currentHome = new HomeCliente(this.userInfo);
                break;
            case 'nutricionista':
                this.currentHome = new HomeNutricionista(this.userInfo);
                break;
            case 'psicologo':
                this.currentHome = new HomePsicologo(this.userInfo);
                break;
            default:
                this.currentHome = new HomeCliente(this.userInfo);
        }
        
        this.currentHome.render();
    }
}
