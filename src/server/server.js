/* global BigInt */

import express from "express";
import passport from "passport";
import compression from "compression";
import serveStatic from "express-static-gzip";
import session from "express-session";
import helmet from "helmet";
import favicon from "serve-favicon";
import logger from "morgan";
import dotenv from "dotenv";
import renderPage from "./renderPage";
import configurePassport from "./passport";
import auth from "./routes/auth";
var proxy = require('express-http-proxy');
import login from "./login";
import connectDabl from "./dabl";
import checkToken from "./checkToken";
import connectSandbox from "./sandbox";
import {publicBoardsInitial, publicBoards}  from "./publicBoards";

// Load environment variables from .env file
dotenv.config();

const app = express();
const ledgerAdmin = process.env.USE_SANDBOX ? connectSandbox() : connectDabl();

const apiHost = process.env.USE_SANDBOX
  ? "http://localhost:7575"
  : "https://api.projectdabl.com";
const apiPrefix = process.env.USE_SANDBOX
? ""
: "/data/" + process.env.DABL_LEDGER ;
app.use("/api", checkToken, proxy(apiHost, {
  "proxyReqPathResolver" : req => {

    const parts = req.url.split('/api/');
    return apiPrefix + parts[parts.length - 1];
  }
}));


app.use(publicBoardsInitial(ledgerAdmin));
app.get("/public", publicBoards);

configurePassport(ledgerAdmin);

app.use(helmet());
app.use(logger("tiny"));
app.use(compression());
app.use(favicon("dist/public/favicons/favicon.png"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// aggressive cache static assets (1 year)
// app.use("/static", express.static("dist/public", { maxAge: "1y" }));
app.use(
  "/static",
  serveStatic("dist/public", { enableBrotli: true, maxAge: "1y" })
);

// Persist session in memory (for now)
app.use(
  session({
    secret: "the most secretest of secrets",
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(login);
app.use("/auth", auth);
app.get("*", renderPage);

const port = process.env.PORT || "1337";
/* eslint-disable no-console */
app.listen(port, () => console.log(`Server listening on port ${port}`));

