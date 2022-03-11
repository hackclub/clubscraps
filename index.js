const { App, ExpressReceiver } = require('@slack/bolt');
const { Readable } = require('stream');
const axios = require("axios").default;
const fs = require("fs");
const { botToken, signingSecret } = JSON.parse(fs.readFileSync("auth.json"));

const receiver = new ExpressReceiver({ signingSecret });

// Initializes your app with your bot token and signing secret
const app = new App({ token: botToken, receiver });

receiver
  .router
  .use(require("cors")())
  .use(require('express').json({ limit: "1mb" }))
  .post('/submit', async (req, res) => {
    /* let's figure out where the hack.af link actually goes rn */
    const official = new URL(
      (await axios.get("https://hack.af/share"))
        .request
        .res
        .responseUrl
    ).origin;

    /* let's send in #botspam if we're not sure where this request is coming from */
    const channel = (req.get('origin') == official) ? "C01504DCLVD" : "C0P5NE354";

    /* okay sweet, let's post the request body in slack */
    const { email, name, link, image, description } = req.body;
    const { ok, error } = await app.client.files.upload({
      channels: channel,
      /* todo: stop using "new Buffer" because it logs a scary message */
      file: Readable.from(new Buffer(image.split(',')[1] ?? "", 'base64')),
      tile: 'Image',
      filename: 'image.png',
      filetype: 'png',
      initial_comment: `${name} wants to share their project with the community!` +
        "\n\n" + description + "\n\n" + link,
    });

    /* forward the error message from slack to the form */
    res.send({ ok, error });
  });

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3011);

  console.log('⚡️ Bolt app is running!');
})();
