export default (data) => {
  console.log('parser started');
  const parser = new DOMParser();
  const document = parser.parseFromString(data, 'application/xml');

  if (document.querySelector('parsererror')) throw new Error('invalidRSS');

  const title = document.querySelector('title').textContent;
  const description = document.querySelector('description').textContent;

  const items = [...document.querySelectorAll('item')].map((item) => ({
    title: item.children[0].textContent,
    description: item.children[3].textContent,
    link: item.children[2].textContent,
  }));

  console.log('parser accomplished');

  return { title, description, items };
};
