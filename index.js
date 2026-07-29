const express= require("express");
const axios= require("axios");
require("dotenv").config();
const app = express();
app.use(express.json())
app.get("/" , (req , res)=>{
    res.send("hello this is my first backend ");

});

app.post("/webhook/order-created", (req, res) => {
console.log("Order ID:", req.body.id);
console.log("Customer:", req.body.customer.first_name, req.body.customer.last_name);

for (let i = 0; i < req.body.line_items.length; i++) {
  console.log(req.body.line_items[i].title);
}

  res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

