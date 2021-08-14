export default (responseData) => {
  const cleanOutCDATA = (string) => (string.includes('CDATA') ? string.slice(9, -3) : string);

  const parser = new DOMParser();
  const doc = parser.parseFromString(responseData.contents, 'application/xml');

  const feedTitle = cleanOutCDATA(doc.querySelector('title').innerHTML);
  const feedDescription = cleanOutCDATA(doc.querySelector('description').innerHTML);

  const feed = { feedTitle, feedDescription };

  const items = [...doc.querySelectorAll('item')];

  const posts = items.map((item) => ({
    title: cleanOutCDATA(item.children[0].innerHTML),
    description: cleanOutCDATA(item.children[3].innerHTML),
    link: item.children[2].innerHTML,
  }));

  return { feed, posts };
};
