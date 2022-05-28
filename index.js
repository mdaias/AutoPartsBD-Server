const express = require('express');
const cors = require('cors');
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

async function run() {
    try{
        await client.connect();
        const partsCollection = client.db("AutoPartsBD").collection("parts");

        //Get all Product
        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query)
            const result = await cursor.toArray();

            res.send(result);
        })

         //Get Product by Id
         app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await partsCollection.findOne(query)

            res.send(result);
        })
    }
    finally{

    }
}
run().catch(console.dir)

app.listen(port, ()=>{
    console.log('Listening to port',port)
})