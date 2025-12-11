import { body } from 'express-validator';

export const createScooterValidation = [
    // Проверяем, что поле 'ssn' существует и является непустой строкой
    body('ssn').notEmpty().withMessage('SSN is required'),

    // Проверяем, что поле 'brand' существует и является строкой от 2 до 30 символов
    body('brand').isLength({ min: 2, max: 30 }).withMessage('Brand must be between 2 and 30 characters'),

    // Проверяем, что поле 'chargeLevel' является числом в диапазоне от 0 до 100
    body('chargeLevel').isInt({ min: 0, max: 100 }).withMessage('Charge level must be between 0 and 100'),

    // Проверяем наличие координат и их тип (вложенные проверки)
    body('location.coordinates').isArray().withMessage('Coordinates must be an array'),
    body('location.coordinates.*').isNumeric().withMessage('Coordinates must be numeric values')
];

export const startRideValidation = [
    body('driverId').isMongoId().withMessage('Invalid driver ID'),
    body('scooterId').isMongoId().withMessage('Invalid scooter ID')
    // Можно добавить проверки на другие параметры начала поездки (например, начальный баланс)
];
