# ¡Hola Sonia!

## Proyecto Expendio

### Tecnologías utilizadas

- NodeJS
- HTML, JS y CSS (Todo vanilla)
- MySQL con XAMPP

### Base de Datos

Actualmente, la base de datos está en MySQL usando XAMPP. Próximamente lo migraré a Docker por recomendación de Pedro de DAM que me comentó que funciona mejor.

Para crear la BBDD, te he dejado 2 archivos en `zDDBB`:

1. `01-CreateDDBB-Expendio.sql` → Crea la base de datos y las tablas.
2. `02-Inserts_categorias_default.sql` → Inserta las categorías de desault.

### Pasos para ejecutar el proyecto

1. Prende Apache en XAMPP.
2. Prende MySQL en XAMPP.
3. Abre la carpeta del proyecto en VS Code.
4. Ejecuta `node app.js` en la terminal del mismo VS Code.
5. Usa la extensión Live Server en VS Code.
6. Abrir la carpeta `Public` y listo. Así me funciona a mi.

### Pendientes

#### Dashboard

- Hacer que funcione con los datos del usuario logueado (actualmente usa datos por defecto).

#### Mis Categorías

- Mejorar los estilos.
- Evitar que se genere el botón `+` para agregar subcategorías en las categorías predeterminadas (ya que el usuario no puede modificarlas).

#### Mis Presupuestos

- Mejorar los estilos.
- Implementar funciones para editar y/o eliminar presupuestos.

#### Mis Gastos

- Implementar funciones para editar y/o eliminar gastos.
- Implementar filtros por periodos de tiempo.
- Implementar filtros por categoría y/o subcategoría.

#### Mi Perfil

- Mejorar estilos.
- Implementar función de editar datos.
- Implementar función de eliminar datos.
