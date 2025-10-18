const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/html/index.html");
});

let characters=[];
let charactersIandF=[];

app.get('/api/datosGot', (req, res) => {
    axios.get('https://thronesapi.com/api/v2/Characters/')
    .then(response => {

    characters= data.map( c=> ({
    id: c.name,
    firstName: c.firstname,
    lastName: c.lastname,
    title: c.title,
    family: c.title,
    image: c.title,
    
    
}));
    res.json(response.data);
    })

     .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Hubo un problema al obtener los datos' });
        });

          });

          
app.get('/api/datosIandF', (req, res) => {
    axios.get('https://anapioficeandfire.com/api/characters')
    .then(response => {
  
    charactersIandF= data.map( c=> ({
    name: c.name,
    born: c.firstname,
    died: c.lastname,
    titles: c.title,
    aliases: c.family,
    
}));

  res.json(response.data);})

  .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Hubo un problema al obtener los datos' });
        });
});

frutas.forEach(characters => {
    console.log(fruta);
});

app.listen(3000, () => {
    console.log("Servidor escuchando en http://localhost:3000");
});