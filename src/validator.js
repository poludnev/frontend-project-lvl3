import * as yup from 'yup';
import validationDictionary from './locales/validationDictionary.js';

export default (values, url) => {
  yup.setLocale(validationDictionary);
  return yup
    .object()
    .shape({
      url: yup.string().url().notOneOf(values),
    })
    .validate({ url });
};
