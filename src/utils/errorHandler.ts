import { Response } from 'express';

// Типы ошибок
export interface MongooseError extends Error {
    code?: number;
    keyPattern?: Record<string, any>;
    errors?: Record<string, any>;
    name: string;
}

// Проверка дубликата
export const isDuplicateKeyError = (error: MongooseError): boolean =>
    !!error && (error.code === 11000 || error.code === 11001);

// Обработчик ValidationError
export const handleValidationError = (res: Response, error: MongooseError): void => {
    const fields = Object.keys(error.errors || {});
    
    res.status(400).json({
        message: 'Некорректные данные. Проверьте правильность заполнения полей.',
        details: fields.length ? `Проблемные поля: ${fields.join(', ')}` : undefined
    });
};

// Обработчик дубликатов
export const handleDuplicateKeyError = (res: Response, error: MongooseError): void => {
    const fieldNames = Object.keys(error.keyPattern || {});
    const field = fieldNames[0] || 'ssn';

    res.status(409).json({
        message: 'Самокат с таким значением уже существует.',
        details: `Поле "${field}" должно быть уникальным.`
    });
};

// Обработчик CastError
export const handleCastError = (res: Response): void => {
    res.status(400).json({
        message: 'Некорректный формат идентификатора.'
    });
};

// Универсальный обработчик
export const handleMongooseError = (res: Response, error: MongooseError): boolean => {
    console.error('Mongoose error:', error.name, error.message);

    switch (error.name) {
        case 'ValidationError':
            handleValidationError(res, error);
            return true;
        
        case 'CastError':
            handleCastError(res);
            return true;
        
        default:
            if (isDuplicateKeyError(error)) {
                handleDuplicateKeyError(res, error);
                return true;
            }
            return false;
    }
};