const express= require("express");
const axios= require("axios");
require("dotenv").config();
const app = express();
app.use(express.json())
app.get("/" , (req , res)=>{
    res.send("hello this is my first backend ");

});

app.post("/webhook/order-created", async (req, res) => {

  console.log("Order ID:", req.body.id);

  console.log(
    "Customer:",
    req.body.customer.first_name,
    req.body.customer.last_name
  );

  console.log("Email:", req.body.customer.email);

  console.log("Total Price:", req.body.total_price);

  for (let i = 0; i < req.body.line_items.length; i++) {

    console.log(
      "Product:",
      req.body.line_items[i].title
    );

    console.log(
      "Quantity:",
      req.body.line_items[i].quantity
    );
  
  }

  res.send("Shopify Order Received");

}); 

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

