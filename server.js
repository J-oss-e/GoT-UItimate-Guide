const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
const path = require("path");


app.get("/", (req, res) => {
  res.redirect("/characters/1");
});


app.get("/characters/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  let character = null;
  let image = "https://placehold.co/200x200?text=Image+Not+Found";
  let crest = "No crest available"
  let father = ""
  let mother = ""
  let spouse = ""

  try {
    const response = await axios.get(`https://anapioficeandfire.com/api/characters/${id}`);
    character = response.data;

    const name = character.name?.trim() || null;
    const houseURL = character.allegiances[0]?.trim() || null;

    if (name) {
      const fandomRes = await axios.get("https://gameofthrones.fandom.com/api.php", {
        params: {
          action: "query",
          prop: "pageimages",
          format: "json",
          piprop: "original",
          titles: name,
          origin: "*",
        },
      });
      
      if (houseURL){
          const houseResponse = await axios.get(houseURL);
          crest = houseResponse.data.coatOfArms
        }
        
        const pages = fandomRes.data.query?.pages || {};
        const page = Object.values(pages)[0];
        if (page?.original?.source) image = page.original.source;
    }
    
        if (character.father?.trim()) father = (await axios.get(character.father)).data.name || "";
        if (character.mother?.trim()) mother = (await axios.get(character.mother)).data.name || "";
        if (character.spouse?.trim()) spouse = (await axios.get(character.spouse)).data.name || "";
} catch (error) {

    console.error("Error fetching character:", error.message);
    image = "https://via.placeholder.com/300x400.png?text=Error";
  }

  res.render("character", { character, id, image, crest, father, mother, spouse });
});


app.get("/search", async (req, res) => {
  try {
    const name = req.query.name;

    const response = await axios.get('https://anapioficeandfire.com/api/characters', {
      params: { name: name }
    });

    const characters = response.data;

    if (characters.length === 0) {
        res.sendFile(path.join(__dirname, "public", "html", "error.html"));
    }

    const character = characters[0];
    const url = character.url;
    const parts = url.split('/');
    const id = parts[parts.length - 1].split('?')[0].split('#')[0];

    res.redirect(`/characters/${id}`);
  } catch (error) {
    console.error(error);
  }
});


app.listen(3000, () => {
    console.log("Servidor escuchando en http://localhost:3000");
});