
const LS = {
  PRODUCTOS: "ms_productos",
  USUARIOS: "ms_usuarios",
  SESION: "ms_sesion",
  CARRITO: "ms_carrito",
  ORDENES: "ms_ordenes",
  MENSAJES: "ms_mensajes"
};

const BASE = document.documentElement.dataset.base || "";

const leer = (clave, porDefecto) => {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : porDefecto;
  } catch {
    return porDefecto;
  }
};
const guardar = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));


if (!localStorage.getItem(LS.PRODUCTOS)) guardar(LS.PRODUCTOS, PRODUCTOS_BASE);
if (!localStorage.getItem(LS.USUARIOS)) guardar(LS.USUARIOS, USUARIOS_BASE);


const formatoCLP = n =>
  "$" + Math.round(Number(n) || 0).toLocaleString("es-CL") + " CLP";

const escapar = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));


const Productos = {
  todos: () => leer(LS.PRODUCTOS, []),
  buscar: codigo => Productos.todos().find(p => p.codigo === codigo),
  guardarTodos: lista => guardar(LS.PRODUCTOS, lista),
  guardar(producto, codigoOriginal = null) {
    const lista = Productos.todos();
    const i = lista.findIndex(p => p.codigo === (codigoOriginal || producto.codigo));
    if (i >= 0) lista[i] = producto; else lista.push(producto);
    Productos.guardarTodos(lista);
  },
  eliminar(codigo) {
    Productos.guardarTodos(Productos.todos().filter(p => p.codigo !== codigo));
  },
  esTorta: p => /torta|cheesecake/i.test(p.nombre) || /^Tortas/.test(p.categoria),
  imagen: p => (p.imagen && p.imagen.startsWith("data:") ? p.imagen : BASE + (p.imagen || "img/logo.svg"))
};

const Usuarios = {
  todos: () => leer(LS.USUARIOS, []),
  buscarPorCorreo: correo => Usuarios.todos().find(u => u.correo.toLowerCase() === String(correo).toLowerCase()),
  buscarPorRun: run => Usuarios.todos().find(u => u.run.toUpperCase() === String(run).toUpperCase()),
  guardar(usuario, runOriginal = null) {
    const lista = Usuarios.todos();
    const i = lista.findIndex(u => u.run === (runOriginal || usuario.run));
    if (i >= 0) lista[i] = { ...lista[i], ...usuario }; else lista.push(usuario);
    guardar(LS.USUARIOS, lista);
  },
  eliminar(run) {
    guardar(LS.USUARIOS, Usuarios.todos().filter(u => u.run !== run));
  }
};

const Sesion = {
  actual: () => leer(LS.SESION, null),
  usuario() {
    const s = Sesion.actual();
    return s ? Usuarios.buscarPorCorreo(s.correo) : null;
  },
  iniciar(usuario) {
    guardar(LS.SESION, { correo: usuario.correo, nombre: usuario.nombre, tipo: usuario.tipo });
  },
  cerrar() {
    localStorage.removeItem(LS.SESION);
  }
};


const CODIGO_PROMO = "FELICES50";

function esCumpleanosHoy(fechaISO) {
  if (!fechaISO) return false;
  const hoy = new Date();
  const [, m, d] = fechaISO.split("-").map(Number);
  return hoy.getMonth() + 1 === m && hoy.getDate() === d;
}

function beneficiosUsuario(usuario) {
  const b = { porcentaje: 0, motivo: "", tortaGratis: false };
  if (!usuario) return b;
  const edad = calcularEdad(usuario.fechaNacimiento);
  if (edad !== null && edad >= 50) {
    b.porcentaje = 50;
    b.motivo = "Descuento 50% por ser mayor de 50 años";
  } else if (String(usuario.codigoPromo || "").toUpperCase() === CODIGO_PROMO) {
    b.porcentaje = 10;
    b.motivo = "Descuento 10% de por vida (código FELICES50)";
  }
  const anio = new Date().getFullYear();
  if (usuario.correo.toLowerCase().endsWith("@duoc.cl") &&
      esCumpleanosHoy(usuario.fechaNacimiento) &&
      usuario.tortaGratisAnio !== anio) {
    b.tortaGratis = true;
  }
  return b;
}


const MAX_POR_ITEM = 10;

const Carrito = {
  items: () => leer(LS.CARRITO, []),
  guardar: items => {
    guardar(LS.CARRITO, items);
    actualizarContadorCarrito();
  },
  clave: (codigo, tamano, mensaje) => `${codigo}|${tamano || ""}|${(mensaje || "").trim()}`,

  agregar(codigo, cantidad = 1, tamano = "", mensaje = "") {
    const p = Productos.buscar(codigo);
    if (!p) return { ok: false, msg: "El producto ya no está disponible." };
    if (p.stock <= 0) return { ok: false, msg: `${p.nombre} está agotado.` };
    const items = Carrito.items();
    const clave = Carrito.clave(codigo, tamano, mensaje);
    const enCarrito = items.filter(i => i.codigo === codigo).reduce((s, i) => s + i.cantidad, 0);
    if (enCarrito + cantidad > p.stock) {
      return { ok: false, msg: `Solo quedan ${p.stock} unidades de ${p.nombre}.` };
    }
    const existente = items.find(i => i.clave === clave);
    if (existente) {
      if (existente.cantidad + cantidad > MAX_POR_ITEM) {
        return { ok: false, msg: `Máximo ${MAX_POR_ITEM} unidades por producto.` };
      }
      existente.cantidad += cantidad;
    } else {
      items.push({ clave, codigo, cantidad, tamano, mensaje: mensaje.trim() });
    }
    Carrito.guardar(items);
    return { ok: true, msg: `${p.nombre} se añadió al carrito.` };
  },

  cambiarCantidad(clave, cantidad) {
    const items = Carrito.items();
    const item = items.find(i => i.clave === clave);
    if (!item) return { ok: false };
    const p = Productos.buscar(item.codigo);
    const otros = items.filter(i => i.codigo === item.codigo && i.clave !== clave).reduce((s, i) => s + i.cantidad, 0);
    if (cantidad < 1) return Carrito.quitar(clave);
    if (cantidad > MAX_POR_ITEM) return { ok: false, msg: `Máximo ${MAX_POR_ITEM} unidades por producto.` };
    if (p && otros + cantidad > p.stock) return { ok: false, msg: `Solo hay ${p.stock} unidades en stock.` };
    item.cantidad = cantidad;
    Carrito.guardar(items);
    return { ok: true };
  },

  quitar(clave) {
    Carrito.guardar(Carrito.items().filter(i => i.clave !== clave));
    return { ok: true };
  },

  vaciar: () => Carrito.guardar([]),

  cantidadTotal: () => Carrito.items().reduce((s, i) => s + i.cantidad, 0),

  precioUnitario(item) {
    const p = Productos.buscar(item.codigo);
    if (!p) return 0;
    const t = TAMANOS.find(t => t.id === item.tamano);
    return Math.round(p.precio * (t ? t.factor : 1));
  },


  resumen(cupon = "") {
    const usuario = Sesion.usuario();
    const b = beneficiosUsuario(usuario);
    const lineas = Carrito.items()
      .map(i => ({ ...i, producto: Productos.buscar(i.codigo), unitario: Carrito.precioUnitario(i) }))
      .filter(l => l.producto)
      .map(l => ({ ...l, subtotal: l.unitario * l.cantidad }));

    const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);

    let descuentoTorta = 0, tortaGratisNombre = "";
    if (b.tortaGratis) {
      const tortas = lineas.filter(l => Productos.esTorta(l.producto));
      if (tortas.length) {
        const mayor = tortas.reduce((a, c) => (c.unitario > a.unitario ? c : a));
        descuentoTorta = mayor.unitario;
        tortaGratisNombre = mayor.producto.nombre;
      }
    }

    let porcentaje = b.porcentaje, motivo = b.motivo;
    if (cupon && cupon.toUpperCase() === CODIGO_PROMO && porcentaje < 10) {
      porcentaje = 10;
      motivo = "Cupón FELICES50 (10%)";
    }
    const descuentoPct = Math.round((subtotal - descuentoTorta) * porcentaje / 100);
    const total = Math.max(0, subtotal - descuentoTorta - descuentoPct);
    return { lineas, subtotal, descuentoTorta, tortaGratisNombre, porcentaje, motivo, descuentoPct, total, usuario, beneficios: b };
  }
};


const Ordenes = {
  todas: () => leer(LS.ORDENES, []),
  crear(resumen, entrega) {
    const ordenes = Ordenes.todas();
    const numero = "B" + String(ordenes.length + 1).padStart(5, "0");
    const orden = {
      numero,
      fecha: new Date().toISOString(),
      cliente: resumen.usuario ? `${resumen.usuario.nombre} ${resumen.usuario.apellidos}` : "Invitado",
      correo: resumen.usuario ? resumen.usuario.correo : "",
      items: resumen.lineas.map(l => ({ codigo: l.codigo, nombre: l.producto.nombre, cantidad: l.cantidad, unitario: l.unitario, tamano: l.tamano, mensaje: l.mensaje })),
      subtotal: resumen.subtotal,
      descuento: resumen.descuentoTorta + resumen.descuentoPct,
      total: resumen.total,
      entrega,
      estado: "En preparación"
    };
    ordenes.push(orden);
    guardar(LS.ORDENES, ordenes);

    
    const productos = Productos.todos();
    orden.items.forEach(it => {
      const p = productos.find(x => x.codigo === it.codigo);
      if (p) p.stock = Math.max(0, p.stock - it.cantidad);
    });
    Productos.guardarTodos(productos);

    
    if (resumen.descuentoTorta && resumen.usuario) {
      Usuarios.guardar({ ...resumen.usuario, tortaGratisAnio: new Date().getFullYear() });
    }
    Carrito.vaciar();
    return orden;
  }
};


function actualizarContadorCarrito() {
  document.querySelectorAll("[data-cart-count]").forEach(el => (el.textContent = Carrito.cantidadTotal()));
}

function actualizarZonaSesion() {
  const zona = document.getElementById("zona-sesion");
  if (!zona) return;
  const s = Sesion.actual();
  if (!s) {
    zona.innerHTML = `<a href="${BASE}login.html">Iniciar sesión</a> | <a href="${BASE}registro.html">Registrar usuario</a>`;
    return;
  }
  const panel = s.tipo === "Administrador" || s.tipo === "Vendedor"
    ? ` | <a href="${BASE}admin/index.html">Panel ${escapar(s.tipo.toLowerCase())}</a>` : "";
  zona.innerHTML = `Hola, <strong>${escapar(s.nombre)}</strong>${panel} | <a href="${BASE}perfil.html">Mi perfil</a> | <button type="button" class="link-btn" id="btn-salir">Cerrar sesión</button>`;
  document.getElementById("btn-salir").addEventListener("click", () => {
    Sesion.cerrar();
    location.href = BASE + "index.html";
  });
}


function avisar(mensaje, tipo = "ok") {
  let cont = document.getElementById("avisos");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "avisos";
    cont.setAttribute("role", "status");
    cont.setAttribute("aria-live", "polite");
    document.body.appendChild(cont);
  }
  const t = document.createElement("div");
  t.className = `aviso aviso-${tipo}`;
  t.textContent = mensaje;
  cont.appendChild(t);
  setTimeout(() => t.classList.add("salir"), 2600);
  setTimeout(() => t.remove(), 3100);
}


document.addEventListener("DOMContentLoaded", () => {
  actualizarContadorCarrito();
  actualizarZonaSesion();
  const btn = document.querySelector(".menu-toggle");
  const nav = document.getElementById("menu-principal");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const abierto = nav.classList.toggle("abierto");
      btn.setAttribute("aria-expanded", abierto);
    });
  }

  const news = document.getElementById("form-newsletter");
  if (news) {
    const input = news.querySelector("input");
    news.addEventListener("submit", e => {
      e.preventDefault();
      const err = Validar.requerido(input.value, "El correo") || Validar.correo(input.value);
      const salida = news.querySelector(".error");
      salida.textContent = err;
      input.classList.toggle("invalido", Boolean(err));
      if (!err) {
        avisar("¡Gracias! Te avisaremos de nuestras novedades.");
        news.reset();
      }
    });
  }
});
