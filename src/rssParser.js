export default (data) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(data, 'application/xml');

  if (document.querySelector('parsererror')) throw new Error('invalidRSS');

  const title = document.querySelector('title').textContent;
  const description = document.querySelector('description').textContent;

  const items = [...document.querySelectorAll('item')].map((item) => ({
    title: item.querySelector('title').textContent,
    description: item.querySelector('description').textContent,
    link: item.querySelector('link').textContent,
  }));

  return { title, description, items };
};
