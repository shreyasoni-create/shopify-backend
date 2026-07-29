const express= require("express");
const axios= require("axios");
require("dotenv").config();
const app = express();
app.use(express.json())
app.get("/" , (req , res)=>{
    res.send("hello this is my first backend ");

});

app.post("/webhook/order-created", (req, res) => {

  console.log("WEBHOOK HIT");

  res.send("OK");

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

