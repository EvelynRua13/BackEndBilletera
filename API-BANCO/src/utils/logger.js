const isTest = process.env.NODE_ENV === 'test';

const info = (...args) => {
  if (!isTest) console.log(...args);
};

const warn = (...args) => {
  if (!isTest) console.warn(...args);
};

const error = (...args) => {
  // siempre mostrar errores incluso en tests
  console.error(...args);
};

export default { info, warn, error };
