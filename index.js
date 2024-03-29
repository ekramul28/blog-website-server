const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: [
        // 'https://blog-website-9301a.web.app',
        // 'https://blog-website-9301a.firebaseapp.com',
        'http://localhost:5173'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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

// middlewares
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: 'not authorize' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            console.log(error)
            return res.status(401).send({ message: 'not authorize' })
        }
        console.log('okokok', decoded)
        req.user = decoded;
        next()
    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        // blog api
        app.get('/blog', async (req, res) => {
            let query = {};
            console.log(req.query)
            if (req.query?.category) {
                query = { category: req.query.category }
            }


            const result = await database.find(query).toArray();
            res.send(result);
        })

        // search api
        app.get('/search', async (req, res) => {

            const { search } = req.query;
            const query = {
                title: new RegExp(search, 'i')

            };

            console.log(query);
            const result = await database.find(query).toArray();
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
        app.post('/wishlist', verifyToken, async (req, res) => {
            const data = req.body;
            const result = await allWishlist.insertOne(data);
            res.send(result);
        })
        app.get('/wishlist', verifyToken, async (req, res) => {
            console.log(req.email);
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = await allWishlist.find(query).toArray()
            res.send(cursor)
        })

        app.delete('/wishlist/:id', verifyToken, async (req, res) => {
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
