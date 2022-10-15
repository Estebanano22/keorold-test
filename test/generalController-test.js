const path = require('path');
const chai = require('chai');
const sinon = require('sinon');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const proxyquire = require('proxyquire')
const expect = chai.expect;
const should = chai.should();
const rewire = require('rewire');
const generalController = require('../controllers/generalController');
const dotenv = require('dotenv');
const Arrays = rewire("../models/arraysModelo");
const { Op } = require("sequelize");
const { v4: uuid_v4 } = require("uuid");
const url = process.env.SERV;

const {
    sequelize,
    dataTypes,
    checkModelName,
    checkPropertyExists,
    makeMockModels
  } = require('sequelize-test-helpers')

const mockModels = makeMockModels({ Arrays: { findOne: sinon.stub() } });

const save = proxyquire('../src/models/arrayModelTest', {
    '../models': mockModels
})
  
const fakeArray = { update: sinon.stub() }
console.log(fakeArray);
dotenv.config({
    path: path.resolve(__dirname, 'production.env')
});

// Asignar resultados API /smallest

const array = [1, 3, 6, 4, 1, 2];
const arrayA = [8, -3, 2, 1, 3, 6, 4, 1, 2];
const arrayPrueba = [1, 3, 6, 4, 1, 2];
const arrayError1 = [300000, 3, 6, 4, 1, 2];
const arrayError2 = [0.1, 3, 6, 4, 1, 2];
const arrayError3 = ["string", 3, 6, 4, 1, 2];

describe('Modelo Arrays: ', async () => {

    const data = {
        id: uuid_v4(),
        array: arrayA,
        result: 5,
        create: new Date()
    }

    let mockModel = {
        Array: {
          findOne: sinon.stub().resolves(null),
          create: sinon.fake.returns({
            result: 5 
          }),
        },
      }

    const resetStubs = () => {
        mockModels.Arrays.findOne.resetHistory()
        fakeArray.update.resetHistory()
    }
    
    let result

    // Contextos Pruebas Modelos
    context('Array no existe', () => {
        before(async () => {
          mockModels.Arrays.findOne.resolves(undefined)
          result = await save(data)
        })
    
        after(resetStubs)

        it('Llamando Arrays.findOne', () => {
            expect(mockModels.Arrays.findOne).to.have.been.called
        })

        it("No llamo Arrays.update", () => {
            expect(fakeArray.update).not.to.have.been.called
        })

        it('Retornar null', () => {
            expect(result).to.be.null
        })
    
    })

});

describe('API REST /smallest: ', async () => {

    it('Validando recepción de array & status 200', (done) => {
        chai.request(url)
            .post('/smallest')
            .send({array: array})
            .end((err, res) => {
                expect(res).to.be.json;
                expect(res).to.have.status(200);
                done();
            });
    });
    
    it('Validando status 401 - Elementors entre [-100.000, ...100.000]', (done) => {
        chai.request(url)
            .post('/smallest')
            .send({array: arrayError1})
            .end((err, res) => {
                expect(res).to.be.json;
                const error = res.body.error; 
                expect(error).to.deep.equal('Un elemento dentro del arrayA no se encuentra dentro del rango [−1,000,000 ... 1,000,000].');
                expect(res).to.have.status(401);
                done();
            });
    });
    
    it('Validando status 401 - Error de decimales en array', (done) => {
        chai.request(url)
            .post('/smallest')
            .send({array: arrayError2})
            .end((err, res) => {
                expect(res).to.be.json;
                const error = res.body.error; 
                expect(error).to.deep.equal('Uno ó varios elementos dentro del arrayA no es numerico ó no es entero.');
                expect(res).to.have.status(401);
                done();
            });
    });
    
    it('Validando status 401 - Error de string en array', (done) => {
        chai.request(url)
            .post('/smallest')
            .send({array: arrayError3})
            .end((err, res) => {
                expect(res).to.be.json;
                const error = res.body.error; 
                expect(error).to.deep.equal('Uno ó varios elementos dentro del arrayA no es numerico ó no es entero.');
                expect(res).to.have.status(401);
                done();
            });
    });
    
    it('Esperando obtener objeto de respuesta', (done) => {
        chai.request(url)
            .post('/smallest')
            .send({array: array})
            .end((err, res) => {
                expect(res).to.be.json;
                expect(res).to.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });
    
    it('Prueba de solicitud con respuesta correcta', (done) => {
        chai.request(url)
            .post('/smallest')
            .send({array: arrayPrueba})
            .end((err, res) => {
                expect(res).to.be.json;
                expect(res).to.have.status(200);
                const result = res.body.result; 
                expect(result).to.deep.equal(5);
                done();
            });
    });

    it('Validando si ya se consulto el array', (done) => {
        chai.request(url)
            .post('/smallest')
            .send({array: arrayPrueba})
            .end((err, res) => {
                expect(res).to.be.json;
                expect(res).to.have.status(200);
                const result = res.body; 
                expect(result.array.sort()).to.deep.equal(arrayPrueba.sort());
                expect(result.result).to.deep.equal(5);
                done();
            });
    });

});

// Asignar resultados API /stats

const entero = 4;
const decimal = 4.8;
const string = 'string';

describe('API REST /stats: ', async () => {
    
    it('Validando recepción de un entero & status 200', (done) => {
        chai.request(url)
        .get(`/stats/${entero}`)
        .end((err, res) => {
            expect(res).to.be.json;
            expect(res).to.have.status(200);
            done();
        });
    });
    
    it('Validando status 401 - Error de decimal en array', (done) => {
        chai.request(url)
        .get(`/stats/${decimal}`)
        .end((err, res) => {
            expect(res).to.be.json;
            const error = res.body.error; 
            expect(error).to.deep.equal('El parametro enviado no puede ser un decimal.');
            expect(res).to.have.status(401);
            done();
        });
    });
    
    it('Validando status 401 - Error de string en solicitud', (done) => {
        chai.request(url)
        .get(`/stats/${string}`)
        .end((err, res) => {
            expect(res).to.be.json;
            const error = res.body.error; 
            expect(error).to.deep.equal('El parametro enviado no es numerico.');
            expect(res).to.have.status(401);
            done();
        });
    });

    it('Esperando obtener objeto de respuesta', (done) => {
        chai.request(url)
            .get(`/stats/${entero}`)
            .end((err, res) => {
                expect(res).to.be.json;
                expect(res).to.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });

    it('Prueba de solicitud con respuesta correcta', (done) => {
        chai.request(url)
            .get(`/stats/${entero}`)
            .end((err, res) => {
                expect(res).to.be.json;
                expect(res).to.have.status(200);
                const count = res.body.count; 
                const total = res.body.total; 
                const ratio = res.body.ratio; 
                expect(count).to.be.gte(0);
                expect(total).to.be.gte(0);
                expect(ratio).to.be.gte(0);
                done();
            });
    });

});