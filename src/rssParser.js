export default (responseData) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(responseData.contents, 'application/xml');

  const cleanCDATA = (string) => (string.includes('CDATA') ? string.slice(9, -2) : string);

  const title = cleanCDATA(document.querySelector('title').innerHTML);
  const description = cleanCDATA(document.querySelector('description').innerHTML);

  const feed = { title, description };

  const posts = [...document.querySelectorAll('item')].map((item) => ({
    title: cleanCDATA(item.children[0].innerHTML),
    description: cleanCDATA(item.children[3].innerHTML),
    link: item.children[2].innerHTML,
  }));

  return { feed, posts };
};
