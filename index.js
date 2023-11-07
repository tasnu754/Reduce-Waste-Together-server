const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middle war
app.use(cors());
app.use(express.json()); 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o9ylutr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
}); 

      const database = client.db("foodCharity");
      const availableFoods = database.collection("availableFoods");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
      // Send a ping to confirm a successful connection
      

     


    app.get('/api/availableFoods', async (req, res) => {
          
      let sortobj = {};
      let queryObj = {};


      const sortDate = req.query.sortDate
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      const donarEmail = req.query.donarEmail;
   
      if (donarEmail) {
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

    app.get('/api/singleFood/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await availableFoods.findOne(query); 
      res.send(result);
    })

    app.post('/api/addTheFood' , async(req, res) => {    
      const fooditem = req.body;
      console.log(fooditem);
      const result = await availableFoods.insertOne(fooditem);
      res.send(result);
 
    })

    app.delete('/api/availableFoods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await availableFoods.deleteOne(query); 
      res.send(result);

    })

    await client.db("admin").command({ ping: 1 });
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