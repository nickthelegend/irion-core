const mongoose = require('mongoose');
const URI = 'mongodb+srv://niveshgajengi_db_user:0gVwvxdK7ms@cluster0.lahyqrp.mongodb.net/?appName=Cluster0';

(async () => {
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB');
        
        // Use the connection to drop the collection or delete docs
        const db = mongoose.connection.db;
        const result = await db.collection('loans').deleteMany({});
        console.log(`Deleted ${result.deletedCount} loans from Database.`);
        
        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (e) {
        console.error(e);
    }
})();
