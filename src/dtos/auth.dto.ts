import Joi from 'joi';

const document = Joi.string().regex(new RegExp('^[1-9]{1}[0-9]{5,9}$')).min(6).max(10);

const password = Joi.string().min(8).max(100);

export const loginDto = Joi.object({
  document: document
    .required(),
  password: password
    .required()
})