const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
var jwt = require('jsonwebtoken');
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
const comment = client.db('AllCommentDB').collection('comment');

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send(token);
        })

        // blog api
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
        // app.get('/feature',async(req,res)=>{

        //     const result = await database.find().toArray();
        //     res.send(result);
        // })
        app.post('/blog', async (req, res) => {
            const data = req.body;
            const result = await database.insertOne(data);
            console.log(data)
            res.send(result);
        })
        app.put('/blog/:id', async (req, res) => {
            const id = req.params.id;

            const product = req.body;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true }
            const updatePro = {
                $set: {
                    name: product.name,
                    image: product.image,
                    category: product.category,
                    short: product.short,
                    longDescription: product.longDescription,

                }
            }
            const result = await database.updateOne(query, updatePro, options);
            res.send(result);
        });


        // comment api
        app.post('/comment', async (req, res) => {
            const data = req.body;
            const result = await comment.insertOne(data);
            res.send(result);
        })
        app.get('/comment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: id }
            const result = await comment.find(query).toArray();
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
