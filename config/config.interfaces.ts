export default interface IConfig {
  MONGO_IP: string;
  MONGO_PORT: string;
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  REDIS_URL: string;
  SESSION_SECRET: string;
  REDIS_PORT: number;
  PORT: number;
}
