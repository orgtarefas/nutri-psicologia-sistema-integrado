import { FuncoesCompartilhadas } from './home.js';

export class HomeCliente {
    constructor(userInfo) {
        this.userInfo = userInfo;
        this.funcoes = FuncoesCompartilhadas;
        this.currentEvaluations = [];
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderHTML();
        this.attachEvents();
        this.loadEvaluations();
    }

    renderHTML() {
        const perfilBadgeClass = this.funcoes.getPerfilBadgeClass(this.userInfo.perfil);
        const perfilDisplayName = this.funcoes.getPerfilDisplayName(this.userInfo.perfil);
        
        return `
            <div class="home-container">
                <div class="header">
                    <div class="header-logo">
                        <img src="./imagens/logo.png" alt="TratamentoWeb" class="header-logo-img">
                        <h1>Minhas Avaliações</h1>
                    </div>
                    <div class="user-info">
                        <span>👋 Olá, ${this.userInfo.nome}</span>
                        <span>🏷️ ${this.userInfo.cargo === 'paciente' ? 'Paciente' : this.userInfo.cargo}</span>
                        <span class="perfil-badge ${perfilBadgeClass}">${perfilDisplayName}</span>
                        ${this.userInfo.perfil === 'admin' || this.userInfo.cargo === 'desenvolvedor' ? `
                            <select id="adminRoleSelector" class="role-selector">
                                <option value="paciente|operador">👤 Paciente (Operador)</option>
                                <option value="paciente|operador_membro">👤 Paciente (Membro)</option>
                                <option value="nutricionista|supervisor_nutricionista">🍎 Nutricionista (Supervisor)</option>
                                <option value="nutricionista|gerente_nutricionista">🍎 Nutricionista (Gerente)</option>
                                <option value="psicologo|supervisor_psicologo">🧠 Psicólogo</option>
                            </select>
                        ` : ''}
                        <button class="logout-btn" id="logoutBtn">Sair</button>
                    </div>
                </div>
                <div class="content">
                    <div class="nav-buttons">
                        <button class="nav-btn" data-module="history">📜 Histórico</button>
                        <button class="nav-btn" data-module="results">📈 Resultados</button>
                        <button class="nav-btn" data-module="schedule">📅 Agendamentos</button>
                        <button class="nav-btn" data-module="messages">💬 Mensagens</button>
                        ${this.userInfo.perfil === 'operador_membro' ? `
                            <button class="nav-btn" id="membroExclusiveBtn" style="background: #ed8936; color: white;">⭐ Conteúdo Exclusivo Membro</button>
                        ` : ''}
                    </div>
                    
                    <!-- INFORMAÇÕES DO PACIENTE -->
                    <div class="client-info">
                        <h3>📋 Meus Dados</h3>
                        <div class="info-card">
                            <p><strong>Nome:</strong> ${this.userInfo.nome || 'Não informado'}</p>
                            <p><strong>Login:</strong> ${this.userInfo.login || 'Não informado'}</p>
                            <p><strong>Data Nasc.:</strong> ${this.funcoes.formatDateToDisplay(this.userInfo.dataNascimento) || 'Não informado'}</p>
                            <p><strong>Idade:</strong> ${this.funcoes.calculateAge(this.userInfo.dataNascimento) || 'Não informado'} anos</p>
                            <p><strong>Sexo:</strong> ${this.userInfo.sexo === 'masculino' ? 'Masculino' : (this.userInfo.sexo === 'feminino' ? 'Feminino' : 'Não informado')}</p>
                        </div>
                    </div>
                    
                    <!-- LISTA DE AVALIAÇÕES -->
                    <div id="clientEvaluations" class="client-evaluations">
                        <h3>📊 Histórico de Avaliações Nutricionais</h3>
                        <div id="evaluationsList"></div>
                    </div>
                    
                    <!-- GRÁFICOS (apenas para membros) -->
                    ${this.userInfo.perfil === 'operador_membro' ? `
                        <div class="charts-section">
                            <h3 style="color: #1a237e; margin-bottom: 20px;">📈 Meus Gráficos de Evolução</h3>
                            <div class="chart-container">
                                <h4>📈 Evolução do Peso</h4>
                                <canvas id="weightChart"></canvas>
                            </div>
                            <div class="chart-container">
                                <h4>📊 Evolução do IMC</h4>
                                <canvas id="imcChart"></canvas>
                            </div>
                            <div class="chart-container">
                                <h4>💪 Evolução da Massa Muscular</h4>
                                <canvas id="muscleChart"></canvas>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    attachEvents() {
        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.funcoes.logout());
        }

        // Seletor de perfil para admin
        const adminSelector = document.getElementById('adminRoleSelector');
        if (adminSelector) {
            adminSelector.addEventListener('change', (e) => {
                const [cargo, perfil] = e.target.value.split('|');
                const event = new CustomEvent('adminRoleChange', { 
                    detail: { cargo: cargo, perfil: perfil } 
                });
                window.dispatchEvent(event);
            });
        }

        // Botão de conteúdo exclusivo para membros
        const membroExclusiveBtn = document.getElementById('membroExclusiveBtn');
        if (membroExclusiveBtn) {
            membroExclusiveBtn.addEventListener('click', () => {
                this.showMembroExclusiveContent();
            });
        }

        // Botões de navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const module = btn.getAttribute('data-module');
            if (module && !btn.id) {
                btn.addEventListener('click', () => this.showModuleMessage(module));
            }
        });
    }

    showModuleMessage(module) {
        const messages = {
            'history': '📜 Histórico de Avaliações\n\nAqui você pode visualizar todo o seu histórico de avaliações realizadas pelos profissionais.',
            'results': '📈 Resultados\n\nAqui você pode acompanhar a evolução dos seus resultados ao longo do tempo.',
            'schedule': '📅 Agendamentos\n\nFuncionalidade em desenvolvimento. Em breve você poderá agendar consultas online!',
            'messages': '💬 Mensagens\n\nFuncionalidade em desenvolvimento. Em breve você poderá se comunicar com seus profissionais!'
        };
        
        alert(messages[module] || `🚧 Módulo "${module}" em desenvolvimento!`);
    }

    showMembroExclusiveContent() {
        const modalHtml = `
            <div id="exclusiveModal" class="modal" style="display: block;">
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close">&times;</span>
                    <h3 style="color: #ed8936;">⭐ Conteúdo Exclusivo para Membros</h3>
                    <div style="margin-top: 20px;">
                        <p style="margin-bottom: 15px;">🎯 <strong>Planos Alimentares Exclusivos</strong><br>
                        Acesso a planos alimentares personalizados desenvolvidos por nossos nutricionistas.</p>
                        
                        <p style="margin-bottom: 15px;">🏆 <strong>Desafios Especiais</strong><br>
                        Participe de desafios exclusivos e ganhe prêmios ao atingir suas metas.</p>
                        
                        <p style="margin-bottom: 15px;">💎 <strong>Consultoria Prioritária</strong><br>
                        Atendimento prioritário com nossa equipe de profissionais.</p>
                        
                        <p style="margin-bottom: 15px;">📚 <strong>Materiais Educativos</strong><br>
                        Acesso a e-books, vídeos e guias exclusivos sobre nutrição e bem-estar.</p>
                        
                        <p style="margin-bottom: 15px;">🎁 <strong>Brindes e Descontos</strong><br>
                        Receba brindes exclusivos e descontos em parceiros do programa.</p>
                    </div>
                    <button id="closeExclusiveModal" class="submit-btn" style="margin-top: 20px;">Fechar</button>
                </div>
            </div>
        `;
        
        // Adicionar modal ao body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Configurar fechamento do modal
        const modal = document.getElementById('exclusiveModal');
        const closeBtn = modal.querySelector('.close');
        const closeButton = document.getElementById('closeExclusiveModal');
        
        const closeModal = () => {
            modal.remove();
        };
        
        closeBtn.onclick = closeModal;
        closeButton.onclick = closeModal;
        
        window.onclick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };
    }

    async loadEvaluations() {
        const evaluationsList = document.getElementById('evaluationsList');
        
        if (!evaluationsList) return;
        
        try {
            const evaluations = await this.funcoes.loadEvaluationsByPatient(this.userInfo.login);
            this.currentEvaluations = evaluations;
            
            evaluationsList.innerHTML = '';
            
            if (evaluations.length === 0) {
                evaluationsList.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 16px;">
                        <p style="color: #666;">📭 Nenhuma avaliação encontrada.</p>
                        <p style="color: #999; font-size: 14px; margin-top: 10px;">Suas avaliações aparecerão aqui assim que forem registradas pelos profissionais.</p>
                    </div>
                `;
            } else {
                evaluations.forEach((data) => {
                    const card = document.createElement('div');
                    card.className = 'evaluation-card';
                    
                    // Formatar data para exibição
                    const dataAvaliacao = data.data_avaliacao ? this.formatDate(data.data_avaliacao) : 'Data não informada';
                    
                    card.innerHTML = `
                        <div class="evaluation-date">
                            📅 ${dataAvaliacao}
                            <span style="float: right; font-size: 12px; color: #f97316;">por: ${data.profissional || 'Profissional'}</span>
                        </div>
                        <div><strong>👨‍⚕️ Profissional:</strong> ${data.profissional || 'Não informado'} (${data.cargo === 'nutricionista' ? 'Nutricionista' : (data.cargo === 'psicologo' ? 'Psicólogo' : data.cargo)})</div>
                        <div class="evaluation-data">
                            <div><strong>📏 Peso:</strong> ${data.dados_antropometricos?.peso || '-'} kg</div>
                            <div><strong>📐 Altura:</strong> ${data.dados_antropometricos?.altura || '-'} m</div>
                            <div><strong>📊 IMC:</strong> ${data.dados_antropometricos?.imc || '-'} - ${data.dados_antropometricos?.classificacao_imc || '-'}</div>
                            ${data.bioimpedancia?.massa_muscular ? `<div><strong>💪 Massa Muscular:</strong> ${data.bioimpedancia.massa_muscular} kg</div>` : ''}
                            ${data.bioimpedancia?.gordura_corporal ? `<div><strong>🧈 Gordura Corporal:</strong> ${data.bioimpedancia.gordura_corporal}%</div>` : ''}
                            ${data.exames_laboratoriais?.glicemia ? `<div><strong>🩸 Glicemia:</strong> ${data.exames_laboratoriais.glicemia} mg/dL</div>` : ''}
                            ${data.exames_laboratoriais?.colesterol_total ? `<div><strong>🩸 Colesterol:</strong> ${data.exames_laboratoriais.colesterol_total} mg/dL</div>` : ''}
                        </div>
                    `;
                    evaluationsList.appendChild(card);
                });
            }
            
            // Carregar gráficos apenas para membros
            if (this.userInfo.perfil === 'operador_membro' && evaluations.length > 0) {
                this.renderCharts();
            } else if (this.userInfo.perfil === 'operador_membro' && evaluations.length === 0) {
                this.showEmptyCharts();
            }
            
        } catch (error) {
            console.error("Erro ao carregar avaliações:", error);
            evaluationsList.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 16px;">
                    <p style="color: #dc2626;">❌ Erro ao carregar avaliações.</p>
                    <p style="color: #999; font-size: 14px; margin-top: 10px;">Tente novamente mais tarde.</p>
                </div>
            `;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        // Se já estiver no formato DD/MM/YYYY
        if (dateString.includes('/')) return dateString;
        // Converter de YYYY-MM-DD para DD/MM/YYYY
        const partes = dateString.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dateString;
    }

    showEmptyCharts() {
        const weightCtx = document.getElementById('weightChart')?.getContext('2d');
        const imcCtx = document.getElementById('imcChart')?.getContext('2d');
        const muscleCtx = document.getElementById('muscleChart')?.getContext('2d');
        
        const showEmptyMessage = (ctx) => {
            if (ctx) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#999';
                ctx.textAlign = 'center';
                ctx.fillText('Nenhuma avaliação encontrada', ctx.canvas.width/2, ctx.canvas.height/2);
            }
        };
        
        showEmptyMessage(weightCtx);
        showEmptyMessage(imcCtx);
        showEmptyMessage(muscleCtx);
    }

    renderCharts() {
        if (this.currentEvaluations.length === 0) {
            this.showEmptyCharts();
            return;
        }
        
        if (typeof Chart === 'undefined') {
            setTimeout(() => this.renderCharts(), 500);
            return;
        }
        
        this.createCharts();
    }

    createCharts() {
        // Ordenar avaliações por data
        const sortedEvaluations = [...this.currentEvaluations].sort((a, b) => 
            new Date(a.data_avaliacao) - new Date(b.data_avaliacao)
        );
        
        const labels = sortedEvaluations.map(e => this.formatDate(e.data_avaliacao));
        const weights = sortedEvaluations.map(e => e.dados_antropometricos?.peso || 0);
        const imcs = sortedEvaluations.map(e => e.dados_antropometricos?.imc || 0);
        const muscles = sortedEvaluations.map(e => e.bioimpedancia?.massa_muscular || 0);
        
        // Destruir gráficos existentes se houver
        if (this.weightChart) this.weightChart.destroy();
        if (this.imcChart) this.imcChart.destroy();
        if (this.muscleChart) this.muscleChart.destroy();
        
        // Gráfico de Peso
        const weightCtx = document.getElementById('weightChart')?.getContext('2d');
        if (weightCtx) {
            this.weightChart = new Chart(weightCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Peso (kg)',
                        data: weights,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#f97316',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw} kg`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Gráfico de IMC
        const imcCtx = document.getElementById('imcChart')?.getContext('2d');
        if (imcCtx) {
            this.imcChart = new Chart(imcCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'IMC',
                        data: imcs,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.raw}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'IMC'
                            }
                        }
                    }
                }
            });
        }
        
        // Gráfico de Massa Muscular (apenas se houver dados)
        const muscleCtx = document.getElementById('muscleChart')?.getContext('2d');
        if (muscleCtx) {
            const hasMuscleData = muscles.some(m => m > 0);
            
            if (hasMuscleData) {
                this.muscleChart = new Chart(muscleCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Massa Muscular (kg)',
                            data: muscles,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: ${context.raw} kg`;
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                muscleCtx.clearRect(0, 0, muscleCtx.canvas.width, muscleCtx.canvas.height);
                muscleCtx.font = '14px Arial';
                muscleCtx.fillStyle = '#999';
                muscleCtx.textAlign = 'center';
                muscleCtx.fillText('Dados de massa muscular não disponíveis', muscleCtx.canvas.width/2, muscleCtx.canvas.height/2);
            }
        }
    }
}
