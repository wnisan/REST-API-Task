import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import scooterRoutes from './routes/scooterRoutes';
import { seedScooters } from "./seed/scooterSeed";
import { Scooter } from './models/Scooter';
import { Driver } from './models/Driver';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
    const [scootersCount, driversCount] = await Promise.all([
      Scooter.countDocuments(),
      Driver.countDocuments()
    ]);
    console.log(`Found ${scootersCount} scooters and ${driversCount} drivers in database`);

    // только если база ПУСТАЯ
    if (scootersCount === 0 && driversCount === 0) {
      console.log('Database is empty, seeding initial data...');
      await seedScooters();
      console.log('Database seeded successfully');
    } else {
      console.log('Database already contains data, skipping seed');
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();