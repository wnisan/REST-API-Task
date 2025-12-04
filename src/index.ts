import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import scooterRoutes from './routes/scooterRoutes';
import { seedScooters } from "./seed/scooterSeed";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Маршруты
app.use('/api', scooterRoutes);

// Базовый route для проверки работы сервера
app.get('/', (req, res) => {
  res.json({ 
    message: 'Scooter Sharing Service API',
    version: '1.0',
    endpoints: {
      level0: 'POST /api/level0',
      restApi: 'GET /api/scooters',
      hateoas: 'GET /api/scooters-hateoas'
    }
  });
});

const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        await seedScooters(); 

        app.listen(PORT, () => {
            console.log(`Server running on port http://localhost:${PORT}`);
        });
    } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();