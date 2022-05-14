import express from "express";
import App from "./App";
import config from "./config";

export const app = new App([], config.PORT);

app.listen();
