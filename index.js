const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nfjhw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    await client.connect();
    const productCollection = client.db('manufacturer_website').collection('products');
    const orderCollection = client.db('manufacturer_website').collection('orders');
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

        app.patch('/orders', async (req, res) => {
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

        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const orders = await orderCollection.find(query).toArray();
            console.log(orders);
            res.send(orders);
        })
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