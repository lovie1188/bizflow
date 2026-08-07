const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    next();
  };
};

const productSchema = Joi.object({
  sku: Joi.string().min(2).required(),
  name: Joi.string().min(3).required(),
  hsnCode: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'HSN Code must be exactly 6 digits',
    'string.pattern.base': 'HSN Code must contain only digits'
  }),
  gstRate: Joi.number().valid(0, 5, 12, 18, 28).required(),
  unit: Joi.string().min(2).required(),
  buyPrice: Joi.number().positive().required(),
  tradePrice: Joi.number().positive().required(),
  minOrderQty: Joi.number().integer().min(1).default(1),
  imageUrl: Joi.string().uri().allow('', null)
});

const orderSchema = Joi.object({
  buyerId: Joi.number().integer().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().required(),
      qty: Joi.number().positive().required(),
      unitPrice: Joi.number().positive().required(),
      gstRate: Joi.number().valid(0, 5, 12, 18, 28).required(),
      hsnCode: Joi.string().allow('', null),
      name: Joi.string().allow('', null)
    })
  ).min(1).required(),
  dueDate: Joi.date().iso().required(),
  deliveryAddress: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  tcSignature: Joi.string().min(3).required(),
  saveAddressToProfile: Joi.boolean().allow(null)
});

const invoiceSchema = Joi.object({
  orderId: Joi.number().integer().required(),
  amount: Joi.number().positive().required(),
  dueDate: Joi.date().iso().required()
});

const buyerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  phone: Joi.string().min(10).max(15).required(),
  email: Joi.string().email().allow('', null),
  gstin: Joi.string().length(15).pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).allow('', null).messages({
    'string.pattern.base': 'Invalid GSTIN format'
  }),
  pan: Joi.string().length(10).pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).allow('', null),
  city: Joi.string().allow('', null),
  state: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  pincode: Joi.string().allow('', null),
  businessType: Joi.string().allow('', null),
  msmeNo: Joi.string().allow('', null),
  msmeType: Joi.string().valid('micro', 'small', 'medium', '').allow('', null),
  agreementSigned: Joi.boolean().default(false)
});

module.exports = {
  validateRequest,
  productSchema,
  orderSchema,
  invoiceSchema,
  buyerSchema
};
