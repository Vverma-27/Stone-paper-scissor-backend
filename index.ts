import express from "express";
import App from "./App";

export const app = new App([], 5000);

app.listen();
