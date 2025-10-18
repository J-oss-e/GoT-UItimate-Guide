const express = require("express");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.engine("ejs", require("ejs").renderFile);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/html/main.html");
});



server.listen(3000, () => {
    console.log("Servidor escuchando en http://localhost:3000");
});