const express = require("express");
const axios = require("axios");
const Order = require("./models/Order");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {

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
app.post("/webhook/order-created", (req, res) => {

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

    console.log(order);


  res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});