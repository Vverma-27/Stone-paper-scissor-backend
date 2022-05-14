import { app } from "..";

const DEFAULT_GUEST_ID = 100;
export default () => {
  let length = 0;
  app.redisClient.keys("*", (err, value) => {
    if (err) console.log("error " + err);
    length = value.length || 0;
    console.log("values " + value);
  });
  const id = DEFAULT_GUEST_ID + length;
  console.log("id " + id, "length " + length);
  return id;
};
