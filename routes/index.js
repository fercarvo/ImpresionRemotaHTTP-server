var express = require('express');
var router = express.Router();
var multer  = require('multer')
var upload = multer({ dest: 'files/' })
var fs = require('fs');
const { secret_print } = require('../config_server.js')

var conectados = new Map(); //Clientes/computadores conectados

/**
 * @param cliente nombre del cliente escuchando para imprimir
 */
router.post('/print/:cliente', upload.single('printer_pdf_file'), async function(req, res, next) {
    try {
        var archivo = req.file.filename
        var impresora = req.body.printer

        //Se obtiene el cliente websocket conectado
        var cliente = conectados.get(req.params.cliente)

        if (cliente === undefined) 
            return res.status(400).send(`No se encuentra conectado el cliente con nombre ${req.params.cliente}`);

        var payload = await fileToBase64(`./files/${archivo}`)

        var respuesta = await new Promise(resolve => {
            //Se envia el archivo en base64 al cliente y se espera por la respuesta
            cliente.emit('imprimir', { 
                file_name: archivo, 
                file_base64: payload, 
                impresora 
            }, socket_res => resolve(socket_res))
        })

        if (respuesta.exito) {
            res.send(respuesta.data)
        } else {
            res.status(206).send(respuesta.data)
        }       

    } catch (e) {
        console.error(e)
        next(e)
    } finally {
        fs.unlink(`./files/${archivo}`, e => e ? console.log('Error eliminar archivo: ', e) : '')
    }    
})

/* test only
router.get('/', function(req, res, next) {
    res.render('index')
})
*/

/**
 * fileToBase64 Funcion que toma archivo y lo transofrma en base64
 * 
 * @param {string} path direccion del archivo
 * @returns {Promise<string>} Base64 string del archivo
 */
function fileToBase64 (path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) return reject(err)
            resolve(new Buffer(data).toString('base64'));
        })
    })
}

/**
 * 
 * @param {Object} socket websocket conectandose
 * @param {function} next Funcion que al ejecutarse deja pasar o rechaza la conexion
 */
function socketAuth(socket, next) {
    var printer_name = socket.handshake.query.printer_name;
    var secret = socket.handshake.query.secret;

    if (printer_name && printer_name.length > 1 && secret === secret_print) {
        if (conectados.has(printer_name)) {
            console.error('[socketAuth]', new Date(), `[ya existe un cliente con nombre ${printer_name}]`)
            next(new Error(`Cliente: ${printer_name} DUPLICADO`))
        } else {
            console.log('[socketAuth]', new Date(), `[Nuevo cliente, nombre ${printer_name}]`)
            next()
        }        
    } else {
        next(new Error("401 Unauthorized"))
    }
}

/**
 * 
 * @param {Object} socket websocket conectado y escuchando
 */
function connectionCB (socket) {

    var printer_name = socket.handshake.query.printer_name;

    if (conectados.has(printer_name)) {
        console.error('[connectionCB] ya existe', printer_name)
        socket.disconnect(true)
    } else {
        conectados.set(printer_name, socket)
    }

    socket.on('disconnect', function() {
        conectados.delete(printer_name)
    })
}

module.exports = {
    router,
    socketAuth,
    connectionCB
}