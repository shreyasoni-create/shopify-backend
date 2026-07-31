const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <h1>Shopify App Connected</h1>
    <p>Store: ${req.query.shop}</p>
  `);


  res.send("hello this is my first backend");

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

  console.log("Order ID:", orderId);
  console.log("Customer:", customerName);
  console.log("Email:", email);
  console.log("Total:", totalPrice);

  res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});