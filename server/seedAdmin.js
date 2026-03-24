import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const hashed = await bcrypt.hash('admin17042005', 10);
        
        let admin = await User.findOne({ email: 'admin' });
        if (admin) {
            admin.password = hashed;
            admin.role = 'admin';
            await admin.save();
            console.log('Admin user updated in MongoDB');
        } else {
            admin = new User({
                name: 'Administrator',
                email: 'admin',
                password: hashed,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created in MongoDB');
        }
        process.exit(0);
    } catch (e) {
        console.error('Error seeding admin:', e);
        process.exit(1);
    }
};

seed();
