// Configuração do Back4App
const BACK4APP_CONFIG = {
  applicationId: "JKv58h5Eyyzdur5fJZUwoPfgbqEvebszRzXbk31q",
  restApiKey: "SbGcthXS7G0NhUrmyfVKg1PQ96K2zzeDrbLK0eON",
  serverUrl: "https://parseapi.back4app.com/"
};

// Headers para requisições ao Back4App
const headers = {
  "X-Parse-Application-Id": BACK4APP_CONFIG.applicationId,
  "X-Parse-REST-API-Key": BACK4APP_CONFIG.restApiKey,
  "Content-Type": "application/json"
};

// Estado da aplicação
const appState = {
  currentSection: 'dashboard',
  products: [],
  customers: [],
  orders: [],
  payments: [],
  currentProduct: null,
  chartType: 'bar',
  charts: {},
  // Paginação de produtos
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  }
};

// ===========================================
// GERENCIAMENTO DA NAVEGAÇÃO
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar navegação
  setupNavigation();
  
  // Carregar dados iniciais do back4app
  loadAllData();
  
  // Configurar CRUD de produtos
  setupProductCRUD();
  
  // Configurar API pública
  setupPublicApi();
  
  // Configurar seletores de gráficos
  setupChartSelectors();
});

function setupNavigation() {
  const navItems = {
    'nav-dashboard': 'section-dashboard',
    'nav-products': 'section-products',
    'nav-customers': 'section-customers',
    'nav-orders': 'section-orders',
    'nav-apidata': 'section-apidata'
  };
  
  Object.keys(navItems).forEach(navId => {
    document.getElementById(navId).addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remover classe active de todos os links
      document.querySelectorAll('.sidebar a').forEach(link => {
        link.classList.remove('active');
      });
      
      // Adicionar classe active ao link clicado
      e.target.classList.add('active');
      
      // Esconder todas as seções
      document.querySelectorAll('main section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('section-active');
      });
      
      // Mostrar a seção correspondente
      const sectionId = navItems[navId];
      const section = document.getElementById(sectionId);
      section.classList.remove('hidden');
      section.classList.add('section-active');
      
      // Atualizar o estado da aplicação
      appState.currentSection = navId.replace('nav-', '');
      
      // Se estamos indo para o dashboard, atualizar os gráficos
      if (appState.currentSection === 'dashboard') {
        updateAllCharts();
      }
    });
  });
}

// ===========================================
// CARREGAMENTO DE DADOS DO BACK4APP
// ===========================================
async function loadAllData() {
  try {
    // Carregar dados em paralelo
    const [productsData, customersData, ordersData, paymentsData] = await Promise.all([
      fetchProducts(),
      fetchCustomers(),
      fetchOrders(),
      fetchPayments()
    ]);
    
    // Atualizar o estado da aplicação
    appState.products = productsData;
    appState.customers = customersData;
    appState.orders = ordersData;
    appState.payments = paymentsData;
    
    // Atualizar total de itens para paginação
    appState.pagination.totalItems = productsData.length;
    
    // Renderizar tabelas
    renderProductsTable();
    renderCustomersTable();
    renderOrdersTable();
    
    // Atualizar gráficos
    updateAllCharts();
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
  }
}

// Função para buscar produtos do Back4App
async function fetchProducts() {
  const response = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Products`, { 
    headers 
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar produtos: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

// Função para buscar clientes
async function fetchCustomers() {
  const response = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Customers?limit=10000`, { 
    headers 
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar clientes: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

// Função para buscar pedidos
async function fetchOrders() {
  const response = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Orders?limit=10000`, { 
    headers 
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar pedidos: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

// Função para buscar pagamentos
async function fetchPayments() {
  const response = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Payments?limit=10000`, { 
    headers 
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar pagamentos: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

// ===========================================
// CRUD DE PRODUTOS COM PAGINAÇÃO
// ===========================================
function setupProductCRUD() {
  // Botão para adicionar novo produto
  document.getElementById('btn-add-product').addEventListener('click', () => {
    appState.currentProduct = null;
    document.getElementById('product-form-title').textContent = 'Adicionar Produto';
    document.getElementById('product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('product-form-container').classList.remove('hidden');
  });
  
  // Botão para cancelar formulário
  document.getElementById('btn-cancel-product').addEventListener('click', () => {
    document.getElementById('product-form-container').classList.add('hidden');
  });
  
  // Salvar produto (criar ou atualizar)
  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const product = {
      name: document.getElementById('product-name').value,
      category: document.getElementById('product-category').value,
      price: parseFloat(document.getElementById('product-price').value),
      description: document.getElementById('product-description').value
    };
    
    try {
      if (productId) {
        // Atualização de produto existente
        await updateProduct(productId, product);
      } else {
        // Criação de novo produto
        await createProduct(product);
      }
      
      // Recarregar produtos
      appState.products = await fetchProducts();
      appState.pagination.totalItems = appState.products.length;
      renderProductsTable();
      
      // Esconder formulário
      document.getElementById('product-form-container').classList.add('hidden');
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Ocorreu um erro ao salvar o produto. Por favor, tente novamente.');
    }
  });
}

// Criar novo produto
async function createProduct(product) {
  const response = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(product)
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao criar produto: ${response.status}`);
  }
  
  return response.json();
}

// Atualizar produto existente
async function updateProduct(productId, product) {
  const response = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Products/${productId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(product)
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao atualizar produto: ${response.status}`);
  }
  
  return response.json();
}

// Excluir produto
async function deleteProduct(productId) {
  const response = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Products/${productId}`, {
    method: 'DELETE',
    headers
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao excluir produto: ${response.status}`);
  }
  
  return response.json();
}

// Renderizar tabela de produtos com paginação
function renderProductsTable() {
  const productsList = document.getElementById('products-list');
  const loadingElement = document.getElementById('products-loading');
  const emptyElement = document.getElementById('products-empty');
  
  // Mostrar loading
  loadingElement.classList.remove('hidden');
  emptyElement.classList.add('hidden');
  productsList.innerHTML = '';
  
  if (appState.products.length === 0) {
    // Sem produtos
    loadingElement.classList.add('hidden');
    emptyElement.classList.remove('hidden');
    return;
  }
  
  // Calcular paginação
  const { currentPage, itemsPerPage } = appState.pagination;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = appState.products.slice(startIndex, endIndex);
  
  // Renderizar produtos da página atual
  paginatedProducts.forEach(product => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${product.name || 'N/A'}</td>
      <td>${product.category || 'N/A'}</td>
      <td>R$ ${product.price ? product.price.toFixed(2) : '0.00'}</td>
      <td class="action-buttons">
        <span class="edit-btn" data-id="${product.objectId}">✏️ Editar</span>
        <span class="delete-btn" data-id="${product.objectId}">🗑️ Excluir</span>
      </td>
    `;
    
    productsList.appendChild(row);
  });
  
  // Adicionar event listeners para botões de ação
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', handleEditProduct);
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteProduct);
  });
  
  // Renderizar controles de paginação
  renderPaginationControls();
  
  // Esconder loading
  loadingElement.classList.add('hidden');
}

// Renderizar controles de paginação
function renderPaginationControls() {
  const { currentPage, itemsPerPage, totalItems } = appState.pagination;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Verificar se já existe container de paginação
  let paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer) {
    paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    paginationContainer.className = 'pagination-container';
    
    // Inserir após a tabela
    const tableContainer = document.querySelector('#section-products .data-table-container');
    tableContainer.appendChild(paginationContainer);
  }
  
  // Limpar container
  paginationContainer.innerHTML = '';
  
  if (totalPages <= 1) {
    return; // Não mostrar paginação se há apenas uma página
  }
  
  // Criar HTML da paginação
  let paginationHTML = `
    <div class="pagination-info">
      Mostrando ${(currentPage - 1) * itemsPerPage + 1} a ${Math.min(currentPage * itemsPerPage, totalItems)} de ${totalItems} produtos
    </div>
    <div class="pagination-controls">
  `;
  
  // Botão anterior
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
      ← Anterior
    </button>
  `;
  
  // Botões de página
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      paginationHTML += `<button class="pagination-btn active">${i}</button>`;
    } else if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      paginationHTML += `<button class="pagination-btn" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }
  
  // Botão próximo
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
      Próximo →
    </button>
  `;
  
  paginationHTML += '</div>';
  
  paginationContainer.innerHTML = paginationHTML;
}

// Função global para mudar página
function changePage(page) {
  const totalPages = Math.ceil(appState.pagination.totalItems / appState.pagination.itemsPerPage);
  
  if (page < 1 || page > totalPages) {
    return;
  }
  
  appState.pagination.currentPage = page;
  renderProductsTable();
}

// Manipular edição de produto
function handleEditProduct(e) {
  const productId = e.target.getAttribute('data-id');
  const product = appState.products.find(p => p.objectId === productId);
  
  if (!product) return;
  
  // Preencher formulário
  document.getElementById('product-form-title').textContent = 'Editar Produto';
  document.getElementById('product-id').value = product.objectId;
  document.getElementById('product-name').value = product.name || '';
  document.getElementById('product-category').value = product.category || '';
  document.getElementById('product-price').value = product.price || 0;
  document.getElementById('product-description').value = product.description || '';
  
  // Mostrar formulário
  document.getElementById('product-form-container').classList.remove('hidden');
}

// Manipular exclusão de produto
async function handleDeleteProduct(e) {
  const productId = e.target.getAttribute('data-id');
  
  if (!confirm('Tem certeza que deseja excluir este produto?')) {
    return;
  }
  
  try {
    await deleteProduct(productId);
    
    // Atualizar lista de produtos
    appState.products = appState.products.filter(p => p.objectId !== productId);
    appState.pagination.totalItems = appState.products.length;
    
    // Ajustar página atual se necessário
    const totalPages = Math.ceil(appState.pagination.totalItems / appState.pagination.itemsPerPage);
    if (appState.pagination.currentPage > totalPages && totalPages > 0) {
      appState.pagination.currentPage = totalPages;
    }
    
    renderProductsTable();
    
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    alert('Ocorreu um erro ao excluir o produto. Por favor, tente novamente.');
  }
}

// ===========================================
// RENDERIZAÇÃO DE TABELAS
// ===========================================
function renderCustomersTable() {
  const customersList = document.getElementById('customers-list');
  const loadingElement = document.getElementById('customers-loading');
  const emptyElement = document.getElementById('customers-empty');
  
  // Mostrar loading
  loadingElement.classList.remove('hidden');
  emptyElement.classList.add('hidden');
  customersList.innerHTML = '';
  
  if (appState.customers.length === 0) {
    // Sem clientes
    loadingElement.classList.add('hidden');
    emptyElement.classList.remove('hidden');
    return;
  }
  
  // Renderizar clientes (limitado a 50 para melhor performance)
  const displayCustomers = appState.customers.slice(0, 50);
  
  displayCustomers.forEach(customer => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${customer.customer_id || 'N/A'}</td>
      <td>${customer.customer_state || 'N/A'}</td>
      <td>${customer.customer_city || 'N/A'}</td>
    `;
    
    customersList.appendChild(row);
  });
  
  // Esconder loading
  loadingElement.classList.add('hidden');
}

function renderOrdersTable() {
  const ordersList = document.getElementById('orders-list');
  const loadingElement = document.getElementById('orders-loading');
  const emptyElement = document.getElementById('orders-empty');
  
  // Mostrar loading
  loadingElement.classList.remove('hidden');
  emptyElement.classList.add('hidden');
  ordersList.innerHTML = '';
  
  if (appState.orders.length === 0) {
    // Sem pedidos
    loadingElement.classList.add('hidden');
    emptyElement.classList.remove('hidden');
    return;
  }
  
  // Renderizar pedidos (limitado a 50 para melhor performance)
  const displayOrders = appState.orders.slice(0, 50);
  
  displayOrders.forEach(order => {
    const row = document.createElement('tr');
    
    // Formatar datas
    const purchaseDate = order.order_purchase_timestamp ? new Date(order.order_purchase_timestamp).toLocaleDateString('pt-BR') : 'N/A';
    const deliveryDate = order.order_delivered_customer_date ? new Date(order.order_delivered_customer_date).toLocaleDateString('pt-BR') : 'N/A';
    
    row.innerHTML = `
      <td>${order.order_id || 'N/A'}</td>
      <td>${order.customer_id || 'N/A'}</td>
      <td>${order.order_status || 'N/A'}</td>
      <td>${purchaseDate}</td>
      <td>${deliveryDate}</td>
    `;
    
    ordersList.appendChild(row);
  });
  
  // Esconder loading
  loadingElement.classList.add('hidden');
}

// ===========================================
// IMPLEMENTAÇÃO DA API PÚBLICA (CEP)
// ===========================================
function setupPublicApi() {
  const filterButton = document.getElementById('api-filter-button');
  const filterInput = document.getElementById('api-filter-input');
  
  filterButton.addEventListener('click', () => {
    const cep = filterInput.value.trim().replace(/\D/g, '');
    
    if (cep.length !== 8) {
      alert('Por favor, digite um CEP válido (8 dígitos).');
      return;
    }
    
    searchCEP(cep);
  });
  
  // Permitir buscar ao pressionar Enter
  filterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      filterButton.click();
    }
  });
}

async function searchCEP(cep) {
  const resultsContainer = document.getElementById('api-data-results');
  const loadingElement = document.getElementById('api-loading');
  const emptyElement = document.getElementById('api-empty');
  
  // Mostrar loading
  loadingElement.classList.remove('hidden');
  emptyElement.classList.add('hidden');
  resultsContainer.innerHTML = '';
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar CEP: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    // Mostrar resultados
    const card = document.createElement('div');
    card.className = 'api-card';
    
    card.innerHTML = `
      <h4>CEP: ${data.cep}</h4>
      <p><strong>Logradouro:</strong> ${data.logradouro || 'N/A'}</p>
      <p><strong>Complemento:</strong> ${data.complemento || 'N/A'}</p>
      <p><strong>Bairro:</strong> ${data.bairro || 'N/A'}</p>
      <p><strong>Cidade:</strong> ${data.localidade || 'N/A'}</p>
      <p><strong>Estado:</strong> ${data.uf || 'N/A'}</p>
      <p><strong>DDD:</strong> ${data.ddd || 'N/A'}</p>
    `;
    
    resultsContainer.appendChild(card);
    
    // Esconder loading
    loadingElement.classList.add('hidden');
    
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    loadingElement.classList.add('hidden');
    emptyElement.classList.remove('hidden');
    emptyElement.textContent = `Erro: ${error.message || 'Não foi possível encontrar o CEP informado'}`;
  }
}

// ===========================================
// GRÁFICOS
// ===========================================
function setupChartSelectors() {
  document.getElementById('barBtn').addEventListener('click', () => {
    setChartType('bar');
  });
  
  document.getElementById('lineBtn').addEventListener('click', () => {
    setChartType('line');
  });
  
  document.getElementById('pieBtn').addEventListener('click', () => {
    setChartType('pie');
  });
}

function setChartType(type) {
  // Atualizar botões
  document.querySelectorAll('.chart-selector button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`${type}Btn`).classList.add('active');
  
  // Atualizar tipo de gráfico
  appState.chartType = type;
  
  // Atualizar gráficos
  updateAllCharts();
}

function updateAllCharts() {
  // Só atualiza se estivermos na seção de dashboard
  if (appState.currentSection !== 'dashboard') return;
  
  // Atualizar todos os gráficos
  updatePaymentChart();
  updateOrdersByStateChart();
  updateDeliveryTimeChart();
  updateOrderValueChart();
}

// Gráfico 1: Distribuição dos Tipos de Pagamento
function updatePaymentChart() {
  const canvas = document.getElementById('graficoPagamentos');
  
  // Destruir gráfico existente, se houver
  if (appState.charts.payments) {
    appState.charts.payments.destroy();
  }
  
  // Verificar se temos dados
  if (!appState.payments || appState.payments.length === 0) {
    return;
  }
  
  // Preparar dados
  const counts = {};
  appState.payments.forEach(p => {
    const tipo = p.payment_type || 'desconhecido';
    counts[tipo] = (counts[tipo] || 0) + 1;
  });
  
  // Cores para o gráfico
  const colors = [
    'rgba(255, 99, 132, 0.5)',
    'rgba(54, 162, 235, 0.5)',
    'rgba(75, 192, 192, 0.5)',
    'rgba(255, 206, 86, 0.5)',
    'rgba(153, 102, 255, 0.5)'
  ];
  
  const borderColors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(75, 192, 192)',
    'rgb(255, 206, 86)',
    'rgb(153, 102, 255)'
  ];
  
  // Configuração inicial
  let config = {
    type: appState.chartType,
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Tipos de Pagamento',
        data: Object.values(counts),
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Distribuição dos Tipos de Pagamento',
          font: {
            size: 16
          }
        },
        legend: {
          position: 'top',
        }
      }
    }
  };
  
  // Para gráficos que não são de pizza, adicionar escalas
  if (appState.chartType !== 'pie') {
    config.options.scales = {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantidade'
        }
      }
    };
  }
  
  // Criar o gráfico
  appState.charts.payments = new Chart(canvas, config);
}

// Gráfico 2: Total de Pedidos por Estado
function updateOrdersByStateChart() {
  const canvas = document.getElementById('graficoPedidosEstado');
  
  // Destruir gráfico existente, se houver
  if (appState.charts.ordersByState) {
    appState.charts.ordersByState.destroy();
  }
  
  // Verificar se temos dados
  if (!appState.orders || appState.orders.length === 0 || !appState.customers || appState.customers.length === 0) {
    return;
  }
  
  // Criar um mapa de cliente para estado
  const customerMap = {};
  appState.customers.forEach(c => {
    customerMap[c.customer_id] = c.customer_state;
  });
  
  // Contar pedidos por estado
  const counts = {};
  appState.orders.forEach(o => {
    const state = customerMap[o.customer_id];
    if (state) {
      counts[state] = (counts[state] || 0) + 1;
    }
  });
  
  // Cores para o gráfico
  const color = 'rgba(54, 162, 235, 0.5)';
  const borderColor = 'rgb(54, 162, 235)';
  
  // Configuração inicial
  let config = {
    type: appState.chartType === 'pie' ? 'pie' : appState.chartType,
    data: {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Pedidos por Estado',
        data: Object.values(counts),
        backgroundColor: appState.chartType === 'pie' ? 
          Object.keys(counts).map((_, i) => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`) : 
          color,
        borderColor: appState.chartType === 'pie' ? 
          Object.keys(counts).map((_, i) => `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`) : 
          borderColor,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Total de Pedidos por Estado',
          font: {
            size: 16
          }
        },
        legend: {
          position: 'top',
        }
      }
    }
  };
  
  // Para gráficos que não são de pizza, adicionar escalas
  if (appState.chartType !== 'pie') {
    config.options.scales = {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantidade de Pedidos'
        }
      }
    };
  }
  
  // Criar o gráfico
  appState.charts.ordersByState = new Chart(canvas, config);
}

// Continuação do código onde parou + correções

// Gráfico 3: Tempo Médio de Entrega por Estado (continuação da função que estava cortada)
function updateDeliveryTimeChart() {
  const canvas = document.getElementById('graficoEntregaEstado');
  
  // Destruir gráfico existente, se houver
  if (appState.charts.deliveryTime) {
    appState.charts.deliveryTime.destroy();
  }
  
  // Verificar se temos dados
  if (!appState.orders || appState.orders.length === 0 || !appState.customers || appState.customers.length === 0) {
    return;
  }
  
  // Criar um mapa de cliente para estado
  const customerMap = {};
  appState.customers.forEach(c => {
    customerMap[c.customer_id] = c.customer_state;
  });
  
  // Calcular tempo médio de entrega por estado
  const estados = {};
  const quantidades = {};
  
  appState.orders.forEach(o => {
    const state = customerMap[o.customer_id];
    const dtCompra = new Date(o.order_purchase_timestamp);
    const dtEntrega = new Date(o.order_delivered_customer_date);
    
    // Verificar se as datas são válidas
    if (state && !isNaN(dtCompra.getTime()) && !isNaN(dtEntrega.getTime()) && dtEntrega > dtCompra) {
      const diffTime = dtEntrega - dtCompra;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (!estados[state]) {
        estados[state] = 0;
        quantidades[state] = 0;
      }
      
      estados[state] += diffDays;
      quantidades[state]++;
    }
  });
  
  // Calcular médias
  const medias = {};
  Object.keys(estados).forEach(state => {
    medias[state] = estados[state] / quantidades[state];
  });
  
  // Verificar se temos dados para mostrar
  if (Object.keys(medias).length === 0) {
    return;
  }
  
  // Cores para o gráfico
  const color = 'rgba(75, 192, 192, 0.5)';
  const borderColor = 'rgb(75, 192, 192)';
  
  // Configuração inicial
  let config = {
    type: appState.chartType === 'pie' ? 'pie' : appState.chartType,
    data: {
      labels: Object.keys(medias),
      datasets: [{
        label: 'Tempo Médio de Entrega (dias)',
        data: Object.values(medias),
        backgroundColor: appState.chartType === 'pie' ? 
          Object.keys(medias).map((_, i) => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`) : 
          color,
        borderColor: appState.chartType === 'pie' ? 
          Object.keys(medias).map((_, i) => `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`) : 
          borderColor,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Tempo Médio de Entrega por Estado (dias)',
          font: {
            size: 16
          }
        },
        legend: {
          position: 'top',
        }
      }
    }
  };
  
  // Para gráficos que não são de pizza, adicionar escalas
  if (appState.chartType !== 'pie') {
    config.options.scales = {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Dias'
        }
      }
    };
  }
  
  // Criar o gráfico
  appState.charts.deliveryTime = new Chart(canvas, config);
}

// Gráfico 4: Valor Médio das Compras por Estado
function updateOrderValueChart() {
  const canvas = document.getElementById('graficoValorPorEstado');

  if (appState.charts.orderValue) {
    appState.charts.orderValue.destroy();
  }

  if (!appState.orders.length || !appState.customers.length) return;

  // Mapeia clientes por estado
  const customerMap = {};
  appState.customers.forEach(c => {
    customerMap[c.customer_id] = c.customer_state;
  });

  // Soma e conta valores por estado
  const somaPorEstado = {};
  const contagemPorEstado = {};

  appState.orders.forEach(order => {
    const state = customerMap[order.customer_id];
    const value = order.payment_value;

    if (state && typeof value === 'number' && value > 0) {
      somaPorEstado[state] = (somaPorEstado[state] || 0) + value;
      contagemPorEstado[state] = (contagemPorEstado[state] || 0) + 1;
    }
  });

  // Calcula valor médio por estado
  const valorMedioPorEstado = {};
  for (const estado in somaPorEstado) {
    valorMedioPorEstado[estado] = somaPorEstado[estado] / contagemPorEstado[estado];
  }

  if (!Object.keys(valorMedioPorEstado).length) return;

  // Cores
  const backgroundColor = 'rgba(255, 159, 64, 0.5)';
  const borderColor = 'rgb(255, 159, 64)';

  const config = {
    type: appState.chartType === 'pie' ? 'pie' : appState.chartType,
    data: {
      labels: Object.keys(valorMedioPorEstado),
      datasets: [{
        label: 'Valor Médio (R$)',
        data: Object.values(valorMedioPorEstado),
        backgroundColor: appState.chartType === 'pie'
          ? Object.keys(valorMedioPorEstado).map(() =>
              `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.5)`)
          : backgroundColor,
        borderColor: appState.chartType === 'pie'
          ? Object.keys(valorMedioPorEstado).map(() =>
              `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})`)
          : borderColor,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Valor Médio das Compras por Estado',
          font: { size: 16 }
        },
        legend: {
          position: 'top'
        }
      }
    }
  };

  if (appState.chartType !== 'pie') {
    config.options.scales = {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Valor (R$)'
        }
      }
    };
  }

  appState.charts.orderValue = new Chart(canvas, config);
}

// MELHORIAS NA PAGINAÇÃO DE PRODUTOS
// Função aprimorada para buscar produtos com paginação do servidor
async function fetchProductsPaginated(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  try {
    // Buscar produtos com paginação
    const response = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Products?limit=${limit}&skip=${skip}&order=-createdAt`, { 
      headers 
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar produtos: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Buscar total de produtos para paginação
    const countResponse = await fetch(`${BACK4APP_CONFIG.serverUrl}classes/Products?limit=0&count=1`, { 
      headers 
    });
    
    if (countResponse.ok) {
      const countData = await countResponse.json();
      appState.pagination.totalItems = countData.count || 0;
    }
    
    return data.results || [];
  } catch (error) {
    console.error('Erro ao buscar produtos paginados:', error);
    throw error;
  }
}

// Função aprimorada para carregar produtos com paginação
async function loadProductsPage(page = 1) {
  try {
    const products = await fetchProductsPaginated(page, appState.pagination.itemsPerPage);
    appState.products = products;
    appState.pagination.currentPage = page;
    renderProductsTable();
  } catch (error) {
    console.error('Erro ao carregar página de produtos:', error);
    alert('Erro ao carregar produtos. Tente novamente.');
  }
}

// Função global aprimorada para mudar página
function changePage(page) {
  const totalPages = Math.ceil(appState.pagination.totalItems / appState.pagination.itemsPerPage);
  
  if (page < 1 || page > totalPages) {
    return;
  }
  
  // Carregar nova página do servidor
  loadProductsPage(page);
}

// Função para adicionar controles de itens por página
function renderItemsPerPageControl() {
  let controlContainer = document.getElementById('items-per-page-container');
  
  if (!controlContainer) {
    controlContainer = document.createElement('div');
    controlContainer.id = 'items-per-page-container';
    controlContainer.className = 'items-per-page-container';
    controlContainer.style.cssText = `
      margin: 10px 0;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    `;
    
    // Inserir antes da tabela
    const tableContainer = document.querySelector('#section-products .data-table-container');
    tableContainer.parentNode.insertBefore(controlContainer, tableContainer);
  }
  
  controlContainer.innerHTML = `
    <label for="items-per-page-select">Itens por página:</label>
    <select id="items-per-page-select" style="padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
      <option value="5" ${appState.pagination.itemsPerPage === 5 ? 'selected' : ''}>5</option>
      <option value="10" ${appState.pagination.itemsPerPage === 10 ? 'selected' : ''}>10</option>
      <option value="20" ${appState.pagination.itemsPerPage === 20 ? 'selected' : ''}>20</option>
      <option value="50" ${appState.pagination.itemsPerPage === 50 ? 'selected' : ''}>50</option>
    </select>
  `;
  
  // Adicionar event listener
  document.getElementById('items-per-page-select').addEventListener('change', (e) => {
    appState.pagination.itemsPerPage = parseInt(e.target.value);
    appState.pagination.currentPage = 1; // Voltar para primeira página
    loadProductsPage(1);
  });
}

// Função aprimorada para renderizar controles de paginação
function renderPaginationControls() {
  const { currentPage, itemsPerPage, totalItems } = appState.pagination;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Verificar se já existe container de paginação
  let paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer) {
    paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    paginationContainer.className = 'pagination-container';
    paginationContainer.style.cssText = `
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
    `;
    
    // Inserir após a tabela
    const tableContainer = document.querySelector('#section-products .data-table-container');
    tableContainer.appendChild(paginationContainer);
  }
  
  // Limpar container
  paginationContainer.innerHTML = '';
  
  if (totalPages <= 1) {
    return; // Não mostrar paginação se há apenas uma página
  }
  
  // Criar HTML da paginação
  let paginationHTML = `
    <div class="pagination-info" style="color: #666; font-size: 14px;">
      Mostrando ${(currentPage - 1) * itemsPerPage + 1} a ${Math.min(currentPage * itemsPerPage, totalItems)} de ${totalItems} produtos
    </div>
    <div class="pagination-controls" style="display: flex; gap: 5px; align-items: center;">
  `;
  
  // Botão primeira página
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(1)" 
            style="padding: 8px 12px; border: 1px solid #ddd; background: ${currentPage === 1 ? '#f5f5f5' : '#fff'}; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
      ⟪
    </button>
  `;
  
  // Botão anterior
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"
            style="padding: 8px 12px; border: 1px solid #ddd; background: ${currentPage === 1 ? '#f5f5f5' : '#fff'}; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
      ← Anterior
    </button>
  `;
  
  // Botões de página (mostrar no máximo 7 páginas)
  let startPage = Math.max(1, currentPage - 3);
  let endPage = Math.min(totalPages, currentPage + 3);
  
  // Ajustar para sempre mostrar 7 páginas quando possível
  if (endPage - startPage < 6) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + 6);
    } else {
      startPage = Math.max(1, endPage - 6);
    }
  }
  
  // Mostrar primeira página se não estiver no range
  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(1)" style="padding: 8px 12px; border: 1px solid #ddd; background: #fff; cursor: pointer;">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span style="padding: 8px 4px;">...</span>`;
    }
  }
  
  // Páginas no range
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `<button class="pagination-btn active" style="padding: 8px 12px; border: 1px solid #007bff; background: #007bff; color: white; cursor: default;">${i}</button>`;
    } else {
      paginationHTML += `<button class="pagination-btn" onclick="changePage(${i})" style="padding: 8px 12px; border: 1px solid #ddd; background: #fff; cursor: pointer;">${i}</button>`;
    }
  }
  
  // Mostrar última página se não estiver no range
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span style="padding: 8px 4px;">...</span>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})" style="padding: 8px 12px; border: 1px solid #ddd; background: #fff; cursor: pointer;">${totalPages}</button>`;
  }
  
  // Botão próximo
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"
            style="padding: 8px 12px; border: 1px solid #ddd; background: ${currentPage === totalPages ? '#f5f5f5' : '#fff'}; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
      Próximo →
    </button>
  `;
  
  // Botão última página
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${totalPages})"
            style="padding: 8px 12px; border: 1px solid #ddd; background: ${currentPage === totalPages ? '#f5f5f5' : '#fff'}; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
      ⟫
    </button>
  `;
  
  paginationHTML += '</div>';
  
  paginationContainer.innerHTML = paginationHTML;
}

// Função aprimorada para renderizar tabela de produtos
function renderProductsTable() {
  const productsList = document.getElementById('products-list');
  const loadingElement = document.getElementById('products-loading');
  const emptyElement = document.getElementById('products-empty');
  
  // Renderizar controle de itens por página
  renderItemsPerPageControl();
  
  // Mostrar loading
  loadingElement.classList.remove('hidden');
  emptyElement.classList.add('hidden');
  productsList.innerHTML = '';
  
  if (appState.products.length === 0) {
    // Sem produtos
    loadingElement.classList.add('hidden');
    emptyElement.classList.remove('hidden');
    return;
  }
  
  // Renderizar produtos (já vem paginado do servidor)
  appState.products.forEach(product => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${product.name || 'N/A'}</td>
      <td>${product.category || 'N/A'}</td>
      <td>R$ ${product.price ? product.price.toFixed(2) : '0.00'}</td>
      <td class="action-buttons">
        <span class="edit-btn" data-id="${product.objectId}" style="cursor: pointer; color: #007bff; margin-right: 10px;">✏️ Editar</span>
        <span class="delete-btn" data-id="${product.objectId}" style="cursor: pointer; color: #dc3545;">🗑️ Excluir</span>
      </td>
    `;
    
    productsList.appendChild(row);
  });
  
  // Adicionar event listeners para botões de ação
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', handleEditProduct);
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteProduct);
  });
  
  // Renderizar controles de paginação
  renderPaginationControls();
  
  // Esconder loading
  loadingElement.classList.add('hidden');
}

// Atualizar a função de carregamento inicial para usar a nova paginação
async function loadAllData() {
  try {
    // Carregar primeira página de produtos
    await loadProductsPage(1);
    
    // Carregar outros dados em paralelo
    const [customersData, ordersData, paymentsData] = await Promise.all([
      fetchCustomers(),
      fetchOrders(),
      fetchPayments()
    ]);
    
    // Atualizar o estado da aplicação
    appState.customers = customersData;
    appState.orders = ordersData;
    appState.payments = paymentsData;
    
    // Renderizar tabelas
    renderCustomersTable();
    renderOrdersTable();
    
    // Atualizar gráficos
    updateAllCharts();
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert('Ocorreu um erro ao carregar os dados. Por favor, tente novamente.');
  }
}