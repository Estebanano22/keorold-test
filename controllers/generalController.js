const Arrays = require("../models/arraysModelo");
const { Op } = require("sequelize");
const { v4: uuid_v4 } = require("uuid");

exports.smallest = async (req, res) => {

  var arrayA = req.body.array.sort();
  var existString = arrayA.filter(i => isNaN(i) || !Number.isInteger(i));
  var Nmin = Math.min(...arrayA);
  var Nmax = Math.max(...arrayA);

  // N es un entero dentro de este rango [1 ... 100,000]
  if(arrayA.length < 1 || arrayA.length > 100000) return res.status(401).send({error: 'El rango de datos supera el limite.'});
  
  // Cada elemento del ArrayA es un entero dentro de este rango [−1,000,000 ... 1,000,000]
  if(Nmin < -100000 || Nmax > 100000) return res.status(401).send({error: 'Un elemento dentro del arrayA no se encuentra dentro del rango [−1,000,000 ... 1,000,000].'});
  
  // Validar que los elementos del arrayA sean números y tambien que sean enteros
  if(existString.length > 0) return res.status(401).send({error: 'Uno ó varios elementos dentro del arrayA no es numerico ó no es entero.'});
  
  // Devolución del menor entero positivo que no esté incluido dentro del ArrayA.
  const numeroMenor = (array) => {
      let noIncluido = true;
      let i = 0;
      do{
          i++;
          if(!array.includes(i)) noIncluido = false;
      } while(noIncluido) return i;
  }

  // Identificar si el array ya existe
  const existeArray = await Arrays.findOne({
    where: {
      array: arrayA
    }
  })

  // Almacenar en DB Arrays Verificados
  if (!existeArray) {
    await Arrays.create({
      id: uuid_v4(),
      array: arrayA,
      result: numeroMenor(arrayA),
      create: new Date()
    });
  }

  return res.status(200).send({result: numeroMenor(arrayA)});

};

exports.stats = async (req, res) => {
  
  const numeroEntero = Number(req.params.entero);

  // Validar que el parametro sea un número
  if(isNaN(numeroEntero)) return res.status(401).send({error: 'El parametro enviado no es numerico.'});
  // Validar si el parametro es entero
  if(!Number.isInteger(numeroEntero)) return res.status(401).send({error: 'El parametro enviado no puede ser un decimal.'});

  const countArrays = await Arrays.count({
    where: {
      [Op.and]:[{result:numeroEntero}]
    }
  });
  
  const totalArrays = await Arrays.count();
  const ocurrencia = totalArrays > 0 ? countArrays / totalArrays : 0;
  return res.status(200).send({count: countArrays, total: totalArrays, ratio: ocurrencia})

};