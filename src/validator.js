import * as yup from 'yup';

export default (values, url, locales) => {
  yup.setLocale(locales);
  return yup
    .object()
    .shape({
      url: yup.string().required().url().notOneOf(values),
    })
    .validate({ url });
};
