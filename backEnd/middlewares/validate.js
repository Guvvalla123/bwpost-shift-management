// Validate is a higher order middleware function
// Takes joi schema as an argument for validating the input fields 
// it returns another function (the actual express middleware)
// That returned function runs automatically when a route is called
// simple joi validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        try {
            // validate request body
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                allowUnknown: false,
                stripUnknown: true
            });

            if (error) {
                return res.status(400).json({
                    message: "Invalid request data",
                    errors: error.details.map((item) => ({
                        field: item.context.key,
                        message: item.message
                    }))
                });
            }

            // replace body with validated data
            req.body = value;
            next();

        } catch (err) {
            console.error("Validation error:", err);
            return res.status(500).json({ message: "Validation server error" });
        }
    };
};

module.exports = validate;
