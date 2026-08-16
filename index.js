const express = require("express");
const axios = require("axios");
const Order = require("./models/Order");
const mongoose = require("mongoose");
require("dotenv").config();
const crypto = require("crypto");


function verifyWebhook(req) {

  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");

  const generatedHash = crypto
    .createHmac(
      "sha256",
      process.env.SHOPIFY_WEBHOOK_SECRET
    )
    .update(JSON.stringify(req.body))
    .digest("base64");

  return generatedHash === hmacHeader;
}



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

        if (!verifyWebhook(req)) {

            console.log("Invalid HMAC");

            return res.status(401).send("Invalid HMAC");

        }

        console.log("Webhook Verified");

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
        
const shiprocketPayload = {
  order_id: orderId,
  customer_name: customerName,
  email: email,
  total: totalPrice,
  created_at: new Date().toISOString()
};


console.log("SHIPROCKET PAYLOAD");
console.log(shiprocketPayload);

        res.send("OK");

    } catch (error) {

        console.log(error.message);

        res.status(500).send("Save Failed");

    }

});
app.get("/test-shiprocket", async (req, res) => {

  const shiprocketPayload = {
    order_id: 12345,
    customer_name: "John Smith",
    email: "john@test.com",
    total: 999
  };

  console.log("SHIPROCKET PAYLOAD");

  const response = await axios.post(
  "https://jsonplaceholder.typicode.com/posts",
  shiprocketPayload
);

console.log("ERP RESPONSE");
console.log(response.data);
  console.log(shiprocketPayload);
 const erpResponse = await axios.post(
  "https://jsonplaceholder.typicode.com/posts",
  shiprocketPayload
);

console.log(erpResponse.data);

console.log(response.data);

  res.send("Payload Created");

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
app.get("/test-get", async (req, res) => {

  const response = await axios.get(
    "https://jsonplaceholder.typicode.com/users/1"
  );

  console.log(response.data);

  res.json(response.data);

});
app.get("/inventory-learning", async (req, res) => {

  try {

    const query = `
    {
      products(first: 1) {
        edges {
          node {
            title

            variants(first: 10) {
              edges {
                node {
                  title

                  inventoryItem {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }`;
console.log("URL =", process.env.SHOPIFY_GRAPHQL_URL);
console.log("TOKEN =", process.env.SHOPIFY_ACCESS_TOKEN);
    const response = await axios.post(
      process.env.SHOPIFY_GRAPHQL_URL,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN
        }
      }
    );

    console.log(
      JSON.stringify(response.data, null, 2)
    );

    res.json(response.data);

  } catch (error) {

    console.log(error.response?.data || error.message);

    res.send("Failed");

  }

});
app.get("/get-location", async (req, res) => {

  try {

    const query = `
    {
      locations(first: 10) {
        edges {
          node {
            id
            name
          }
        }
      }
    }`;

    const response = await axios.post(
      process.env.SHOPIFY_GRAPHQL_URL,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log(error.response?.data || error.message);
    res.send("Failed");

  }

});
app.post("/erp-stock-update", async (req, res) => {

  try {

const sku = req.body.sku;
const quantity = req.body.quantity;
const location = req.body.location;

    console.log("SKU =", sku);
    console.log("QUANTITY =", quantity);
    console.log("LOCATION =", location);





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
    `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/products.json`,
    {
        headers: {
            "X-Shopify-Access-Token": accessToken
        }
    }
);
const locationResponse = await axios.get(
    `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/locations.json`,
    {
        headers: {
            "X-Shopify-Access-Token": accessToken
        }
    }
);

let locationId = null;

for (const shopifyLocation of locationResponse.data.locations) {

    if (shopifyLocation.name === location) {

        locationId = shopifyLocation.id;

        console.log(
            "FOUND LOCATION =",
            locationId
        );

        break;
    }
}

if (!locationId) {

    return res.status(404).json({
        message: "Location Not Found",
        location: location
    });
}
let inventoryItemId = null;

for (const product of productResponse.data.products) {

    for (const variant of product.variants) {

        if (variant.sku === sku) {

            inventoryItemId = variant.inventory_item_id;

            console.log(
                "FOUND INVENTORY ITEM =",
                inventoryItemId
            );

            break;
        }
    }
}

if (!inventoryItemId) {

    return res.status(404).json({
        message: "SKU Not Found"
    });
}
const currentInventoryResponse = await axios.get(
    `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/inventory_levels.json`,
    {
        params: {
            inventory_item_ids: inventoryItemId,
            location_ids: locationId
        },
        headers: {
            "X-Shopify-Access-Token": accessToken
        }
    }
);

const currentQuantity =
    currentInventoryResponse.data.inventory_levels[0]?.available;

console.log("CURRENT SHOPIFY QUANTITY =", currentQuantity);
console.log("ERP QUANTITY =", quantity);

if (currentQuantity === quantity) {

    console.log("NO UPDATE NEEDED");

    return res.json({
        success: true,
        message: "Inventory already up to date",
        sku,
        quantity,
        inventory_item_id: inventoryItemId,
        location_id: locationId
    });
}

console.log("QUANTITY DIFFERENT - UPDATING SHOPIFY");
const inventoryResponse = await axios.post(
    `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/inventory_levels/set.json`,
    {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: quantity
    },
    {
        headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json"
        }
    }
);

console.log("SHOPIFY RESPONSE");
console.log(inventoryResponse.data);

res.json({
    success: true,
    sku,
    quantity,
    inventory_item_id: inventoryItemId
});
  } catch (error) {

    console.log(error.message);

    res.status(500).send("Failed");

  }

});
app.post("/graphql-find-sku", async (req, res) => {

    try {

        const sku = req.body.sku;

        // Question: did we receive SKU?
        if (!sku) {
            return res.status(400).json({
                success: false,
                message: "SKU is required"
            });
        }

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
            query FindProductBySKU($query: String!) {
                productVariants(first: 1, query: $query) {
                    nodes {
                        id
                        title
                        sku
                        inventoryQuantity
                        inventoryItem {
                            id
                        }
                        product {
                            title
                        }
                    }
                }
            }
        `;

        const response = await axios.post(
            `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
            {
                query: query,
                variables: {
                    query: `sku:${sku}`
                }
            },
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("GRAPHQL RESPONSE");
        console.log(response.data);

        const variant = response.data.data.productVariants.nodes[0];

        // Question: did Shopify find the SKU?
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "SKU Not Found"
            });
        }

        return res.json({
            success: true,
            sku: variant.sku,
            variant_name: variant.title,
            product_name: variant.product.title,
            inventory_item_id: variant.inventoryItem.id,
            current_quantity: variant.inventoryQuantity
        });

    } catch (error) {

        console.log("GRAPHQL ERROR");
        console.log(error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
app.post("/graphql-update-inventory", async (req, res) => {

    try {

        const sku = req.body.sku;
        const quantity = req.body.quantity;

        if (!sku) {
            return res.status(400).json({
                success: false,
                message: "SKU is required"
            });
        }

        if (quantity === undefined || quantity === null) {
            return res.status(400).json({
                success: false,
                message: "Quantity is required"
            });
        }

        // Get Shopify access token
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

        // 1. Find inventory item using SKU
        const findQuery = `
            query FindProductBySKU($query: String!) {
                productVariants(first: 1, query: $query) {
                    nodes {
                        sku
                        inventoryQuantity
                        inventoryItem {
                            id
                        }
                    }
                }
            }
        `;

        const findResponse = await axios.post(
            `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
            {
                query: findQuery,
                variables: {
                    query: `sku:${sku}`
                }
            },
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json"
                }
            }
        );

        const variant =
            findResponse.data.data.productVariants.nodes[0];

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "SKU Not Found"
            });
        }

        const inventoryItemId =
            variant.inventoryItem.id;

        console.log("INVENTORY ITEM ID =", inventoryItemId);
        console.log("CURRENT QUANTITY =", variant.inventoryQuantity);
        console.log("NEW QUANTITY =", quantity);

        // 2. GraphQL mutation
        const mutation = `
            mutation SetInventoryQuantity(
                $input: InventorySetQuantitiesInput!
            ) {
                inventorySetQuantities(input: $input) {
                    inventoryAdjustmentGroup {
                        createdAt
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const mutationResponse = await axios.post(
            `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
            {
                query: mutation,
                variables: {
                    input: {
                        name: "available",
                        reason: "correction",
                     quantities: [
    {
        inventoryItemId: inventoryItemId,
        locationId: "gid://shopify/Location/81772970162",
        quantity: quantity,
        compareQuantity: variant.inventoryQuantity
    }
]
                        
                    }
                }
            },
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("GRAPHQL MUTATION RESPONSE");
        console.log(mutationResponse.data);

        const userErrors =
            mutationResponse.data.data.inventorySetQuantities.userErrors;

        if (userErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: userErrors
            });
        }

        return res.json({
            success: true,
            sku,
            quantity,
            inventory_item_id: inventoryItemId
        });

    } catch (error) {

        console.log("GRAPHQL UPDATE ERROR");
        console.log(error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
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
app.get("/create-product", async (req, res) => {

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
      mutation {
        productCreate(
          product: {
            title: "Shreya Test Product"
          }
        ) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
      { query },
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

    res.send("Create Product Failed");

  }

});


app.get("/update-product", async (req, res) => {

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
      mutation {
        productUpdate(
          product: {
            id: "gid://shopify/Product/8961216970930"
            title: "Shreya Updated Product"
          }
        ) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
      { query },
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

    res.send("Update Failed");

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

{
  products(first: 5) {
    edges {
      node {
        title

        variants(first: 5) {
          edges {
            node {
              id
              title
              inventoryQuantity
            }
          }
        }
      }
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
app.get("/locations", async (req, res) => {

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
            `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/locations.json`,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken
                }
            }
        );

        console.log(response.data);

        res.json(response.data);

    } catch (error) {

        console.log("FULL ERROR:");
        console.log(error.response?.data || error.message);

        res.send("Locations Failed");

    }

});
app.get("/inventory-test", async (req, res) => {

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
            `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/inventory_levels.json?inventory_item_ids=48532732248242`,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken
                }
            }
        );

        res.json(response.data);

    } catch (error) {

        console.log(error.response?.data || error.message);

        res.send("Inventory Failed");

    }
});
app.get("/find-sku", async (req, res) => {

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

        const products = response.data.products;

        for (const product of products) {

            for (const variant of product.variants) {

                if (variant.sku === "FOUNDATION-BEIGE") {

                    return res.json({
                        sku: variant.sku,
                        inventory_item_id: variant.inventory_item_id,
                        inventory_quantity: variant.inventory_quantity
                    });

                }

            }

        }

        res.send("SKU Not Found");

    } catch (error) {

        console.log(error.response?.data || error.message);

        res.send("Failed");

    }

});
app.post("/erp-stock-update", async (req, res) => {

    try {

        const sku = req.body.sku;
        const quantity = req.body.quantity;

   console.log("FULL BODY");
console.log(req.body);



console.log("SKU =", sku);
console.log("QUANTITY =", quantity);
        
console.log("GETTING TOKEN");
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
console.log("TOKEN RECEIVED");
      const accessToken = tokenResponse.data.access_token;

const productResponse = await axios.get(
    `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/products.json`,
    {
        headers: {
            "X-Shopify-Access-Token": accessToken
        }
    }
);

console.log("PRODUCTS RECEIVED");
console.log(productResponse.data.products.length);

console.log("STARTING SKU SEARCH");

        let inventoryItemId = null;

        for (const product of productResponse.data.products) {

            for (const variant of product.variants) {

                if (variant.sku === sku) {

                    inventoryItemId =
                        variant.inventory_item_id;

                    console.log(
                        "FOUND INVENTORY ITEM =",
                        inventoryItemId
                    );

                    break;
                }
            }
        }

        if (!inventoryItemId) {

            return res.status(404).json({
                message: "SKU Not Found"
            });
        }

        const inventoryResponse = await axios.post(
            `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/inventory_levels/set.json`,
            {
                location_id: 81772970162,
                inventory_item_id: inventoryItemId,
                available: quantity
            },
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("SHOPIFY RESPONSE");
        console.log(inventoryResponse.data);

        res.json({
            success: true,
            sku,
            quantity,
            inventory_item_id: inventoryItemId,
            inventory_response:
                inventoryResponse.data
        });

    } catch (error) {

    console.log("FULL ERROR");

    console.log(error);

    console.log(error.response?.data);

    res.status(500).json({
        error: error.message
    });

}

});

app.get("/orders", async (req, res) => {

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
        orders(first: 10) {
          edges {
            node {
              id
              name
              createdAt
            }
          }
        }
      }
    `;

    const response = await axios.post(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2025-10/graphql.json`,
      { query },
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

    res.send("Orders Failed");

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});