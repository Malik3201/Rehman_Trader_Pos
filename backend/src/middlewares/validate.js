import { ZodError } from 'zod';

function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.validated = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formatted = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.errorCode = 'VALIDATION_ERROR';
        error.details = formatted;
        return next(error);
      }
      return next(err);
    }
  };
}

export { validate };

