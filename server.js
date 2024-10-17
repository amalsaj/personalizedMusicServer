const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const generateRandomString = (length) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = "spotify_auth_state";

app.get("/login", (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);
  const scope =
    "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-follow-read user-follow-modify user-follow-read app-remote-control streaming";
  const queryParams = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: scope,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  if (state === null) {
    res.redirect(
      "/" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  }
  try {
    const authOptions = {
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
      },
    };
    const response = await axios(authOptions);
    console.log("response: ", response);
    const { access_token, refresh_token, expires_in } = response.data;
    res.json({ access_token, refresh_token, expires_in });
  } catch (error) {
    console.error("Error: ", error.response ? error.response.data : error);
    res.status(500).json({ error: "Failed to get access token" });
  }
});

app.listen(8000, () => {
  console.log("Server is running on http://localhost:8000");
});
