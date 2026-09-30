
function tarjetaProducto(p) {
  const agotado = p.stock <= 0;
  return `
    <article class="tarjeta">
      <a class="imagen" href="detalle.html?codigo=${encodeURIComponent(p.codigo)}">
        <img src="${Productos.imagen(p)}" alt="${escapar(p.nombre)}" loading="lazy" width="400" height="300">
      </a>
      <div class="cuerpo">
        <span class="categoria">${escapar(p.categoria)}</span>
        <h3><a href="detalle.html?codigo=${encodeURIComponent(p.codigo)}">${escapar(p.nombre)}</a></h3>
        ${agotado ? '<span class="insignia insignia-agotado">Agotado</span>' : p.personalizable ? '<span class="insignia">Personalizable</span>' : ""}
        <div class="pie">
          <span class="precio">${p.precio === 0 ? "FREE" : formatoCLP(p.precio)}</span>
          <button class="btn btn-chico btn-rosa" type="button" data-agregar="${escapar(p.codigo)}" ${agotado ? "disabled" : ""}
            aria-label="Añadir ${escapar(p.nombre)} al carrito">Añadir</button>
        </div>
      </div>
    </article>`;
}


document.addEventListener("click", e => {
  const btn = e.target.closest("[data-agregar]");
  if (!btn) return;
  const p = Productos.buscar(btn.dataset.agregar);
  const tamano = p && Productos.esTorta(p) && p.personalizable ? "S" : "";
  const r = Carrito.agregar(btn.dataset.agregar, 1, tamano, "");
  avisar(r.msg, r.ok ? "ok" : "error");
});


const listaDestacados = document.getElementById("lista-destacados");
if (listaDestacados) {
  const destacados = Productos.todos().filter(p => p.stock > 0).slice(0, 8);
  listaDestacados.innerHTML = destacados.map(tarjetaProducto).join("");
}


const listaProductos = document.getElementById("lista-productos");
if (listaProductos) {
  const form = document.getElementById("form-filtros");
  const buscar = document.getElementById("buscar");
  const selCategoria = document.getElementById("filtro-categoria");
  const precio = document.getElementById("filtro-precio");
  const precioSalida = document.getElementById("precio-salida");
  const orden = document.getElementById("orden");
  const info = document.getElementById("resultado-info");

  const productos = Productos.todos();
  const precioMax = Math.max(1000, ...productos.map(p => p.precio));
  precio.max = Math.ceil(precioMax / 1000) * 1000;
  precio.value = precio.max;

  CATEGORIAS.forEach(c => selCategoria.insertAdjacentHTML("beforeend", `<option>${escapar(c)}</option>`));
  document.getElementById("sugerencias-busqueda").innerHTML =
    productos.map(p => `<option value="${escapar(p.nombre)}">`).join("");

 
  const params = new URLSearchParams(location.search);
  if (params.get("categoria")) selCategoria.value = params.get("categoria");
  if (params.get("q")) buscar.value = params.get("q");

  const normalizar = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function render() {
    const texto = normalizar(buscar.value.trim());
    const forma = form.querySelector('input[name="forma"]:checked').value;
    const max = Number(precio.value);
    precioSalida.textContent = formatoCLP(max).replace(" CLP", "");

    let lista = Productos.todos().filter(p =>
      (!texto || normalizar(p.nombre + " " + p.descripcion + " " + p.categoria).includes(texto)) &&
      (!selCategoria.value || p.categoria === selCategoria.value) &&
      (!forma || p.categoria === forma) &&
      p.precio <= max
    );
    if (orden.value === "precio-asc") lista.sort((a, b) => a.precio - b.precio);
    if (orden.value === "precio-desc") lista.sort((a, b) => b.precio - a.precio);
    if (orden.value === "nombre") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    info.textContent = `${lista.length} producto${lista.length === 1 ? "" : "s"} encontrado${lista.length === 1 ? "" : "s"}`;
    listaProductos.innerHTML = lista.length
      ? lista.map(tarjetaProducto).join("")
      : `<div class="vacio"><p>No encontramos productos con esos filtros.</p><p class="texto-secundario">Sugerencia: prueba con otra categoría o sube el precio máximo.</p></div>`;
  }

  form.addEventListener("input", render);
  form.addEventListener("submit", e => e.preventDefault());
  form.addEventListener("reset", () => setTimeout(() => { precio.value = precio.max; render(); }));
  render();
}


const contDetalle = document.getElementById("detalle-producto");
if (contDetalle) {
  const codigo = new URLSearchParams(location.search).get("codigo");
  const p = Productos.buscar(codigo);

  if (!p) {
    contDetalle.innerHTML = `<div><h1>Producto no encontrado</h1><p>El producto que buscas no existe o fue retirado.</p><a class="btn" href="productos.html">Volver al catálogo</a></div>`;
  } else {
    document.title = `${p.nombre} | Pastelería Mil Sabores`;
    document.getElementById("migas").insertAdjacentHTML("beforeend",
      `<li><a href="productos.html?categoria=${encodeURIComponent(p.categoria)}">${escapar(p.categoria)}</a></li><li aria-current="page">${escapar(p.nombre)}</li>`);

    const conTamano = Productos.esTorta(p) && p.personalizable;
    const agotado = p.stock <= 0;
    const img = Productos.imagen(p);
    const url = encodeURIComponent(location.href);
    const textoCompartir = encodeURIComponent(`¡Mira esta delicia de Pastelería Mil Sabores! ${p.nombre}`);

    contDetalle.innerHTML = `
      <div class="galeria">
        <div class="principal"><img id="img-principal" src="${img}" alt="${escapar(p.nombre)}" width="400" height="300"></div>
        <div class="miniaturas" role="group" aria-label="Vistas del producto">
          <button type="button" aria-pressed="true" data-img="${img}"><img src="${img}" alt="Vista 1"></button>
          <button type="button" aria-pressed="false" data-img="${BASE}img/hero.svg"><img src="${BASE}img/hero.svg" alt="Vista de celebración"></button>
          <button type="button" aria-pressed="false" data-img="${BASE}img/nosotros.svg"><img src="${BASE}img/nosotros.svg" alt="Hecho por nuestro equipo"></button>
        </div>
      </div>
      <div class="detalle-info">
        <span class="insignia">${escapar(p.categoria)}</span>
        <h1>${escapar(p.nombre)}</h1>
        <p class="precio" id="precio-detalle">${formatoCLP(p.precio)}</p>
        <p>${escapar(p.descripcion || "")}</p>
        <p class="texto-secundario">Código: ${escapar(p.codigo)} · ${agotado ? "Sin stock" : `Stock disponible: ${p.stock}`}</p>
        <hr>
        <form id="form-agregar" novalidate>
          ${conTamano ? `
          <div class="campo">
            <label for="tamano">Tamaño</label>
            <select id="tamano">${TAMANOS.map(t => `<option value="${t.id}">${t.nombre} — ${formatoCLP(p.precio * t.factor)}</option>`).join("")}</select>
          </div>` : ""}
          ${p.personalizable ? `
          <div class="campo">
            <label for="mensaje">Mensaje especial <span class="opcional">(opcional)</span></label>
            <input type="text" id="mensaje" placeholder="Ej: ¡Feliz cumpleaños, Sofía!" autocomplete="off">
            <small class="ayuda">Lo escribimos sobre la torta. Máximo 50 caracteres.</small>
            <small class="error" aria-live="polite"></small>
          </div>` : ""}
          <div class="campo">
            <label for="cantidad">Cantidad</label>
            <input type="number" id="cantidad" value="1" min="1" max="${Math.min(MAX_POR_ITEM, p.stock)}" style="max-width:120px">
            <small class="error" aria-live="polite"></small>
          </div>
          <button class="btn btn-bloque" type="submit" ${agotado ? "disabled" : ""}>${agotado ? "Agotado" : "Añadir al carrito"}</button>
        </form>
        <hr>
        <div class="origen"><strong>Origen de la receta:</strong> ${origenReceta(p)}</div>
        <hr>
        <div class="compartir">
          <strong>Compartir:</strong>
          <a class="btn btn-borde btn-chico" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${url}">Facebook</a>
          <a class="btn btn-borde btn-chico" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=${textoCompartir}&url=${url}">X</a>
          <a class="btn btn-borde btn-chico" target="_blank" rel="noopener" href="https://wa.me/?text=${textoCompartir}%20${url}">WhatsApp</a>
          <button class="btn btn-borde btn-chico" type="button" id="copiar-enlace">Copiar enlace</button>
        </div>
      </div>`;

   
    contDetalle.querySelectorAll(".miniaturas button").forEach(b => b.addEventListener("click", () => {
      document.getElementById("img-principal").src = b.dataset.img;
      contDetalle.querySelectorAll(".miniaturas button").forEach(x => x.setAttribute("aria-pressed", x === b));
    }));

    document.getElementById("copiar-enlace").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.href); avisar("Enlace copiado."); }
      catch { avisar("No se pudo copiar el enlace.", "error"); }
    });

    const selTamano = document.getElementById("tamano");
    if (selTamano) selTamano.addEventListener("change", () => {
      const t = TAMANOS.find(t => t.id === selTamano.value);
      document.getElementById("precio-detalle").textContent = formatoCLP(p.precio * t.factor);
    });

   
    const formAgregar = document.getElementById("form-agregar");
    const mensaje = document.getElementById("mensaje");
    if (mensaje) contadorCaracteres(mensaje, 50);
    const reglas = {
      cantidad: v => Validar.requerido(v, "La cantidad") ||
        Validar.numero(v, { min: 1, entero: true, campo: "La cantidad" }) ||
        (Number(v) > Math.min(MAX_POR_ITEM, p.stock) ? `Puedes llevar como máximo ${Math.min(MAX_POR_ITEM, p.stock)} unidades.` : "")
    };
    if (mensaje) reglas.mensaje = v => Validar.maxLargo(v, 50, "El mensaje");

    conectarValidacion(formAgregar, reglas, () => {
      const r = Carrito.agregar(p.codigo, Number(document.getElementById("cantidad").value),
        selTamano ? selTamano.value : "", mensaje ? mensaje.value : "");
      avisar(r.msg, r.ok ? "ok" : "error");
    });

  
    const otros = Productos.todos().filter(x => x.codigo !== p.codigo);
    const relacionados = [...otros.filter(x => x.categoria === p.categoria), ...otros.filter(x => x.categoria !== p.categoria)].slice(0, 4);
    document.getElementById("lista-relacionados").innerHTML = relacionados.map(tarjetaProducto).join("");
  }
}


function origenReceta(p) {
  const origenes = {
    "Tortas Circulares": "receta de la casa desde 1976; el manjar y la crema pastelera se preparan a diario en nuestro taller.",
    "Tortas Cuadradas": "formato creado para celebraciones grandes, inspirado en la torta récord de 1995.",
    "Pastelería Tradicional": "recetas heredadas de las abuelas fundadoras; la Tarta de Santiago viene de Galicia y llegó con la inmigración española.",
    "Postres Individuales": "desarrollados junto a estudiantes de gastronomía de Duoc UC.",
    "Productos Sin Azúcar": "línea saludable endulzada con fruta y stevia, creada en 2015.",
    "Productos Sin Gluten": "elaborados en una zona separada de nuestra cocina para evitar contaminación cruzada.",
    "Productos Vegana": "sin ingredientes de origen animal; desarrollados con estudiantes de gastronomía de Duoc UC.",
    "Tortas Especiales": "diseñadas a pedido por nuestros maestros pasteleros para tus momentos más importantes."
  };
  return origenes[p.categoria] || "producto elaborado artesanalmente en nuestra pastelería.";
}
