
(() => {

const sesionAdmin = Sesion.actual();
const rolesPagina = (document.documentElement.dataset.roles || "Administrador").split(",");
if (!sesionAdmin || !rolesPagina.includes(sesionAdmin.tipo)) {
  alert(sesionAdmin ? "No tienes permisos para ver esta sección." : "Debes iniciar sesión para entrar al panel.");
  location.replace(sesionAdmin && sesionAdmin.tipo === "Vendedor" ? "index.html" : "../login.html");
  return; 
}
const esAdmin = sesionAdmin.tipo === "Administrador";


document.querySelectorAll("[data-roles]").forEach(el => {
  if (el !== document.documentElement && !el.dataset.roles.split(",").includes(sesionAdmin.tipo)) el.remove();
});
document.getElementById("perfil-admin").textContent = `${sesionAdmin.nombre} · ${sesionAdmin.tipo}`;
document.getElementById("admin-salir").addEventListener("click", () => {
  Sesion.cerrar();
  location.href = "../login.html";
});


const btnMenu = document.querySelector(".admin-toggle");
const menu = document.getElementById("admin-menu");
if (btnMenu) btnMenu.addEventListener("click", () => {
  const abierto = menu.classList.toggle("abierto");
  btnMenu.setAttribute("aria-expanded", abierto);
});

const qs = new URLSearchParams(location.search);
const esCritico = p => p.stockCritico !== "" && p.stockCritico !== null && p.stockCritico !== undefined && p.stock <= Number(p.stockCritico);
const ESTADOS = ["En preparación", "Listo", "En camino", "Entregado"];


function paginar(lista, pagina, porPagina, contenedor, alCambiar) {
  const total = Math.max(1, Math.ceil(lista.length / porPagina));
  pagina = Math.min(pagina, total);
  contenedor.innerHTML = total > 1
    ? Array.from({ length: total }, (_, i) =>
        `<button type="button" data-pag="${i + 1}" ${i + 1 === pagina ? 'aria-current="true"' : ""}>${i + 1}</button>`).join("")
    : "";
  contenedor.onclick = e => { const b = e.target.closest("[data-pag]"); if (b) alCambiar(Number(b.dataset.pag)); };
  return lista.slice((pagina - 1) * porPagina, pagina * porPagina);
}


if (document.getElementById("estadisticas")) {
  document.getElementById("saludo").textContent = `¡Hola ${sesionAdmin.nombre}!`;
  document.getElementById("fecha-hoy").textContent = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const productos = Productos.todos();
  const ordenes = Ordenes.todas();
  const ventas = ordenes.reduce((s, o) => s + o.total, 0);
  const tarjetas = [
    ["Productos", productos.length],
    ["Órdenes", ordenes.length],
    ["Ventas totales", formatoCLP(ventas)],
    esAdmin ? ["Usuarios", Usuarios.todos().length] : ["Stock crítico", productos.filter(esCritico).length]
  ];
  document.getElementById("estadisticas").innerHTML = tarjetas
    .map(([t, v]) => `<article class="estadistica"><span>${t}</span><strong>${v}</strong></article>`).join("");

  const criticos = productos.filter(esCritico);
  document.getElementById("alertas-stock").innerHTML = criticos.length
    ? criticos.map(p => `<p class="alerta">⚠️ <strong>${escapar(p.nombre)}</strong> (${escapar(p.codigo)}) tiene stock ${p.stock}, igual o bajo el crítico (${p.stockCritico}).</p>`).join("")
    : "<p>Todo en orden: ningún producto está bajo su stock crítico.</p>";

  const ultimas = ordenes.slice(-5).reverse();
  document.getElementById("ultimas-ordenes").innerHTML = ultimas.length
    ? `<table class="tabla"><thead><tr><th>N°</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>
        ${ultimas.map(o => `<tr><td>${o.numero}</td><td>${escapar(o.cliente)}</td><td>${formatoCLP(o.total)}</td><td><span class="estado estado-${o.estado.replace(/\s/g, "-")}">${o.estado}</span></td></tr>`).join("")}
       </tbody></table>`
    : "<p>Aún no hay órdenes. Haz una compra en la tienda para verla aquí.</p>";
}


const tablaProductos = document.getElementById("tabla-productos");
if (tablaProductos) {
  const buscar = document.getElementById("buscar-producto");
  const filtroCat = document.getElementById("filtro-cat");
  CATEGORIAS.forEach(c => filtroCat.insertAdjacentHTML("beforeend", `<option>${escapar(c)}</option>`));
  let pagina = 1;

  function render() {
    const t = buscar.value.trim().toLowerCase();
    const lista = Productos.todos().filter(p =>
      (!t || (p.codigo + " " + p.nombre).toLowerCase().includes(t)) && (!filtroCat.value || p.categoria === filtroCat.value));
    const visibles = paginar(lista, pagina, 8, document.getElementById("paginacion-productos"), n => { pagina = n; render(); });
    tablaProductos.innerHTML = visibles.length ? visibles.map(p => `
      <tr>
        <td><img src="${Productos.imagen(p)}" alt=""></td>
        <td>${escapar(p.codigo)}</td>
        <td>${escapar(p.nombre)}</td>
        <td>${escapar(p.categoria)}</td>
        <td>${p.precio === 0 ? "FREE" : formatoCLP(p.precio)}</td>
        <td class="${esCritico(p) ? "critico" : ""}">${p.stock}${esCritico(p) ? " ⚠️" : ""}</td>
        <td class="acciones">
          <a class="btn btn-borde btn-chico" href="producto-detalle.html?codigo=${encodeURIComponent(p.codigo)}">Ver</a>
          ${esAdmin ? `<a class="btn btn-chico" href="producto-form.html?codigo=${encodeURIComponent(p.codigo)}">Editar</a>
          <button class="btn btn-peligro btn-chico" type="button" data-eliminar="${escapar(p.codigo)}">Eliminar</button>` : ""}
        </td>
      </tr>`).join("") : `<tr><td colspan="7">No hay productos que coincidan.</td></tr>`;
  }
  tablaProductos.addEventListener("click", e => {
    const b = e.target.closest("[data-eliminar]");
    if (b && confirm(`¿Eliminar el producto ${b.dataset.eliminar}?`)) {
      Productos.eliminar(b.dataset.eliminar);
      avisar("Producto eliminado.");
      render();
    }
  });
  buscar.addEventListener("input", () => { pagina = 1; render(); });
  filtroCat.addEventListener("change", () => { pagina = 1; render(); });
  render();
}


const formProducto = document.getElementById("form-producto");
if (formProducto) {
  const $ = id => formProducto.querySelector("#" + id);
  CATEGORIAS.forEach(c => $("categoria").insertAdjacentHTML("beforeend", `<option>${escapar(c)}</option>`));
  contadorCaracteres($("nombre"), 100);
  contadorCaracteres($("descripcion"), 500);

  const editando = qs.get("codigo") ? Productos.buscar(qs.get("codigo")) : null;
  let imagenData = editando ? editando.imagen : "";
  if (editando) {
    document.getElementById("titulo-form").textContent = "Editar producto";
    ["codigo", "nombre", "descripcion", "precio", "stock", "stockCritico", "categoria"].forEach(k => ($(k).value = editando[k] ?? ""));
    $("personalizable").checked = Boolean(editando.personalizable);
    $("vista-previa").src = Productos.imagen(editando);
    $("vista-previa").hidden = false;
  }


  $("imagen").addEventListener("change", () => {
    const archivo = $("imagen").files[0];
    let err = "";
    if (archivo && !archivo.type.startsWith("image/")) err = "El archivo debe ser una imagen.";
    else if (archivo && archivo.size > 1024 * 1024) err = "La imagen no puede pesar más de 1 MB.";
    mostrarError($("imagen"), err);
    if (err || !archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      imagenData = lector.result;
      $("vista-previa").src = imagenData;
      $("vista-previa").hidden = false;
    };
    lector.readAsDataURL(archivo);
  });


  const avisoStock = document.getElementById("aviso-stock");
  const revisarStock = () => {
    const s = $("stock").value, c = $("stockCritico").value;
    avisoStock.textContent = s !== "" && c !== "" && Number(s) <= Number(c)
      ? `⚠️ El stock (${s}) está igual o bajo el stock crítico (${c}). Se mostrará una alerta en el panel.` : "";
  };
  $("stock").addEventListener("input", revisarStock);
  $("stockCritico").addEventListener("input", revisarStock);
  revisarStock();

  conectarValidacion(formProducto, {
    codigo: v => Validar.requerido(v, "El código") || Validar.minLargo(v, 3, "El código") ||
      (/\s/.test(v.trim()) ? "El código no debe tener espacios." : "") ||
      ((!editando || editando.codigo !== v.trim().toUpperCase()) && Productos.buscar(v.trim().toUpperCase()) ? "Ya existe un producto con ese código." : ""),
    nombre: v => Validar.requerido(v, "El nombre") || Validar.maxLargo(v, 100, "El nombre"),
    descripcion: v => Validar.maxLargo(v, 500, "La descripción"),
    precio: v => Validar.requerido(v, "El precio") || Validar.numero(v, { min: 0, campo: "El precio" }),
    stock: v => Validar.requerido(v, "El stock") || Validar.numero(v, { min: 0, entero: true, campo: "El stock" }),
    stockCritico: v => Validar.numero(v, { min: 0, entero: true, campo: "El stock crítico" }),
    categoria: v => Validar.requerido(v, "La categoría")
  }, () => {
    const codigo = $("codigo").value.trim().toUpperCase();
    const producto = {
      codigo,
      nombre: $("nombre").value.trim(),
      descripcion: $("descripcion").value.trim(),
      precio: Number($("precio").value.replace(",", ".")),
      stock: parseInt($("stock").value, 10),
      stockCritico: $("stockCritico").value === "" ? "" : parseInt($("stockCritico").value, 10),
      categoria: $("categoria").value,
      personalizable: $("personalizable").checked,
      imagen: imagenData || "img/logo.svg"
    };
    try {
      Productos.guardar(producto, editando && editando.codigo);
    } catch {
      avisar("No hay espacio para guardar la imagen. Prueba con una más liviana.", "error");
      return;
    }
    avisar(editando ? "Producto actualizado." : "Producto creado.");
    setTimeout(() => (location.href = "productos.html"), 700);
  });
}


const fichaProducto = document.getElementById("ficha-producto");
if (fichaProducto) {
  const p = Productos.buscar(qs.get("codigo"));
  fichaProducto.innerHTML = !p ? "<p>Producto no encontrado.</p>" : `
    <div class="ficha">
      <img src="${Productos.imagen(p)}" alt="${escapar(p.nombre)}">
      <div>
        <h2>${escapar(p.nombre)}</h2>
        ${esCritico(p) ? `<p class="alerta">⚠️ Stock crítico: quedan ${p.stock} unidades.</p>` : ""}
        <dl>
          <dt>Código</dt><dd>${escapar(p.codigo)}</dd>
          <dt>Categoría</dt><dd>${escapar(p.categoria)}</dd>
          <dt>Precio</dt><dd>${p.precio === 0 ? "FREE" : formatoCLP(p.precio)}</dd>
          <dt>Stock</dt><dd>${p.stock}</dd>
          <dt>Stock crítico</dt><dd>${p.stockCritico === "" || p.stockCritico == null ? "—" : p.stockCritico}</dd>
          <dt>Personalizable</dt><dd>${p.personalizable ? "Sí" : "No"}</dd>
          <dt>Descripción</dt><dd>${escapar(p.descripcion || "—")}</dd>
        </dl>
        <p style="margin-top:18px">
          ${esAdmin ? `<a class="btn" href="producto-form.html?codigo=${encodeURIComponent(p.codigo)}">Editar</a>` : ""}
          <a class="btn btn-borde" href="../detalle.html?codigo=${encodeURIComponent(p.codigo)}">Ver en la tienda</a>
        </p>
      </div>
    </div>`;
}


const tablaUsuarios = document.getElementById("tabla-usuarios");
if (tablaUsuarios) {
  const buscar = document.getElementById("buscar-usuario");
  const filtroTipo = document.getElementById("filtro-tipo");
  TIPOS_USUARIO.forEach(t => filtroTipo.insertAdjacentHTML("beforeend", `<option>${t}</option>`));
  let pagina = 1;

  function render() {
    const t = buscar.value.trim().toLowerCase();
    const lista = Usuarios.todos().filter(u =>
      (!t || `${u.run} ${u.nombre} ${u.apellidos} ${u.correo}`.toLowerCase().includes(t)) && (!filtroTipo.value || u.tipo === filtroTipo.value));
    const visibles = paginar(lista, pagina, 8, document.getElementById("paginacion-usuarios"), n => { pagina = n; render(); });
    tablaUsuarios.innerHTML = visibles.length ? visibles.map(u => `
      <tr>
        <td>${escapar(u.run)}</td>
        <td>${escapar(u.nombre)} ${escapar(u.apellidos)}</td>
        <td>${escapar(u.correo)}</td>
        <td><span class="estado">${escapar(u.tipo)}</span></td>
        <td>${escapar(u.comuna)}</td>
        <td class="acciones">
          <a class="btn btn-borde btn-chico" href="usuario-detalle.html?run=${encodeURIComponent(u.run)}">Ver</a>
          <a class="btn btn-chico" href="usuario-form.html?run=${encodeURIComponent(u.run)}">Editar</a>
          ${u.correo !== sesionAdmin.correo ? `<button class="btn btn-peligro btn-chico" type="button" data-eliminar="${escapar(u.run)}">Eliminar</button>` : ""}
        </td>
      </tr>`).join("") : `<tr><td colspan="6">No hay usuarios que coincidan.</td></tr>`;
  }
  tablaUsuarios.addEventListener("click", e => {
    const b = e.target.closest("[data-eliminar]");
    if (b && confirm(`¿Eliminar al usuario con RUN ${b.dataset.eliminar}?`)) {
      Usuarios.eliminar(b.dataset.eliminar);
      avisar("Usuario eliminado.");
      render();
    }
  });
  buscar.addEventListener("input", () => { pagina = 1; render(); });
  filtroTipo.addEventListener("change", () => { pagina = 1; render(); });
  render();
}


const fichaUsuario = document.getElementById("ficha-usuario");
if (fichaUsuario) {
  const u = Usuarios.buscarPorRun(qs.get("run"));
  const b = u ? beneficiosUsuario(u) : null;
  const compras = u ? Ordenes.todas().filter(o => o.correo === u.correo) : [];
  fichaUsuario.innerHTML = !u ? "<p>Usuario no encontrado.</p>" : `
    <h2>${escapar(u.nombre)} ${escapar(u.apellidos)}</h2>
    <div class="ficha" style="grid-template-columns:1fr">
      <dl>
        <dt>RUN</dt><dd>${escapar(u.run)}</dd>
        <dt>Correo</dt><dd>${escapar(u.correo)}</dd>
        <dt>Tipo de usuario</dt><dd>${escapar(u.tipo)}</dd>
        <dt>Fecha de nacimiento</dt><dd>${u.fechaNacimiento ? `${u.fechaNacimiento} (${calcularEdad(u.fechaNacimiento)} años)` : "—"}</dd>
        <dt>Teléfono</dt><dd>${escapar(u.telefono || "—")}</dd>
        <dt>Dirección</dt><dd>${escapar(u.direccion)}, ${escapar(u.comuna)}, ${escapar(u.region)}</dd>
        <dt>Beneficio</dt><dd>${escapar(b.motivo || "Sin descuento")}</dd>
        <dt>Preferencias</dt><dd>${escapar((u.preferencias || []).join(", ") || "—")}</dd>
        <dt>Compras</dt><dd>${compras.length} (${formatoCLP(compras.reduce((s, o) => s + o.total, 0))})</dd>
      </dl>
    </div>
    <p style="margin-top:18px"><a class="btn" href="usuario-form.html?run=${encodeURIComponent(u.run)}">Editar</a></p>`;
}


const tablaOrdenes = document.getElementById("tabla-ordenes");
if (tablaOrdenes) {
  const buscar = document.getElementById("buscar-orden");
  const filtroEstado = document.getElementById("filtro-estado");
  ESTADOS.forEach(e => filtroEstado.insertAdjacentHTML("beforeend", `<option>${e}</option>`));

  function render() {
    const t = buscar.value.trim().toLowerCase();
    const lista = Ordenes.todas().filter(o =>
      (!t || `${o.numero} ${o.cliente}`.toLowerCase().includes(t)) && (!filtroEstado.value || o.estado === filtroEstado.value)).reverse();
    tablaOrdenes.innerHTML = lista.length ? lista.map(o => `
      <tr>
        <td>${o.numero}</td>
        <td>${new Date(o.fecha).toLocaleDateString("es-CL")}</td>
        <td>${escapar(o.cliente)}</td>
        <td>${o.entrega.fecha}</td>
        <td>${formatoCLP(o.total)}</td>
        <td>${esAdmin
          ? `<label class="oculto-visual" for="estado-${o.numero}">Estado</label><select id="estado-${o.numero}" data-estado="${o.numero}">${ESTADOS.map(e => `<option${e === o.estado ? " selected" : ""}>${e}</option>`).join("")}</select>`
          : `<span class="estado estado-${o.estado.replace(/\s/g, "-")}">${o.estado}</span>`}</td>
        <td><button class="btn btn-borde btn-chico" type="button" data-ver="${o.numero}">Ver detalle</button></td>
      </tr>`).join("") : `<tr><td colspan="7">No hay órdenes todavía.</td></tr>`;
  }

  tablaOrdenes.addEventListener("change", e => {
    const sel = e.target.closest("[data-estado]");
    if (!sel) return;
    const ordenes = Ordenes.todas();
    const o = ordenes.find(x => x.numero === sel.dataset.estado);
    o.estado = sel.value;
    guardar(LS.ORDENES, ordenes);
    avisar(`Orden ${o.numero}: ${o.estado}. Se notificará al cliente.`);
  });

  tablaOrdenes.addEventListener("click", e => {
    const b = e.target.closest("[data-ver]");
    if (!b) return;
    const o = Ordenes.todas().find(x => x.numero === b.dataset.ver);
    const paso = ESTADOS.indexOf(o.estado);
    document.getElementById("detalle-orden").innerHTML = `
      <header><h2>Boleta ${o.numero}</h2><p>${escapar(o.cliente)} · ${escapar(o.correo || "sin correo")}</p></header>
      <table>
        <thead><tr><th>Producto</th><th>Cant.</th><th>Total</th></tr></thead>
        <tbody>${o.items.map(i => `<tr><td>${escapar(i.nombre)}${i.mensaje ? `<br><small>“${escapar(i.mensaje)}”</small>` : ""}</td><td>${i.cantidad}</td><td>${formatoCLP(i.unitario * i.cantidad)}</td></tr>`).join("")}</tbody>
        <tfoot>
          <tr><td colspan="2">Subtotal</td><td>${formatoCLP(o.subtotal)}</td></tr>
          <tr><td colspan="2">Descuentos</td><td>−${formatoCLP(o.descuento)}</td></tr>
          <tr><td colspan="2">Total</td><td>${formatoCLP(o.total)}</td></tr>
        </tfoot>
      </table>
      <p style="margin-top:12px"><strong>Entrega:</strong> ${o.entrega.fecha} · ${escapar(o.entrega.direccion)}</p>
      <ol class="estado-pedido">${ESTADOS.map((e, i) => `<li class="${i <= paso ? "activo" : ""}">${e}</li>`).join("")}</ol>
      <form method="dialog" style="text-align:center"><button class="btn">Cerrar</button></form>`;
    document.getElementById("dialogo-orden").showModal();
  });

  buscar.addEventListener("input", render);
  filtroEstado.addEventListener("change", render);
  render();
}
})();
