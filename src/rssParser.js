export default (responseData) => {
  // console.log('rss parser responseData', responseData);
  const parser = new DOMParser();
  const doc = parser.parseFromString(responseData.contents, 'application/xml');

  const parseRSSString = (string) => {
    if (string.includes('CDATA')) {
      console.log(string);
      return string.slice(9, -3);
    }
    return string;
  };

  const title = parseRSSString(doc.querySelector('title').innerHTML);
  const description = parseRSSString(doc.querySelector('description').innerHTML);
  console.log('rssparser, getting link', responseData);
  const link = responseData.status.url;

  const feed = { title, description, link };

  const items = [...doc.querySelectorAll('item')].map((item) => ({
    title: parseRSSString(item.children[0].innerHTML),
    description: parseRSSString(item.children[3].innerHTML),
    link: item.children[2].innerHTML,
  }));

  const posts = items;

  return { feed, posts };
};
