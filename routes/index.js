const express = require('express');
const router = express.Router();

// importar controladores
const generalController = require('../controllers/generalController');

module.exports = function () {

    router.post('/smallest', generalController.smallest);
    router.get('/stats/:entero', generalController.stats);

    return router;
}

// Swagger
/**
 * @swagger
 * components:
 *  schemas:
 *      Nivel I:
 *          type: object
 *          properties:
 *              array:
 *                  type: object
 *                  description: Ingrese un Array de numero enteros dentro de este rango [−1,000,000 ... 1,000,000]
 *          required:
 *              - array
 *          example:
 *              array: [1, 2, -3]
 */

/**
 * @swagger
 * /smallest:
 *  post:
 *      sumary: Valida si el array contine 100.000 o menos elementos, y valida que cada elemento del array este dentro del rango [−1,000,000 ... 1,000,000] y que los elementos del array sean enteros. 
 *      tags: [Nivel I]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      $ref: '#/components/schemas/Nivel I'
 *      responses:
 *          200:
 *              description: En caso poder realizar el cálculo, debería devolver un HTTP 200-OK
 *          401:
 *              description: En caso de error, debería devolver un HTTP 401
 */

/**
 * @swagger
 * components:
 *  schemas:
 *      Nivel II:
 *          type: integer
 *          properties:
 *              entero:
 *                  type: integer
 *                  description: Ingrese un entero
 *          required:
 *              - entero
 *          example:
 *              entero: 5
 */

/**
 * @swagger
 * /stats/{entero}:
 *  get:
 *      parameters:
 *          -   in: path
 *              name: entero
 *              schema:
 *                  type: integer
 *              required: true
 *              description: Un número entero
 *      sumary: Recibe un número entero y devuelva para cuantos Arrays ese ha sido el resultado esperado, el total de Arrays que se hayan verificado y la tasa de ocurrencia. 
 *      tags: [Nivel II]
 *      responses:
 *          200:
 *              description: En caso poder realizar el cálculo, debería devolver un HTTP 200-OK
 *          401:
 *              description: En caso de error, debería devolver un HTTP 401
 */