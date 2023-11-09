const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middle war
app.use(cors({
  origin: [
    "http://localhost:5173"
  ],
  credentials:true
}));
app.use(express.json()); 
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o9ylutr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
}); 

const verifyToken = async (req, res, next) => {

  if (req.query.veri) {
    return next();
  }

 
  else  {  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({message: "Not Authorized"})
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({message: "Unauthorized"})
    }
    console.log("value od dewcode", decoded);
    req.user = decoded;
     next();
   
  })}
  
}
  

// const verifyToken = async (req, res, next) => {
//   const token = req.cookies?.token;
//   if (!token) {
//     return res.status(401).send({ message: "Not Authorized" });
//   }

//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       console.log(err);
//       return res.status(401).send({ message: "Unauthorized" });
//     } else {
//       console.log("value of decoded", decoded);
//       req.user = decoded;
//       next();
//     }
//   });
// }






      const database = client.db("foodCharity");
      const availableFoods = database.collection("availableFoods");
      const requestedFoods = database.collection("requestedFoods");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
      // Send a ping to confirm a successful connection
      
    // process.env.NODE_ENV === "production" ? true : false
    //  process.env.NODE_ENV === "production" ? "none" : "strict"
    app.post('/api/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' })
      res.cookie("token", token, {
       httpOnly: true,
       secure:process.env.NODE_ENV === "production" ? true : false ,
       sameSite:  process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({success:true})
    })

    app.post('/api/logout', async (req, res) => {
      const user = req.body;
      console.log("logout");
      res.clearCookie("token",
        {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true: false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        }
      ).send({ success: true })
    } )
     


    app.get('/api/availableFoods', verifyToken, async (req, res) => {


    
      let sortobj = {};
      let queryObj = {};



      const sortDate = req.query.sortDate
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      const donarEmail = req.query.donarEmail;
   
      if (donarEmail) {
        if (req.query.donarEmail!== req.user?.email) {
          return res.status(403).send({ message: "Forbidden access" })
        }
        console.log("okkkk");
        queryObj.donarEmail = donarEmail;
      }

      if (sortField && sortOrder) {
        sortobj[sortField] = sortOrder;
      }
      if (sortDate) { 
        sortobj[sortDate] = 1; 
      }
          
      const cursor = availableFoods.find(queryObj).sort(sortobj);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/api/requestedFoods", verifyToken, async (req, res) => {
      if (req.query?.requesterEmail !== req.user?.email) {
        console.log("Access forbidden: User emails do not match");
        return res.status(403).send({ message: "Forbidden access" })
      }
      const requesterEmail = req.query.requesterEmail;
      const query = { requesterEmail : requesterEmail };
       const cursor1 = requestedFoods.find(query);
      const result = await cursor1.toArray();
      res.send(result);
    })




    app.get('/api/singleFood/:id',verifyToken, async (req, res) => {
      
      //  console.log("User email from req.query:", req.query?.email);
      //  console.log("User email from req.user:", req.user?.email);
      if (req.query?.email !== req.user?.email) {
        console.log("Access forbidden: User emails do not match");
        return res.status(403).send({ message: "Forbidden access" })
      }
      else {
        const id = req.params.id
        const query = { _id: new ObjectId(id) };
        const result = await availableFoods.findOne(query);
        res.send(result);
      }
    })

    app.get("/api/requestedFoods/:id" ,  async(req, res) => {
      const id = req.params.id;
      const query = { foodId : id };
       const cursor1 = requestedFoods.find(query);
      const result = await cursor1.toArray();
      res.send(result);
    })

    app.post('/api/addTheFood' , async(req, res) => {    
      const fooditem = req.body;
      const result = await availableFoods.insertOne(fooditem);
      res.send(result);
 
    })

    app.delete('/api/availableFoods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await availableFoods.deleteOne(query); 
      res.send(result);

    })

    app.delete('/api/delivered/:id', async (req, res) => {
      const id = req.params.id;
      const query1 = { _id: new ObjectId(id) };
      const query2 = { foodId : id };
      const result1 = await availableFoods.deleteOne(query1); 
      const result2 = await requestedFoods.deleteMany(query2); 
      res.json({ result1, result2 });
    })

     app.delete('/api/requestedFoods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await requestedFoods.deleteOne(query); 
      res.send(result);

    })

    app.put("/api/availableFoods/update/:id" , async (req, res) => {
      const id = req.params.id;
      const updatedFood = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const food = {
        $set: {

          foodName: updatedFood.foodName ,
          foodImageURL:updatedFood.foodImageURL ,
          foodQuantity:updatedFood.foodQuantity ,
          pickupLocation: updatedFood.pickupLocation,
          expiredDate:updatedFood.expiredDate ,
          additionalNotes: updatedFood.additionalNotes,
          foodStatus: updatedFood.foodStatus,
          donarEmail:updatedFood.donarEmail,
          donarImg:updatedFood.donarImg,
          donarName: updatedFood.donarName
        }
      }
      
      const result = await availableFoods.updateOne(filter , food , options); 
      res.send(result);

    })

    app.post("/api/requestedFoods", async (req, res) => {
      const requestedFood = req.body;
      const result = await requestedFoods.insertOne(requestedFood);
      res.send(result);
    })

    

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("Reduce waste together charity is running");
})

app.listen(port, () => {
    console.log(`Reduce waste together charity is running on port ${port}`);
})