
function conectarRegionComuna(selRegion, selComuna) {
  REGIONES.forEach(r => selRegion.insertAdjacentHTML("beforeend", `<option>${escapar(r.region)}</option>`));
  const cargarComunas = (seleccion = "") => {
    const r = REGIONES.find(r => r.region === selRegion.value);
    selComuna.innerHTML = '<option value="">-- Seleccione la comuna --</option>' +
      (r ? r.comunas.map(c => `<option${c === seleccion ? " selected" : ""}>${escapar(c)}</option>`).join("") : "");
    selComuna.disabled = !r;
  };
  selRegion.addEventListener("change", () => {
    cargarComunas();
    selComuna.classList.remove("valido", "invalido");
  });
  return cargarComunas;
}

const formUsuario = document.getElementById("form-usuario");
if (formUsuario) {
  const modo = formUsuario.dataset.modo || "registro";
  const $ = id => formUsuario.querySelector("#" + id);
  const cargarComunas = conectarRegionComuna($("region"), $("comuna"));
  const params = new URLSearchParams(location.search);

  let editando = null;
  if (modo === "perfil") {
    editando = Sesion.usuario();
    if (!editando) location.href = "login.html?volver=perfil.html";
  } else if (modo === "admin" && params.get("run")) {
    editando = Usuarios.buscarPorRun(params.get("run"));
    if (!editando) {
      formUsuario.innerHTML = `<p class="resumen-errores">El usuario no existe.</p><a class="btn" href="usuarios.html">Volver</a>`;
    }
    const t = document.getElementById("titulo-form");
    if (t) t.textContent = "Editar usuario";
  }


  const datalist = document.getElementById("dominios");
  if (datalist && $("correo")) {
    $("correo").addEventListener("input", () => {
      const v = $("correo").value;
      const usuario = v.split("@")[0];
      datalist.innerHTML = usuario ? DOMINIOS_PERMITIDOS.map(d => `<option value="${escapar(usuario + d)}">`).join("") : "";
    });
  }


  [["nombre", 50], ["apellidos", 100], ["direccion", 300]].forEach(([id, max]) => $(id) && contadorCaracteres($(id), max));


  if (editando) {
    ["run", "nombre", "apellidos", "correo", "fechaNacimiento", "telefono", "direccion", "codigoPromo"].forEach(k => {
      if ($(k)) $(k).value = editando[k] || "";
    });
    if ($("tipo")) $("tipo").value = editando.tipo;
    $("region").value = editando.region || "";
    cargarComunas(editando.comuna);
    if (modo === "admin") { $("run").readOnly = true; }
  }


  const contPref = document.getElementById("preferencias");
  if (contPref) {
    const favoritas = (editando && editando.preferencias) || [];
    contPref.innerHTML = CATEGORIAS.map((c, i) => `
      <label style="display:flex;gap:6px;align-items:center;font-weight:400">
        <input type="checkbox" name="preferencias" value="${escapar(c)}" id="pref-${i}" ${favoritas.includes(c) ? "checked" : ""}> ${escapar(c)}
      </label>`).join("");
  }


  const reglas = {
    nombre: v => Validar.requerido(v, "El nombre") || Validar.maxLargo(v, 50, "El nombre") ||
      (/\d/.test(v) ? "El nombre no debe contener números." : ""),
    apellidos: v => Validar.requerido(v, "Los apellidos") || Validar.maxLargo(v, 100, "Los apellidos") ||
      (/\d/.test(v) ? "Los apellidos no deben contener números." : ""),
    fechaNacimiento: v => Validar.fechaNacimiento(v),
    telefono: v => Validar.telefono(v),
    region: v => Validar.requerido(v, "La región"),
    comuna: v => Validar.requerido(v, "La comuna"),
    direccion: v => Validar.requerido(v, "La dirección") || Validar.maxLargo(v, 300, "La dirección")
  };

  if (modo !== "perfil") {
    reglas.run = v => Validar.requerido(v, "El RUN") || Validar.run(v) ||
      (!editando && Usuarios.buscarPorRun(v.trim()) ? "Ya existe un usuario con este RUN." : "");
    reglas.correo = v => Validar.requerido(v, "El correo") || Validar.maxLargo(v, 100, "El correo") || Validar.correo(v) ||
      ((() => { const u = Usuarios.buscarPorCorreo(v.trim()); return u && (!editando || u.run !== editando.run); })()
        ? "Este correo ya está registrado." : "");
  }
  if ($("correo2")) {
    reglas.correo2 = (v, f) => Validar.requerido(v, "La confirmación del correo") ||
      (v.trim().toLowerCase() !== f.querySelector("#correo").value.trim().toLowerCase() ? "Los correos no coinciden." : "");
  }
  if ($("password")) {
    const passOpcional = modo === "admin" && editando;
    reglas.password = v => (passOpcional && !v ? "" : Validar.requerido(v, "La contraseña") || Validar.password(v));
    reglas.password2 = (v, f) => {
      const p = f.querySelector("#password").value;
      if (passOpcional && !p && !v) return "";
      return Validar.requerido(v, "La confirmación") || (v !== p ? "Las contraseñas no coinciden." : "");
    };
  }
  if ($("tipo")) reglas.tipo = v => Validar.requerido(v, "El tipo de usuario");
  if ($("codigoPromo")) {
    reglas.codigoPromo = v => (!v.trim() || v.trim().toUpperCase() === CODIGO_PROMO ? "" : "Código no válido. El código vigente es FELICES50.");
  }


  [["correo", "correo2"], ["password", "password2"]].forEach(([a, b]) => {
    if ($(a) && $(b)) $(a).addEventListener("input", () => { if ($(b).value) mostrarError($(b), reglas[b]($(b).value, formUsuario)); });
  });


  const cajaBeneficios = document.getElementById("beneficios-vivo");
  function mostrarBeneficios() {
    if (!cajaBeneficios) return;
    const u = {
      correo: $("correo").value.trim(),
      fechaNacimiento: $("fechaNacimiento").value,
      codigoPromo: $("codigoPromo") ? $("codigoPromo").value : (editando && editando.codigoPromo) || "",
      tortaGratisAnio: editando && editando.tortaGratisAnio
    };
    const msgs = [];
    const edad = calcularEdad(u.fechaNacimiento);
    if (edad !== null && edad >= 50) msgs.push("🎉 Tendrás 50% de descuento en todos los productos por ser mayor de 50 años.");
    else if (String(u.codigoPromo).trim().toUpperCase() === CODIGO_PROMO) msgs.push("🎉 Código FELICES50: 10% de descuento de por vida.");
    if (u.correo.toLowerCase().endsWith("@duoc.cl")) {
      msgs.push(u.fechaNacimiento
        ? "🎂 Como estudiante Duoc recibirás una torta gratis el día de tu cumpleaños."
        : "🎂 ¿Eres estudiante Duoc? Agrega tu fecha de nacimiento para recibir una torta gratis en tu cumpleaños.");
    }
    cajaBeneficios.textContent = msgs.join(" ");
  }
  ["correo", "fechaNacimiento", "codigoPromo"].forEach(id => $(id) && $(id).addEventListener("input", mostrarBeneficios));
  mostrarBeneficios();


  const terminos = $("terminos");
  const errTerminos = document.getElementById("error-terminos");
  if (terminos) terminos.addEventListener("change", () => { errTerminos.textContent = ""; });


  formUsuario.addEventListener("submit", e => {
    if (terminos && !terminos.checked) {
      errTerminos.textContent = "Debes aceptar los términos y condiciones.";
    }
  }, true);

  conectarValidacion(formUsuario, reglas, form => {
    if (terminos && !terminos.checked) { terminos.focus(); return; }

    const datos = {
      run: $("run").value.trim().toUpperCase(),
      nombre: $("nombre").value.trim(),
      apellidos: $("apellidos").value.trim(),
      correo: $("correo").value.trim().toLowerCase(),
      fechaNacimiento: $("fechaNacimiento").value,
      telefono: $("telefono") ? $("telefono").value.trim() : (editando && editando.telefono) || "",
      region: $("region").value,
      comuna: $("comuna").value,
      direccion: $("direccion").value.trim()
    };
    if ($("codigoPromo")) datos.codigoPromo = $("codigoPromo").value.trim().toUpperCase();
    if ($("password") && $("password").value) datos.password = $("password").value;
    if (contPref) datos.preferencias = [...form.querySelectorAll('input[name="preferencias"]:checked')].map(c => c.value);

    if (modo === "registro") {
      datos.tipo = "Cliente";
      Usuarios.guardar(datos);
      Sesion.iniciar(datos);
      avisar("¡Cuenta creada con éxito! Bienvenido/a a Mil Sabores.");
      setTimeout(() => (location.href = "index.html"), 900);
    } else if (modo === "perfil") {
      Usuarios.guardar({ ...editando, ...datos, run: editando.run, correo: editando.correo }, editando.run);
      Sesion.iniciar({ ...editando, ...datos });
      avisar("Perfil actualizado.");
      mostrarBeneficios();
    } else {
      datos.tipo = $("tipo").value;
      Usuarios.guardar(editando ? { ...editando, ...datos } : datos, editando && editando.run);
      avisar(editando ? "Usuario actualizado." : "Usuario creado.");
      setTimeout(() => (location.href = "usuarios.html"), 700);
    }
  });
}
