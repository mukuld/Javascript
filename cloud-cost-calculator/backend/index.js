import express from 'express';
import bodyParser from 'body-parser';
import sequelize from './config/database.js';
import userRoutes from './routes/authRoutes.js';
import instanceRoutes from './routes/instanceRoutes.js';
import volumeRoutes from './routes/volumeRoutes.js';
import costRoutes from './routes/costRoutes.js';
import regionRoutes from './routes/regionRoutes.js';
import upload from './utils/fileUpload.js';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', userRoutes);
app.use('/api/instances', instanceRoutes);
app.use('/api/volumes', volumeRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/regions', regionRoutes);

sequelize.sync().then(() => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});