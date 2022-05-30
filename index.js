const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

//MongoDb connect

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@cluster0.vgoc3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }



async function run() {
    try {
        await client.connect();
        const partsCollection = client.db("AutoPartsBD").collection("parts");
        const orderCollection = client.db("AutoPartsBD").collection("order");
        const userCollection = client.db("AutoPartsBD").collection("user");
        const reviewsCollection = client.db("AutoPartsBD").collection("reviews");

        //Load all Product
        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query)
            const result = await cursor.toArray();

            res.send(result);
        });

        //Load all order
        app.get('/orders', async (req,res) => {
          const query = {};
          const cursor = orderCollection.find(query);
          const result = await cursor.toArray()

          res.send(result);
        })

        //Load all reviews
        app.get('/reviews', async (req,res) => {
          const query = {};
          const cursor = reviewsCollection.find(query);
          const result = await cursor.toArray()

          res.send(result);
        })

        //Get Product by Id
        app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await partsCollection.findOne(query)

            res.send(result);
        })

        //get order data
        app.get('/order', verifyJWT, async (req, res) => {
            const user = req.query.user;
            const decodedEmail = req.decoded.email;
            if (user === decodedEmail) {
              const query = { email: user };
              const orders = await orderCollection.find(query).toArray();
              console.log(orders)
              return res.send(orders);
            }
            else {
              return res.status(403).send({ message: 'forbidden access' });
            }
          })

            //update user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
          })

           //Add a new parts
        app.post('/parts', async (req, res) => {
            const newService = req.body;
            const result = await partsCollection.insertOne(newService);
            res.send(result);
        });


          app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
          });


          app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
          })

      
          app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
              const filter = { email: email };
              const updateDoc = {
                $set: { role: 'admin' },
              };
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
            }
            else{
              res.status(403).send({message: 'forbidden'});
            }
      
          })

        
          
        // DELETE Product
        app.delete('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await partsCollection.deleteOne(query);
            res.send(result);
        });

        // DELETE orders
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        //post order data
        app.post('/order', async (req, res) => {
            const newService = req.body;
            const result = await orderCollection.insertOne(newService);
            res.send(result);
        });

           // update quantity
           app.put('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const updatedParts = req.body.quantity;
            console.log(id)
            console.log(updatedParts)
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedParts,
                }
            };
            const result = await partsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(console.dir)

app.listen(port, () => {
    console.log('Listening to port', port)
})