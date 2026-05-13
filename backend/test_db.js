import 'dotenv/config';
import mongoose from 'mongoose';
import { Order } from './src/models/Order.model.js';
import { Quote } from './src/models/Quote.model.js';
import { Customer } from './src/models/Customer.model.js';

async function test() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected!");

        console.log("Testing queries...");
        const results = await Promise.all([
            Order.countDocuments(),
            Order.find().limit(5).lean(),
            Quote.find().limit(5).lean(),
            Customer.find().limit(5).lean()
        ]);
        console.log("Query results:", results.map(r => Array.isArray(r) ? r.length : r));
        
        process.exit(0);
    } catch (error) {
        console.error("TEST ERROR:", error);
        process.exit(1);
    }
}

test();
