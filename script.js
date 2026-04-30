/**
 * LÓGICA DEL SISTEMA DE INVENTARIO
 * Maneja el estado de la aplicación mediante LocalStorage.
 */

// CLAVES DE PERSISTENCIA: Constantes para evitar errores de dedo al acceder a memoria
const CAT_KEY = "inv_categorias";
const PROD_KEY = "inv_productos";

/** 
 * CARGA DE DATOS: Lee de LocalStorage y parsea a JSON.
 * Si no hay datos, retorna un arreglo vacío para evitar errores de ejecución.
 */
function load(key) { 
    return JSON.parse(localStorage.getItem(key) || "[]"); 
}

/** 
 * PERSISTENCIA: Serializa el objeto JS a cadena de texto y guarda en memoria.
 */
function save(key, data) { 
    localStorage.setItem(key, JSON.stringify(data)); 
}

/** 
 * GENERADOR DE ID: Crea un identificador único de 5 caracteres.
 * Útil para diferenciar productos con nombres similares.
 */
function generateID() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

/** 
 * NAVEGACIÓN SPA: Simula una aplicación de una sola página.
 * Alterna clases 'active' para mostrar/ocultar el contenido.
 */
function showSection(sectionId, element) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    element.classList.add('active');
    
    // Si entramos al Dashboard, recalculamos las métricas
    if(sectionId === 'section-dashboard') updateDashboard();
}

/** 
 * DASHBOARD LOGIC: Realiza cálculos acumulativos sobre el inventario.
 */
function updateDashboard() {
    const prods = load(PROD_KEY);
    
    // Total de tipos de productos registrados
    document.getElementById('stat-total').textContent = prods.length;
    
    // Filtrado de productos que requieren atención inmediata (Reposición)
    const stockBajo = prods.filter(p => Number(p.stock) <= Number(p.minStock)).length;
    document.getElementById('stat-low').textContent = stockBajo;
    
    // Cálculo financiero: Sumatoria de (Precio * Cantidad)
    const totalValue = prods.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock)), 0);
    document.getElementById('stat-value').textContent = `$${totalValue.toFixed(2)}`;
}

/** 
 * GESTIÓN DE PRODUCTOS: Controlador central para Crear y Editar.
 */
function saveProduct() {
    const idHidden = document.getElementById("productId").value; // Recupera ID si estamos editando
    const name = document.getElementById("productName").value.trim();
    
    if(!name) return alert("Error: El nombre del producto es obligatorio.");

    let products = load(PROD_KEY);
    
    // Estructura del Modelo de Datos
    const productData = {
        id: idHidden || generateID(), // Mantiene ID original si edita, genera uno si es nuevo
        name: name,
        category: document.getElementById("productCategory").value,
        price: document.getElementById("productPrice").value || 0,
        stock: document.getElementById("productStock").value || 0,
        minStock: document.getElementById("productMinStock").value || 0
    };

    if(idHidden) {
        // MODO EDICIÓN: Encuentra el índice y reemplaza el objeto completo
        const idx = products.findIndex(x => x.id === idHidden);
        products[idx] = productData;
    } else {
        // MODO CREACIÓN: Inserta nuevo producto al final del arreglo
        products.push(productData);
    }
    
    save(PROD_KEY, products); // Persiste cambios
    clearForm();              // Resetea campos
    renderTable();            // Refresca UI
    updateDashboard();        // Actualiza estadísticas
}

/** 
 * RENDERIZADO DINÁMICO: Transforma el arreglo de objetos en filas HTML.
 */
function renderTable() {
    const products = load(PROD_KEY);
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = ""; // Limpieza previa del DOM
    
    products.forEach(p => {
        // Lógica condicional para alertas visuales
        const isLow = Number(p.stock) <= Number(p.minStock);
        
        tbody.innerHTML += `
            <tr>
                <td><span class="id-badge">${p.id}</span></td>
                <td><strong>${p.name}</strong></td>
                <td><span style="background:var(--accent); padding:4px 8px; border-radius:5px; font-size:0.8rem">${p.category}</span></td>
                <td>$${parseFloat(p.price).toFixed(2)}</td>
                <td>
                    ${p.stock} 
                    ${isLow ? '<br><span class="low-stock">BAJO STOCK</span>' : ''}
                </td>
                <td><span style="color:#666">${p.minStock}</span></td>
                <td>
                    <button class="btn-secondary" style="padding:4px 8px" onclick="editProduct('${p.id}')">Editar</button>
                    <button class="btn-danger" style="padding:4px 8px" onclick="deleteProduct('${p.id}')">Borrar</button>
                </td>
            </tr>`;
    });
}

/** 
 * ELIMINACIÓN: Utiliza filter() para remover un elemento sin mutar el arreglo original.
 */
function deleteProduct(id) {
    if (confirm("¿Está seguro de eliminar este producto del sistema?")) {
        const filtrados = load(PROD_KEY).filter(p => p.id !== id);
        save(PROD_KEY, filtrados);
        renderTable();
        updateDashboard();
    }
}

/** 
 * CARGA PARA EDICIÓN: Mapea los datos del objeto de vuelta a los inputs del formulario.
 */
function editProduct(id) {
    const p = load(PROD_KEY).find(x => x.id === id);
    document.getElementById("productId").value = p.id;
    document.getElementById("productName").value = p.name;
    document.getElementById("productCategory").value = p.category;
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productStock").value = p.stock;
    document.getElementById("productMinStock").value = p.minStock;
    document.getElementById("btnSave").textContent = "Actualizar Producto";
    window.scrollTo({top: 0, behavior: 'smooth'}); // Experiencia de usuario (UX)
}

/** 
 * RESETEO: Devuelve el formulario a su estado inicial.
 */
function clearForm() {
    document.getElementById("productId").value = "";
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productStock").value = "";
    document.getElementById("productMinStock").value = "";
    document.getElementById("btnSave").textContent = "Guardar Producto";
}

// FUNCIONES DE CATEGORÍA (IDEM A PRODUCTOS)
function renderCategories() {
    const categories = load(CAT_KEY);
    const select = document.getElementById("productCategory");
    const list = document.getElementById("categoryList");
    select.innerHTML = "";
    list.innerHTML = "";
    categories.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee">
                ${cat} <button class="btn-danger" style="padding:4px 8px" onclick="deleteCategory('${cat}')">Borrar</button>
            </div>`;
    });
}

function addCategory() {
    const name = document.getElementById("newCategory").value.trim();
    if(!name) return;
    const cats = load(CAT_KEY);
    if(cats.includes(name)) return alert("Esta categoría ya existe.");
    cats.push(name);
    save(CAT_KEY, cats);
    document.getElementById("newCategory").value = "";
    renderCategories();
}

function deleteCategory(cat) {
    if(!confirm(`¿Borrar la categoría "${cat}"?`)) return;
    save(CAT_KEY, load(CAT_KEY).filter(c => c !== cat));
    renderCategories();
}

/** 
 * AUTO-BOOTSTRAP: Lógica que se ejecuta al cargar la aplicación.
 */
if(load(CAT_KEY).length === 0) save(CAT_KEY, ["General", "Ventas"]); // Datos iniciales por defecto
renderCategories();
renderTable();
updateDashboard();