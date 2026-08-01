const express = require("express");
const axios = require("axios");
const Order = require("./models/Order");
const mongoose = require("mongoose");

require("dotenv").config();
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((error) => {
    console.log("MongoDB Connection Failed");
    console.log(error.message);
});
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    console.log("QUERY =", req.query);
console.log("HEADERS =", req.headers);

  console.log("STORE =", req.query.shop);

  console.log("TOKEN EXISTS =", !!req.query.id_token);

  res.send("Shopify App Connected");



 

});
app.get("/test-post", async (req, res) => {

  try {

    const response = await axios.post(
      "https://jsonplaceholder.typicode.com/posts",
      {
        title: "Shopify Order",
        customer: "John Smith",
        total: 100
      }
    );

    console.log(response.data);

    res.send("POST Success");

  } catch (error) {

    console.log("API Failed");

    res.send("API Failed");

  }

});
app.post("/webhook/order-created", async (req, res) => {

  const orderId = req.body.id;

  const customerName =
    req.body.customer.first_name +
    " " +
    req.body.customer.last_name;

  const email = req.body.customer.email;

  const totalPrice = req.body.total_price;

    const order = new Order({
        orderId,
        customerName,
        email,
        totalPrice
    });
await order.save();
console.log(order);
   console.log("Order Saved");


  res.send("OK");

});



app.get("/test-shopify", (req, res) => {
  res.send("Shopify Route Working");
});

app.get("/install", (req, res) => {

  const shop = req.query.shop;

  const redirectUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${process.env.SHOPIFY_CLIENT_ID}` +
    `&scope=read_products,read_orders` +
    `&redirect_uri=${process.env.APP_URL}/callback`;

  res.redirect(redirectUrl);

});
app.get("/callback", (req, res) => {

  console.log(req.query);

  res.send("OAuth Callback Hit");

});



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});