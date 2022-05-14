import express from "express";
// import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import { createServer } from "http";
import cors from "cors";

enum IMove {
  "ROCK" = 1,
  "PAPER",
  "SCISSORS",
}

interface IGameInfo {
  host: string;
  opponent?: string;
  gameId: string;
  hostScore: number;
  opponentScore: number;
  rounds: number;
  gameOver: boolean;
  currentHostMove?: IMove;
  currentOpponentMove?: IMove;
}

let games: IGameInfo[] = [];
const mapPlayerToGame = new Map();
const players = new Map();

const getResult = (user: IMove, ai: IMove) => {
  if (user === ai) {
    return "draw";
  }
  if (user - ai === 1 || ai - user === 1) {
    return ai < user ? "win" : "loss";
  } else {
    return ai > user ? "win" : "loss";
  }
};

class App {
  private app: express.Application;
  private port: number;
  private server: any;
  private io: any;

  constructor(controllers: any, port: number) {
    this.app = express();
    this.port = port;
    this.server = createServer(this.app);
    this.io = require("socket.io")(this.server, {
      cors: {
        origin: "*",
        // methods: ["GET", "POST"],
      },
    });

    this.initializeMiddlewares();
    this.initializeSocketEvents();
    this.initializeControllers(controllers);
  }

  private async initializeSocketEvents() {
    this.io.on("connection", (socket: any) => {
      console.log("a user connected");
      // let username: string;
      socket.on("username-set", (usernameArg: string) => {
        players.set(socket.id, usernameArg);
        console.log(players);
        // console.log(username);
      });
      socket.on("cancel-game", () => {
        games[mapPlayerToGame.get(socket.id)] = null;
        mapPlayerToGame.delete(socket.id);
      });
      socket.on("create-game", (data, callback) => {
        if (mapPlayerToGame.get(socket.id)) return callback(null);
        const gameId = uuidv4();
        console.log(gameId, players);
        let gameInfo: IGameInfo;
        gameInfo = {
          host: players.get(socket.id),
          gameId,
          hostScore: 0,
          opponentScore: 0,
          rounds: 0,
          gameOver: false,
        };
        games.push(gameInfo);
        mapPlayerToGame.set(socket.id, games.length - 1);
        socket.join(gameId);
        callback(gameId);
      });
      socket.on("next-round", (data) => {
        const gameInfo = games[mapPlayerToGame.get(socket.id)];
        gameInfo.rounds++;
        games = games.map((gameInfoArg, i) => {
          if (gameInfoArg?.gameId === data) {
            return gameInfo;
          } else return gameInfoArg;
        });
        this.io.to(data).emit("next-round", gameInfo);
      });
      socket.on("join-game", (data, callback) => {
        let gameInfo: IGameInfo;
        console.log(
          "join ",
          data,
          socket.id,
          players,
          players.get(socket.id) || players.get(`${socket.id}`)
        );
        // if()
        games = games.map((gameInfoArg, i) => {
          if (gameInfoArg?.gameId === data) {
            if (gameInfoArg.opponent && gameInfoArg.host) return gameInfoArg;
            gameInfo = { ...gameInfoArg, opponent: players.get(socket.id) };
            console.log(gameInfo);
            mapPlayerToGame.set(socket.id, i);
            return gameInfo;
          } else return gameInfoArg;
        });
        if (!gameInfo) callback(null);
        socket.join(data);
        this.io.to(data).emit("game-start", gameInfo);
        // gameInfo.opponent=
      });
      socket.on("move-selected", (data) => {
        // this.io.to(data.gameId).emit("move-selected",{move:data.move,username:data.username});
        // let gameInfo: IGameInfo;
        // this.redisClient.get(data.gameId, (err, value) => {
        //   if (err) console.log(err);
        //   else gameInfo = value;
        // });
        const gameInfo = games[mapPlayerToGame.get(socket.id)];
        const isHost = players.get(socket.id) === gameInfo.host;
        // gameInfo[isHost ? "currentHostMove" : "currentOpponentMove"] = data;
        if (isHost) gameInfo.currentHostMove = data;
        else gameInfo.currentOpponentMove = data;
        console.log(gameInfo, isHost, data);
        if (gameInfo.currentHostMove && gameInfo.currentOpponentMove) {
          const result = getResult(
            gameInfo.currentHostMove,
            gameInfo.currentOpponentMove
          );
          switch (result) {
            case "win":
              gameInfo.hostScore++;
            case "loss":
              gameInfo.opponentScore++;
          }
          gameInfo.gameOver =
            gameInfo.rounds === 10 ||
            gameInfo.hostScore === 6 ||
            gameInfo.opponentScore === 6;
          this.io.to(gameInfo.gameId).emit("moves-selected", {
            hostMove: gameInfo.currentHostMove,
            opponentMove: gameInfo.currentOpponentMove,
          });
          gameInfo.currentHostMove = null;
          gameInfo.currentOpponentMove = null;
          games = games.map((gameInfoArg, i) => {
            if (gameInfoArg?.gameId === data) {
              return gameInfo;
            } else return gameInfoArg;
          });
        }
      });
      socket.on("disconnect", () => {
        console.log("user disconnected");
        this.io
          .to(games[mapPlayerToGame.get(socket.id)]?.gameId)
          .emit("game-left");
        games[mapPlayerToGame.get(socket.id)] = undefined;
        mapPlayerToGame.delete(socket.id);
        players.delete(socket.id);
      });
    });
  }

  private async initializeMiddlewares() {
    // mongoose
    //   .connect(
    //     `mongodb://${config.MONGO_USER}:${config.MONGO_PASSWORD}@${config.MONGO_IP}:${config.MONGO_PORT}/?authSource=admin`
    //   )
    //   .then(() => {
    //     console.log("logged in to mongo");
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    // this.app.use(cookieParser());
    // this.app.use(express.json());
    this.app.use(cors());
    // this.app.use(cookies());
  }

  private initializeControllers(controllers: any) {
    controllers.forEach((controller: any) => {
      this.app.use("/api", controller.router);
    });
  }

  public listen() {
    // this.app.listen(this.port, () => {
    //   console.log(`App listening on the port ${this.port}`);
    // });
    this.server.listen(process.env.PORT || this.port, () => {
      console.log(`App listening on the port ${this.port}`);
    });
  }
}

export default App;
