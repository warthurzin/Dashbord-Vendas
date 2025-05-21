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
  charts: {}
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
// CRUD DE PRODUTOS
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

// Renderizar tabela de produtos
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
  
  // Renderizar produtos
  appState.products.forEach(product => {
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
  
  // Esconder loading
  loadingElement.classList.add('hidden');
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

// Gráfico 3: Tempo Médio de Entrega por Estado
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
    
    if (state && dtCompra && dtEntrega && !isNaN(dtCompra) && !isNaN(dtEntrega) && dtEntrega > dtCompra) {
      const dias = (dtEntrega - dtCompra) / (1000 * 60 * 60 * 24);
      estados[state] = (estados[state] || 0) + dias;
      quantidades[state] = (quantidades[state] || 0) + 1;
    }
  });
  
  // Calcular médias
  const medias = {};
  Object.keys(estados).forEach(state => {
    medias[state] = Number((estados[state] / quantidades[state]).toFixed(1));
  });
  
  // Cores para o gráfico
  const color = 'rgba(75, 192, 192, 0.5)';
  const borderColor = 'rgb(75, 192, 192)';
  
  // Configuração inicial
  let config = {
    type: appState.chartType === 'pie' ? 'pie' : appState.chartType,
    data: {
      labels: Object.keys(medias),
      datasets: [{
        label: 'Tempo médio de entrega (dias)',
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
  
  // Destruir gráfico existente, se houver
  if (appState.charts.orderValue) {
    appState.charts.orderValue.destroy();
  }
  
  // Verificar se temos dados
  if (!appState.orders || appState.orders.length === 0 || 
      !appState.customers || appState.customers.length === 0 ||
      !appState.payments || appState.payments.length === 0) {
    return;
  }
  
  // Criar um mapa de cliente para estado
  const customerMap = {};
  appState.customers.forEach(c => {
    customerMap[c.customer_id] = c.customer_state;
  });
  
  // Somar valores de pagamento por pedido
  const orderValues = {};
  appState.payments.forEach(p => {
    if (p.order_id && p.payment_value) {
      orderValues[p.order_id] = (orderValues[p.order_id] || 0) + p.payment_value;
    }
  });
  
  // Calcular valor médio por estado
  const totalPorEstado = {};
  const qtdPorEstado = {};
  
  appState.orders.forEach(o => {
    const state = customerMap[o.customer_id];
    const valor = orderValues[o.order_id];
    
    if (state && valor) {
      totalPorEstado[state] = (totalPorEstado[state] || 0) + valor;
      qtdPorEstado[state] = (qtdPorEstado[state] || 0) + 1;
    }
  });
  
  // Calcular médias
  const medias = {};
  Object.keys(totalPorEstado).forEach(state => {
    medias[state] = Number((totalPorEstado[state] / qtdPorEstado[state]).toFixed(2));
  });
  
  // Cores para o gráfico
  const color = 'rgba(255, 99, 132, 0.5)';
  const borderColor = 'rgb(255, 99, 132)';
  
  // Configuração inicial
  let config = {
    type: appState.chartType === 'pie' ? 'pie' : appState.chartType,
    data: {
      labels: Object.keys(medias),
      datasets: [{
        label: 'Valor médio por pedido (R$)',
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
          text: 'Valor Médio das Compras por Estado (R$)',
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
          text: 'Valor (R$)'
        }
      }
    };
  }
  
  // Criar o gráfico
  appState.charts.orderValue = new Chart(canvas, config);
}