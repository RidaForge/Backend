// backend/app.js
const express = require("express");
const dotenv = require("dotenv");
const Stripe = require('stripe');
const cors = require("cors");

dotenv.config();
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
    origin: process.env.CLIENT_URL
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { products } = req.body;

        console.log("Received products:", products);

        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: "Products array missing in request body" });
        }

        const line_items = products.map((product) => {
            const item = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                    },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity: product.quantity || 1,
            };

            // Only add images if it's a valid public URL
            if (product.image && product.image.startsWith('http')) {
                item.price_data.product_data.images = [product.image];
            }

            return item;
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/success`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
        });

        res.json({ url: session.url });

    } catch (error) {
        console.error("Stripe error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(4000, () => {
    console.log("Server running on port 4000");
});