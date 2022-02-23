require('dotenv').config();
const Safepay = require("safepay");
const express = require("express");
const path = require("path");
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const { readSync } = require("fs");
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/checkout", async (req, res) => {
  const amount = req.body.amount;
  
  const config = {
    environment: "sandbox",
    sandbox: {
      baseUrl: "https://sandbox.api.getsafepay.com",
      apiKey: process.env.API_Key,
      apiSecret: process.env.SECRET_Key,
    }
    // production: {
    //   baseUrl: "https://api.getsafepay.com",
    //   apiKey: process.env.API_KEY,
    //   apiSecret: process.env.API_SECRET,
    // },
  };

  let sfpy = new Safepay(config);

  console.log(sfpy)

  // --------------------
  // Payments
  // --------------------

  // initialize payment
  sfpy.payments
    .create({
      amount: Number(amount),
      currency: "PKR",
    })
    .then((response) => {
      return response.data;
    })
    .then((data) => {
      console.log(data)
      return sfpy.checkout.create({
        tracker: data.data.token,
        orderId: "1234",
        source: "custom",
        cancelUrl: `${process.env.BASE_URL}/cancel`,
        redirectUrl: `${process.env.BASE_URL}/paymentComplete`,
      });
    })
    .then((url) => {
      console.log(url);
      res.redirect(url);
    })
    .catch((error) => {
      console.error(error);
      res.redirect('/')
    });
});

app.get("/success", (req, res) => {
  res.send("success");
});

app.get("/paymentComplete", (req, res)=>{
  const tracker = req.query.tracker;
  const sig = req.query.sig;
  const valid = Safepay.validateWebhookSignature(tracker, sig, process.env.SECRET_Key)
  if (!valid) {
    throw new Error("invalid payment signature. rejecting order...")
  }

  console.log("signature verified...")
  console.log("proceeding to mark order as paid")
})

app.get("/cancel", (req, res) => {
  res.send("cancel");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
