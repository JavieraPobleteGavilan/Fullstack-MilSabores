
const contItems = document.getElementById("items-carrito");
const contResumen = document.getElementById("resumen-carrito");
const formCupon = document.getElementById("form-cupon");
const formPago = document.getElementById("form-pago");
const inputFecha = document.getElementById("fecha-entrega");
const notaSesion = document.getElementById("nota-sesion");
let cuponAplicado = "";


const aISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const hoy = new Date();
const minEntrega = new Date(hoy); minEntrega.setDate(hoy.getDate() + 2);
const maxEntrega = new Date(hoy); maxEntrega.setDate(hoy.getDate() + 60);
inputFecha.min = aISO(minEntrega);
inputFecha.max = aISO(maxEntrega);

function render() {
  const r = Carrito.resumen(cuponAplicado);

  if (!r.lineas.length) {
    contItems.innerHTML = `
      <div class="vacio">
        <p style="font-size:3rem;margin:0">🧁</p>
        <h2>Tu carrito está vacío</h2>
        <p>Descubre nuestras tortas y postres.</p>
        <a class="btn" href="productos.html">Ver productos</a>
      </div>`;
  } else {
    contItems.innerHTML = r.lineas.map(l => {
      const t = TAMANOS.find(t => t.id === l.tamano);
      return `
      <article class="item-carrito" data-clave="${escapar(l.clave)}">
        <a href="detalle.html?codigo=${encodeURIComponent(l.codigo)}"><img src="${Productos.imagen(l.producto)}" alt="${escapar(l.producto.nombre)}" width="96" height="72"></a>
        <div>
          <h3>${escapar(l.producto.nombre)}</h3>
          <p class="extra">${formatoCLP(l.unitario)} c/u${t ? ` · ${escapar(t.nombre)}` : ""}${l.mensaje ? ` · Mensaje: “${escapar(l.mensaje)}”` : ""}</p>
          <div class="cantidad">
            <button type="button" data-accion="menos" aria-label="Quitar una unidad">−</button>
            <input type="number" value="${l.cantidad}" min="1" max="${MAX_POR_ITEM}" aria-label="Cantidad de ${escapar(l.producto.nombre)}">
            <button type="button" data-accion="mas" aria-label="Agregar una unidad">+</button>
          </div>
        </div>
        <div class="item-acciones">
          <strong class="precio">${formatoCLP(l.subtotal)}</strong>
          <button type="button" class="btn btn-borde btn-chico" data-accion="eliminar">Eliminar</button>
        </div>
      </article>`;
    }).join("") + `<p style="text-align:right;margin:12px 0 0"><button type="button" class="link-btn" id="vaciar">Vaciar carrito</button></p>`;
  }

  contResumen.innerHTML = `
    <dl>
      <dt>Productos (${Carrito.cantidadTotal()})</dt><dd>${formatoCLP(r.subtotal)}</dd>
      ${r.descuentoTorta ? `<dt class="descuento">Torta de cumpleaños gratis 🎂<br><small>${escapar(r.tortaGratisNombre)}</small></dt><dd class="descuento">−${formatoCLP(r.descuentoTorta)}</dd>` : ""}
      ${r.descuentoPct ? `<dt class="descuento">${escapar(r.motivo)}</dt><dd class="descuento">−${formatoCLP(r.descuentoPct)}</dd>` : ""}
      <dt class="total">Total</dt><dd class="total">${formatoCLP(r.total)}</dd>
    </dl>`;

  if (!r.usuario) {
    notaSesion.innerHTML = `<a href="login.html">Inicia sesión</a> o <a href="registro.html">regístrate</a> para aplicar tus descuentos automáticamente.`;
  } else if (r.beneficios.tortaGratis && !r.descuentoTorta) {
    notaSesion.textContent = "🎉 ¡Feliz cumpleaños! Agrega una torta y te la regalamos.";
  } else {
    notaSesion.textContent = r.motivo ? `Beneficio activo: ${r.motivo}.` : "";
  }

  document.getElementById("btn-pagar").disabled = !r.lineas.length;
}


contItems.addEventListener("click", e => {
  if (e.target.id === "vaciar") {
    if (confirm("¿Seguro que quieres vaciar el carrito?")) { Carrito.vaciar(); render(); }
    return;
  }
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const item = btn.closest(".item-carrito");
  const clave = item.dataset.clave;
  const actual = Number(item.querySelector("input").value);
  let r = { ok: true };
  if (btn.dataset.accion === "mas") r = Carrito.cambiarCantidad(clave, actual + 1);
  if (btn.dataset.accion === "menos") r = actual <= 1 ? { ok: true, ...Carrito.quitar(clave) } : Carrito.cambiarCantidad(clave, actual - 1);
  if (btn.dataset.accion === "eliminar") { Carrito.quitar(clave); avisar("Producto eliminado del carrito."); }
  if (!r.ok && r.msg) avisar(r.msg, "error");
  render();
});

contItems.addEventListener("change", e => {
  if (e.target.matches(".cantidad input")) {
    const clave = e.target.closest(".item-carrito").dataset.clave;
    const n = parseInt(e.target.value, 10);
    const r = Number.isNaN(n) ? { ok: false, msg: "Ingresa una cantidad válida." } : Carrito.cambiarCantidad(clave, n);
    if (!r.ok && r.msg) avisar(r.msg, "error");
    render();
  }
});


formCupon.addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("cupon");
  const codigo = input.value.trim().toUpperCase();
  let err = Validar.requerido(codigo, "El cupón");
  if (!err && codigo !== CODIGO_PROMO) err = "Cupón no válido. Prueba con FELICES50.";
  mostrarError(input, err);
  if (!err) {
    cuponAplicado = codigo;
    const r = Carrito.resumen(cuponAplicado);
    avisar(r.porcentaje > 10 ? "Ya tienes un descuento mayor aplicado." : "Cupón aplicado: 10% de descuento.");
    render();
  }
});


conectarValidacion(formPago, {
  "fecha-entrega": v => {
    if (!v) return "Selecciona una fecha de entrega.";
    const f = new Date(v + "T00:00:00");
    if (v < inputFecha.min) return "La entrega debe ser al menos en 2 días más.";
    if (v > inputFecha.max) return "Solo aceptamos pedidos hasta 60 días en adelante.";
    if (f.getDay() === 0) return "No hacemos entregas los domingos. Elige otro día.";
    return "";
  }
}, () => {
  const resumen = Carrito.resumen(cuponAplicado);
  if (!resumen.lineas.length) return;
  const u = resumen.usuario;
  const orden = Ordenes.crear(resumen, {
    fecha: inputFecha.value,
    direccion: u ? `${u.direccion}, ${u.comuna}` : "Retiro en tienda"
  });
  mostrarBoleta(orden);
  cuponAplicado = "";
  formPago.reset();
  render();
});

function mostrarBoleta(o) {
  const fechaEntrega = new Date(o.entrega.fecha + "T00:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("contenido-boleta").innerHTML = `
    <header>
      <img src="img/logo.svg" alt="" width="56" height="56" style="margin:0 auto">
      <h2 id="titulo-boleta">¡Gracias por tu compra!</h2>
      <p>Boleta N° <strong>${o.numero}</strong> · ${new Date(o.fecha).toLocaleString("es-CL")}</p>
    </header>
    <table>
      <thead><tr><th>Producto</th><th>Cant.</th><th>Total</th></tr></thead>
      <tbody>${o.items.map(i => `<tr><td>${escapar(i.nombre)}${i.mensaje ? `<br><small>“${escapar(i.mensaje)}”</small>` : ""}</td><td>${i.cantidad}</td><td>${formatoCLP(i.unitario * i.cantidad)}</td></tr>`).join("")}</tbody>
      <tfoot>
        <tr><td colspan="2">Subtotal</td><td>${formatoCLP(o.subtotal)}</td></tr>
        ${o.descuento ? `<tr><td colspan="2">Descuentos</td><td>−${formatoCLP(o.descuento)}</td></tr>` : ""}
        <tr><td colspan="2">Total pagado</td><td>${formatoCLP(o.total)}</td></tr>
      </tfoot>
    </table>
    <p style="margin-top:14px"><strong>Entrega:</strong> ${escapar(fechaEntrega)} · ${escapar(o.entrega.direccion)}</p>
    <ol class="estado-pedido" aria-label="Estado del pedido">
      <li class="activo">En preparación</li><li>Listo</li><li>En camino</li><li>Entregado</li>
    </ol>
    <p style="font-size:.9rem" class="texto-secundario">Te avisaremos por correo cada vez que cambie el estado de tu pedido.</p>
    <form method="dialog" style="text-align:center"><button class="btn">Cerrar</button></form>`;
  document.getElementById("dialogo-boleta").showModal();
}

render();
