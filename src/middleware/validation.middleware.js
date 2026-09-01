import ApiError from "../util/ApiError.js";
import fs from "fs";

/**
 * Reusable validation middleware that parses express request using a Zod schema.
 * Formats errors and passes them to the global error handling middleware.
 */
export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        
        // Update request properties with parsed values to support coercion and defaults
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) req.query = parsed.query;
        if (parsed.params) req.params = parsed.params;
        
        next();
    } catch (error) {
        // Clean up local files created by multer if validation fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, () => {});
        }
        if (req.files) {
            Object.keys(req.files).forEach((key) => {
                req.files[key].forEach((file) => {
                    if (fs.existsSync(file.path)) {
                        fs.unlink(file.path, () => {});
                    }
                });
            });
        }

        // Zod 4 uses `issues`; older versions used `errors`
        const zodIssues = error.issues || error.errors || [];
        const errors = zodIssues.map((err) => {
            const fieldPath = err.path.slice(1).join(".");
            return `${fieldPath || "input"}: ${err.message}`;
        });
            
        next(new ApiError(400, "Validation Failed", errors));
    }
};
