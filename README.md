<h1> Documentación Prueba KeoWorld </h1>

<h4>Para correr el desarrollo es necesario lo siguiente: <h4>
  <h5>- Crear un DB local:</h5>
     <p>- DB_HOST = 127.0.0.1 </p>
     <p>- DB_DATABASE = keoworld_db </p>
     <p>- DB_USER = root </p>
     <p>- DB_PASS = rootroot </p>
     <p>- DB_PORT = 5432 </p>
     
  <h5>En caso de ser modificadas tambien deben ser modificadas en el archivo: </h5>
  
```css
production.env
```
  
   <p>- Una vez conectado con la base de datos se debe correr el comando para correr la prueba: </p>

```css
  npm run dev
```
   <p>- Para correr las pruebas unitarias se debe correr el comando:</p>

```css
  npm run test
```
  
   <p>- Para correr la cobertura de codigo se debe correr el comando: </p>

 ```css
  npm run coverage
```
  
  <h4>Este desarrollo fue hecho en NodeJS v14.16.1 y Express, se documento con Swagger y se uso una base de datos Postgress.</h4>
  <h4>Las pruebas unitarias fueron realizadas con Mocha, Chai y Sinon</h4>

