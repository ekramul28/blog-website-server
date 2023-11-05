const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.ktxzlkz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const database = client.db('blogDB').collection('blog');
const allWishlist = client.db('AllBlogDB').collection('blogs');

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        app.get('/blog', async (req, res) => {
            const result = await database.find().toArray();
            res.send(result);
        })
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await database.findOne(query);
            res.send(result);
        })
        app.post('/blog', async (req, res) => {
            const data = req.body;
            const result = await database.insertOne(data);
            console.log(data)
            res.send(result);
        })

        // wishlist api
        app.post('/wishlist', async (req, res) => {
            const data = req.body;
            const result = await allWishlist.insertOne(data);
            res.send(result);
        })
        app.get('/wishlist', async (req, res) => {
            console.log(req.email);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = await allWishlist.find(query).toArray()
            res.send(cursor)
        })
        // app.get('/wishlist/:id',async(req,res=>{

        // }))
        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await allWishlist.deleteOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("server is running");
});
app.listen(port, () => {
    console.log(`this is the port ${port}`)
})
