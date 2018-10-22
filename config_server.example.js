/**
 * Ejemplo config_server.js
 */

//Puerto de la app que escucha, se recomienda NO CAMBIAR
const puerto_server = 4000

//clave debe ser igual en todos los clientes, CAMBIAR
const secret_print = "SuperSecret1234567890passwordfoobar"

module.exports = { puerto_server, secret_print }
