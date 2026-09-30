
const formLogin = document.getElementById("form-login");
if (formLogin) {
  conectarValidacion(formLogin, {
    correo: v => Validar.requerido(v, "El correo") || Validar.maxLargo(v, 100, "El correo") || Validar.correo(v),
    password: v => Validar.requerido(v, "La contraseña") || Validar.password(v)
  }, form => {
    const correo = form.correo.value.trim();
    const pass = form.password.value;
    const usuario = Usuarios.buscarPorCorreo(correo);
    const resumen = form.querySelector(".resumen-errores");

    if (!usuario || usuario.password !== pass) {
      resumen.textContent = "Correo o contraseña incorrectos. Revisa tus datos o regístrate.";
      resumen.hidden = false;
      form.password.value = "";
      form.password.focus();
      return;
    }
    Sesion.iniciar(usuario);
    avisar(`¡Bienvenido/a, ${usuario.nombre}!`);
    
    const destino = usuario.tipo === "Cliente" ? "index.html" : "admin/index.html";
    setTimeout(() => (location.href = destino), 700);
  });
}


const formContacto = document.getElementById("form-contacto");
if (formContacto) {
  const s = Sesion.usuario();
  if (s) {
    formContacto.nombre.value = `${s.nombre} ${s.apellidos}`;
    formContacto.correo.value = s.correo;
  }
  contadorCaracteres(formContacto.nombre, 100);
  contadorCaracteres(formContacto.comentario, 500);

  conectarValidacion(formContacto, {
    nombre: v => Validar.requerido(v, "El nombre") || Validar.maxLargo(v, 100, "El nombre"),
    correo: v => Validar.maxLargo(v, 100, "El correo") || Validar.correo(v),
    comentario: v => Validar.requerido(v, "El comentario") || Validar.maxLargo(v, 500, "El comentario") ||
      (v.trim().length < 10 ? "Cuéntanos un poco más (mínimo 10 caracteres)." : "")
  }, form => {
    const mensajes = leer(LS.MENSAJES, []);
    mensajes.push({
      nombre: form.nombre.value.trim(),
      correo: form.correo.value.trim(),
      comentario: form.comentario.value.trim(),
      fecha: new Date().toISOString()
    });
    guardar(LS.MENSAJES, mensajes);
    avisar("¡Mensaje enviado! Te responderemos pronto.");
    form.reset();
    form.querySelectorAll(".valido").forEach(el => el.classList.remove("valido"));
    form.querySelectorAll(".contador").forEach(c => (c.textContent = c.textContent.replace(/^\d+/, "0")));
  });
}
