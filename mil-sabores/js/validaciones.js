
const DOMINIOS_PERMITIDOS = ["@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];

const Validar = {
  requerido(valor, campo = "Este campo") {
    return String(valor ?? "").trim() === "" ? `Debes completar ${campo.charAt(0).toLowerCase() + campo.slice(1)}.` : "";
  },

  maxLargo(valor, max, campo = "Este campo") {
    return String(valor ?? "").trim().length > max ? `${campo} no puede superar los ${max} caracteres.` : "";
  },

  minLargo(valor, min, campo = "Este campo") {
    return String(valor ?? "").trim().length < min ? `${campo} debe tener al menos ${min} caracteres.` : "";
  },

  correo(valor) {
    const v = String(valor ?? "").trim().toLowerCase();
    if (!v) return "";
    const formato = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formato.test(v)) return "Ingresa un correo con formato válido, por ejemplo nombre@duoc.cl.";
    if (!DOMINIOS_PERMITIDOS.some(d => v.endsWith(d))) {
      return "Solo se aceptan correos @duoc.cl, @profesor.duoc.cl o @gmail.com.";
    }
    return "";
  },

  run(valor) {
    const v = String(valor ?? "").trim().toUpperCase();
    if (!v) return "";
    if (/[.\-]/.test(v)) return "Escribe el RUN sin puntos ni guion (ej: 190110222).";
    if (v.length < 7 || v.length > 9) return "El RUN debe tener entre 7 y 9 caracteres.";
    if (!/^\d{6,8}[0-9K]$/.test(v)) return "El RUN solo puede tener números y terminar en un dígito o K.";
    const cuerpo = v.slice(0, -1);
    const dv = v.slice(-1);
    return calcularDV(cuerpo) === dv ? "" : "El RUN no es válido: el dígito verificador no coincide.";
  },

  password(valor) {
    const v = String(valor ?? "");
    if (!v) return "";
    return v.length < 4 || v.length > 10 ? "La contraseña debe tener entre 4 y 10 caracteres." : "";
  },

  numero(valor, { min = null, entero = false, campo = "El valor" } = {}) {
    const v = String(valor ?? "").trim();
    if (v === "") return "";
    const n = Number(v.replace(",", "."));
    if (Number.isNaN(n)) return `${campo} debe ser un número.`;
    if (entero && !Number.isInteger(n)) return `${campo} debe ser un número entero (sin decimales).`;
    if (min !== null && n < min) return `${campo} no puede ser menor que ${min}.`;
    return "";
  },

  telefono(valor) {
    const v = String(valor ?? "").replace(/\s/g, "");
    if (!v) return "";
    return /^(\+?56)?9\d{8}$/.test(v) ? "" : "Ingresa un celular válido, por ejemplo +56 9 1234 5678.";
  },

  fechaNacimiento(valor) {
    if (!valor) return "";
    const f = new Date(valor + "T00:00:00");
    if (Number.isNaN(f.getTime())) return "Fecha no válida.";
    if (f > new Date()) return "La fecha de nacimiento no puede estar en el futuro.";
    if (calcularEdad(valor) > 120) return "Revisa el año de nacimiento.";
    return "";
  }
};

function calcularDV(cuerpo) {
  let suma = 0, mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (suma % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}

function calcularEdad(fechaISO) {
  if (!fechaISO) return null;
  const hoy = new Date();
  const f = new Date(fechaISO + "T00:00:00");
  let edad = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) edad--;
  return edad;
}

function mostrarError(input, mensaje) {
  const grupo = input.closest(".campo");
  const salida = grupo ? grupo.querySelector(".error") : null;
  input.classList.toggle("invalido", Boolean(mensaje));
  input.classList.toggle("valido", !mensaje && String(input.value).trim() !== "");
  input.setAttribute("aria-invalid", mensaje ? "true" : "false");
  if (salida) salida.textContent = mensaje || "";
  return !mensaje;
}

function conectarValidacion(form, reglas, alEnviar) {
  const validarCampo = id => {
    const input = form.querySelector("#" + id);
    if (!input) return true;
    return mostrarError(input, reglas[id](input.value, form));
  };

  Object.keys(reglas).forEach(id => {
    const input = form.querySelector("#" + id);
    if (!input) return;
    const evento = input.tagName === "SELECT" || input.type === "date" ? "change" : "input";
    input.addEventListener(evento, () => validarCampo(id));
    input.addEventListener("blur", () => validarCampo(id));
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const resultados = Object.keys(reglas).map(validarCampo);
    const ok = resultados.every(Boolean);
    const resumen = form.querySelector(".resumen-errores");
    if (!ok) {
      if (resumen) {
        resumen.textContent = "Revisa los campos marcados en rojo antes de continuar.";
        resumen.hidden = false;
      }
      const primero = form.querySelector(".invalido");
      if (primero) primero.focus();
      return;
    }
    if (resumen) resumen.hidden = true;
    alEnviar(form);
  });
}

function contadorCaracteres(input, max) {
  const grupo = input.closest(".campo");
  if (!grupo) return;
  let c = grupo.querySelector(".contador");
  if (!c) {
    c = document.createElement("small");
    c.className = "contador";
    grupo.appendChild(c);
  }
  const actualizar = () => {
    const n = input.value.length;
    c.textContent = `${n}/${max}`;
    c.classList.toggle("excedido", n > max);
  };
  input.addEventListener("input", actualizar);
  actualizar();
}
