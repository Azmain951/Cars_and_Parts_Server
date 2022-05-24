const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorize Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nfjhw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    await client.connect();
    const productCollection = client.db('manufacturer_website').collection('products');
    const orderCollection = client.db('manufacturer_website').collection('orders');
    const userCollection = client.db('manufacturer_website').collection('users');
    const reviewCollection = client.db('manufacturer_website').collection('reviews');
    try {
        app.get('/products', async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products);
        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        app.post('/products', verifyJWT, async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        app.get('/orders', verifyJWT, async (req, res) => {
            const orders = await orderCollection.find().toArray();
            res.send(orders);
        });

        app.get('/orders/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const orders = await orderCollection.find(query).toArray();
            console.log(orders);
            res.send(orders);
        });

        app.patch('/orders', verifyJWT, async (req, res) => {
            const order = req.body;
            const quantity = order.quantity;
            const stock = order.stock;
            const newStock = stock - quantity;
            const id = order.productId;
            const query = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    stock: newStock,
                }
            }
            const updatedProduct = await productCollection.updateOne(query, updatedDoc);
            console.log(updatedProduct);
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });


        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });


        app.put('/user/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            console.log(user)
            const filter = { email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '30d'
            })
            res.send({ result, token });
        });

        app.get('/review', async (req, res) => {
            const users = await reviewCollection.find().toArray();
            res.send(users);
        });

        app.post('/review', verifyJWT, async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });
    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello from Manufacturer!')
})

app.listen(port, () => {
    console.log('listening to port: ', port)
})