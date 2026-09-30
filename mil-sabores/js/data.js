
const CATEGORIAS = [
  "Tortas Cuadradas",
  "Tortas Circulares",
  "Postres Individuales",
  "Productos Sin Azúcar",
  "Pastelería Tradicional",
  "Productos Sin Gluten",
  "Productos Vegana",
  "Tortas Especiales"
];

const PRODUCTOS_BASE = [
  { codigo: "TC001", categoria: "Tortas Cuadradas", nombre: "Torta Cuadrada de Chocolate", precio: 45000, stock: 10, stockCritico: 3, personalizable: true,
    descripcion: "Deliciosa torta de chocolate con capas de ganache y un toque de avellanas. Personalizable con mensajes especiales." },
  { codigo: "TC002", categoria: "Tortas Cuadradas", nombre: "Torta Cuadrada de Frutas", precio: 50000, stock: 8, stockCritico: 3, personalizable: true,
    descripcion: "Una mezcla de frutas frescas y crema chantilly sobre un suave bizcocho de vainilla, ideal para celebraciones." },
  { codigo: "TT001", categoria: "Tortas Circulares", nombre: "Torta Circular de Vainilla", precio: 40000, stock: 12, stockCritico: 3, personalizable: true,
    descripcion: "Bizcocho de vainilla clásico relleno con crema pastelera y cubierto con un glaseado dulce, perfecto para cualquier ocasión." },
  { codigo: "TT002", categoria: "Tortas Circulares", nombre: "Torta Circular de Manjar", precio: 42000, stock: 9, stockCritico: 3, personalizable: true,
    descripcion: "Torta tradicional chilena con manjar y nueces, un deleite para los amantes de los sabores dulces y clásicos." },
  { codigo: "PI001", categoria: "Postres Individuales", nombre: "Mousse de Chocolate", precio: 5000, stock: 30, stockCritico: 5, personalizable: false,
    descripcion: "Postre individual cremoso y suave, hecho con chocolate de alta calidad, ideal para los amantes del chocolate." },
  { codigo: "PI002", categoria: "Postres Individuales", nombre: "Tiramisú Clásico", precio: 5500, stock: 25, stockCritico: 5, personalizable: false,
    descripcion: "Un postre italiano individual con capas de café, mascarpone y cacao, perfecto para finalizar cualquier comida." },
  { codigo: "PSA001", categoria: "Productos Sin Azúcar", nombre: "Torta Sin Azúcar de Naranja", precio: 48000, stock: 6, stockCritico: 2, personalizable: true,
    descripcion: "Torta ligera y deliciosa, endulzada naturalmente, ideal para quienes buscan opciones más saludables." },
  { codigo: "PSA002", categoria: "Productos Sin Azúcar", nombre: "Cheesecake Sin Azúcar", precio: 47000, stock: 5, stockCritico: 2, personalizable: false,
    descripcion: "Suave y cremoso, este cheesecake es una opción perfecta para disfrutar sin culpa." },
  { codigo: "PT001", categoria: "Pastelería Tradicional", nombre: "Empanada de Manzana", precio: 3000, stock: 40, stockCritico: 8, personalizable: false,
    descripcion: "Pastelería tradicional rellena de manzanas especiadas, perfecta para un dulce desayuno o merienda." },
  { codigo: "PT002", categoria: "Pastelería Tradicional", nombre: "Tarta de Santiago", precio: 6000, stock: 15, stockCritico: 4, personalizable: false,
    descripcion: "Tradicional tarta española hecha con almendras, azúcar y huevos, una delicia para los amantes de los postres clásicos." },
  { codigo: "PG001", categoria: "Productos Sin Gluten", nombre: "Brownie Sin Gluten", precio: 4000, stock: 20, stockCritico: 5, personalizable: false,
    descripcion: "Rico y denso, este brownie es perfecto para quienes necesitan evitar el gluten sin sacrificar el sabor." },
  { codigo: "PG002", categoria: "Productos Sin Gluten", nombre: "Pan Sin Gluten", precio: 3500, stock: 18, stockCritico: 5, personalizable: false,
    descripcion: "Suave y esponjoso, ideal para sándwiches o para acompañar cualquier comida." },
  { codigo: "PV001", categoria: "Productos Vegana", nombre: "Torta Vegana de Chocolate", precio: 50000, stock: 4, stockCritico: 2, personalizable: true,
    descripcion: "Torta de chocolate húmeda y deliciosa, hecha sin productos de origen animal, perfecta para veganos." },
  { codigo: "PV002", categoria: "Productos Vegana", nombre: "Galletas Veganas de Avena", precio: 4500, stock: 35, stockCritico: 6, personalizable: false,
    descripcion: "Crujientes y sabrosas, estas galletas son una excelente opción para un snack saludable y vegano." },
  { codigo: "TE001", categoria: "Tortas Especiales", nombre: "Torta Especial de Cumpleaños", precio: 55000, stock: 7, stockCritico: 2, personalizable: true,
    descripcion: "Diseñada especialmente para celebraciones, personalizable con decoraciones y mensajes únicos." },
  { codigo: "TE002", categoria: "Tortas Especiales", nombre: "Torta Especial de Boda", precio: 60000, stock: 3, stockCritico: 1, personalizable: true,
    descripcion: "Elegante y deliciosa, esta torta está diseñada para ser el centro de atención en cualquier boda." }
].map(p => ({ ...p, imagen: `img/productos/${p.codigo}.svg` }));


const TAMANOS = [
  { id: "S", nombre: "Pequeña (8 porciones)", factor: 1 },
  { id: "M", nombre: "Mediana (15 porciones)", factor: 1.5 },
  { id: "L", nombre: "Grande (25 porciones)", factor: 2.2 }
];


const REGIONES = [
  { region: "Región de Arica y Parinacota", comunas: ["Arica", "Camarones", "Putre", "General Lagos"] },
  { region: "Región de Tarapacá", comunas: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica"] },
  { region: "Región de Antofagasta", comunas: ["Antofagasta", "Mejillones", "Calama", "Tocopilla", "Taltal"] },
  { region: "Región de Atacama", comunas: ["Copiapó", "Caldera", "Vallenar", "Chañaral"] },
  { region: "Región de Coquimbo", comunas: ["La Serena", "Coquimbo", "Ovalle", "Illapel", "Vicuña"] },
  { region: "Región de Valparaíso", comunas: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio", "Los Andes", "Quillota"] },
  { region: "Región Metropolitana de Santiago", comunas: ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "Maipú", "La Florida", "Puente Alto", "San Bernardo", "Quilicura", "Pudahuel", "Estación Central", "Recoleta", "Vitacura", "Peñalolén", "Melipilla"] },
  { region: "Región del Libertador General Bernardo O'Higgins", comunas: ["Rancagua", "Machalí", "San Fernando", "Pichilemu", "Rengo"] },
  { region: "Región del Maule", comunas: ["Talca", "Curicó", "Linares", "Longaví", "Constitución", "Cauquenes"] },
  { region: "Región de Ñuble", comunas: ["Chillán", "Chillán Viejo", "San Carlos", "Bulnes", "Quirihue"] },
  { region: "Región del Biobío", comunas: ["Concepción", "Talcahuano", "San Pedro de la Paz", "Los Ángeles", "Coronel", "Chiguayante"] },
  { region: "Región de La Araucanía", comunas: ["Temuco", "Padre Las Casas", "Villarrica", "Pucón", "Angol"] },
  { region: "Región de Los Ríos", comunas: ["Valdivia", "La Unión", "Panguipulli", "Río Bueno"] },
  { region: "Región de Los Lagos", comunas: ["Puerto Montt", "Puerto Varas", "Osorno", "Castro", "Ancud"] },
  { region: "Región de Aysén", comunas: ["Coyhaique", "Aysén", "Chile Chico", "Cochrane"] },
  { region: "Región de Magallanes y de la Antártica Chilena", comunas: ["Punta Arenas", "Puerto Natales", "Porvenir", "Puerto Williams"] }
];


const TIPOS_USUARIO = ["Administrador", "Vendedor", "Cliente"];


const USUARIOS_BASE = [
  { run: "190110222", nombre: "Ana", apellidos: "Torres Muñoz", correo: "admin@duoc.cl", password: "admin123",
    fechaNacimiento: "1990-05-14", tipo: "Administrador", region: "Región Metropolitana de Santiago", comuna: "Santiago",
    direccion: "Av. Libertador Bernardo O'Higgins 1234", codigoPromo: "" },
  { run: "112223339", nombre: "Pedro", apellidos: "Soto Lagos", correo: "vendedor@duoc.cl", password: "vende123",
    fechaNacimiento: "1985-10-02", tipo: "Vendedor", region: "Región Metropolitana de Santiago", comuna: "Providencia",
    direccion: "Av. Providencia 2020", codigoPromo: "" },
  { run: "76543216", nombre: "Rosa", apellidos: "Pérez Rojas", correo: "rosa@gmail.com", password: "rosa1234",
    fechaNacimiento: "1965-03-21", tipo: "Cliente", region: "Región del Biobío", comuna: "Concepción",
    direccion: "Calle Barros Arana 45", codigoPromo: "FELICES50" }
];
