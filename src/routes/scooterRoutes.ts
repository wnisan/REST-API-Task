import { Router } from 'express';
import { createScooterValidation, startRideValidation } from '../validation/scooterValidation';
import {
    level0Handler,
    getAllScooters,
    getScooterById,
    createScooter,
    updateScooter,
    deleteScooter,
    getScootersWithLinks,
    getFreeScooters,
    startRide
} from '../controllers/scooterController';

const router = Router();

// Уровень 0:
router.post('/level0', level0Handler);

// Уровень 1 + 2:
router.get('/scooters', getAllScooters);           // GET все самокаты
router.get('/scooters/free', getFreeScooters);     // GET свободные самокаты
router.get('/scooters/:id', getScooterById);       // GET конкретный самокат
router.post('/scooters', createScooterValidation, createScooter);     // POST создать самокат
router.put('/scooters/:id', updateScooter);        // PUT обновить самокат
router.delete('/scooters/:id', deleteScooter);     // DELETE удалить самокат

// Уровень 3:
router.get('/scooters-hateoas', getScootersWithLinks);

router.post('/scooters/start-ride', startRideValidation, startRide);

export default router;