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

    try {

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

    } catch (error) {

        console.log(error.message);

        res.status(500).send("Save Failed");

    }

});

app.get("/test-shopify", (req, res) => {

    res.send("Shopify Route Working");

});

app.get("/get-token", async (req, res) => {

    try {

        const params = new URLSearchParams();

        params.append("grant_type", "client_credentials");
        params.append("client_id", process.env.SHOPIFY_CLIENT_ID);
        params.append("client_secret", process.env.SHOPIFY_CLIENT_SECRET);

        const response = await axios.post(
            `https://${process.env.SHOPIFY_STORE}/admin/oauth/access_token`,
            params,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        console.log(response.data);

        res.json(response.data);

    } catch (error) {

        console.log(error.response?.data || error.message);

        res.json(
            error.response?.data || {
                error: error.message
            }
        );

    }

});

app.get("/products", async (req, res) => {

  try {

    const tokenResponse = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/oauth/access_token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const response = await axios.get(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/products.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log(error.response?.data || error.message);

    res.send("Products Failed");

  }

});

app.get("/send-product", async (req, res) => {

  try {

    const tokenResponse = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/oauth/access_token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const productResponse = await axios.get(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/products.json?limit=1`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken
        }
      }
    );

    const product = productResponse.data.products[0];

    const apiResponse = await axios.post(
      "https://jsonplaceholder.typicode.com/posts",
      {
        productId: product.id,
        title: product.title
      }
    );

    res.json(apiResponse.data);

  } catch (error) {

    console.log(error.response?.data || error.message);

    res.send("Failed");

  }

});

app.get("/graphql-products", async (req, res) => {

  try {

    const tokenResponse = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/oauth/access_token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const query = `
    {
      products(first: 5) {
        nodes {
          id
          title
            vendor
      handle
      featuredImage {
        }
      }
    }
    `;

    const response = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
      {
        query
      },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log(error.response?.data || error.message);

    res.send("GraphQL Failed");

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});