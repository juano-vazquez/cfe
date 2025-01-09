const auth_routes = require("./routes/auth_routes");
const app = require("express")(); // Note here
const bodyParser = require("body-parser");
const config = require("./config/config.js");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const cors = require("cors");
const currentUser = require("./config/common/middlewares/current_user");
const db_url = config.servers.db.url;
//const express = require('express');
const measures_routes = require("./routes/measures_routes");
const mongoose = require("mongoose");
const session = require("express-session");
const port = config.ports.app || 3005;
const timeout = require("connect-timeout");
const userPrivilege = require("./config/common/middlewares/user_privilege");
const users_routes = require("./routes/users_routes");

// Setting database URL.
if (!db_url) {
  console.error("No se ha definido DB_URL en las variables de entorno.");
  process.exit(1);
}

// Middleware to accept request from multiple origins.
app.use(
  cors({
    origin: ["http://localhost:8081", "http://localhost:4200"], // URL de tu aplicación Angular
    credentials: true, // Permite el envío de cookies
  })
);

// Formatting incoming data.
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Enabling cookies.
app.set("trust proxy", true);
app.use(
  cookieSession({
    sameSite: "None", // Permite cookies entre sitios
    signed: false, // No additional security layer will be added.
    secure: false, // Can handle both HTTP and HTTPS requests.
  })
);

//app.use(cookieParser());
/*app.use(session({
  secret: config.tokens.secretKey,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Solo para HTTPS en producción
    sameSite: 'None', // Permite cookies entre sitios
    maxAge: 24 * 60 * 60 * 1000 // Tiempo de vida de la cookie
  }
}));
*/

// Setting global tiemout for all requests.
app.use(timeout("20s")); // Increasing timeout in 20s.

// Middleware to handle requests that surpass timeout.
function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}
app.use(haltOnTimedout);

// Public routes.
app.get("/", (req, res, next) => {
  res.status(200).json({ state: "success" });
});
app.use("/auth", auth_routes);

//Validating user's token in later requests.
//app.use(currentUser);

//Determining user access based on privileges.
//app.use(userPrivilege);

// Private routes.
app.use("/measures", measures_routes);
app.use("/users", users_routes);

// Middleware to handle no found resources.
app.all("*", (req, res, next) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

// Middleware to handle errors.
app.use((err, req, res, next) => {
  if (err.statusCode) {
    res.status(err.statusCode).json({ error: err.generateErrors() });
    return;
  }
  res
    .status(500)
    .json({
      error: "Error  del servidor: algo salió mal",
      message: err.message,
    });
});

// Connection to Mongoose.
mongoose
  .connect(db_url)
  .then(async () => {
    app.listen(port, () => {
      console.log(`La aplicación está funcionando en el puerto ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error al conectar: " + err.message);
  });
